# KKA OS production conversion

Updated 2026-09-07. This is the working delivery register for converting the React prototype into the operational product.

## Deployment contract

- Web: `https://os.kariukikagunda.com`
- API: `https://api.kariukikagunda.com/api/v1`
- Hosting: new single VPS with separate staging, Docker Compose, Caddy, private document storage and encrypted off-site backups.
- Data: clean production database; reviewed import batches only. Browser seed records are never promoted.
- Writes: online and server-confirmed. Local browser state is limited to presentation preferences and explicit future offline work.
- Integrations: real provider adapters or auditable manual alternatives. No simulated payment, filing, delivery or connection success.
- Advanced scope: OIDC SSO, OCR/search, reporting, retention/legal holds, bounded API/webhook extensions and certificate-based PDF signing. True multi-node HA and unrestricted plugins remain later platform work.

## Current conversion status

| Area | Current state | Production action | Acceptance proof |
|---|---|---|---|
| Branding and document execution | Persistent server-backed workflow | Keep as regression slice; verify on the two domains | `docs/DOCUMENT_WORKFLOWS.md`, API and browser suites |
| Authentication and authorization | Session/RBAC backend exists; web shell still being separated from prototype context | Complete account lifecycle, MFA/CSRF, route guards and server policy coverage | Cross-role API/E2E matrix |
| Organization and settings | Backend modules exist; local context remains broad | Move branches, users, settings and permissions to server queries | Reload, second-user and audit tests |
| Clients, intake and matters | Partial API hydration with local seed fallback | Complete conflict/KYC/engagement, matter spine, assignments and workflow versions | Intake-to-matter vertical slice |
| Tasks, calendar and court | Modules and prototype workspaces exist | Connect all mutations, deadline propagation, hearings, filings and service evidence | Court-event vertical slice |
| Personal injury | Domain screens and partial services exist | Persist each stage and gate transitions; remove seeded fallback | PI matter through closure |
| Communications | Backend modules exist; provider behavior incomplete | Queue, delivery states, threading, attachments and manual alternatives | Provider failure/retry scenarios |
| Finance and client money | Finance module exists; full ledger acceptance remains open | Implement immutable postings, reconciliation, controls and reports | Invariant and opening-balance reconciliation |
| Firm operations and portal | Portal, knowledge and administration foundations exist | Complete HR, leave, procurement, assets, portal grants and external workflows | Staff/client authorization matrix |
| Advanced platform | Operations/reporting/automation/developer foundations exist | Add OIDC, OCR, report builder, retention, webhooks, API clients and certificate signing | End-to-end capability tests |
| Deployment and recovery | Compose/Caddy scaffold exists | Provision staging/production, domains, monitoring, backups and restore rehearsal | Replacement-VPS recovery test |

## Phased build rule

Every phase is a vertical slice: Prisma migration, shared contract, authorized API, worker/outbox behavior where needed, UI, loading/error/empty states, responsive and keyboard behavior, audit event, meaningful unit/integration/browser tests and documentation evidence. A screen is not considered complete because it renders or because a local state change appears successful.

### Phase 0 — truthful baseline

Freeze prototype-only behavior behind explicit development mode. Remove demo persona controls and reset actions from production. Create the capability register, CI gates, clean bootstrap, fixture-only seed command, migration inventory and domain URL configuration. Replace the central context incrementally; do not add new business state to it.

### Phase 1 — identity and organization

Deliver invitations, recovery, revocation, suspension, MFA, CSRF, branches, teams, roles, permission administration, settings history, server-side route authorization and real deep links. The web app must render an authenticated shell only after the backend confirms the session.

### Phase 2 — clients, intake and matter spine

Deliver conflict checks, KYC/consent, engagement, relationships, numbering, parties, proceedings, assignments, workflow versions, stage gates, handoffs and timeline. Add dry-run import batches with duplicate handling and reconciliation.

### Phase 3 — legal work, court and documents

Connect tasks, dependencies, deadlines, calendar, filing/service evidence, hearings/outcomes and the PI lifecycle to authoritative matter records. Apply the existing versioned document, branding, template, approval and audit pipeline throughout.

### Phase 4 — communications and collaboration

Deliver matter correspondence, internal threads, notifications, reminders, inbound triage and provider adapters. Provider status must distinguish unconfigured, connected, degraded, failed and manually handled.

### Phase 5 — finance and client money

Deliver time/WIP, fees, receipts, allocations, expenses, approvals, separate client/office ledgers, imports, reconciliation, settlement distributions, locks and reporting. Enable financial imports only after ledger invariants pass.

### Phase 6 — firm operations and external access

Deliver employee/leave records, procurement, vendors, asset custody, meetings, knowledge, portal visibility policies, collaborator grants, client instructions and secure uploads.

### Phase 7 — advanced platform

Deliver OIDC SSO, asynchronous OCR and authorized search, semantic report builder, scheduled exports, custom fields/forms, versioned idempotent automation, API clients, signed webhooks, job administration, retention/legal holds and independently verifiable certificate-based PDF signing.

### Phase 8 — rehearsal and launch

Provision staging and production, configure DNS/TLS for both domains, run imports, verify permissions with firm representatives, test provider and storage failures, restore onto a clean VPS, train users and cut over with a monitored stabilization period.

## Non-negotiable release gates

- No production route exposes seed records, persona switching, demo reset, fake integration status or client-only success state.
- Every mutation is authorized on the server, audited where material, idempotent where retried and safe under concurrent requests.
- Restricted matter, client, document, signature, finance and portal records remain absent from unauthorized lists, searches and exports.
- Blank and upgrade migrations pass; builds, typechecks, unit tests, API tests and browser tests pass.
- Core flows work at 360, 768 and 1440 pixels with keyboard navigation and usable failure states.
- Backups are encrypted, off-site and periodically restored. Target recovery objectives are at most one hour of data loss and restoration within four hours, demonstrated on the selected VPS.

