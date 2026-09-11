import test from "node:test";
import assert from "node:assert/strict";
import { AuditController } from "../src/modules/audit/audit.controller";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = {
  id: "user-1", firmId: "firm-1", email: "user@example.test", fullName: "User One",
  homeBranchId: null, roleKeys: ["advocate"], permissions: ["admin.audit_view"]
};

test("audit listing omits events linked to matters outside the shared access policy", async () => {
  const controller = new AuditController({
    client: { auditEvent: { findMany: async () => [
      { id: "public", matterId: null },
      { id: "visible", matterId: "matter-visible" },
      { id: "restricted", matterId: "matter-restricted" }
    ] } }
  } as any, { canViewMatter: async (_user: RequestUser, matterId: string) => matterId !== "matter-restricted" } as any);

  const rows = await controller.list(user);
  assert.deepEqual(rows.map((row) => row.id), ["public", "visible"]);
});
