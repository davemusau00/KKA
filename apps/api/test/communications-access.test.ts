import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { CommunicationsService } from "../src/modules/communications/communications.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = { id: "user-1", firmId: "firm-1", email: "staff@example.test", fullName: "Staff", homeBranchId: null, roleKeys: ["advocate"], permissions: ["module.comms"] };
const scope = { firmId: user.firmId, OR: [{ accesses: { none: {} } }, { accesses: { some: { userId: user.id } } }] };

test("matter communication lists include the shared record-access predicate and message reads resolve channel access first", async () => {
  let channelsWhere: any;
  const service = new CommunicationsService({ client: {
    communicationChannel: { findMany: async ({ where }: any) => { channelsWhere = where; return []; }, findFirst: async () => ({ id: "channel-1", private: false, matterId: null }) },
    channelMessage: { findMany: async () => [] }
  } } as any, {} as any, {} as any, { matterWhere: async () => scope } as any, {} as any);
  await service.listChannels(user);
  await service.messages(user, "channel-1");
  const matterBranch = channelsWhere.OR[2].matter.AND;
  assert.deepEqual(matterBranch[0], scope);
  assert.equal(matterBranch[1].OR.length, 3);
});

test("restricted matter channels cannot send or join realtime before message creation or room access", async () => {
  let creates = 0;
  const channel = { id: "channel-restricted", firmId: user.firmId, matterId: "matter-restricted", private: false };
  const service = new CommunicationsService({ client: {
    communicationChannel: { findFirst: async () => channel },
    channelMessage: { create: async () => { creates += 1; return {}; } }
  } } as any, {} as any, { emitToChannel: () => undefined } as any, { canViewMatter: async () => false } as any, {} as any);
  await assert.rejects(() => service.send(user, channel.id, { text: "confidential message" }), (error: unknown) => error instanceof NotFoundException);
  await assert.rejects(() => service.joinRealtimeChannel(user, channel.id), (error: unknown) => error instanceof NotFoundException);
  assert.equal(creates, 0);
});

test("restricted channel reads and invalid mentions are rejected before membership or message mutation", async () => {
  let memberships = 0;
  let messages = 0;
  const restricted = { id: "channel-restricted", firmId: user.firmId, matterId: "matter-restricted", private: false };
  const readService = new CommunicationsService({ client: {
    communicationChannel: { findFirst: async () => restricted },
    channelMembership: { upsert: async () => { memberships += 1; } }
  } } as any, {} as any, {} as any, { canViewMatter: async () => false } as any, {} as any);
  await assert.rejects(() => readService.markRead(user, restricted.id), NotFoundException);
  assert.equal(memberships, 0);

  const open = { ...restricted, id: "channel-open", matterId: null };
  const mentionService = new CommunicationsService({ client: {
    communicationChannel: { findFirst: async () => open },
    channelMembership: { findMany: async () => [] },
    user: { findMany: async () => [] },
    channelMessage: { create: async () => { messages += 1; return {}; } }
  } } as any, {} as any, {} as any, {} as any, {} as any);
  await assert.rejects(() => mentionService.send(user, open.id, { text: "hello", mentionUserIds: ["user-2"] }), /Mentions are limited/);
  assert.equal(messages, 0);
});

test("message-to-task conversion returns the canonical task after an earlier conversion", async () => {
  const converted = { id: "message-1", convertedTaskId: "task-1", channel: { id: "channel-1", private: false, matterId: null } };
  let creates = 0;
  const service = new CommunicationsService({ client: {
    channelMessage: { findFirst: async () => converted },
    task: { findUnique: async () => ({ id: "task-1", sourceMessageId: "message-1" }), create: async () => { creates += 1; } }
  } } as any, {} as any, {} as any, { matterWhere: async () => ({ firmId: user.firmId }) } as any, {} as any);
  const result = await service.convertMessageToTask({ ...user, permissions: ["module.comms", "task.create"] }, "message-1", { title: "Follow up", assignedToId: "user-2", dueAt: "2026-10-01T10:00:00.000Z", priority: "MEDIUM" });
  assert.equal(result.task.id, "task-1");
  assert.equal(creates, 0);
});

test("direct staff threads use one firm-scoped canonical key and persisted membership", async () => {
  let create: any;
  const service = new CommunicationsService({ client: {
    user: { findFirst: async ({ where }: any) => ({ id: where.id, firmId: user.firmId, email: `${where.id}@example.test`, fullName: where.id, homeBranchId: null, roles: [] }) },
    communicationChannel: { upsert: async ({ create: data }: any) => { create = data; return { id: "channel-direct", ...data }; } }
  } } as any, { record: async () => ({ id: "audit-direct" }) } as any, {} as any, {} as any, {} as any);
  const result = await service.getOrCreateDirectChannel(user, "user-2");
  assert.equal(result.channel.id, "channel-direct");
  assert.equal(create.channelKey, "direct:firm:user-1:user-2");
  assert.equal(create.private, true);
  assert.deepEqual(create.memberships.create.map((row: any) => row.userId), ["user-1", "user-2"]);
});
