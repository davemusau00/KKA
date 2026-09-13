# KKA Current Release State

**Status date:** 2026-09-13
**Repository:** `davemusau00/KKA`
**Normative use:** This document is the current implementation and acceptance register. Older status documents are historical or domain-specific unless they explicitly provide newer evidence.

---

## Implemented and Locally Accepted

- **Core Topology & Monorepo Foundation**: React web application (`@kka/web`), NestJS/Fastify API (`@kka/api`), Prisma 7/PostgreSQL data layer (`@kka/database`), document rendering engine (`@kka/document-engine`), Redis sessions/queues, BullMQ worker (`@kka/worker`), shared contracts (`@kka/contracts`), Docker topology, and Caddy reverse proxy configuration.
- **Clean Bootstrap & Boundary Protections**: Explicit firm/branch/admin inputs, atomic creation, demo database refusal, session boundary protections, CSRF token validation, host-only cookies, and production startup validation recorded in [PROJECT_STATE.md](PROJECT_STATE.md).
- **Comprehensive Object-Level Authorization (`RecordAccessService`)**:
  - Shared `RecordAccessService.matterWhere(user)` strictly composes `AND: [matterScope, ...]` across matter lists/details, search queries, clients, tasks, documents, audit logs, and notification reads.
  - Firm scoping, explicit matter access rows, and team memberships are evaluated; `matter.access_manage` operates as the administrative override.
  - Restricted matter reads and writes fail closed (404/403). Document downloads enforce metadata resolution, access checks, and audit recording before opening storage.
  - Verified by 94 tests in `pnpm --filter @kka/api test:access` across 21 test suites.
- **Intake Conversion & Matter Lifecycle**:
  - Server-side conflict/KYC gates, firm scoping, automated sequential numbering (`{firm}/{practice}/{year}/{seq:5}`), transactional creation, initial stage assignment, and communication channel creation.
  - Matter updates, stage validations, stage transitions, and handoff acknowledgements (`acknowledgeHandoff`) enforce object-level matter access before mutation.
- **Client & Task Security**:
  - Client updates require visibility into at least one associated matter (`matters: { some: matterWhere }`).
  - Task creation, updates, status changes, archiving, and dependency resolution enforce matter access; cross-matter dependencies and non-firm assignees are rejected.
- **Notification Visibility & Queuing Integrity**:
  - Notifications are filtered by matter access on read.
  - Recipient matter access is verified before notification persistence and re-checked by the worker before external queueing; queued jobs are cancelled if access is revoked.
- **Atomic Court Outcome Propagation**:
  - `POST /calendar/events/:id/court-outcome` executes entirely within a single Prisma `$transaction`:
    1. Updates the calendar event with outcome status and directions.
    2. Creates the next scheduled court event if a date is provided.
    3. Records a legal deadline with `courtOrderOverride: true`, `riskLevel: 'CRITICAL'`, and `immutable: true`.
    4. Records the initial immutable deadline revision (`DeadlineRevision`).
    5. Creates a locked calendar event (`editPolicy: 'LOCKED'`) for the filing deadline.
    6. Generates a critical preparation task (`priority: 'CRITICAL'`) due 3 days prior to the official deadline.
    7. Updates matter `nextAction` and `lastActivityAt`.
    8. Persists the `CourtOutcomeRecord` and writes an audit event.
    9. Handles concurrency and duplicate retries via P2002 catch, returning the canonical record.
  - Verified in `test/calendar-outcome.test.ts`.
- **Legal Deadlines Engine**:
  - Supports `CALENDAR_DAYS`, `BUSINESS_DAYS`, and `MANUAL` calculations.
  - Explicit source tracking, legal-rule codes, excluded dates, responsible/escalation users, court order overrides, and immutable revision history (`DeadlineRevision`).
  - Verified in `test/deadlines.test.ts`.
- **Ledger-Grade Finance & Client Trust Separation**:
  - Strict fund separation: Journals reject mixed `CLIENT` and `OFFICE` funds unless explicitly marked as `FUND_TRANSFER`.
  - Balanced debit/credit enforcement (`debit === credit > 0`), exclusive debit/credit per line, and sequential voucher numbering (`KKA/JV/{year}/{seq:6}`).
  - Dedicated `POST /finance/transfers` workflow for balanced, idempotent transfers between accounts.
  - Payment receipt clearing: `POST /finance/receipts/:id/clear` distinguishes cleared from uncleared funds, enforces reconciliation permissions, and records clearing references.
  - Ledger period locks: Prevent postings and receipts within locked date intervals.
  - Reconciliation locks: Reconciliations derive period ledger balances, validate statement items, prevent duplicate source references, and block completion while items remain unmatched.
  - Settlement position: `GET /finance/matters/:matterId/settlement-position` derives cleared client receipts, issued fee notes, disbursed expenses, and calculates proposed residual funds.
  - Verified in `test/finance-access.test.ts`.
- **Identity Lifecycle & Session Administration**:
  - Staff invitations: Single-use hashed invite tokens, atomic claim, user activation, password establishment, and automatic revocation of superseded replacement invites.
  - Frontend invite acceptance: Fully wired at `/auth/invite` via `InviteAcceptancePage.tsx`.
  - Password reset: Expiring single-use hashed reset tokens, URL-carried token handling, session revocation, and audit tracking.
  - Admin session control: `GET/POST /auth/users/:userId/sessions|revoke-sessions` allows firm administrators to inspect active sessions and revoke server-held sessions with Redis cleanup.
  - Verified in `test/invite-lifecycle.test.ts`.
- **Personal Injury Backend Conversion**:
  - Complete server-side endpoints in `PersonalInjuryController` and `PersonalInjuryService`:
    - Profile (`PUT /personal-injury/:matterId/profile`)
    - Vehicles (`POST /personal-injury/:matterId/vehicles`)
    - Witnesses (`POST /personal-injury/:matterId/witnesses`)
    - Evidence (`POST /personal-injury/:matterId/evidence`)
    - Injuries (`POST /personal-injury/:matterId/injuries`)
    - Treatments (`POST /personal-injury/:matterId/treatments`)
    - Medical Reports (`POST /personal-injury/:matterId/medical-reports`, `PATCH .../:reportId`)
    - Liability & Quantum (`PUT /personal-injury/:matterId/liability-quantum`)
    - Negotiations (`POST /personal-injury/:matterId/negotiations`)
    - Hearing Brief (`PUT /personal-injury/:matterId/hearing-brief`)
    - Judgment (`PUT /personal-injury/:matterId/judgment`)
    - Recovery Actions (`POST /personal-injury/:matterId/recovery-actions`)
    - Settlement (`PUT /personal-injury/:matterId/settlement`)
    - Closure (`PUT /personal-injury/:matterId/closure`)
  - Shared matter-access policy applied to all reads and writes; material mutations audited.
  - Frontend `LiabilityQuantumWorkspace.tsx` wired to server endpoints; other PI screens have truthful empty states in non-demo mode.
  - Verified in `test/personal-injury-access.test.ts`.
- **Operations, HR & Procurement Integrity**:
  - HR Leave: Date-only inputs, assigned policy calendars, holiday exclusions, front-loaded/month-end accrual with proration, carryover caps, and derived balances from persisted requests.
  - Departments: Firm-scoped with active-manager validation.
  - Procurement: Requisitions with firm-scoped idempotency keys, GRN/delivery receipt reference constraints, asset custody assignment constraints (1 open per asset), and receipt-to-asset / receipt-to-expense linkages.
  - Verified in `test/operations-leave-calculation.test.ts`, `test/organization-departments.test.ts`, and `test/operations-procurement-integrity.test.ts`.
- **Continuous Integration Gate**:
  - `.github/workflows/predeployment.yml` validates Prisma schema, runs typechecking, compiles production builds, executes API foundation tests, document engine tests, the complete `test:access` suite (94 tests), clean bootstrap test, migrations, and Playwright browser acceptance.

---

## Implemented, Acceptance Incomplete

- **Frontend Workspace Server Hydration**:
  - While backend endpoints are complete for Personal Injury, Court operations, and Finance, several frontend workspaces (`IncidentEvidenceWorkspace`, `MedicalManagementWorkspace`, `ClaimNegotiationWorkspace`, `SettlementDistributionWorkspace`) still retain demo-mode toggles and are being converted to direct TanStack Query / API client hooks.
- **Provider Integrations & Real Delivery**:
  - External providers (SMTP email delivery, Africa's Talking SMS, WhatsApp Business API, Judiciary CTS e-filing, Daraja M-Pesa API) have stubbed/mock adapters and fallback handling, but live provider delivery requires production credentials and network provisioning.
- **Client Portal Extended Workflows**:
  - Portal grants and access scoping are enforced server-side. Public client onboarding, SMS magic link delivery, and self-service document uploading require end-to-end browser verification.
- **Bundle Optimization**:
  - Frontend production build succeeds, but route-level code-splitting is recommended to reduce initial chunk size.

---

## Not Implemented or Explicitly Deferred

- **Explicitly Deferred Platform Features**:
  - MFA / TOTP enrollment (deferred to post-core).
  - OIDC / SSO enterprise authentication.
  - OCR full-text search indexing on uploaded documents.
  - Retention policies and cryptographic document timestamping.
  - Multi-node high availability (single VPS deployment is the target architecture).
- **Deployment-Dependent Gates (Require Live VPS)**:
  - Staging and production VPS provisioning.
  - Live domain DNS, Let's Encrypt TLS certificates, and secure cookie validation.
  - Live bank statement imports and M-Pesa statement reconciliation.
  - Real firm data migration dry run and firm-wide legal staff UAT.
  - Disaster recovery drill: 1-hour RPO / 4-hour RTO restoration test on a replacement VPS.

---

## Acceptance Contract

A slice may move to **implemented and locally accepted** only when all of the following are evidenced:

1. A browser mutation writes an authoritative server record.
2. The record survives reload and is visible to a second authorized session.
3. Unauthorized, inactive, and cross-firm access is rejected server-side.
4. Failed, stale, duplicate, and concurrent requests have explicit behavior.
5. Material mutations create audit events.
6. API, service, and browser tests cover desktop, tablet, mobile, keyboard, loading, empty, and failure states.
7. Typecheck, build, and `git diff --check` pass.

## Release Gates

Truthfulness, identity, authorization, matter integrity, PI completion, court/document cohesion, ledger correctness, deployment, recovery, monitoring, migration, UAT, and CI are independent gates. Passing compilation or rendering a screen does not close any of them.
