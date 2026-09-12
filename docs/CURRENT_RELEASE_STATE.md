# KKA current release state

**Status date:** 2026-09-13
**Repository:** `davemusau00/KKA`  
**Normative use:** This document is the current implementation and acceptance register. Older status documents are historical or domain-specific unless they explicitly provide newer evidence.

## Implemented and locally accepted

- React web application, NestJS/Fastify API, Prisma/PostgreSQL data layer, Redis sessions/queues, worker, shared contracts, Docker topology, and Caddy configuration exist.
- Clean bootstrap, organization profile reads/writes, session boundary protections, document branding/version/approval foundations, and selected browser/API regressions have local evidence recorded in [PROJECT_STATE.md](PROJECT_STATE.md).
- Intake-to-matter conversion has server-side conflict/KYC gates, firm scoping, numbering, transactional creation, and audit coverage. The conversion still requires the complete acceptance matrix below before launch classification changes.
- Client/task/intake adapters and selected server-confirmed mutations exist. Calendar CRUD and court/document service foundations exist.
- Provider and backup/integration fallbacks are required to report unavailable, manual, failed, or unimplemented states; local checks do not prove external delivery, payment, filing, synchronization, backup, or restore.
- Password-reset request and token-consumption API paths now exist with expiring single-use hashed tokens, generic request behavior, local-only token exposure behind an explicit flag, audit events, and revocation of indexed sessions. Mail delivery remains unconfigured.
- Password reset and self-service logout-all were exercised against the local compiled API, PostgreSQL, and Redis; valid reset tokens are single-use and reset revokes existing sessions.
- A shared `RecordAccessService` now scopes matter lists/details/timelines, search results, clients, tasks, and document access by firm, explicit matter access, and team membership, with `matter.access_manage` as the server-side override. Focused policy tests pass; multi-user browser acceptance remains open.
- Matter-derived management dashboard counts, court metrics, and portal grant creation/listing now use the same access policy. Approval and expense dashboard totals remain firm-scoped because those current records do not carry a direct matter relation and require a later data-model/policy decision.
- Notification listing, read-state mutations, the shared creation service, and the notification worker now re-check matter visibility. Restricted recipients are rejected before persistence, realtime emission, or provider queueing; queued deliveries are cancelled if access is revoked before worker handling. Provider delivery outcomes and multi-user browser acceptance remain open.
- PI judgment, liability/quantum, recovery, settlement, incident/evidence, medical, negotiation, hearing, pleadings, pre-trial, and closure workspaces no longer surface their seeded legal, medical, filing, recovery, payment, or client-money outcomes in normal mode. Browser-only save paths are disabled unless the explicit local demo flag is enabled; empty screens state when server-backed evidence is unavailable. This is truthfulness remediation, not acceptance of the PI lifecycle.
- The judgment and liability/quantum workspaces now hydrate from and save to the server PI record, with schema-backed field mappings for liability splits, appeal justification, interest metadata, recovery-trigger state, and special-damage evidence. The PI service applies the shared matter-access policy to reads and writes. Reload, second-user, and browser authorization evidence for this slice remain to be added before it is classified as fully accepted.
- `pnpm --filter @kka/api test:access` now covers the shared record predicate, notification visibility, PI restricted reads, authorized reads, judgment field mapping, and PI audit recording; these are service-level proofs, not yet browser or second-user acceptance.
- Audit listing now applies the same matter-access policy to matter-linked audit events, including firm-wide audit queries; restricted audit rows are omitted. The access suite includes this regression.
- Matter-ledger reads now enforce shared matter access. Journal source identifiers and receipt reference numbers have database uniqueness constraints with idempotent replay handling, including recovery from concurrent unique-constraint races. Full client-money balancing, allocation, reconciliation, and settlement-distribution acceptance remains open.
- Journal posting now validates exclusive debit/credit lines, firm-owned matter/client references, matter-client consistency, and line/header attribution before persistence. These checks reduce ledger corruption risk but do not establish the complete client-money kernel.
- Journal posting now rejects mixed `CLIENT`, `OFFICE`, petty-cash, or mobile-money funds unless the source is explicitly `FUND_TRANSFER`; the access/finance suite covers the rejection path. Transfers still require a later dedicated workflow and reconciliation proof.
- A dedicated `POST /finance/transfers` workflow now requires source/destination accounts, amount, transaction date, description, and idempotency key; it posts a balanced transfer journal and records a transfer audit event. This is an authoritative transfer primitive, not proof of the complete settlement or reconciliation flow.
- `GET /finance/matters/:matterId/settlement-position` now derives recorded client receipts, persisted fee notes, disbursed/reconciled expenses, evidence IDs, and a clearly labeled proposed residual under shared matter access. The settlement UI displays this server position read-only; payout approval and distribution remain unimplemented.
- Payment receipts now distinguish uncleared from cleared funds. `POST /finance/receipts/:id/clear` requires reconciliation permission, is firm-scoped and idempotent, records a clearing reference and audit event, and settlement positions/PI settlement validation use only cleared client receipts. External bank/M-Pesa reconciliation evidence remains open.
- PI settlement writes now reject claimed client funds without persisted client-account receipts and reject net amounts that do not reconcile with stored deductions. This prevents unsupported payout numbers but does not authorize or execute client distributions.
- Finance reconciliation now has `GET /finance/reconciliations`, `POST /finance/reconciliations`, and `POST /finance/reconciliations/:id/complete`; it derives period ledger balances, records statement balances, refuses completion on mismatch, and audits start/complete events. Bank statement import/matching and full settlement payout reconciliation remain open.
- Reconciliation now accepts period-bounded statement items through `POST /finance/reconciliations/:id/items`, validates optional journal matches against the reconciled account and amount, prevents duplicate source references, and blocks completion while items remain unmatched. It is manual evidence entry, not an external bank import.
- Ledger period locks now have firm-scoped list/create routes and prevent new journal postings or receipts dated inside a locked interval. Open reconciliations also prevent postings to their account during the reconciled period; reversal approval, bank/M-Pesa evidence, and full client-money acceptance remain open.
- Web workspace navigation now has reload-safe URL routes for dashboard, matters, clients, tasks, court, approvals, calendar, documents, communications, finance, reports, admin, integrations, and website, plus `/matters/:matterId?tab=...` detail links with browser-history handling. Client/task/document/court resource-detail routes, auth links, and browser acceptance remain open.
- Calendar hydration and the non-demo create/reschedule/document-link actions now use the server API; local state is updated only after a persisted response. Calendar list and matter-linked mutations apply the shared record-access policy, with focused restricted-event tests.

## Implemented, acceptance incomplete

- Client, intake, matter, task, calendar, court, document, finance, communication, notification, portal, reporting, and website surfaces have backend modules or UI paths, but not every path has proven reload persistence, second-user visibility, scoped authorization, failure behavior, concurrency behavior, and audit evidence.
- `AppContext.tsx` still contains local business collections, seed imports, and mutations. Calendar hydration/create/reschedule/document-link/court-outcome paths now cross an authoritative API boundary outside demo mode; the remaining domain collections are compatibility/prototype paths until converted.
- Court outcomes now have a single persisted outcome record per court event. The recorded outcome, optional next hearing, court-directed deadline, locked deadline calendar event, preparation task, matter next action, and audit event are created in one transaction; retry returns the canonical outcome rather than duplicating downstream records. This is local service-level evidence only: legal deadline calculation, responsible-staff/client notification delivery, court-order document validation, cross-user browser reload, and external calendar synchronization remain open.
- PI stage models and routes exist, but the complete lifecycle from empty matter through closure is not accepted as one gated workflow.
- Finance models and routes exist, but client money is not launch-ready until balanced immutable journals, fund separation, idempotency, reversals, reconciliation, locks, and ledger-derived settlement distribution are proven.
- Filing, service, court outcome propagation, communications, portal grants, search access policy, settings administration, feature flags, resource-detail/auth routing, and notifications require domain-specific acceptance evidence.
- The current release build retains a large-bundle warning and has no independent lint suite claim.

## Not implemented or not proven

- Password-recovery browser journey, MFA, administrative session inspection/revocation, and end-to-end invite acceptance journey remain incomplete. The password-reset API and self-service logout-all slice are locally accepted; browser automation and mail delivery remain open.
- One shared record-access policy applied consistently to search, lists, details, exports, reports, documents, notifications, and portal grants. Matter/client/task/document/search reads, matter-derived reports, portal administration, notification reads, shared notification creation, and queued notification delivery checks are implemented locally; exports, approval/expense report scope, provider delivery outcomes, and multi-user browser acceptance remain open.
- Complete PI legal lifecycle with persisted stage gates, approvals, transitions, server-backed workspace hydration, and cross-user verification. Empty-state truthfulness for the four remediation workspaces above is locally verified; the broader PI lifecycle remains open.
- Ledger-grade client-money operations and settlement reconciliation.
- Production deployment, staging isolation, provider configuration, reviewed imports, monitoring/alerting proof, encrypted off-site backup proof, replacement-VPS restore proof, staff pilot, and firm-wide UAT.

## Explicitly deferred

- OIDC/SSO, OCR/full-text search, advanced reporting, retention/legal holds, versioned automation extensions, broad API/webhook administration, cryptographic certificate signing, multi-node high availability, and unrestricted plugins.
- DNS, TLS, live VPS provisioning, SMTP, Judiciary, Daraja, WhatsApp, SMS, S3, live bank reconciliation, production imports, and external provider delivery remain deployment/provider gates rather than local implementation evidence.

## Acceptance contract

A slice may move to **implemented and locally accepted** only when all of the following are evidenced:

1. A browser mutation writes an authoritative server record.
2. The record survives reload and is visible to a second authorized session.
3. Unauthorized, inactive, and cross-firm access is rejected server-side.
4. Failed, stale, duplicate, and concurrent requests have explicit behavior.
5. Material mutations create audit events.
6. API, service, and browser tests cover desktop, tablet, mobile, keyboard, loading, empty, and failure states.
7. Typecheck, build, and `git diff --check` pass.

## Release gates

Truthfulness, identity, authorization, matter integrity, PI completion, court/document cohesion, ledger correctness, deployment, recovery, monitoring, migration, UAT, and CI are independent gates. Passing compilation or rendering a screen does not close any of them.

## Source precedence

- This file: current cross-domain classification.
- [LOCAL_ONLY_CONVERSION_PLAN.md](LOCAL_ONLY_CONVERSION_PLAN.md): local implementation order and acceptance contract.
- [PROJECT_STATE.md](PROJECT_STATE.md): dated evidence and command-level verification history.
- [PRODUCTION_CONVERSION.md](PRODUCTION_CONVERSION.md): production deployment contract and release gates.
- [UI_SURFACE_INVENTORY.json](UI_SURFACE_INVENTORY.json) and [UI_INTEGRATION_AUDIT.md](UI_INTEGRATION_AUDIT.md): detailed UI audit evidence; findings must be revalidated against the current commit.
- Domain design documents: implementation guidance, not proof of completion unless linked evidence is present.
