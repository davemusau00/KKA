import test from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@kka/database";
import { CalendarService } from "../src/modules/calendar/calendar.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const courtEvent = {
  id: "court-1", firmId: "firm-1", matterId: "matter-1", courtProceedingId: "proceeding-1",
  title: "Mention", eventType: "COURT", startAt: new Date("2026-09-14T09:00:00.000Z"),
  endAt: new Date("2026-09-14T11:00:00.000Z"), timezone: "Africa/Nairobi", location: "Milimani",
  assignedUserId: "advocate-1", notes: null
};

test("court outcome persists its derived event, deadline, task, matter action, and audit in one transaction", async () => {
  const calls: string[] = [];
  let auditTransaction: unknown;
  const tx = {
    calendarEvent: {
      update: async () => { calls.push("event.update"); return { ...courtEvent, status: "ADJOURNED", syncState: "PENDING" }; },
      create: async ({ data }: any) => {
        calls.push(`event.create.${data.eventType}`);
        return { id: data.eventType === "COURT" ? "court-2" : "deadline-event-1", ...data };
      }
    },
    user: { findFirst: async () => { calls.push("assignee.lookup"); return { id: "advocate-1" }; } },
    deadline: { create: async ({ data }: any) => { calls.push("deadline.create"); return { id: "deadline-1", ...data }; } },
    task: { create: async ({ data }: any) => { calls.push("task.create"); return { id: "task-1", createdAt: new Date(), updatedAt: new Date(), ...data }; } },
    matter: { update: async () => { calls.push("matter.update"); return {}; } },
    courtOutcomeRecord: { create: async ({ data }: any) => { calls.push("outcome.create"); return { id: "outcome-1", recordedAt: new Date(), ...data }; } }
  };
  const service = new CalendarService({
    client: {
      user: { findFirst: async () => ({ id: "actor-1", firmId: "firm-1", status: "ACTIVE", email: "actor@example.test", fullName: "Actor", homeBranchId: null, roles: [] }) },
      calendarEvent: { findFirst: async () => courtEvent },
      courtOutcomeRecord: { findUnique: async () => null },
      $transaction: async (callback: (transaction: typeof tx) => Promise<unknown>) => callback(tx)
    }
  } as any, { record: async (_input: unknown, transaction: unknown) => { calls.push("audit.record"); auditTransaction = transaction; } } as any,
  { add: async () => { calls.push("calendar.queue"); } } as any,
  { canViewMatter: async (_user: RequestUser, matterId: string) => matterId === "matter-1" } as any);

  const result = await service.completeFromCourtOutcome("firm-1", "actor-1", "court-1", {
    status: "ADJOURNED", outcome: "Adjourned with filing directions.", nextDate: "2026-10-02T09:00:00.000Z",
    deadline: { officialDueAt: "2026-09-30T16:00:00.000Z", title: "File submissions" }
  });

  assert.equal((result as any).outcome.id, "outcome-1");
  assert.equal((result as any).nextEvent.id, "court-2");
  assert.equal((result as any).deadline.id, "deadline-1");
  assert.equal((result as any).deadlineEvent.id, "deadline-event-1");
  assert.equal((result as any).task.id, "task-1");
  assert.deepEqual(calls, ["event.update", "event.create.COURT", "assignee.lookup", "deadline.create", "event.create.DEADLINE", "task.create", "matter.update", "outcome.create", "audit.record", "calendar.queue"]);
  assert.equal(auditTransaction, tx);
});

test("court outcome retry returns the canonical outcome without creating duplicate downstream records", async () => {
  let transactions = 0;
  const canonical = { id: "outcome-1", eventId: "court-1", nextEventId: "court-2" };
  const service = new CalendarService({
    client: {
      user: { findFirst: async () => ({ id: "actor-1", firmId: "firm-1", status: "ACTIVE", email: "actor@example.test", fullName: "Actor", homeBranchId: null, roles: [] }) },
      calendarEvent: { findFirst: async () => courtEvent },
      courtOutcomeRecord: { findUnique: async () => canonical },
      $transaction: async () => { transactions += 1; throw new Error("must not run"); }
    }
  } as any, {} as any, {} as any, { canViewMatter: async () => true } as any);

  const result = await service.completeFromCourtOutcome("firm-1", "actor-1", "court-1", { status: "ADJOURNED", outcome: "Adjourned." });
  assert.deepEqual(result, { outcome: canonical, replayed: true });
  assert.equal(transactions, 0);
});

test("court outcome concurrent uniqueness race returns the canonical record after its transaction rolls back", async () => {
  const canonical = { id: "outcome-1", eventId: "court-1", nextEventId: "court-2" };
  let reads = 0;
  const service = new CalendarService({
    client: {
      user: { findFirst: async () => ({ id: "actor-1", firmId: "firm-1", status: "ACTIVE", email: "actor@example.test", fullName: "Actor", homeBranchId: null, roles: [] }) },
      calendarEvent: { findFirst: async () => courtEvent },
      courtOutcomeRecord: { findUnique: async () => ++reads === 1 ? null : canonical },
      $transaction: async () => { throw new Prisma.PrismaClientKnownRequestError("unique outcome event", { code: "P2002", clientVersion: "test" }); }
    }
  } as any, {} as any, {} as any, { canViewMatter: async () => true } as any);

  const result = await service.completeFromCourtOutcome("firm-1", "actor-1", "court-1", { status: "ADJOURNED", outcome: "Adjourned." });
  assert.deepEqual(result, { outcome: canonical, replayed: true });
});

test("court outcome rejects a restricted matter before starting a transaction", async () => {
  let transactions = 0;
  const service = new CalendarService({
    client: {
      user: { findFirst: async () => ({ id: "actor-1", firmId: "firm-1", status: "ACTIVE", email: "actor@example.test", fullName: "Actor", homeBranchId: null, roles: [] }) },
      calendarEvent: { findFirst: async () => courtEvent },
      $transaction: async () => { transactions += 1; }
    }
  } as any, {} as any, {} as any, { canViewMatter: async () => false } as any);

  await assert.rejects(() => service.completeFromCourtOutcome("firm-1", "actor-1", "court-1", { status: "ADJOURNED", outcome: "Adjourned." }));
  assert.equal(transactions, 0);
});
