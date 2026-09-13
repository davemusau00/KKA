import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import { AuthService } from "../src/modules/auth/auth.service";
import { UsersService } from "../src/modules/users/users.service";

process.env.DATABASE_URL ??= "postgresql://localhost/test";
process.env.REDIS_URL ??= "redis://localhost";
process.env.APP_ENCRYPTION_KEY_BASE64 ??= Buffer.alloc(32, 7).toString("base64");
process.env.ARGON2_MEMORY_COST = "1024";
process.env.ARGON2_TIME_COST = "1";

const user = {
  id: "invitee-1", email: "invitee@example.test", fullName: "Invitee", firmId: "firm-1", homeBranchId: null, status: "INVITED", passwordHash: null,
  roles: [{ role: { firmId: "firm-1", active: true, key: "advocate", permissions: [{ permission: { key: "matter.view" } }] } }]
};

function authService(overrides: Record<string, unknown> = {}) {
  const redis = { client: { incr: async () => 1, expire: async () => 1, ...((overrides.redis as object) || {}) } };
  const audit = { record: async () => ({ id: "audit-1" }) };
  return new AuthService({ client: overrides.client } as any, redis as any, audit as any);
}

test("invite acceptance atomically claims a valid invite, activates the user, revokes replacements, and records an audit", async () => {
  const calls: Array<{ target: string; data?: unknown }> = [];
  const invite = { id: "invite-1", userId: user.id, expiresAt: new Date(Date.now() + 60_000), acceptedAt: null, revokedAt: null, supersededAt: null, user };
  const tx = {
    userInvite: {
      updateMany: async (input: any) => { calls.push({ target: "invite", data: input.data }); return { count: 1 }; }
    },
    user: {
      updateMany: async (input: any) => { calls.push({ target: "user", data: input.data }); return { count: 1 }; },
      findUniqueOrThrow: async () => user
    }
  };
  const service = authService({ client: { userInvite: { findUnique: async () => invite }, $transaction: async (work: any) => work(tx) } });
  const accepted = await service.acceptInvite("x".repeat(43), "sufficiently-long-password");
  assert.equal(accepted.ok, true);
  assert.equal(accepted.user.id, user.id);
  assert.equal(accepted.auditId, "audit-1");
  const activation = calls.find((call) => call.target === "user")?.data as { passwordHash: string; status: string };
  assert.equal(typeof activation.passwordHash, "string");
  assert.equal(activation.status, "ACTIVE");
  assert.equal(calls.filter((call) => call.target === "invite").length, 2);
});

test("a concurrently claimed, expired, revoked, superseded, or already accepted invite cannot activate an account", async () => {
  const invite = { id: "invite-1", userId: user.id, expiresAt: new Date(Date.now() + 60_000), acceptedAt: null, revokedAt: null, supersededAt: null, user };
  let activated = 0;
  const tx = { userInvite: { updateMany: async () => ({ count: 0 }) }, user: { updateMany: async () => { activated += 1; return { count: 1 }; } } };
  const service = authService({ client: { userInvite: { findUnique: async () => invite }, $transaction: async (work: any) => work(tx) } });
  await assert.rejects(() => service.acceptInvite("y".repeat(43), "sufficiently-long-password"), (error: unknown) => error instanceof BadRequestException);
  assert.equal(activated, 0);

  for (const state of [{ acceptedAt: new Date() }, { revokedAt: new Date() }, { supersededAt: new Date() }, { expiresAt: new Date(Date.now() - 1) }, { user: { ...user, status: "SUSPENDED" } }]) {
    const rejected = authService({ client: { userInvite: { findUnique: async () => ({ ...invite, ...state }) } } });
    await assert.rejects(() => rejected.acceptInvite("z".repeat(43), "sufficiently-long-password"), (error: unknown) => error instanceof BadRequestException);
  }
});

test("resending a pending invitation supersedes every still-usable token and records an unconfigured delivery outcome", async () => {
  const superseded: unknown[] = [];
  const created: any[] = [];
  const service = new UsersService({ client: {
    user: { findFirst: async () => user },
    $transaction: async (work: any) => work({ userInvite: {
      updateMany: async (input: any) => { superseded.push(input); return { count: 1 }; },
      create: async (input: any) => { created.push(input); return { id: "replacement-1", expiresAt: input.data.expiresAt, deliveryStatus: input.data.deliveryStatus }; }
    } })
  } } as any, { record: async () => ({ id: "audit-2" }) } as any);
  const result = await service.resendInvite("firm-1", "admin-1", user.id);
  assert.equal(result.invite.deliveryStatus, "UNCONFIGURED");
  assert.equal(result.auditId, "audit-2");
  assert.equal(superseded.length, 1);
  assert.equal(created[0].data.deliveryStatus, "UNCONFIGURED");
  assert.equal(created[0].data.createdById, "admin-1");
});

test("an administrator cannot bypass password creation by activating a pending invitation", async () => {
  let updates = 0;
  const service = new UsersService({ client: { user: {
    findFirst: async () => user,
    update: async () => { updates += 1; return user; }
  } } } as any, { record: async () => ({ id: "audit-3" }) } as any);
  await assert.rejects(() => service.setStatus("firm-1", "admin-1", user.id, "ACTIVE"), (error: unknown) => error instanceof BadRequestException);
  assert.equal(updates, 0);
});

test("administrators can inspect and revoke only same-firm server sessions, with stale session cleanup", async () => {
  const deleted: string[][] = [];
  const removed: string[][] = [];
  const audit: any[] = [];
  const service = new AuthService({ client: { user: { findFirst: async ({ where }: any) => where.firmId === "firm-1" ? { id: user.id } : null } } } as any, {
    client: {
      smembers: async () => ["live", "stale"],
      get: async (key: string) => key.endsWith("live") ? "session" : null,
      srem: async (_key: string, ...ids: string[]) => { removed.push(ids); return ids.length; },
      del: async (...keys: string[]) => { deleted.push(keys); return keys.length; }
    }
  } as any, { record: async (input: any) => { audit.push(input); return { id: "audit-4" }; } } as any);
  const inspected = await service.inspectUserSessions("firm-1", "admin-1", user.id);
  assert.equal(inspected.activeSessionCount, 1);
  assert.deepEqual(removed, [["stale"]]);
  const revoked = await service.revokeUserSessions("firm-1", "admin-1", user.id);
  assert.equal(revoked.revokedSessions, 2);
  assert.equal(audit[0].action, "auth.sessions_inspected");
  assert.equal(audit[1].action, "auth.sessions_admin_revoked");
  await assert.rejects(() => service.revokeUserSessions("other-firm", "admin-1", user.id), (error: unknown) => error instanceof BadRequestException);
});

test("home-branch assignment is firm-scoped, records membership, and audits the persisted change", async () => {
  const writes: any[] = [];
  const service = new UsersService({ client: {
    user: { findFirst: async () => ({ id: user.id, homeBranchId: "branch-old" }) },
    branch: { findFirst: async ({ where }: any) => where.id === "branch-new" ? { id: "branch-new" } : null },
    $transaction: async (work: any) => work({
      user: { update: async (input: any) => { writes.push(input); return { ...user, homeBranchId: input.data.homeBranchId }; } },
      userBranch: { upsert: async (input: any) => { writes.push(input); return {}; } }
    })
  } } as any, { record: async () => ({ id: "audit-5" }) } as any);
  const result = await service.setHomeBranch("firm-1", "admin-1", user.id, "branch-new");
  assert.equal(result.user.homeBranchId, "branch-new");
  assert.equal(result.auditId, "audit-5");
  assert.equal(writes[1].where.userId_branchId.branchId, "branch-new");
  await assert.rejects(() => service.setHomeBranch("firm-1", "admin-1", user.id, "branch-other"), (error: unknown) => error instanceof BadRequestException);
});
