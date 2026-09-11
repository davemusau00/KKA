import test from "node:test";
import assert from "node:assert/strict";
import { RecordAccessService } from "../src/platform/auth/record-access.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = {
  id: "user-a",
  firmId: "firm-a",
  email: "a@example.test",
  fullName: "User A",
  homeBranchId: null,
  roleKeys: ["advocate"],
  permissions: ["matter.view"]
};

function service(teamIds: string[] = []) {
  return new RecordAccessService({
    client: {
      userTeam: { findMany: async () => teamIds.map(teamId => ({ teamId })) },
      matter: { findFirst: async ({ where }: any) => ({ id: where.id }) }
    }
  } as any);
}

test("unrestricted users receive only their firm scope and no access rows means firm-visible", async () => {
  const where = await service().matterWhere(user);
  assert.deepEqual(where, { firmId: "firm-a", OR: [{ accesses: { none: {} } }, { accesses: { some: { userId: "user-a" } } }] });
});

test("team memberships are included in the shared matter predicate", async () => {
  const where = await service(["team-a"]).matterWhere(user);
  assert.deepEqual(where, {
    firmId: "firm-a",
    OR: [
      { accesses: { none: {} } },
      { accesses: { some: { userId: "user-a" } } },
      { accesses: { some: { teamId: { in: ["team-a"] } } } }
    ]
  });
});

test("matter access administrators retain firm-wide visibility", async () => {
  const admin = { ...user, permissions: ["matter.view", "matter.access_manage"] };
  assert.deepEqual(await service(["team-a"]).matterWhere(admin), { firmId: "firm-a" });
});
