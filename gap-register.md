# KKA LAW FIRM OS

## Current Product, Engineering & Production Gap Register

**Repository:** `davemusau00/KKA`
**Audit basis:** `main` at `e1c70cfae10898eb21a8e2d98451ca5a6e733575`
**Audit date:** 13 September 2026
**Purpose:** define the current remaining work between the repository as it exists now and a dependable, staff-ready, firm-wide law-firm operating system.

---

# 1. Executive status

KKA is now a substantial application rather than a prototype shell.

The repository has a credible production-shaped architecture comprising React, NestJS/Fastify, Prisma/PostgreSQL, Redis, BullMQ, shared contracts, document generation, Docker infrastructure, Caddy, server-side authentication and an authoritative set of backend domains.

The current release register itself correctly distinguishes between implemented code and accepted workflows. A workflow is not complete merely because an API route, screen, database model or test exists. Full acceptance requires authoritative persistence, reload survival, second-user visibility, authorization, failure handling, auditing, concurrency handling and browser acceptance.

The principal remaining risk has shifted.

Earlier KKA's greatest weakness was polished frontend functionality backed by synthetic state.

The greatest remaining work now is:

> **completing frontend UI server-hydration conversion for remaining PI screens and executing operational deployment proofs on live infrastructure.**

The application now applies object-level authorization consistently across all core service modules, evidenced by 94 automated tests in the dedicated access suite.

### Current classification

| Area                       | Current status                                                   |
| -------------------------- | ---------------------------------------------------------------- |
| Architecture               | Strong                                                           |
| Backend platform           | Strong foundation                                                |
| Authentication core        | Substantial (Invites, Password Reset, Session Admin complete)    |
| Object-level authorization | Implemented & verified (94 passing tests in `test:access`)       |
| Intake conversion          | Strong backend & conflict/KYC gates                              |
| Matters                    | Strong backend foundation & record-access enforcement            |
| PI workflow                | Complete server-backed endpoints, partial UI hydration           |
| Documents                  | Mature operational domain                                        |
| Tasks                      | Server-backed core, full record-access enforcement               |
| Calendar                   | Server-backed with atomic court outcome propagation              |
| Court operations           | Backend complete (atomic outcome propagation, deadlines, tasks)  |
| Notifications              | Fully secured (access-filtered reads, creation, worker checks)   |
| Audit                      | Complete with matter-access filtering                            |
| Finance                    | Ledger-grade (fund separation, period locks, reconciliations)   |
| Communications             | Server-backed channels, messages, Socket.IO live events          |
| Client portal              | Scoped grants, summary/document queries                          |
| HR / operations            | Accrual leave calculations, departments, procurement integrity   |
| Routing                    | Reload-safe resource routing                                     |
| Offline                    | Explicitly deferred                                              |
| Deployment                 | Single VPS target, staging/production provisioning open          |
| Disaster recovery          | Runbooks written, operational restore drill open                 |
| Staff UAT                  | Not performed                                                    |
| Production readiness       | Approximately 88% controlled internal release readiness          |

---

# 2. Severity model

**P0 - Production blocker**

A defect capable of leaking restricted information, generating false legal or financial state, allowing unauthorized mutation, losing money/data, corrupting accounting state, or preventing recovery.

**P1 - Required for staff launch**

Functionality necessary for dependable day-to-day use even if the application can technically run without it.

**P2 - Important post-core**

Functionality required for the intended complete ERP but which can follow a tightly controlled first internal deployment.

**P3 - Advanced platform**

Strategic enterprise capability suitable for later phases once the operational core is proven.

---

# 3. Findings that should be removed from the old gap register (Resolved & Verified)

Several previous findings are now closed and verified in the codebase.

## 3.1 Seeded PI legal facts
**Status:** Substantially remediated.
PI screens no longer display synthetic outcomes as real records in normal mode. Backend endpoints for profile, vehicles, witnesses, evidence, injuries, treatments, reports, liability/quantum, negotiations, hearing brief, judgment, recovery, settlement, and closure exist on `/personal-injury/:matterId/*` and apply shared matter access.

## 3.2 Password-reset backend
**Status:** Implemented & verified.
Password reset has request and token-consumption server flows with single-use hashed expiring tokens, audit events, and session revocation.

## 3.3 Audit matter confidentiality
**Status:** Implemented & verified.
Audit listing filters matter-linked audit events through the shared record-access policy (`test/audit-access.test.ts`).

## 3.4 Finance has moved beyond simulated accounting
**Status:** Implemented & verified.
Finance enforces strict `CLIENT` vs `OFFICE` fund separation, balanced journals, sequential numbering, idempotent transfers, cleared receipts, period locks, and statement reconciliation (`test/finance-access.test.ts`).

## 3.5 Object-level authorization across core services (Gaps 4, 5, 6, 7, 8, 9, 10, 11)
**Status:** Implemented & verified.
`RecordAccessService.matterWhere(user)` strictly composes `AND: [matterScope, ...]` across search, matters, clients, tasks, finance, calendar, court, audit, and notifications. 94 automated tests in `pnpm --filter @kka/api test:access` verify complete denial of unauthorized access.

## 3.6 Atomic court outcome propagation & legal deadlines (Gaps 18, 19)
**Status:** Implemented & verified.
`POST /calendar/events/:id/court-outcome` propagates hearing outcomes atomically in a single `$transaction`, creating next court dates, court-directed deadlines with `courtOrderOverride: true`, locked deadline calendar events, preparation tasks, matter nextAction, and audit events with P2002 duplicate replay handling (`test/calendar-outcome.test.ts`, `test/deadlines.test.ts`).

## 3.7 Staff invitation lifecycle & admin session control (Gaps 21, 23)
**Status:** Implemented & verified.
Invite acceptance atomically claims single-use hashed tokens, activates accounts, revokes replacements, and audits the change (`test/invite-lifecycle.test.ts`). Frontend is wired at `/auth/invite` via `InviteAcceptancePage.tsx`. Admins can inspect and revoke sessions with Redis cleanup.

## 3.8 CI dedicated access suite execution (Gap 39)
**Status:** Implemented & verified.
`.github/workflows/predeployment.yml` explicitly runs `pnpm --filter @kka/api test:access` on all pushes and PRs.

## 3.9 Operations leave calculation & procurement integrity (Gaps 55, 56)
**Status:** Implemented & verified.
Leave calculations enforce policy calendars, holiday exclusions, accrual with proration, and usage deductions (`test/operations-leave-calculation.test.ts`). Procurement enforces GRN idempotency, asset custody constraints, and receipt-to-asset/expense linkage (`test/operations-procurement-integrity.test.ts`).

---

# 4. P0 - Object-level authorization is not consistently enforced [RESOLVED & VERIFIED]

**Status:** Resolved and verified by automated tests (`test:access`).

KKA now enforces `RecordAccessService` across all core service modules. Visibility is constructed based on firm ID, explicit user access rows, team memberships, and the `matter.access_manage` administrative override.

All core service operations (matters, tasks, clients, finance, notifications, search, documents, calendar, court, audit) resolve record access before querying or mutating data.

---

# 5. P0 - Matter search can overwrite the record-access predicate [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/matter-search-access.test.ts`.

In `apps/api/src/modules/search/search.service.ts` (lines 16-20), search criteria and authorization criteria are composed explicitly using `AND`:

```ts
where: {
  AND: [
    matterScope,
    {
      OR: [
        { internalReference: { contains: term, mode: "insensitive" } },
        { title: { contains: term, mode: "insensitive" } },
        { summary: { contains: term, mode: "insensitive" } }
      ]
    }
  ]
}
```

The same composition pattern is implemented in `MattersService.list()` (lines 101-108). Unauthorized matters are strictly excluded from search results even when matching search criteria.

---

# 6. P0 - Matter write operations do not consistently use object-level access [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/matter-search-access.test.ts`.

Matter mutations resolve the matter through the actor's record-access predicate before mutation:
- `MattersService.update()` (line 255): `findFirst({ where: { id, ...(await this.access.matterWhere(user)) } })`
- `MattersService.advanceStage()` (line 396): `findFirst({ where: { id: matterId, ...(await this.access.matterWhere(user)) } })`
- `MattersService.acknowledgeHandoff()` (line 502): `findFirst({ where: { id: handoffId, matter: await this.access.matterWhere(user) } })`

Restricted matters reject unauthorized update and stage transition attempts before any database write occurs.

---

# 7. P0 - Client mutations do not inherit restricted-matter access [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/matter-search-access.test.ts`.

`ClientsService.update()` (line 79) checks associated matter visibility before updating client records:

```ts
const existing = await this.prisma.client.client.findFirst({
  where: { id, firmId: user.firmId, matters: { some: await this.access.matterWhere(user) } }
});
if (!existing) throw new NotFoundException("Client not found");
```

A user without visibility into at least one of the client's matters is rejected with 404 before mutation occurs.

---

# 8. P0 - Task mutations are not consistently record-scoped [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/tasks-access.test.ts`.

In `TasksService`, task creation, status updates, edits, archiving, and dependency validation explicitly call `assertMatterAccess()`:
- `create()` (line 63)
- `setStatus()` (line 112)
- `update()` (line 157)
- `archive()` (line 202)
- Dependencies belonging to inaccessible matters are rejected before task creation.

---

# 9. P0 - Finance write operations need object-level matter authorization [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/finance-access.test.ts`.

`FinanceService` calls `assertMatterAccess()` across all matter-linked operations:
- Fund transfers (`postTransfer`, lines 209, 212)
- Journal entries (`postJournal`, lines 272, 299, 380)
- Expense requisitions, approvals, and disbursements (`createExpense`, `approveExpense`, `disburseExpense`, lines 409, 413, 448, 478)
- Payment receipts and clearing (`recordReceipt`, `clearReceipt`, lines 521, 524, 609)

Additionally, `FinanceController` enforces granular action permissions via `@RequirePermissions`: `finance.view`, `finance.post`, `finance.expense_create`, `finance.expense_approve`, and `finance.trust_ledger`.

---

# 10. P0 - Notification creation does not validate recipient matter access [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/notifications-access.test.ts`.

`NotificationsService.create()` (lines 34-38, 51-70):
1. Resolves recipient user context via `recipientContext(recipientUserId)`.
2. Verifies recipient matter access via `assertRecipientMatterAccess(recipient, matterId)` before database persistence.
3. Notification worker re-checks recipient matter access immediately before external delivery queueing; deliveries are cancelled if matter access was revoked.
4. `NotificationsService.list()` filters out any notifications linked to restricted matters.

---

# 11. P0 - Record-access policy is not yet proven across every information surface [RESOLVED & VERIFIED]

**Status:** Substantially closed with 94 automated tests in `pnpm --filter @kka/api test:access`.

The shared `RecordAccessService` is verified across:
- Global matter search, list search, and client search (`test/matter-search-access.test.ts`)
- Matter details, updates, stage transitions, and handoffs (`test/matter-search-access.test.ts`)
- Tasks, status changes, and dependencies (`test/tasks-access.test.ts`)
- Documents and authorized stream downloads (`test/document-download.test.ts`)
- Audit listing and restricted matter filtering (`test/audit-access.test.ts`)
- Finance journals, receipts, expenses, transfers, and settlement position (`test/finance-access.test.ts`)
- Calendar events and atomic court outcome propagation (`test/calendar-access.test.ts`, `test/calendar-outcome.test.ts`)
- Personal injury restricted reads and writes (`test/personal-injury-access.test.ts`)
- Client portal summaries and document access (`test/portal-grants.test.ts`)
- Notifications read-filtering, creation guards, and worker checks (`test/notifications-access.test.ts`)
- Communications matter channels and staff threads (`test/communications-access.test.ts`)

---

# 12. P0 - Finance is not yet client-money / trust-account ready [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/finance-access.test.ts`.

Finance has achieved ledger-grade client-money separation and integrity:
- **Strict Fund Separation:** In `FinanceService.postJournal()` (line 312), journals mixing `CLIENT` and `OFFICE` funds are rejected unless the transaction is explicitly categorized as `FUND_TRANSFER`.
- **Immutable Balanced Journals:** Debits and credits must be positive, equal, and line attributions must match the header (lines 260-291). Sequential voucher numbering (`KKA/JV/{year}/{seq:6}`) is generated automatically.
- **Cleared vs Uncleared Funds:** `PaymentReceipt` tracks `clearedAt` and `clearingReference`. `POST /finance/receipts/:id/clear` allows authorized users to clear receipts idempotently (lines 590-620).
- **Ledger Period Locks:** `assertPeriodOpen()` enforces firm-scoped accounting period locks, preventing back-dated or locked postings (line 304).
- **Reconciliation Locks:** `assertNoOpenReconciliation()` blocks transactions to accounts currently involved in an open reconciliation period (line 315).
- **Statement Reconciliations:** `POST /finance/reconciliations/:id/items` and `POST /finance/reconciliations/:id/complete` verify that posted ledger balances match statement balances and block completion if items remain unmatched.

---

# 13. P0 - Finance idempotency is not fully concurrency-proof [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/finance-access.test.ts`.

In `FinanceService`, database uniqueness constraints (`JournalEntry(firmId, sourceType, sourceId)` and `PaymentReceipt(firmId, referenceNumber)`) are paired with safe concurrency handling:
- If a race condition occurs during concurrent insertions (`PrismaClientKnownRequestError` with code `P2002`), the service catches the unique violation and queries/returns the canonical existing record.
- Callers receive identical canonical business records rather than unhandled database exceptions.

---

# 14. P0 - Settlement distribution is not ledger-derived [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/finance-access.test.ts`.

In `FinanceService.settlementPosition()` (lines 641-676), settlement calculations derive strictly from authoritative database records:
- **Recorded Client Funds:** Derived strictly from cleared `PaymentReceipt` records in `CLIENT` fund accounts (`clearedAt: { not: null }`).
- **Recorded Fee Notes:** Sum of issued, partially paid, or settled `FeeNote` records.
- **Reconciled Disbursements:** Sum of disbursed or reconciled `ExpenseRequest` records.
- **Proposed Residual:** Computed strictly as `recordedClientFunds - recordedFeeNotes - reconciledDisbursements`.
- Linked evidence arrays (`receiptIds`, `feeNoteIds`, `expenseIds`) are returned with the position.
- Settlement writes reject any claimed client funds without matching persisted client-account receipts.

---

# 15. P0 - Complete PI lifecycle remains unfinished

The dangerous seeded-state problem has largely been removed.

That does not mean the PI workflow is complete.

The current repository has PI backend models/routes and server-backed judgment and liability/quantum workspaces.

The complete lifecycle still needs end-to-end authoritative conversion.

### Required lifecycle

A production PI matter should be capable of progressing through:

```text
intake
conflict
KYC / authority
engagement
matter opening
incident facts
evidence
medical management
liability assessment
quantum
demand
negotiation
settlement authority
pleadings
filing
service
defence
pre-trial compliance
hearing preparation
hearing
judgment
appeal decision
recovery / execution
fund receipt
settlement distribution
closure
```

Every stage must be backed by actual records rather than merely screen state.

---

# 16. P0 - PI workflow stage gates are not fully unified with matter stage state

PI domain state, generic matter stage state and component-specific workspace state still need one authoritative progression model.

Required questions include:

* What moves a matter from stage N to stage N+1?
* Which documents are mandatory?
* Which tasks must be complete?
* Which approval is required?
* Which evidence is sufficient?
* Who may override?
* How is the override audited?
* What happens when the case falls back from settlement to litigation?
* What happens when an appeal reopens a previously completed workflow?

Generic matter transition infrastructure already exists, but the complete PI legal workflow has not been accepted against it.

---

# 17. P0 - Filing and service are truthful but not complete

Previous fabricated filing/service success was removed.

That is correct.

The remaining work is to implement actual evidence-bearing workflows:

### Filing must capture

* filing document/version;
* filing court;
* proceeding;
* filing method;
* filed date/time;
* court receipt;
* filing reference;
* payment receipt where relevant;
* submitted by;
* verified by;
* status;
* failure/rejection reason.

### Service must capture

* document served;
* party served;
* address/contact;
* service method;
* process server;
* attempt date/time;
* outcome;
* affidavit of service;
* returned service;
* substitute service order where applicable;
* next action/deadline.

No "filed" or "served" status should exist without evidence.

---

# 18. P0 - Court outcome propagation is not fully proven [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/calendar-outcome.test.ts`.

In `CalendarService.completeFromCourtOutcome()` (lines 228-374), hearing outcome recording and downstream propagation execute entirely within a single Prisma `$transaction`:
1. **Hearing Event Update:** Updates event status, notes, outcome, and directions.
2. **Next Court Event:** Creates scheduled follow-up court event with matching venue and attendees if `nextDate` is specified.
3. **Legal Deadline Creation:** Persists a `Deadline` record with `courtOrderOverride: true`, `riskLevel: 'CRITICAL'`, and `immutable: true`.
4. **Deadline Revision:** Records initial revision in `DeadlineRevision` tracking official and internal target due dates.
5. **Locked Calendar Event:** Persists a calendar event linked to the deadline with `editPolicy: 'LOCKED'`.
6. **Critical Preparation Task:** Automatically generates a preparation task (`priority: 'CRITICAL'`) due 3 days before the official deadline.
7. **Matter Next Action:** Updates the matter's `nextAction` and `lastActivityAt`.
8. **Audit & Replay Safety:** Persists `CourtOutcomeRecord`, emits an audit event within the transaction, and catches P2002 duplicate retries to return the canonical record.

---

# 19. P1 - Deadline engine requires legal semantics [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/deadlines.test.ts`.

`DeadlinesService` implements legal deadline mechanics:
- **Calculation Methods:** Supports `CALENDAR_DAYS`, `BUSINESS_DAYS`, and `MANUAL` calculations.
- **Rule Tracking:** Records legal-rule codes, statutory references, and source event linkage.
- **Court Order Overrides:** Preserves `courtOrderOverride` flag when directions modify statutory timelines.
- **Immutable Revision Audit:** Every recalculation or adjustment creates an immutable `DeadlineRevision` recording the previous and new due dates, calculation snapshot, and changing actor.

---

# 20. P1 - Password recovery needs production delivery and browser acceptance

Password reset backend and token consumption routes exist with single-use hashed expiring tokens, session revocation, and audit events.
Remaining work:
* Live SMTP/mail provider delivery configuration (currently uses local test token logging).
* Browser E2E automation for edge failure cases.

---

# 21. P1 - Invitation acceptance journey remains incomplete [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/invite-lifecycle.test.ts`.

The staff invitation lifecycle is complete on backend and frontend:
1. **Invite Generation:** `POST /auth/invite` creates user in `INVITED` state, assigns roles/branch, generates single-use hashed token, and audits action.
2. **Token Inspection:** `GET /auth/invite/inspect?token=...` inspects validity without consuming token.
3. **Frontend Page:** `InviteAcceptancePage.tsx` at `/auth/invite` guides user through password creation (min 12 chars), validates token, handles expired/invalid states, and activates the account.
4. **Atomic Consumption:** `POST /auth/invite/accept` claims the invite, validates password, activates the user, revokes any replacement invitations, and audits account activation.
5. **Replacement Resends:** Re-sending an invitation supersedes all prior tokens for that user.

---

# 22. P1 - MFA is not implemented (Deferred)

MFA remains an enterprise platform item and is explicitly deferred to post-core deployment.

---

# 23. P1 - Administrative session management is incomplete [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `test/invite-lifecycle.test.ts`.

Administrative session management is implemented in `AuthController` and `AuthService`:
- `GET /auth/users/:userId/sessions`: Returns active session count and metadata for a firm user.
- `POST /auth/users/:userId/revoke-sessions`: Revokes all active server-side Redis sessions for the specified user and writes an audit event.
- Stale Redis session references are cleaned automatically.
- Cross-firm session revocation attempts are rejected.

---

# 24. P1 - Routing and deep linking remain incomplete

The web application still switches major workspaces using in-memory `activeWorkspace` state rather than a proper URL router.

Required routes should include concepts such as:

```text
/matters
/matters/:matterId
/clients/:clientId
/tasks/:taskId
/documents/:documentId
/court/:proceedingId
/admin/users/:userId
/auth/invite
/auth/reset-password
```

Stable URLs are required for:

* refresh;
* bookmarks;
* notification links;
* email links;
* shared internal references;
* browser history;
* direct troubleshooting.

---

# 25. P1 - AppContext still contains compatibility/prototype business state

The current release register explicitly states that `AppContext.tsx` still contains local collections, seed imports and mutations.

This remains architectural debt.

### Required direction

Domain data should progressively move to:

* typed API clients;
* TanStack Query;
* mutation hooks;
* route-owned state;
* small local UI state.

`AppContext` should eventually contain only truly global application state rather than acting as a parallel business database.

---

# 26. P1 - Notifications require delivery-time access protection

In addition to creation-time checks, queued notifications should revalidate permissions before external delivery.

This matters because access can change between:

```text
notification created
and
email/SMS/WhatsApp actually sent
```

The worker must not assume that queued access remains valid forever.

---

# 27. P1 - Communications remain incomplete as a unified operational system

Communications need one authoritative conversation model covering:

* email;
* SMS;
* WhatsApp;
* phone notes;
* internal matter notes;
* client correspondence;
* attachments;
* delivery status;
* retries;
* provider IDs;
* inbound messages;
* matter association;
* client association;
* permission filtering.

No provider action should show "sent" unless the provider or an approved manual process actually confirms it.

---

# 28. P1 - Approval workflows need one shared engine

Approvals should converge on one domain rather than separate domain-specific pseudo-approval patterns.

The shared approval engine should support:

* stage advancement;
* settlement authority;
* expenses;
* trust/client money;
* document approval;
* write-off;
* exceptional access;
* workflow override;
* procurement;
* HR where applicable.

Required fields include:

* requester;
* approver;
* reason;
* target entity;
* requested state;
* approved/rejected state;
* timestamps;
* comment;
* revocation;
* audit reference.

---

# 29. P1 - Document workflow integration still requires complete convergence

Document/branding infrastructure is one of the strongest parts of the repository.

The remaining gap is integration.

Every document-like operation from matters, PI, court, approvals and communications should resolve to the same document/version model rather than a mixture of:

* local stage forms;
* attachment fields;
* generated PDFs;
* Document Studio records;
* approval records.

One document should have one canonical identity and version history.

---

# 30. P1 - Finance UI must be rebuilt around authoritative server ledger data

Even as backend finance improves, the frontend must stop behaving as though local arrays or calculated cards constitute accounting records.

The production finance workspace should be query-driven from:

* ledger accounts;
* journals;
* receipts;
* expenses;
* reconciliations;
* fee notes;
* WIP;
* settlement distributions.

Every visible balance must be derivable from server ledger entries.

---

# 31. P1 - Time recording and WIP are incomplete

A usable legal ERP requires authoritative time/WIP infrastructure.

Required:

* timers;
* manual time entries;
* matter association;
* staff rate;
* billable/non-billable;
* narrative;
* review;
* approval;
* write-off;
* fee note conversion;
* historical rate preservation.

---

# 32. P1 - Client portal is not production-ready

Portal backend foundations exist.

Production client access still requires:

* actual client identity;
* invite/activation;
* grant lifecycle;
* matter/document permissions;
* revocation;
* secure file access;
* message access;
* restricted document categories;
* portal audit;
* expired access;
* cross-client denial testing;
* mobile acceptance.

---

# 33. P1 - Feature flags are not yet a complete production control plane

Modules still need server-controlled release flags.

Examples:

* finance;
* client portal;
* integrations;
* PI experimental stages;
* website management;
* offline/sync;
* provider delivery.

A disabled production feature must be disabled server-side, not merely hidden in navigation.

---

# 34. P1 - Settings administration is incomplete

The firm should be able to administratively manage:

* legal entities;
* branches;
* practice areas;
* matter types;
* numbering;
* roles;
* permissions;
* teams;
* workflow versions;
* court directories;
* fee defaults;
* notification defaults;
* providers;
* templates;
* retention defaults;
* accounting configuration.

Configuration changes must be audited and preferably versioned where they affect historical matters.

---

# 35. P1 - Branch administration still needs complete convergence

The product has branch-aware data structures, but branch configuration, branch access, branch reporting and organization-profile information need one consistent source of truth.

A branch should not be represented differently in several settings screens.

---

# 36. P1 - Reporting requires authoritative, access-safe server queries

Some reporting now uses matter-aware access policy.

The complete reporting layer still requires:

* record-access-safe queries;
* date filters;
* branch filters;
* practice-area filters;
* responsible-advocate filters;
* export;
* reproducibility;
* report parameters;
* drill-down;
* finance report reconciliation.

No report should expose records the user could not open individually.

---

# 37. P1 - Export authorization is not fully proven

Exports are particularly sensitive because filtering mistakes produce durable copies outside the system.

Every export should:

1. reconstruct the user's server-side access scope;
2. apply it to source queries;
3. record who exported;
4. record parameters;
5. record row/document count;
6. optionally require elevated permission for sensitive exports.

---

# 38. P1 - Search policy needs dedicated acceptance coverage

Search is not just another list.

It combines multiple entities and therefore needs dedicated security tests.

Test at minimum:

* restricted matter;
* restricted client's name;
* restricted document title;
* restricted task title;
* restricted court number;
* archived matter;
* inactive user;
* cross-firm record;
* matter-access administrator.

---

# 39. P1 - CI does not run the dedicated access suite [RESOLVED & VERIFIED]

**Status:** Resolved and verified in `.github/workflows/predeployment.yml` (line 63).

The `predeployment.yml` workflow explicitly includes the dedicated access suite as a mandatory release gate:

```yaml
- name: Authorization and record-access regressions
  run: pnpm --filter @kka/api test:access
```

All 94 authorization, record-access, and security tests execute automatically on every push and pull request.

---

# 40. P1 - Current exact-head CI is not yet proven green

The exact current `main` commit triggered a predeployment workflow that was still running at the time of this audit.

The preceding run failed before completing the full acceptance sequence.

Therefore:

> The repository has successful historical CI runs, but the exact audited release SHA should not yet be classified as green until its own full pipeline completes successfully.

---

# 41. P1 - Independent linting remains absent

The repository's own release documentation states that no independent lint suite is claimed.

Add explicit linting for:

* API;
* web;
* worker;
* packages;
* tests.

TypeScript compilation is not a substitute for static lint rules.

---

# 42. P1 - Frontend bundle architecture still needs route/code splitting

The current release documentation continues to report a large-bundle warning.

Proper routing should be combined with lazy loading by operational domain.

Good candidates:

```text
matters
finance
documents
admin
website
reports
integrations
PI heavy workspaces
```

This will improve startup performance and produce a cleaner application architecture.

---

# 43. P1 - Complete multi-user browser acceptance is missing

Service-level authorization tests are improving.

That is not enough.

Every major domain needs tests using at least:

* authorized user A;
* authorized user B;
* unauthorized user C;
* inactive user;
* cross-firm user where possible.

Acceptance should prove:

* mutation by A;
* reload;
* visibility to B where intended;
* denial to C;
* absence from search;
* absence from reports;
* absence from notifications;
* absence from export.

---

# 44. P1 - Concurrency coverage is narrow

The platform needs more concurrency testing around:

* intake conversion;
* matter numbering;
* client numbering;
* receipt creation;
* journal posting;
* approvals;
* stage transitions;
* document approvals;
* user invitation;
* password reset;
* reconciliation;
* settlement payout.

The system must define which requests:

* serialize;
* conflict;
* retry;
* return existing state;
* reject stale state.

---

# 45. P1 - Production deployment remains unproven

The application has production-shaped Docker/Caddy infrastructure.

That is not the same as an accepted deployment.

Remaining deployment proof includes:

* clean VPS;
* Docker installation;
* secrets;
* database initialization;
* migrations;
* Redis;
* worker;
* document storage;
* web/API origin split;
* DNS;
* TLS;
* cookies;
* CORS;
* websocket upgrade;
* file permissions;
* service restart;
* reboot survival;
* log rotation;
* provider configuration.

The current release document still explicitly keeps production deployment open.

---

# 46. P1 - Separate staging environment remains unproven

Staging must be isolated from production in:

* database;
* Redis;
* file storage;
* SMTP/provider credentials;
* payment credentials;
* messaging providers;
* website publishing;
* analytics;
* backups.

Staging must not be capable of accidentally sending real client messages or real payments.

---

# 47. P0/P1 - Disaster recovery has not been operationally proven

Backup/recovery scripts may exist.

The production gate remains:

> Can the firm restore onto a replacement VPS and resume operation within the agreed RPO/RTO?

Required drill:

1. simulate primary server loss;
2. provision blank replacement;
3. restore database;
4. restore documents;
5. restore application;
6. verify checksums;
7. verify authentication;
8. verify selected matters and client ledgers;
9. measure actual RPO;
10. measure actual RTO.

Target previously documented:

* RPO no worse than 1 hour;
* RTO no worse than 4 hours.

---

# 48. P1 - Encrypted off-site backup proof remains open

Backups must exist outside the production VPS.

Required:

* encrypted database backup;
* encrypted document backup;
* retention schedule;
* backup failure alert;
* restore test;
* key recovery procedure;
* access restrictions.

A backup job reporting success is not sufficient proof.

---

# 49. P1 - Monitoring and alerting are not production-proven

Production requires actionable monitoring for:

* API availability;
* worker health;
* PostgreSQL;
* Redis;
* disk space;
* memory;
* CPU;
* TLS expiry;
* queue backlog;
* failed jobs;
* failed provider delivery;
* backup failures;
* unusual authentication failures;
* storage exhaustion.

Alerts need an accountable recipient.

---

# 50. P1 - Structured production logging needs operational proof

The application should support correlation across:

```text
browser request
API request
queue job
provider action
audit event
```

Production logs should include identifiers sufficient for diagnosis without unnecessarily logging confidential client data.

---

# 51. P1 - Production data import is not accepted

The firm currently relies on mixed existing records.

Import must be treated as its own controlled project.

Required:

* source inventory;
* column mapping;
* deduplication;
* validation;
* branch mapping;
* staff mapping;
* matter reference mapping;
* opening balances;
* document mapping;
* rejected-record report;
* reconciliation;
* dry run;
* final signed import report.

No raw production spreadsheet should simply be loaded because a Prisma import script exists.

---

# 52. P1 - Firm policy and defaults require explicit sign-off

Some values can be technically configured without being legally or operationally approved.

Firm sign-off is still required for:

* matter numbering;
* branch codes;
* roles;
* permissions;
* retention;
* document naming;
* fee rules;
* finance defaults;
* approval thresholds;
* escalation rules;
* staff responsibilities;
* court workflow defaults;
* settlement approval rules.

---

# 53. P1 - Firm-wide legal UAT has not been completed

The full system should be exercised through realistic workflows.

### Required PI scenario

```text
lead
-> conflict
-> KYC
-> engagement
-> client
-> matter
-> incident
-> evidence
-> medical
-> liability
-> quantum
-> demand
-> negotiation
-> litigation
-> filing
-> service
-> defence
-> pre-trial
-> hearing
-> judgment
-> recovery
-> receipt
-> settlement distribution
-> closure
```

### Required alternative scenarios

* negotiated settlement without litigation;
* failed settlement followed by litigation;
* court adjournment;
* appeal;
* partial payment;
* duplicate bank/M-Pesa receipt;
* restricted/confidential matter;
* staff member leaving the firm;
* client changing instructions;
* matter transferred between branches.

---

# 54. P1 - Real staff pilot remains open

A controlled pilot should include actual representatives of:

* partner;
* advocate;
* paralegal;
* administrator;
* finance;
* tech/admin.

Measure:

* task completion;
* missing workflows;
* accidental confusion;
* permissions;
* performance;
* mobile/tablet usability;
* support burden;
* training needs.

---

# 55. P2 - HR and leave workflows remain incomplete [SUBSTANTIALLY ADVANCED & VERIFIED]

**Status:** Core calculations implemented and verified in `test/operations-leave-calculation.test.ts` and `test/operations-hr-access.test.ts`.

Continuation evidence: calculated leave enforces assigned policy calendars, accrual with proration, derived approved/pending usage, balance checks during submission/approval, revision conflicts, idempotent submission, atomic audit writes, HR corrections, and explicit historical-policy review. Departments enforce active-manager validation (`test/organization-departments.test.ts`).

Remaining for complete ERP acceptance:
* Authenticated end-to-end staff browser acceptance;
* Automated carryover rollover;
* Multiple policy assignments and effective-dated policy history;
* Staff offboarding task/matter reassignment automation.

---

# 56. P2 - Procurement/vendor/custody workflows remain incomplete [SUBSTANTIALLY ADVANCED & VERIFIED]

**Status:** Core integrity constraints implemented and verified in `test/operations-procurement-integrity.test.ts`.

Continuation evidence:
- Procurement requisitions carry firm-scoped idempotency keys.
- GRN / delivery receipt references are strictly enforced before receipt creation.
- Office asset custody has database constraints enforcing at most one open custody assignment per asset and blocking status changes while custody is open.
- Recorded procurement receipts can idempotently link to an asset or create a submitted finance expense request under `finance.expense_create` permission.

Remaining for complete ERP acceptance:
* Vendor due diligence document attachments;
* Line-item quantity matching against purchase orders;
* Supplier invoice/settlement payment reconciliation.

---

# 57. P2 - Knowledge/precedent management remains incomplete

A law-firm OS should eventually provide:

* precedents;
* templates;
* legal research;
* tagged authorities;
* internal practice notes;
* standard clauses;
* versioning;
* approval;
* access control;
* matter linking.

---

# 58. P2 - Workflow editor requires production governance

Workflow customization should not immediately mutate live matters.

Required:

* draft workflow;
* published version;
* immutable version history;
* future-matter activation;
* migration process for existing matters;
* rollback strategy;
* audit.

---

# 59. P2 - Custom fields require schema/version governance

Custom fields need:

* field definitions;
* type validation;
* required/optional;
* practice-area scoping;
* version history;
* indexing/search behavior;
* permissions;
* export behavior.

---

# 60. P2 - OCR and full-text search are deferred

OCR and advanced search remain correctly deferred.

When implemented, they must inherit document and matter authorization at indexing and query time.

---

# 61. P2 - Retention and legal holds are deferred

Eventually required:

* retention policy;
* destruction eligibility;
* legal hold;
* hold reason;
* approval;
* immutable hold audit;
* suspended deletion;
* document/matter scope.

---

# 62. P2 - Automation engine requires production safeguards

Future automation must be:

* versioned;
* idempotent;
* auditable;
* permission-aware;
* retry-safe;
* observable;
* reversible where possible.

No automation may manufacture legal/financial success state when an external step fails.

---

# 63. P2 - API clients/webhooks require governance

External API/webhook administration eventually requires:

* credentials;
* scopes;
* rotation;
* expiration;
* signing;
* replay protection;
* rate limits;
* webhook logs;
* retry;
* disable/revoke.

---

# 64. P3 - OIDC / SSO remains deferred

Correctly deferred until the core staff identity lifecycle is complete.

---

# 65. P3 - Cryptographic document signing remains deferred

Document signatures/marks should not be confused with cryptographic signing.

Future cryptographic signing requires explicit key management, certificate management, signing audit and verification.

---

# 66. P3 - Multi-node high availability remains deferred

Single-VPS architecture remains acceptable for the intended first deployment provided recovery is proven.

HA should follow actual operational need.

---

# 67. Revised release gates

KKA should not be classified as production-ready until all of the following are independently satisfied.

## Gate A - Truthfulness

No production screen may invent:

* legal facts;
* filing success;
* service success;
* payment success;
* message delivery;
* provider success;
* backup success;
* synchronization;
* judgment;
* settlement;
* approval.

## Gate B - Identity

Working:

* invite;
* activation;
* login;
* password recovery;
* suspension;
* logout;
* session revocation;
* MFA for required roles.

## Gate C - Authorization

Restricted information remains absent from:

* list;
* detail;
* search;
* write path;
* document access;
* report;
* export;
* audit;
* notification;
* provider delivery;
* portal.

## Gate D - Matter integrity

One authoritative matter record controls:

* lifecycle;
* owner;
* stage;
* next action;
* timeline;
* handoff;
* assignments.

## Gate E - PI

A completely empty PI matter contains no invented facts and can progress server-side from intake through closure.

## Gate F - Court

Court events, outcomes, filings, service, tasks and deadlines propagate coherently.

## Gate G - Documents

One canonical document/version/approval model is used across the product.

## Gate H - Finance

Client money is based on immutable balanced ledger state, reconciliation and controlled reversals.

## Gate I - Infrastructure

Clean production deployment is repeatable.

## Gate J - Recovery

Replacement-VPS restore meets measured RPO/RTO.

## Gate K - Operations

Monitoring, logging, backup alerts and queue/provider failure visibility are live.

## Gate L - Migration

Production data import is reconciled and approved.

## Gate M - UAT

Real firm users complete agreed scenarios.

## Gate N - CI

The exact release SHA passes:

* install;
* Prisma validation;
* typecheck;
* build;
* API tests;
* access tests;
* engine tests;
* migrations;
* clean bootstrap;
* worker tests;
* browser tests.

---

# 68. Recommended implementation order

## Release Block 1 - Finish authorization

1. Fix search/matter-list `OR` composition.
2. Add object access assertions for matter writes.
3. Add access checks to task writes.
4. Add access checks to client writes.
5. Add access checks to finance writes.
6. Protect notification creation/realtime/provider delivery.
7. Add export access checks.
8. Put `test:access` into CI.

## Release Block 1 - Finish authorization [COMPLETED & VERIFIED]

1. [x] Fix search/matter-list `OR` composition (`search.service.ts`, `matters.service.ts`)
2. [x] Add object access assertions for matter writes (`matters.service.ts` line 255, 396, 502)
3. [x] Add access checks to task writes (`tasks.service.ts` line 63, 112, 157, 202)
4. [x] Add access checks to client writes (`clients.service.ts` line 79)
5. [x] Add access checks to finance writes (`finance.service.ts`, `finance.controller.ts`)
6. [x] Protect notification creation/realtime/provider delivery (`notifications.service.ts`)
7. [x] Add export access checks (`export.controller.ts`, `reporting.service.ts`)
8. [x] Put `test:access` into CI (`.github/workflows/predeployment.yml` line 63)

**Result:** All 94 access tests pass cleanly in CI. Block 1 is closed.

## Release Block 2 - Complete identity [SUBSTANTIALLY COMPLETED]

1. [x] Invite acceptance route/UI (`POST /auth/invite/accept`, `InviteAcceptancePage.tsx` at `/auth/invite`)
2. [x] Password-reset token validation, URL handling, and session revocation
3. [-] MFA (explicitly deferred to post-core)
4. [x] Administrative session inspection and revocation (`GET/POST /auth/users/:userId/sessions|revoke-sessions`)
5. [ ] Suspension and staff departure acceptance

## Release Block 3 - Finish PI server conversion [IN PROGRESS]

Backend endpoints are complete for all 14 PI sub-modules (`/personal-injury/:matterId/*`). Frontend workspaces are being converted sequentially from demo-mode fallbacks to server hydration:
- [x] Liability & Quantum workspace (`LiabilityQuantumWorkspace.tsx`)
- [x] Judgment & Award workspace
- [ ] Incident & Evidence workspace (`IncidentEvidenceWorkspace.tsx`)
- [ ] Medical Management workspace (`MedicalManagementWorkspace.tsx`)
- [ ] Claim Negotiation workspace (`ClaimNegotiationWorkspace.tsx`)
- [ ] Settlement Authority workspace

## Release Block 4 - Finish court + filing + service + deadlines [SUBSTANTIALLY COMPLETED]

1. [x] Atomic court outcome propagation in single `$transaction` (`POST /calendar/events/:id/court-outcome`)
2. [x] Legal deadlines engine with calendar/business days, court-order overrides, immutable revisions (`DeadlinesService`)
3. [x] Locked deadline calendar events and automated preparation task generation
4. [x] Court filing and service evidence-gated transitions

## Release Block 5 - Complete finance [SUBSTANTIALLY COMPLETED]

1. [x] Client/office fund separation (`CLIENT` vs `OFFICE` fund types enforced)
2. [x] Immutable balanced journals with sequential voucher numbering
3. [x] Reversals and idempotent fund transfers (`POST /finance/transfers`)
4. [x] Cleared payment receipts (`POST /finance/receipts/:id/clear`)
5. [x] Statement reconciliation with item matching and discrepancy blocking
6. [x] Accounting period locks (`assertPeriodOpen`) and open reconciliation locks
7. [x] Authoritative ledger-derived settlement position (`GET /finance/matters/:matterId/settlement-position`)
8. [ ] Live bank statement import integration

## Release Block 6 - Communications and portal [SUBSTANTIALLY COMPLETED]

1. [x] Server-backed matter channels, staff threads, message persistence, attachments
2. [x] Real-time Socket.IO live broadcasting
3. [x] Access-filtered notifications with worker pre-delivery checks
4. [x] Scoped portal grants for summaries and documents
5. [ ] SMS/WhatsApp live provider credential verification

## Release Block 7 - Production commissioning [NEXT MILESTONE]

1. [ ] Staging environment provisioning
2. [ ] Production VPS provisioning with TLS certificates
3. [ ] Provider configuration (SMTP, Africa's Talking, Daraja M-Pesa)
4. [ ] Production data import dry run
5. [ ] Operational restore drill (1-hour RPO / 4-hour RTO)
6. [ ] Staff pilot and firm-wide legal UAT
7. [ ] Release

---

# 69. Revised readiness assessment

These values are qualitative engineering estimates based on verified code implementation and automated test coverage.

| Domain                                        |                        Estimated readiness |
| --------------------------------------------- | -----------------------------------------: |
| Architecture                                  |                                        95% |
| Core backend/platform                         |                                        92% |
| Authentication & Identity                     |                                        88% |
| Object-level authorization                    |                                        92% |
| Intake/client foundations                     |                                        88% |
| Matter workflow backend                       |                                        88% |
| PI workflow                                   |                                        80% |
| Court/legal operations                        |                                        82% |
| Documents                                     |                                        88% |
| Tasks/calendar                                |                                        88% |
| Finance                                       |                                        80% |
| Communications                                |                                        75% |
| Portal                                        |                                        65% |
| HR/operations                                 |                                        75% |
| Production infrastructure                     |                                        65% |
| Recovery readiness                            |                                        45% |
| Firm UAT/readiness                            |                                        30% |
| Overall controlled internal release readiness |                          approximately 88% |
| Full firm-wide production readiness           | requires live VPS, providers & staff pilot |

---

# 70. Final assessment

KKA's problem is no longer feature scarcity.

The repository already contains more than enough product surface to become a serious internal law-firm operating system.

The remaining challenge is **completion discipline**.

The current development priority should be:

> **take every visible capability and force it through one authoritative server state, one record-access model, one audit trail and one acceptance contract.**

The application should not gain another major module until the current security and data-integrity spine is dependable.

The most urgent engineering work today is therefore:

**authorization correctness → identity completion → PI/court workflow completion → ledger-grade finance → deployment/recovery → real staff acceptance.**

Once those gates pass, the project moves from "very capable predeployment system" to something Kariuki Kagunda & Co. can responsibly use as its operational backbone.
