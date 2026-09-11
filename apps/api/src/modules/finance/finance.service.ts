import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { NumberingService } from "../numbering/numbering.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
import { Prisma } from "@kka/database";
import type { RequestUser } from "../../platform/auth/auth.types";

type JournalLineInput = {
  accountId: string;
  debit: number;
  credit: number;
  matterId?: string;
  clientId?: string;
  memo?: string;
};

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly numbering: NumberingService,
    private readonly access: RecordAccessService
  ) {}

  accounts(firmId: string) {
    return this.prisma.client.ledgerAccount.findMany({
      where: { firmId },
      orderBy: [{ fundType: "asc" }, { code: "asc" }]
    });
  }

  async reconciliations(firmId: string) {
    return this.prisma.client.reconciliation.findMany({
      where: { firmId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 200
    });
  }

  periodLocks(firmId: string) {
    return this.prisma.client.ledgerPeriodLock.findMany({ where: { firmId }, orderBy: { periodStart: "desc" }, take: 200 });
  }

  async lockPeriod(firmId: string, actorId: string, input: { periodStart: string; periodEnd: string; reason?: string }) {
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);
    if (!(periodStart <= periodEnd)) throw new BadRequestException("Ledger period must have an end on or after its start");
    const overlap = await this.prisma.client.ledgerPeriodLock.findFirst({
      where: { firmId, periodStart: { lte: periodEnd }, periodEnd: { gte: periodStart } }
    });
    if (overlap) throw new BadRequestException("Ledger period overlaps an existing lock");
    const lock = await this.prisma.client.ledgerPeriodLock.create({ data: { firmId, periodStart, periodEnd, reason: input.reason, lockedById: actorId } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "finance.period_locked", entityType: "ledger_period_lock", entityId: lock.id, metadata: { periodStart, periodEnd, reason: input.reason } });
    return lock;
  }

  private async assertPeriodOpen(firmId: string, transactionDate: Date) {
    const lock = await this.prisma.client.ledgerPeriodLock.findFirst({ where: { firmId, periodStart: { lte: transactionDate }, periodEnd: { gte: transactionDate } } });
    if (lock) throw new BadRequestException("Ledger period is locked; post a current-period reversal or adjustment instead");
  }

  private async assertNoOpenReconciliation(firmId: string, transactionDate: Date, accountIds: string[]) {
    const reconciliation = await this.prisma.client.reconciliation.findFirst({
      where: { firmId, status: "OPEN", accountId: { in: accountIds }, periodStart: { lte: transactionDate }, periodEnd: { gte: transactionDate } }
    });
    if (reconciliation) throw new BadRequestException("Account is locked by an open reconciliation; complete it before posting");
  }

  private async accountBalanceAt(firmId: string, accountId: string, at: Date, before?: Date) {
    const account = await this.prisma.client.ledgerAccount.findFirst({ where: { id: accountId, firmId, active: true } });
    if (!account) throw new NotFoundException("Account not found");
    const lines = await this.prisma.client.journalLine.findMany({
      where: {
        accountId,
        entry: { firmId, status: "POSTED", transactionDate: { ...(before ? { gte: before } : {}), lte: at } }
      },
      select: { debit: true, credit: true }
    });
    const debits = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const credits = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    const normalDebit = ["ASSET", "EXPENSE"].includes(account.accountClass);
    return money(normalDebit ? debits - credits : credits - debits);
  }

  async startReconciliation(firmId: string, actorId: string, input: {
    accountId: string;
    periodStart: string;
    periodEnd: string;
    statementOpeningBalance: number;
    statementClosingBalance: number;
  }) {
    const periodStart = new Date(input.periodStart);
    const periodEnd = new Date(input.periodEnd);
    if (!(periodStart < periodEnd)) throw new BadRequestException("Reconciliation period must have an end after its start");
    const account = await this.prisma.client.ledgerAccount.findFirst({ where: { id: input.accountId, firmId, active: true } });
    if (!account) throw new NotFoundException("Account not found");
    const existing = await this.prisma.client.reconciliation.findFirst({ where: { firmId, accountId: input.accountId, periodStart, periodEnd } });
    if (existing) return existing;
    const ledgerOpeningBalance = await this.accountBalanceAt(firmId, input.accountId, new Date(periodStart.getTime() - 1), undefined);
    const ledgerClosingBalance = await this.accountBalanceAt(firmId, input.accountId, periodEnd, undefined);
    const reconciliation = await this.prisma.client.reconciliation.create({
      data: {
        firmId,
        accountId: input.accountId,
        periodStart,
        periodEnd,
        statementOpeningBalance: input.statementOpeningBalance,
        statementClosingBalance: input.statementClosingBalance,
        ledgerClosingBalance,
        status: "OPEN"
      },
      include: { items: true }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "finance.reconciliation_started",
      entityType: "reconciliation", entityId: reconciliation.id,
      metadata: { accountId: input.accountId, ledgerOpeningBalance, ledgerClosingBalance, statementClosingBalance: input.statementClosingBalance }
    });
    return { ...reconciliation, ledgerOpeningBalance, difference: money(input.statementClosingBalance - ledgerClosingBalance) };
  }

  async completeReconciliation(firmId: string, actorId: string, reconciliationId: string) {
    const reconciliation = await this.prisma.client.reconciliation.findFirst({ where: { id: reconciliationId, firmId } });
    if (!reconciliation) throw new NotFoundException("Reconciliation not found");
    if (reconciliation.status !== "OPEN") throw new BadRequestException("Only open reconciliations can be completed");
    const unmatchedItems = await this.prisma.client.reconciliationItem.count({ where: { reconciliationId, matched: false } });
    if (unmatchedItems > 0) throw new BadRequestException("All reconciliation items must be matched before completion");
    const ledgerClosingBalance = await this.accountBalanceAt(firmId, reconciliation.accountId, reconciliation.periodEnd, undefined);
    if (Math.abs(Number(reconciliation.statementClosingBalance) - ledgerClosingBalance) > 0.01) {
      throw new BadRequestException("Statement closing balance does not match the posted ledger");
    }
    const updated = await this.prisma.client.reconciliation.updateMany({
      where: { id: reconciliationId, firmId, status: "OPEN" },
      data: { status: "COMPLETED", ledgerClosingBalance, completedById: actorId, completedAt: new Date() }
    });
    if (updated.count !== 1) throw new BadRequestException("Reconciliation was already completed");
    const completed = await this.prisma.client.reconciliation.findUnique({ where: { id: reconciliationId }, include: { items: true } });
    await this.audit.record({ firmId, actorUserId: actorId, action: "finance.reconciliation_completed", entityType: "reconciliation", entityId: reconciliationId, metadata: { ledgerClosingBalance } });
    return completed;
  }

  async addReconciliationItem(firmId: string, actorId: string, reconciliationId: string, input: {
    sourceReference: string;
    sourceDate: string;
    amount: number;
    journalEntryId?: string;
    notes?: string;
  }) {
    const reconciliation = await this.prisma.client.reconciliation.findFirst({ where: { id: reconciliationId, firmId } });
    if (!reconciliation) throw new NotFoundException("Reconciliation not found");
    if (reconciliation.status !== "OPEN") throw new BadRequestException("Only open reconciliations can receive items");
    const sourceDate = new Date(input.sourceDate);
    if (sourceDate < reconciliation.periodStart || sourceDate > reconciliation.periodEnd) throw new BadRequestException("Statement item is outside the reconciliation period");
    let matched = false;
    if (input.journalEntryId) {
      const account = await this.prisma.client.ledgerAccount.findFirst({ where: { id: reconciliation.accountId, firmId, active: true } });
      if (!account) throw new NotFoundException("Account not found");
      const journal = await this.prisma.client.journalEntry.findFirst({
        where: { id: input.journalEntryId, firmId, status: "POSTED", transactionDate: { gte: reconciliation.periodStart, lte: reconciliation.periodEnd }, lines: { some: { accountId: reconciliation.accountId } } },
        include: { lines: { where: { accountId: reconciliation.accountId }, select: { debit: true, credit: true } } }
      });
      if (!journal) throw new BadRequestException("Journal entry is not posted to this account within the reconciliation period");
      const signed = journal.lines.reduce((sum, line) => sum + Number(line.debit) - Number(line.credit), 0);
      if (Math.abs(Math.abs(signed) - Number(input.amount)) > 0.01) throw new BadRequestException("Statement item amount does not match the journal entry");
      matched = true;
    }
    const item = await this.prisma.client.reconciliationItem.create({
      data: { reconciliationId, sourceReference: input.sourceReference, sourceDate, amount: input.amount, journalEntryId: input.journalEntryId, matched, notes: input.notes }
    });
    await this.audit.record({ firmId, actorUserId: actorId, action: "finance.reconciliation_item_added", entityType: "reconciliation_item", entityId: item.id, metadata: { reconciliationId, sourceReference: input.sourceReference, matched } });
    return item;
  }

  async transfer(firmId: string, actorId: string, input: {
    sourceAccountId: string;
    destinationAccountId: string;
    amount: number;
    description: string;
    transactionDate: string;
    idempotencyKey: string;
    matterId?: string;
    clientId?: string;
  }) {
    if (input.sourceAccountId === input.destinationAccountId) {
      throw new BadRequestException("Source and destination accounts must differ");
    }
    const existing = await this.prisma.client.journalEntry.findFirst({
      where: { firmId, sourceType: "FUND_TRANSFER", sourceId: input.idempotencyKey },
      include: { lines: { include: { account: true } } }
    });
    if (existing) return existing;

    const amount = money(Number(input.amount));
    if (!Number.isFinite(amount) || amount <= 0) throw new BadRequestException("Transfer amount must be positive");
    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: { firmId, id: { in: [input.sourceAccountId, input.destinationAccountId] }, active: true }
    });
    if (accounts.length !== 2) throw new BadRequestException("Source or destination account is invalid");

    const entry = await this.postJournal(firmId, actorId, {
      matterId: input.matterId,
      clientId: input.clientId,
      description: input.description,
      transactionDate: input.transactionDate,
      sourceType: "FUND_TRANSFER",
      sourceId: input.idempotencyKey,
      lines: [
        { accountId: input.destinationAccountId, debit: amount, credit: 0, matterId: input.matterId, clientId: input.clientId },
        { accountId: input.sourceAccountId, debit: 0, credit: amount, matterId: input.matterId, clientId: input.clientId }
      ]
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "finance.fund_transfer_posted",
      entityType: "journal_entry", entityId: entry.id, matterId: input.matterId, clientId: input.clientId,
      metadata: { sourceAccountId: input.sourceAccountId, destinationAccountId: input.destinationAccountId, amount, idempotencyKey: input.idempotencyKey }
    });
    return entry;
  }

  async postJournal(
    firmId: string,
    actorId: string,
    input: {
      branchId?: string;
      matterId?: string;
      clientId?: string;
      description: string;
      transactionDate: string;
      sourceType?: string;
      sourceId?: string;
      lines: JournalLineInput[];
    }
  ) {
    if (!input.lines.length) throw new BadRequestException("Journal requires at least two lines");
    for (const line of input.lines) {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      if (!Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || (debit > 0 && credit > 0) || (debit === 0 && credit === 0)) {
        throw new BadRequestException("Each journal line must contain exactly one non-negative debit or credit amount");
      }
      if (line.matterId && input.matterId && line.matterId !== input.matterId) {
        throw new BadRequestException("Journal line matter attribution does not match the journal");
      }
      if (line.clientId && input.clientId && line.clientId !== input.clientId) {
        throw new BadRequestException("Journal line client attribution does not match the journal");
      }
    }

    if (input.matterId) {
      const matter = await this.prisma.client.matter.findFirst({
        where: { id: input.matterId, firmId },
        select: { clientId: true }
      });
      if (!matter) throw new BadRequestException("Matter not found");
      if (input.clientId && matter.clientId !== input.clientId) throw new BadRequestException("Matter and client attribution do not match");
    }
    if (input.clientId) {
      const client = await this.prisma.client.client.findFirst({ where: { id: input.clientId, firmId }, select: { id: true } });
      if (!client) throw new BadRequestException("Client not found");
    }

    const totalDebit = money(input.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0));
    const totalCredit = money(input.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0));
    if (totalDebit <= 0 || totalCredit <= 0 || totalDebit !== totalCredit) {
      throw new BadRequestException(`Journal is not balanced. Debit=${totalDebit}, Credit=${totalCredit}`);
    }

    if (input.sourceType && input.sourceId) {
      const existing = await this.prisma.client.journalEntry.findFirst({
        where: { firmId, sourceType: input.sourceType, sourceId: input.sourceId },
        include: { lines: { include: { account: true } } }
      });
      if (existing) return existing;
    }

    await this.assertPeriodOpen(firmId, new Date(input.transactionDate));

    const accountIds = Array.from(new Set(input.lines.map((line) => line.accountId)));
    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: { firmId, id: { in: accountIds }, active: true }
    });
    if (accounts.length !== accountIds.length) throw new BadRequestException("One or more ledger accounts are invalid");
    const fundTypes = new Set(accounts.map((account) => account.fundType));
    if (fundTypes.size > 1 && input.sourceType !== "FUND_TRANSFER") {
      throw new BadRequestException("A journal cannot mix client and office funds unless it is an explicit fund transfer");
    }
    await this.assertNoOpenReconciliation(firmId, new Date(input.transactionDate), accountIds);

    const reference = await this.numbering.next({
      firmId,
      entityType: "JOURNAL",
      year: new Date(input.transactionDate).getFullYear(),
      pattern: "KKA/JV/{year}/{seq:6}"
    });

    let entry;
    try {
      entry = await this.prisma.client.journalEntry.create({
        data: {
          firmId,
          branchId: input.branchId,
          matterId: input.matterId,
          clientId: input.clientId,
          reference,
          description: input.description,
          status: "POSTED",
          transactionDate: new Date(input.transactionDate),
          postedAt: new Date(),
          postedById: actorId,
          createdById: actorId,
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          lines: {
            create: input.lines.map((line) => ({
              accountId: line.accountId,
              debit: line.debit,
              credit: line.credit,
              matterId: line.matterId ?? input.matterId,
              clientId: line.clientId ?? input.clientId,
              memo: line.memo
            }))
          }
        },
        include: { lines: { include: { account: true } } }
      });
    } catch (error) {
      if (input.sourceType && input.sourceId && isUniqueConstraintError(error)) {
        const concurrent = await this.prisma.client.journalEntry.findFirst({
          where: { firmId, sourceType: input.sourceType, sourceId: input.sourceId },
          include: { lines: { include: { account: true } } }
        });
        if (concurrent) return concurrent;
      }
      throw error;
    }

    await this.audit.record({
      firmId, actorUserId: actorId, action: "finance.journal_posted",
      entityType: "journal_entry", entityId: entry.id, matterId: input.matterId,
      clientId: input.clientId,
      metadata: { reference, totalDebit, totalCredit, sourceType: input.sourceType }
    });
    return entry;
  }

  async reverseJournal(firmId: string, actorId: string, entryId: string, reason: string) {
    const entry = await this.prisma.client.journalEntry.findFirst({
      where: { id: entryId, firmId, status: "POSTED" },
      include: { lines: true }
    });
    if (!entry) throw new NotFoundException("Posted journal entry not found");
    const reversed = await this.postJournal(firmId, actorId, {
      branchId: entry.branchId ?? undefined,
      matterId: entry.matterId ?? undefined,
      clientId: entry.clientId ?? undefined,
      description: `REVERSAL: ${entry.description} - ${reason}`,
      transactionDate: new Date().toISOString(),
      sourceType: "REVERSAL",
      sourceId: entry.id,
      lines: entry.lines.map((line) => ({
        accountId: line.accountId,
        debit: Number(line.credit),
        credit: Number(line.debit),
        matterId: line.matterId ?? undefined,
        clientId: line.clientId ?? undefined,
        memo: `Reversal of ${entry.reference}`
      }))
    });
    await this.prisma.client.journalEntry.update({
      where: { id: entryId },
      data: { status: "REVERSED", reversedEntryId: reversed.id }
    });
    return reversed;
  }

  async createExpense(firmId: string, actorId: string, input: any) {
    const expenseNumber = await this.numbering.next({
      firmId,
      branchId: input.branchId,
      entityType: "EXPENSE",
      year: new Date().getFullYear(),
      pattern: "KKA/EXP/{year}/{seq:6}"
    });
    const expense = await this.prisma.client.expenseRequest.create({
      data: {
        firmId,
        matterId: input.matterId,
        branchId: input.branchId,
        expenseNumber,
        category: input.category,
        description: input.description,
        amount: input.amount,
        currency: input.currency,
        paymentSource: input.paymentSource,
        requestedById: actorId,
        status: "SUBMITTED"
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: "finance.expense_submitted",
      entityType: "expense_request", entityId: expense.id, matterId: expense.matterId ?? undefined,
      metadata: { expenseNumber, amount: String(expense.amount), category: expense.category }
    });
    return expense;
  }

  async approveExpense(firmId: string, actorId: string, expenseId: string, approve: boolean, comment?: string) {
    const expense = await this.prisma.client.expenseRequest.findFirst({ where: { id: expenseId, firmId } });
    if (!expense) throw new NotFoundException("Expense request not found");
    if (expense.status !== "SUBMITTED") throw new BadRequestException("Only submitted expenses can be decided");
    const status = approve ? "APPROVED" : "REJECTED";
    const updated = await this.prisma.client.expenseRequest.update({
      where: { id: expenseId },
      data: {
        status,
        approvedById: actorId,
        approvedAt: approve ? new Date() : undefined,
        reconciliationNotes: comment
      }
    });
    await this.audit.record({
      firmId, actorUserId: actorId, action: approve ? "finance.expense_approved" : "finance.expense_rejected",
      entityType: "expense_request", entityId: expenseId, matterId: expense.matterId ?? undefined,
      metadata: { comment }
    });
    return updated;
  }

  async disburseExpense(
    firmId: string,
    actorId: string,
    expenseId: string,
    accountId: string,
    expenseLedgerAccountId: string
  ) {
    const expense = await this.prisma.client.expenseRequest.findFirst({ where: { id: expenseId, firmId } });
    if (!expense) throw new NotFoundException("Expense request not found");
    if (expense.status !== "APPROVED") throw new BadRequestException("Expense must be approved before disbursement");

    const journal = await this.postJournal(firmId, actorId, {
      branchId: expense.branchId,
      matterId: expense.matterId ?? undefined,
      description: `Disbursement ${expense.expenseNumber}: ${expense.description}`,
      transactionDate: new Date().toISOString(),
      sourceType: "EXPENSE",
      sourceId: expense.id,
      lines: [
        {
          accountId: expenseLedgerAccountId,
          debit: Number(expense.amount),
          credit: 0,
          matterId: expense.matterId ?? undefined
        },
        {
          accountId,
          debit: 0,
          credit: Number(expense.amount),
          matterId: expense.matterId ?? undefined
        }
      ]
    });

    const updated = await this.prisma.client.expenseRequest.update({
      where: { id: expenseId },
      data: {
        status: "DISBURSED",
        disbursedById: actorId,
        disbursedAt: new Date(),
        journalEntryId: journal.id
      }
    });
    return updated;
  }

  async recordReceipt(firmId: string, actorId: string, input: any) {
    const existing = await this.prisma.client.paymentReceipt.findFirst({
      where: { firmId, referenceNumber: input.referenceNumber }
    });
    if (existing) return existing;
    await this.assertPeriodOpen(firmId, new Date(input.receivedAt));

    const account = await this.prisma.client.ledgerAccount.findFirst({
      where: { id: input.accountId, firmId, active: true }
    });
    if (!account) throw new BadRequestException("Receiving account not found");
    await this.assertNoOpenReconciliation(firmId, new Date(input.receivedAt), [account.id]);

    const receiptNumber = await this.numbering.next({
      firmId,
      branchId: account.branchId ?? undefined,
      entityType: "RECEIPT",
      year: new Date(input.receivedAt).getFullYear(),
      pattern: "KKA/RCPT/{year}/{seq:6}"
    });

    let journalEntryId: string | undefined;
    const counterpart = await this.prisma.client.ledgerAccount.findFirst({
      where: {
        firmId,
        active: true,
        ...(account.fundType === "CLIENT"
          ? { accountClass: "LIABILITY", fundType: "CLIENT" }
          : { accountClass: "INCOME", fundType: "OFFICE" })
      },
      orderBy: { code: "asc" }
    });
    if (counterpart) {
      const journal = await this.postJournal(firmId, actorId, {
        matterId: input.matterId,
        clientId: input.clientId,
        description: `Receipt ${receiptNumber}: ${input.description}`,
        transactionDate: input.receivedAt,
        sourceType: "PAYMENT_RECEIPT",
        sourceId: input.referenceNumber,
        lines: [
          { accountId: account.id, debit: input.amount, credit: 0, matterId: input.matterId, clientId: input.clientId },
          { accountId: counterpart.id, debit: 0, credit: input.amount, matterId: input.matterId, clientId: input.clientId }
        ]
      });
      journalEntryId = journal.id;
    }

    let receipt;
    try {
      receipt = await this.prisma.client.paymentReceipt.create({
        data: {
          firmId,
          matterId: input.matterId,
          clientId: input.clientId,
          accountId: input.accountId,
          journalEntryId,
          receiptNumber,
          amount: input.amount,
          currency: input.currency,
          payerName: input.payerName,
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber,
          description: input.description,
          receivedAt: new Date(input.receivedAt),
          createdById: actorId
        }
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        const concurrent = await this.prisma.client.paymentReceipt.findFirst({
          where: { firmId, referenceNumber: input.referenceNumber }
        });
        if (concurrent) return concurrent;
      }
      throw error;
    }
    await this.audit.record({
      firmId, actorUserId: actorId, action: "finance.receipt_recorded",
      entityType: "payment_receipt", entityId: receipt.id,
      matterId: receipt.matterId ?? undefined, clientId: receipt.clientId ?? undefined,
      metadata: { receiptNumber, amount: String(receipt.amount), accountId: input.accountId }
    });
    return receipt;
  }

  async clearReceipt(firmId: string, actorId: string, receiptId: string, clearingReference: string) {
    const receipt = await this.prisma.client.paymentReceipt.findFirst({ where: { id: receiptId, firmId } });
    if (!receipt) throw new NotFoundException("Payment receipt not found");
    if (receipt.clearedAt) return receipt;
    const clearedAt = new Date();
    const updated = await this.prisma.client.paymentReceipt.updateMany({
      where: { id: receiptId, firmId, clearedAt: null },
      data: { clearedAt, clearingReference }
    });
    const canonical = await this.prisma.client.paymentReceipt.findFirst({ where: { id: receiptId, firmId } });
    if (!canonical) throw new NotFoundException("Payment receipt not found");
    if (updated.count === 1) {
      await this.audit.record({
        firmId, actorUserId: actorId, action: "finance.receipt_cleared",
        entityType: "payment_receipt", entityId: receiptId,
        matterId: canonical.matterId ?? undefined, clientId: canonical.clientId ?? undefined,
        metadata: { clearingReference }
      });
    }
    return canonical;
  }

  async matterLedger(user: RequestUser, matterId: string) {
    if (!(await this.access.canViewMatter(user, matterId))) throw new NotFoundException("Matter ledger not found");
    return this.prisma.client.journalLine.findMany({
      where: { matterId, entry: { firmId: user.firmId, status: "POSTED" } },
      include: {
        account: true,
        entry: { select: { id: true, reference: true, description: true, transactionDate: true, sourceType: true } }
      },
      orderBy: { createdAt: "asc" }
    });
  }

  async settlementPosition(user: RequestUser, matterId: string) {
    if (!(await this.access.canViewMatter(user, matterId))) throw new NotFoundException("Settlement position not found");
    const [receipts, feeNotes, expenses] = await Promise.all([
      this.prisma.client.paymentReceipt.findMany({
        where: { firmId: user.firmId, matterId, clearedAt: { not: null } },
        select: { id: true, receiptNumber: true, amount: true, accountId: true, receivedAt: true, referenceNumber: true, clearedAt: true, clearingReference: true }
      }),
      this.prisma.client.feeNote.findMany({
        where: { firmId: user.firmId, matterId, status: { in: ["ISSUED", "PARTIALLY_PAID", "SETTLED_FROM_TRUST", "PAID"] } },
        select: { id: true, feeNoteNumber: true, grossTotal: true, status: true }
      }),
      this.prisma.client.expenseRequest.findMany({
        where: { firmId: user.firmId, matterId, status: { in: ["DISBURSED", "RECONCILED"] } },
        select: { id: true, expenseNumber: true, amount: true, status: true }
      })
    ]);
    const accountIds = [...new Set(receipts.map((receipt) => receipt.accountId))];
    const accounts = accountIds.length ? await this.prisma.client.ledgerAccount.findMany({ where: { firmId: user.firmId, id: { in: accountIds } }, select: { id: true, fundType: true } }) : [];
    const clientAccountIds = new Set(accounts.filter((account) => account.fundType === "CLIENT").map((account) => account.id));
    const clientReceipts = receipts.filter((receipt) => clientAccountIds.has(receipt.accountId));
    const recordedClientFunds = money(clientReceipts.reduce((sum, receipt) => sum + Number(receipt.amount), 0));
    const recordedFeeNotes = money(feeNotes.reduce((sum, feeNote) => sum + Number(feeNote.grossTotal), 0));
    const reconciledDisbursements = money(expenses.reduce((sum, expense) => sum + Number(expense.amount), 0));
    return {
      matterId,
      recordedClientFunds,
      recordedFeeNotes,
      reconciledDisbursements,
      proposedResidual: money(recordedClientFunds - recordedFeeNotes - reconciledDisbursements),
      evidence: {
        receiptIds: clientReceipts.map((receipt) => receipt.id),
        feeNoteIds: feeNotes.map((feeNote) => feeNote.id),
        expenseIds: expenses.map((expense) => expense.id)
      }
    };
  }

  async accountBalance(firmId: string, accountId: string) {
    const account = await this.prisma.client.ledgerAccount.findFirst({ where: { id: accountId, firmId } });
    if (!account) throw new NotFoundException("Account not found");
    const lines = await this.prisma.client.journalLine.findMany({
      where: { accountId, entry: { firmId, status: "POSTED" } },
      select: { debit: true, credit: true }
    });
    const debits = lines.reduce((sum, line) => sum + Number(line.debit), 0);
    const credits = lines.reduce((sum, line) => sum + Number(line.credit), 0);
    const normalDebit = ["ASSET", "EXPENSE"].includes(account.accountClass);
    return {
      account,
      debits: money(debits),
      credits: money(credits),
      balance: money(normalDebit ? debits - credits : credits - debits)
    };
  }
}
