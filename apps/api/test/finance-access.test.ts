import test from "node:test";
import assert from "node:assert/strict";
import { NotFoundException } from "@nestjs/common";
import { FinanceService } from "../src/modules/finance/finance.service";
import type { RequestUser } from "../src/platform/auth/auth.types";

const user: RequestUser = {
  id: "user-1", firmId: "firm-1", email: "finance@example.test", fullName: "Finance User",
  homeBranchId: null, roleKeys: ["finance"], permissions: ["finance.view"]
};

function service(canView: boolean) {
  return new FinanceService(
    { client: { journalLine: { findMany: async () => [{ id: "line-1" }] } } } as any,
    {} as any,
    {} as any,
    { canViewMatter: async () => canView } as any
  );
}

test("matter ledger denies restricted matter access", async () => {
  await assert.rejects(service(false).matterLedger(user, "matter-restricted"), (error: unknown) => error instanceof NotFoundException);
});

test("matter ledger returns posted lines after shared matter access succeeds", async () => {
  assert.deepEqual(await service(true).matterLedger(user, "matter-visible"), [{ id: "line-1" }]);
});
