import test from "node:test";
import assert from "node:assert/strict";
import { ForbiddenException } from "@nestjs/common";
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

test("notification creation rejects a recipient without matter access before persistence", async () => {
  let creates = 0;
  const service = new NotificationsService({ client: {
    user: { findFirst: async () => ({ id: "user-a", firmId: "firm-a", email: user.email, fullName: user.fullName, homeBranchId: null, roles: [] }) },
    notification: { create: async () => { creates += 1; return {}; } }
  } } as any, {} as any, {} as any, {
    canViewMatter: async () => false
  } as any);

  await assert.rejects(
    service.create({ recipientUserId: user.id, matterId: "matter-restricted", category: "TASK", title: "Restricted", message: "Do not deliver" }),
    (error: unknown) => error instanceof ForbiddenException
  );
  assert.equal(creates, 0);
});

test("notification creation rechecks matter access before external queueing", async () => {
  let checks = 0;
  let queued = 0;
  let emitted = 0;
  const notification = { id: "notification-1", deliveries: [{ id: "delivery-1", channel: "EMAIL" }] };
  const service = new NotificationsService({ client: {
    user: { findFirst: async () => ({ id: "user-a", firmId: "firm-a", email: user.email, fullName: user.fullName, homeBranchId: null, roles: [] }) },
    notification: {
      create: async () => notification,
      delete: async () => notification
    }
  } } as any, { add: async () => { queued += 1; } } as any, { emitToUser: () => { emitted += 1; } } as any, {
    canViewMatter: async () => ++checks < 3
  } as any);

  await assert.rejects(
    service.create({ recipientUserId: user.id, matterId: "matter-restricted", category: "TASK", title: "Revoked", message: "Do not queue", channels: ["EMAIL"] }),
    /cannot access this matter/
  );
  assert.equal(emitted, 1);
  assert.equal(queued, 0);
});
