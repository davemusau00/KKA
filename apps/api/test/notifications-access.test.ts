import test from "node:test";
import assert from "node:assert/strict";
import { NotificationsService } from "../src/modules/notifications/notifications.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = {
  id: "user-a", firmId: "firm-a", email: "a@example.test", fullName: "User A",
  homeBranchId: null, roleKeys: ["advocate"], permissions: ["matter.view"]
};

test("notification reads omit restricted matter notifications", async () => {
  const rows = [
    { id: "firm", matterId: null },
    { id: "visible", matterId: "matter-visible" },
    { id: "restricted", matterId: "matter-restricted" }
  ];
  const service = new NotificationsService({ client: { notification: { findMany: async () => rows } } } as any, {} as any, {} as any, {
    canViewMatter: async (_user: RequestUser, matterId: string) => matterId === "matter-visible"
  } as any);

  const result = await service.list(user);
  assert.deepEqual(result.map(row => row.id), ["firm", "visible"]);
});

test("marking a restricted notification read is a no-op", async () => {
  let updates = 0;
  const service = new NotificationsService({ client: { notification: {
    findFirst: async () => ({ matterId: "matter-restricted" }),
    updateMany: async () => { updates += 1; return { count: 1 }; }
  } } } as any, {} as any, {} as any, {
    canViewMatter: async () => false
  } as any);

  assert.deepEqual(await service.markRead(user, "restricted"), { count: 0 });
  assert.equal(updates, 0);
});
