import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { OrganizationService } from "../src/modules/organization/organization.service";

test("department creation rejects a manager outside the firm before department persistence", async () => {
  let creates = 0;
  const service = new OrganizationService({ client: {
    user: { findFirst: async () => null },
    department: { create: async () => { creates += 1; } }
  } } as any, {} as any);

  await assert.rejects(() => service.createDepartment("firm-1", "admin-1", { name: "Litigation", code: "LIT", managerId: "outside-user" }), NotFoundException);
  assert.equal(creates, 0);
});
