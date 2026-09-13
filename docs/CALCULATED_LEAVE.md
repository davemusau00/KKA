# Calculated leave implementation and evidence

Status: implemented with local service/database and focused browser evidence; broader staff acceptance remains open.

## Rules and contracts

- Requests use date-only values, a configured employee policy, and a client-generated UUID for retries. The API rejects caller-supplied day totals and requests spanning multiple years; submit one request per year.
- Policies configure chargeable weekdays, explicit excluded dates, annual entitlement, carryover cap, front-loaded or monthly accrual, new-starter proration, and a bounded negative allowance. Holiday dates must be supplied by HR; no external holiday source is inferred.
- Monthly accrual is credited on completed calendar month ends. First-month proration uses employed calendar days divided by that month's calendar days. Front-loaded proration uses the remaining calendar days in the year. Values round to two decimal places.
- Entitlement is calculated as of the current Nairobi date. Future-year requests cannot borrow unaccrued entitlement unless the configured negative limit allows it.
- Available = capped recorded opening carryover + calculated accrual + audited adjustment total - approved request days. Projected available also subtracts submitted requests. Stored legacy `usedDays` and `accruedDays` fields are no longer authoritative or editable through balance administration.
- Each employee currently has one assigned policy key. Changing that key does not migrate prior requests. Multiple simultaneous leave-type policy assignments and effective-dated policy versions remain follow-up work.
- A request snapshots its actual chargeable dates and calendar configuration. Policy edits do not recalculate the days on an existing request. Approval does recheck the current entitlement and projected balance.
- Submissions and decisions run in serializable transactions, retry serialization conflicts up to twice, and include audit records in the same transaction. Decisions/cancellations require the record revision. Duplicate submission keys return the original record/audit only when the details match.
- Cancellation/rejection frees availability by changing request state. Usage is derived from approved requests, so no decrement/reincrement balance bookkeeping is needed.
- HR correction controls accept opening carryover and adjustment totals with a required reason. Audit events contain before/after values. Automated carryover rollover is not implemented.
- Historical requests without a policy block new charges/approval until HR explicitly reviews their policy mapping. The review preserves recorded days and records actor/reason. Cross-year historical requests need a reviewed data migration.

## Interfaces

| Endpoint | Purpose |
| --- | --- |
| `GET /operations/leave/policies` | Current employee's assigned active policy |
| `POST /operations/leave/preview` | Chargeable dates and balance preview |
| `GET /operations/leave/balance` | Self balance; HR may request an in-firm employee |
| `POST /operations/leave` | Idempotent submission |
| `POST /operations/leave/:id/decision` | HR approval/rejection with revision |
| `POST /operations/leave/:id/cancel` | Owner/HR cancellation with revision |
| `POST /operations/leave/:id/reconcile-policy` | Audited HR review of a historical request |
| `POST /operations/hr/leave-policies` | Configure policy rules |
| `POST /operations/hr/employees/:userId/leave-balances` | Audited correction inputs only |

The People & Leave screen provides request previews, policy editing, historical review, approval/cancellation, calculated employee balances, and carryover/adjustment controls.

## Verification

- `pnpm --filter @kka/api test:access`: existing access suite plus leave calculation regression coverage.
- `apps/api/test/leave-database.test.ts`: opt-in local PostgreSQL integration. Set `RUN_LEAVE_DATABASE_TESTS=1` and supply a local `DATABASE_URL`. The test creates a randomly named `kka_leave_test_*` database, applies all repository migrations, exercises the real service/database/audit transactions, and removes only that disposable database.
- Database evidence covers concurrent oversubscription, duplicate submissions, stale/competing decisions, reduced allowance before approval, cross-firm/self-approval/suspended-user denial, independent service re-read, cancellation/rejection, historical review, and audit-failure rollback.
- `pnpm --filter @kka/web exec playwright test test/leave-form.spec.ts`: actual request form rendered through Vite, with mocked API responses at 360px, 768px and 1440px in Africa/Nairobi. Checks date preservation, keyboard submission, failure messaging, retry identity, no browser day total, and horizontal overflow.
- Browser tests mock responses and do not prove the authenticated browser-to-database journey. Full staff UAT, policy-management/correction browser coverage, migration of historical data, and production deployment remain open.

Migration `202609130012_calculated_leave` is additive. It preserves all historical requests and leaves their policy unclassified. The isolated test proves clean migration application; application to a deployed database requires its normal reviewed migration process.
