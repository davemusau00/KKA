import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CreateExpenseSchema, PostJournalSchema, RecordReceiptSchema } from "@kka/contracts";
import { z } from "zod";
import { CurrentUser, RequirePermissions } from "../../platform/auth/decorators";
import type { RequestUser } from "../../platform/auth/auth.types";
import { FinanceService } from "./finance.service";

@Controller("finance")
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get("accounts")
  @RequirePermissions("finance.view")
  accounts(@CurrentUser() user: RequestUser) {
    return this.finance.accounts(user.firmId);
  }

  @Get("accounts/:id/balance")
  @RequirePermissions("finance.view")
  balance(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.finance.accountBalance(user.firmId, id);
  }

  @Get("reconciliations")
  @RequirePermissions("finance.view")
  reconciliations(@CurrentUser() user: RequestUser) {
    return this.finance.reconciliations(user.firmId);
  }

  @Post("reconciliations")
  @RequirePermissions("finance.reconciliation_manage")
  reconciliation(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      accountId: z.string().min(1),
      periodStart: z.string().datetime(),
      periodEnd: z.string().datetime(),
      statementOpeningBalance: z.coerce.number(),
      statementClosingBalance: z.coerce.number()
    }).parse(body);
    return this.finance.startReconciliation(user.firmId, user.id, input);
  }

  @Post("reconciliations/:id/complete")
  @RequirePermissions("finance.reconciliation_manage")
  completeReconciliation(@CurrentUser() user: RequestUser, @Param("id") id: string) {
    return this.finance.completeReconciliation(user.firmId, user.id, id);
  }

  @Post("journals")
  @RequirePermissions("finance.billing_manage")
  journal(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.finance.postJournal(user.firmId, user.id, PostJournalSchema.parse(body));
  }

  @Post("journals/:id/reverse")
  @RequirePermissions("finance.billing_manage")
  reverse(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ reason: z.string().min(3).max(2000) }).parse(body);
    return this.finance.reverseJournal(user.firmId, user.id, id, input.reason);
  }

  @Post("expenses")
  @RequirePermissions("finance.expense_create")
  expense(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.finance.createExpense(user.firmId, user.id, CreateExpenseSchema.parse(body));
  }

  @Post("expenses/:id/decision")
  @RequirePermissions("finance.expense_approve")
  expenseDecision(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ approve: z.boolean(), comment: z.string().optional() }).parse(body);
    return this.finance.approveExpense(user.firmId, user.id, id, input.approve, input.comment);
  }

  @Post("expenses/:id/disburse")
  @RequirePermissions("finance.expense_disburse")
  disburse(@CurrentUser() user: RequestUser, @Param("id") id: string, @Body() body: unknown) {
    const input = z.object({ accountId: z.string(), expenseLedgerAccountId: z.string() }).parse(body);
    return this.finance.disburseExpense(user.firmId, user.id, id, input.accountId, input.expenseLedgerAccountId);
  }

  @Post("receipts")
  @RequirePermissions("finance.trust_ledger")
  receipt(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    return this.finance.recordReceipt(user.firmId, user.id, RecordReceiptSchema.parse(body));
  }

  @Post("transfers")
  @RequirePermissions("finance.trust_ledger")
  transfer(@CurrentUser() user: RequestUser, @Body() body: unknown) {
    const input = z.object({
      sourceAccountId: z.string().min(1),
      destinationAccountId: z.string().min(1),
      amount: z.coerce.number().positive(),
      description: z.string().min(2).max(1000),
      transactionDate: z.string().datetime(),
      idempotencyKey: z.string().min(8).max(150),
      matterId: z.string().optional(),
      clientId: z.string().optional()
    }).parse(body);
    return this.finance.transfer(user.firmId, user.id, input);
  }

  @Get("matters/:matterId/ledger")
  @RequirePermissions("finance.view")
  matterLedger(@CurrentUser() user: RequestUser, @Param("matterId") matterId: string) {
    return this.finance.matterLedger(user, matterId);
  }

  @Get("matters/:matterId/settlement-position")
  @RequirePermissions("finance.view")
  settlementPosition(@CurrentUser() user: RequestUser, @Param("matterId") matterId: string) {
    return this.finance.settlementPosition(user, matterId);
  }
}
