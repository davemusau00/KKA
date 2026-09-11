import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { CalendarService } from "../src/modules/calendar/calendar.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = {
  id: "user-1", firmId: "firm-1", email: "calendar@example.test", fullName: "Calendar User",
  homeBranchId: null, roleKeys: ["advocate"], permissions: ["module.calendar"]
};

test("calendar lists omit events from matters outside shared record access", async () => {
  const service = new CalendarService({
    client: { calendarEvent: { findMany: async () => [
      { id: "firm-event", matterId: null },
      { id: "visible", matterId: "matter-visible" },
      { id: "restricted", matterId: "matter-restricted" }
    ] } }
  } as any, {} as any, {} as any, { canViewMatter: async (_user: RequestUser, matterId: string) => matterId === "matter-visible" } as any);

  const result = await service.list(user.firmId, undefined, undefined, undefined, undefined, user);
  assert.deepEqual(result.map((event) => event.id), ["firm-event", "visible"]);
});

test("calendar creation rejects restricted matter events before persistence", async () => {
  let creates = 0;
  const service = new CalendarService({
    client: {
      user: { findFirst: async () => ({ id: user.id, firmId: user.firmId, status: "ACTIVE", email: user.email, fullName: user.fullName, homeBranchId: null, roles: [] }) },
      calendarEvent: { create: async () => { creates += 1; return {}; } }
    }
  } as any, {} as any, {} as any, { canViewMatter: async () => false } as any);

  await assert.rejects(
    service.create("firm-1", "user-1", {
      matterId: "matter-restricted", title: "Restricted hearing", eventType: "COURT",
      startAt: "2026-09-15T09:00:00.000Z", endAt: "2026-09-15T10:00:00.000Z", assignedUserId: "user-1"
    }),
    (error: unknown) => error instanceof NotFoundException
  );
  assert.equal(creates, 0);
});
