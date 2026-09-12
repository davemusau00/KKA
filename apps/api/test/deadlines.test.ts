import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException, ConflictException } from "@nestjs/common";
import { DeadlinesService } from "../src/modules/deadlines/deadlines.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = {
  id: "user-1", firmId: "firm-1", email: "deadline@example.test", fullName: "Deadline User",
  homeBranchId: null, roleKeys: ["advocate"], permissions: ["task.edit", "task.create", "task.view"]
};

const current = {
  id: "deadline-1", matterId: "matter-1", title: "File submissions", deadlineType: "COURT_DIRECTION",
  officialDueAt: new Date("2026-09-30T16:00:00.000Z"), internalTargetAt: new Date("2026-09-27T16:00:00.000Z"),
  source: "Court outcome", calculationMethod: "MANUAL", calculationAnchorAt: null, calculationDays: null,
  excludedDates: null, courtOrderOverride: false, courtOrderDocumentId: null, reminderSchedule: null,
  responsibleUserId: null, escalationUserId: null, stayPeriods: null, legalRuleCode: null, riskLevel: "CRITICAL",
  immutable: false, status: "OPEN", version: 1, completedAt: null, completedById: null, lastRecalculatedAt: null, notes: null, revisions: []
};

test("business-day deadline calculation skips weekends and declared excluded dates", async () => {
  let created: any;
  let revision: any;
  const service = new DeadlinesService({
    client: {
      user: { findFirst: async () => ({ id: "user-1" }) },
      $transaction: async (callback: any) => callback({
        deadline: { create: async ({ data }: any) => { created = { id: "deadline-1", version: 1, ...data }; return created; } },
        deadlineRevision: { create: async ({ data }: any) => { revision = data; return data; } }
      })
    }
  } as any, { record: async () => undefined } as any, { canViewMatter: async () => true } as any);

  await service.create(user, {
    matterId: "matter-1", title: "Business deadline", deadlineType: "RULE", source: "Rule 7", legalRuleCode: "RULE-7",
    calculationMethod: "BUSINESS_DAYS", calculationAnchorAt: "2026-10-02T09:00:00.000Z", calculationDays: 2,
    excludedDates: ["2026-10-05"], riskLevel: "HIGH", responsibleUserId: "user-1"
  });

  assert.equal(created.officialDueAt.toISOString(), "2026-10-07T09:00:00.000Z");
  assert.equal(revision.revisionNumber, 1);
  assert.equal(revision.calculationSnapshot.calculationMethod, "BUSINESS_DAYS");
});

test("immutable deadlines reject silent revision without court-order override evidence", async () => {
  const service = new DeadlinesService({
    client: { deadline: { findFirst: async () => ({ ...current, immutable: true }) } }
  } as any, {} as any, { matterWhere: async () => ({ firmId: "firm-1" }) } as any);

  await assert.rejects(
    () => service.revise(user, "deadline-1", { expectedVersion: 1, action: "EXTENDED", source: "Client request", reason: "Requested extension" }),
    (error: unknown) => error instanceof BadRequestException
  );
});

test("deadline revision uses the expected version, writes immutable history, and audits the recalculation", async () => {
  let revision: any;
  let auditTransaction: unknown;
  const revised = { ...current, version: 2, officialDueAt: new Date("2026-10-03T16:00:00.000Z"), lastRecalculatedAt: new Date() };
  const service = new DeadlinesService({
    client: {
      deadline: { findFirst: async () => current },
      $transaction: async (callback: any) => callback({
        deadline: {
          updateMany: async ({ where }: any) => { assert.deepEqual(where, { id: "deadline-1", version: 1 }); return { count: 1 }; },
          findUniqueOrThrow: async () => revised
        },
        deadlineRevision: { create: async ({ data }: any) => { revision = data; return data; } }
      })
    }
  } as any, { record: async (_input: unknown, transaction: unknown) => { auditTransaction = transaction; } } as any, {
    matterWhere: async () => ({ firmId: "firm-1" })
  } as any);

  const result = await service.revise(user, "deadline-1", {
    expectedVersion: 1, action: "EXTENDED", source: "Consent order", reason: "Court granted extension", officialDueAt: "2026-10-03T16:00:00.000Z"
  });

  assert.equal(result.version, 2);
  assert.equal(revision.action, "EXTENDED");
  assert.equal(revision.priorOfficialDueAt.toISOString(), current.officialDueAt.toISOString());
  assert.equal(revision.nextOfficialDueAt.toISOString(), revised.officialDueAt.toISOString());
  assert.ok(auditTransaction);
});

test("deadline revision rejects stale versions before writing", async () => {
  const service = new DeadlinesService({
    client: { deadline: { findFirst: async () => current } }
  } as any, {} as any, { matterWhere: async () => ({ firmId: "firm-1" }) } as any);

  await assert.rejects(
    () => service.revise(user, "deadline-1", { expectedVersion: 2, action: "EXTENDED", source: "Consent order", reason: "Court granted extension" }),
    (error: unknown) => error instanceof ConflictException
  );
});
