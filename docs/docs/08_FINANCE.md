# 08. Finance, Expenses and Matter Money

## 1. MVP financial scope

Build enough to manage:
- matter expenses,
- expense requests,
- petty cash,
- basic client/office money distinction,
- payment receipts,
- simple invoices,
- matter financial summaries,
- imports,
- reconciliation notes.

Do not attempt full statutory accounting or payroll in the first build.

## 2. Daily expense workflow

Quick entry fields:
- matter optional
- branch
- amount
- currency
- category
- date
- description
- payer/source
- receipt attachment

Status:
- draft
- submitted
- approved
- rejected
- paid
- reconciled
- void

## 3. Expense categories

Configurable:
- filing fees
- court fees
- process server
- transport/fare
- medical report
- police records
- printing/copying
- search fees
- courier
- witness
- accommodation
- office supplies
- other

## 4. Petty cash

Represent petty cash as an account.

Workflow:
request -> approve -> disburse -> attach evidence -> reconcile

Dashboard:
- opening balance
- money in
- money out
- expected balance
- unreconciled requests

## 5. Matter ledger

Display chronological matter financial activity:

- date
- category/type
- particulars
- money out
- money in
- account/source
- reference
- evidence

Summaries:
- total expenses
- recoverable disbursements
- money received
- outstanding client balance where tracked
- settlement receipts

## 6. Client vs office money

At minimum:
- every account has type,
- every receipt/payment indicates account,
- matter ledger can filter by client/office.

Never combine them into one unidentified balance.

## 7. Payment receipt

Record:
- amount
- date
- payer
- payment method
- reference
- account
- matter
- invoice optional
- attachment

Payment methods:
- cash
- M-Pesa
- bank transfer
- cheque
- other

## 8. M-Pesa and bank

MVP:
- manual record
- CSV/Excel import
- reconciliation interface

Later:
- direct API feeds where available and authorized

## 9. Excel migration

Import wizard:
1. upload file
2. select sheet
3. map columns
4. preview
5. validate
6. import
7. show errors

Imports must be idempotent where possible using source hash/reference.

## 10. Approval

Expense request:
- requester
- approver
- approval note
- approved amount
- timestamps

Rules configurable by amount/role later.

## 11. Reports

MVP:
- expenses by period
- expenses by matter
- expenses by category
- expenses by branch
- unreconciled expenses
- matter money in/out
- petty cash activity
- recent receipts

## 12. Currency

Default KES.
Store ISO currency code for future multi-currency support.
