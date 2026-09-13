import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { SearchService } from "../src/modules/search/search.service";
import { MattersService } from "../src/modules/matters/matters.service";
import { ClientsService } from "../src/modules/clients/clients.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = { id: "user-1", firmId: "firm-1", email: "user@example.test", fullName: "Restricted User", homeBranchId: null, roleKeys: ["advocate"], permissions: ["matter.view", "matter.edit", "matter.stage_advance"] };
const scope = { firmId: "firm-1", OR: [{ accesses: { none: {} } }, { accesses: { some: { userId: "user-1" } } }] };
const access = { matterWhere: async () => scope };

test("global matter search combines text criteria with, rather than replacing, the shared access predicate", async () => {
  const calls: Record<string, any> = {};
  const service = new SearchService({ client: {
    matter: { findMany: async (input: any) => { calls.matters = input; return []; } },
    client: { findMany: async (input: any) => { calls.clients = input; return []; } },
    document: { findMany: async (input: any) => { calls.documents = input; return []; } },
    task: { findMany: async (input: any) => { calls.tasks = input; return []; } },
    courtProceeding: { findMany: async (input: any) => { calls.proceedings = input; return []; } },
    directoryContact: { findMany: async () => [] }
  } } as any, access as any);
  await service.search(user, "shared term");
  assert.deepEqual(calls.matters.where.AND[0], scope);
  assert.equal(calls.matters.where.AND[1].OR.length, 3);
  assert.deepEqual(calls.clients.where.matters.some, scope);
  assert.deepEqual(calls.documents.where.matter, scope);
  assert.deepEqual(calls.tasks.where.matter, scope);
  assert.deepEqual(calls.proceedings.where.matter, scope);
});

test("matter list search combines text filters with restricted-matter scope", async () => {
  let received: any;
  const service = new MattersService({ client: { matter: { findMany: async (input: any) => { received = input; return []; } } } } as any, {} as any, {} as any, access as any);
  await service.list(user.firmId, { q: "shared term", status: "ACTIVE" }, user);
  assert.deepEqual(received.where.AND[0], scope);
  assert.equal(received.where.AND[1].status, "ACTIVE");
  assert.equal(received.where.AND[1].OR.length, 3);
});

test("restricted matters cannot be updated, stage-validated, or transitioned before any mutation", async () => {
  let updates = 0;
  let transactions = 0;
  const service = new MattersService({ client: {
    matter: { findFirst: async () => null, update: async () => { updates += 1; return {}; } },
    $transaction: async () => { transactions += 1; return {}; }
  } } as any, {} as any, {} as any, access as any);
  await assert.rejects(() => service.update(user, "restricted-matter", { title: "Do not write" }), (error: unknown) => error instanceof NotFoundException);
  await assert.rejects(() => service.validateTransition(user, "restricted-matter", 2), (error: unknown) => error instanceof NotFoundException);
  await assert.rejects(() => service.transition(user, "restricted-matter", { toStageNumber: 2, newOwnerUserId: user.id, handoffNotes: "", override: false }), (error: unknown) => error instanceof NotFoundException);
  assert.equal(updates, 0);
  assert.equal(transactions, 0);
});

test("handoff acknowledgement requires current matter visibility as well as recipient identity", async () => {
  let acknowledgements = 0;
  const service = new MattersService({ client: {
    stageHandoff: { findFirst: async () => null, update: async () => { acknowledgements += 1; return {}; } }
  } } as any, {} as any, {} as any, access as any);
  await assert.rejects(() => service.acknowledgeHandoff(user, "restricted-handoff"), (error: unknown) => error instanceof NotFoundException);
  assert.equal(acknowledgements, 0);
});

test("client updates require access to at least one associated matter before persistence", async () => {
  let updates = 0;
  const service = new ClientsService({ client: {
    client: { findFirst: async () => null, update: async () => { updates += 1; return {}; } }
  } } as any, {} as any, {} as any, access as any);
  await assert.rejects(() => service.update(user, "restricted-client", { displayName: "Do not write" }), (error: unknown) => error instanceof NotFoundException);
  assert.equal(updates, 0);
});
