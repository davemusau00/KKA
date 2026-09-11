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

test("journal retries return the existing source record instead of posting twice", async () => {
  let creates = 0;
  const finance = new FinanceService({
    client: {
      journalEntry: {
        findFirst: async () => ({ id: "journal-existing", lines: [] }),
        create: async () => { creates += 1; return { id: "journal-new" }; }
      }
    }
  } as any, {} as any, {} as any, {} as any);
  const result = await finance.postJournal("firm-1", "user-1", {
    description: "Settlement receipt", transactionDate: "2026-09-11T00:00:00.000Z", sourceType: "PAYMENT_RECEIPT", sourceId: "receipt-1",
    lines: [{ accountId: "debit", debit: 100, credit: 0 }, { accountId: "credit", debit: 0, credit: 100 }]
  });
  assert.equal(result.id, "journal-existing");
  assert.equal(creates, 0);
});

test("receipt retries return the existing reference instead of creating another receipt", async () => {
  let creates = 0;
  const finance = new FinanceService({
    client: { paymentReceipt: { findFirst: async () => ({ id: "receipt-existing" }), create: async () => { creates += 1; return {}; } } }
  } as any, {} as any, {} as any, {} as any);
  const result = await finance.recordReceipt("firm-1", "user-1", {
    accountId: "account-1", referenceNumber: "BANK-001", amount: 100, currency: "KES", payerName: "Client",
    paymentMethod: "BANK", description: "Receipt", receivedAt: "2026-09-11T00:00:00.000Z"
  });
  assert.equal(result.id, "receipt-existing");
  assert.equal(creates, 0);
});

test("journal rejects line attribution that differs from the journal header", async () => {
  const finance = new FinanceService({ client: {} } as any, {} as any, {} as any, {} as any);
  await assert.rejects(
    finance.postJournal("firm-1", "user-1", {
      matterId: "matter-1", description: "Mismatch", transactionDate: "2026-09-11T00:00:00.000Z",
      lines: [{ accountId: "a", debit: 100, credit: 0, matterId: "matter-2" }, { accountId: "b", debit: 0, credit: 100 }]
    }),
    /matter attribution does not match/
  );
});
