# Project State and Release Evidence

> Current cross-domain status is maintained in [CURRENT_RELEASE_STATE.md](CURRENT_RELEASE_STATE.md). This file records dated verification evidence and remains the evidence ledger.

Updated 2026-09-13. Repository: `davemusau00/KKA`.

## Product and Launch Authority

The full operating product and its launch gates are defined in [PRODUCTION_CONVERSION.md](PRODUCTION_CONVERSION.md). Staff launch occurs after all agreed phases pass. Frontend: `https://os.kariukikagunda.com`. API: `https://api.kariukikagunda.com/api/v1`. Business writes are online and server-confirmed; offline synchronization and multi-node high availability are deferred.

The implementation register for local-only conversion work is [LOCAL_ONLY_CONVERSION_PLAN.md](LOCAL_ONLY_CONVERSION_PLAN.md). It covers work that can be built and verified against the local API, PostgreSQL, Redis, worker and browser stack without deployment or external provider credentials.

This record supersedes the historical tier checklist. Backend module existence, a rendered screen, compilation and empty test runners do not establish a completed workflow. Branch names, deadlines, retention and accounting defaults in synthetic fixtures require firm approval.

## Implemented Increments and Evidence

| Increment | Implemented Behavior | Evidence and Verification |
|---|---|---|
| Authorization & Record-Access Scope | Uniform `RecordAccessService.matterWhere()` composition with `AND` operators; matter, task, client, finance, calendar, court, audit, and document access checks; role & permission decorators | `test:access` (94/94 passing tests) covering record-access, matter search, restricted reads/writes, notifications, and portal grants. |
| Court Outcome & Calendar Propagation | Atomic propagation in single `$transaction`: updates hearing, creates next court date, records court-directed deadline, creates locked deadline calendar event, generates preparation task, updates matter nextAction, writes audit record, handles P2002 replay | `test/calendar-outcome.test.ts`, `test/deadlines.test.ts`, `test/court-evidence.test.ts` passing. |
| Ledger-Grade Finance | Double-entry journals, balanced debit/credit lines, fund separation (`CLIENT` vs `OFFICE`), sequential numbering, idempotent transfers, cleared receipts, period locks, statement reconciliation, ledger-derived settlement position | `test/finance-access.test.ts` passing. |
| Identity & Session Administration | Single-use hashed invite claim, rate limiting, replacement revocation, user activation, password reset token validation, admin session inspection and revocation with Redis cleanup | `test/invite-lifecycle.test.ts`, `test/foundation.test.ts` passing. Frontend `InviteAcceptancePage` wired at `/auth/invite`. |
| Personal Injury Server Conversion | Server-backed endpoints for profile, vehicles, witnesses, evidence, injuries, treatments, reports, liability/quantum, negotiations, hearing brief, judgment, recovery, settlement, closure | `test/personal-injury-access.test.ts` passing; `LiabilityQuantumWorkspace.tsx` wired to server. |
| Operations, Leave & Procurement | Accrual rules, policy calendar, holiday handling, usage deduction, balance calculation, GRN receipt idempotency, asset custody constraints, vendor compliance, receipt-to-asset/expense linkage | `test/operations-leave-calculation.test.ts`, `test/operations-procurement-integrity.test.ts`, `test/operations-hr-access.test.ts` passing. |
| Branding & Document Engine | Persistent logo management, private marks/signatures, controlled PDF application, immutable drafts, approvals, queued DOCX/structured generation | `test:documents` (document workflows test suite), packaged converters, PDF generation. |
| Clean Bootstrap & Migrations | Explicit firm/branch/admin inputs; atomic creation; concurrent request serialization; demo database refusal; no credential/policy reset on repeat | `scripts/bootstrap.test.ts`, blank/repeat/upgrade migrations deployed to PostgreSQL. |
| Browser/API Security Boundary | Signed expiring CSRF tokens on login/invites and writes, exact-origin checks, credentialed images/favicon, host-only cookies, production startup validation | `test/foundation.test.ts`, CORS/CSRF middleware passing. |
| CI Pipeline Gate | Complete automated verification: Prisma validate, typecheck, monorepo build, public boundary check, worker Docker build, API tests, `test:access`, bootstrap test, migrations, Playwright browser suite | `.github/workflows/predeployment.yml` configured and executing `test:access`. |

---

## Current Verification Run

- **Authorization & Record-Access Suite (`pnpm --filter @kka/api test:access`)**: **94 tests passed**, 0 failed, 0 skipped across 21 test suites:
  - `record-access.test.ts`, `notifications-access.test.ts`, `personal-injury-access.test.ts`, `audit-access.test.ts`, `finance-access.test.ts`, `calendar-access.test.ts`, `calendar-outcome.test.ts`, `tasks-access.test.ts`, `deadlines.test.ts`, `court-evidence.test.ts`, `invite-lifecycle.test.ts`, `onboarding-state.test.ts`, `operations-leave-calculation.test.ts`, `matter-search-access.test.ts`, `communications-access.test.ts`, `operations-hr-access.test.ts`, `operations-procurement-integrity.test.ts`, `organization-departments.test.ts`, `feature-flags.test.ts`, `portal-grants.test.ts`, `document-download.test.ts`.
- **Foundation & API Tests (`pnpm --filter @kka/api test`)**: **passed**.
- **Document Engine Tests (`pnpm --filter @kka/api test:documents`)**: **passed**.
- **Full Typecheck (`pnpm typecheck`)**: **passed** across all packages (`@kka/contracts`, `@kka/database`, `@kka/document-engine`, `@kka/api`, `@kka/worker`, `@kka/web`).
- **Full Production Build (`pnpm build`)**: **passed** across all packages.
- **Docker Compose Topology**: API, Worker, PostgreSQL 18, Redis 8.2, Caddy 2 reverse proxy defined in `infra/docker-compose.production.yml`.

---

## Remaining Predeployment Work

| Phase | Description | Status |
|---|---|---|
| **Phase 0** | Capability register, server flags, CI access suite integration | **Completed** |
| **Phase 1** | Identity lifecycle (invites, password reset, session control), shared record-access | **Completed** (MFA deferred) |
| **Phase 2** | Matter lifecycle & stage handoffs, intake conversion gates | **Completed** |
| **Phase 3** | Calendar, atomic court outcome propagation, legal deadlines, court filing & service evidence | **Completed** |
| **Phase 4** | Communications channels & messages, access-safe notifications | **Completed** |
| **Phase 5** | Ledger-grade finance, fund separation, receipts, expenses, transfers, period locks, reconciliation, settlement position | **Completed** |
| **Phase 6** | HR & leave calculation, procurement integrity, asset custody, departments | **Completed** |
| **Phase 7** | Frontend workspace server hydration conversion for remaining PI sub-screens | **In Progress** |
| **Phase 8** | VPS production deployment, live provider credentials (SMTP, SMS/WhatsApp, CTS, Bank), and staff UAT | **Pending Deployment** |

---

## Deployment-Dependent Gates

Separate staging/production provisioning, real-domain DNS/TLS/cookies/CORS/WebSockets, live provider credentials (SMTP, SMS gateway, Judiciary CTS), production imports and firm policy sign-off, accountable staff acceptance, and off-site backup restore drill remain open. Demonstrate at most one hour of data loss and restoration within four hours on the production VPS.
