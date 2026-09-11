import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../platform/prisma/prisma.service";
import { AuditService } from "../../platform/audit/audit.service";
import { NumberingService } from "../numbering/numbering.service";
import { RecordAccessService } from "../../platform/auth/record-access.service";
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

    const accountIds = Array.from(new Set(input.lines.map((line) => line.accountId)));
    const accounts = await this.prisma.client.ledgerAccount.findMany({
      where: { firmId, id: { in: accountIds }, active: true }
    });
    if (accounts.length !== accountIds.length) throw new BadRequestException("One or more ledger accounts are invalid");

    const reference = await this.numbering.next({
      firmId,
      entityType: "JOURNAL",
      year: new Date(input.transactionDate).getFullYear(),
      pattern: "KKA/JV/{year}/{seq:6}"
    });

    const entry = await this.prisma.client.journalEntry.create({
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

    const account = await this.prisma.client.ledgerAccount.findFirst({
      where: { id: input.accountId, firmId, active: true }
    });
    if (!account) throw new BadRequestException("Receiving account not found");

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
        lines: [
          { accountId: account.id, debit: input.amount, credit: 0, matterId: input.matterId, clientId: input.clientId },
          { accountId: counterpart.id, debit: 0, credit: input.amount, matterId: input.matterId, clientId: input.clientId }
        ]
      });
      journalEntryId = journal.id;
    }

    const receipt = await this.prisma.client.paymentReceipt.create({
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
    await this.audit.record({
      firmId, actorUserId: actorId, action: "finance.receipt_recorded",
      entityType: "payment_receipt", entityId: receipt.id,
      matterId: receipt.matterId ?? undefined, clientId: receipt.clientId ?? undefined,
      metadata: { receiptNumber, amount: String(receipt.amount), accountId: input.accountId }
    });
    return receipt;
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
