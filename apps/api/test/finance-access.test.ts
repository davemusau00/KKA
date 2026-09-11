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

test("journal rejects mixed funds unless explicitly marked as a fund transfer", async () => {
  const finance = new FinanceService({
    client: {
      ledgerAccount: { findMany: async () => [
        { id: "client-account", fundType: "CLIENT" },
        { id: "office-account", fundType: "OFFICE" }
      ] }
    }
  } as any, {} as any, {} as any, {} as any);
  await assert.rejects(
    finance.postJournal("firm-1", "user-1", {
      description: "Mixed funds", transactionDate: "2026-09-11T00:00:00.000Z",
      lines: [{ accountId: "client-account", debit: 100, credit: 0 }, { accountId: "office-account", debit: 0, credit: 100 }]
    }),
    /cannot mix client and office funds/
  );
});

test("fund transfer posts a balanced, idempotent movement between two firm accounts", async () => {
  let created: any;
  const finance = new FinanceService({
    client: {
      journalEntry: { findFirst: async () => null },
      ledgerAccount: { findMany: async () => [{ id: "source", fundType: "CLIENT" }, { id: "destination", fundType: "OFFICE" }] },
      client: { findFirst: async () => null },
      matter: { findFirst: async () => null },
      journalLine: { findMany: async () => [] },
      $transaction: async () => undefined
    }
  } as any, { record: async () => undefined } as any, { next: async () => "KKA/JV/2026/000001" } as any, {} as any);
  (finance as any).prisma.client.journalEntry.create = async (args: any) => {
    created = { id: "transfer-1", ...args.data };
    return { id: "transfer-1", lines: args.data.lines.create };
  };
  const result = await finance.transfer("firm-1", "user-1", {
    sourceAccountId: "source", destinationAccountId: "destination", amount: 500,
    description: "Trust to office transfer", transactionDate: "2026-09-11T00:00:00.000Z", idempotencyKey: "transfer-001"
  });
  assert.equal(result.id, "transfer-1");
  assert.deepEqual(created.lines.create, [
    { accountId: "destination", debit: 500, credit: 0, matterId: undefined, clientId: undefined, memo: undefined },
    { accountId: "source", debit: 0, credit: 500, matterId: undefined, clientId: undefined, memo: undefined }
  ]);
});

test("settlement position derives recorded funds and deductions from persisted finance records", async () => {
  const finance = new FinanceService({
    client: {
      paymentReceipt: { findMany: async () => [{ id: "receipt-1", amount: 1000, accountId: "trust", receiptNumber: "R1", receivedAt: new Date(), referenceNumber: "REF1" }] },
      feeNote: { findMany: async () => [{ id: "fee-1", grossTotal: 200, feeNoteNumber: "F1", status: "ISSUED" }] },
      expenseRequest: { findMany: async () => [{ id: "expense-1", amount: 100, expenseNumber: "E1", status: "DISBURSED" }] },
      ledgerAccount: { findMany: async () => [{ id: "trust", fundType: "CLIENT" }] }
    }
  } as any, {} as any, {} as any, { canViewMatter: async () => true } as any);
  const position = await finance.settlementPosition(user, "matter-1");
  assert.equal(position.recordedClientFunds, 1000);
  assert.equal(position.recordedFeeNotes, 200);
  assert.equal(position.reconciledDisbursements, 100);
  assert.equal(position.proposedResidual, 700);
  assert.deepEqual(position.evidence, { receiptIds: ["receipt-1"], feeNoteIds: ["fee-1"], expenseIds: ["expense-1"] });
});

test("reconciliation completion rejects a statement balance that differs from the posted ledger", async () => {
  const finance = new FinanceService({
    client: {
      reconciliation: { findFirst: async () => ({ id: "recon-1", accountId: "account-1", periodEnd: new Date("2026-09-30T00:00:00.000Z"), statementClosingBalance: 100, status: "OPEN" }) },
      ledgerAccount: { findFirst: async () => ({ id: "account-1", accountClass: "ASSET", active: true }) },
      journalLine: { findMany: async () => [] }
    }
  } as any, {} as any, {} as any, {} as any);
  await assert.rejects(finance.completeReconciliation("firm-1", "user-1", "recon-1"), /does not match the posted ledger/);
});
