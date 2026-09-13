import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { CommunicationsService } from "../src/modules/communications/communications.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = { id: "user-1", firmId: "firm-1", email: "staff@example.test", fullName: "Staff", homeBranchId: null, roleKeys: ["advocate"], permissions: ["module.comms"] };
const scope = { firmId: user.firmId, OR: [{ accesses: { none: {} } }, { accesses: { some: { userId: user.id } } }] };

test("matter communication list and message queries include the shared record-access predicate", async () => {
  let channelsWhere: any;
  let messagesWhere: any;
  const service = new CommunicationsService({ client: {
    communicationChannel: { findMany: async ({ where }: any) => { channelsWhere = where; return []; } },
    channelMessage: { findMany: async ({ where }: any) => { messagesWhere = where; return []; } }
  } } as any, {} as any, {} as any, { matterWhere: async () => scope } as any);
  await service.listChannels(user);
  await service.messages(user, "channel-1");
  const matterBranch = channelsWhere.OR[2].matter.AND;
  assert.deepEqual(matterBranch[0], scope);
  assert.equal(matterBranch[1].OR.length, 3);
  assert.deepEqual(messagesWhere.channel.OR[2].matter.AND[0], scope);
});

test("restricted matter channels cannot send or join realtime before message creation or room access", async () => {
  let creates = 0;
  const channel = { id: "channel-restricted", firmId: user.firmId, matterId: "matter-restricted", private: false };
  const service = new CommunicationsService({ client: {
    communicationChannel: { findFirst: async () => channel },
    channelMessage: { create: async () => { creates += 1; return {}; } }
  } } as any, {} as any, { emitToChannel: () => undefined } as any, { canViewMatter: async () => false } as any);
  await assert.rejects(() => service.send(user, channel.id, "confidential message"), (error: unknown) => error instanceof NotFoundException);
  await assert.rejects(() => service.joinRealtimeChannel(user, channel.id), (error: unknown) => error instanceof NotFoundException);
  assert.equal(creates, 0);
});
