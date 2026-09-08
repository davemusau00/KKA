# Local-Only KKA Product Conversion Plan

Updated 2026-09-08. This is the implementation plan for converting the KKA OS prototype into a server-confirmed local product without requiring production deployment or external provider credentials.

## Objective

Build and verify the operational core against the local PostgreSQL, Redis, API, worker and browser stack. The backend is authoritative in normal local mode; demo fixtures remain available only behind an explicit development flag.

Every completed vertical slice must include persistence, shared contracts, server authorization, UI integration, loading/error/empty states, audit evidence, reload and second-user behavior, API/browser tests, and responsive/keyboard verification.

## Delivery order

### Phase 0 — Truthful baseline

- Remove or explicitly label fake integration, backup/restore, payment, filing, delivery and synchronization success.
- Prevent normal local mode from falling back to synthetic business records after API failure.
- Establish shared Zod DTOs, list/mutation response conventions, error handling and TanStack Query domain hooks.
- Add reload-safe routes for clients, intake, matters, tasks, calendar, court and finance.
- Keep theme preferences; keep business fixtures only in explicit demo mode.

### Phase 1 — Core records and identity

- Complete server-backed session, invitation, suspension, role, branch, permission, settings and feature-flag administration.
- Normalize clients and directory persistence; remove fire-and-forget saves.
- Convert intake through conflict, KYC, consent/engagement, numbering, assignment and workflow selection into a transactional matter.
- Enforce matter access on list, detail, search and timeline queries.

### Phase 2 — Legal operations

- Complete task editing, dependencies, assignment, deadlines and status transitions.
- Connect calendar and court events to persisted matters, documents, filings, service records, deadlines and follow-up tasks.
- Connect all personal-injury stage records to the API and enforce persisted transition gates.
- Connect matter documents and the approvals inbox to the central document/approval engine.

### Phase 3 — Finance and client money

- Harden balanced journal posting, fund separation, attribution, reversals, duplicate protection and idempotency.
- Complete receipts, expenses, fee notes, time entries, disbursements and audit trails.
- Add local CSV reconciliation and ledger-derived reporting without bank or payment-provider dependencies.

### Phase 4 — Cross-cutting local capabilities

- Normalize authorized search and stable result navigation.
- Persist internal notifications, read state and manual-delivery statuses.
- Persist internal matter communications and private local attachments.
- Replace context-only audit rendering with server audit history.
- Apply responsive, keyboard, failure, loading and empty-state acceptance to every converted slice.

## Explicitly deferred

This plan does not require or claim completion of DNS, TLS, production VPS provisioning, live Caddy deployment, SMTP, Google, Judiciary, Daraja, WhatsApp, SMS, S3, OIDC providers, live bank reconciliation, off-site backup proof, replacement-VPS restore proof, production imports or staff pilot acceptance.

Provider-backed functionality must expose truthful states such as `UNCONFIGURED`, `MANUAL`, `FAILED` and `NOT_IMPLEMENTED`; it must not manufacture connected, paid, filed, delivered or synchronized outcomes.

## Acceptance contract

A slice is complete only when:

1. A browser mutation writes an authoritative server record.
2. The record survives reload and is visible to a second authorized session.
3. Unauthorized, inactive and cross-firm access is rejected server-side.
4. Failed, stale, duplicate and concurrent requests have explicit behavior.
5. Material mutations create audit events.
6. API, service and browser tests cover the behavior at desktop, tablet and mobile widths.
7. Typecheck, build and `git diff --check` pass.

## Current evidence

The foundation, organization-profile and document slices have prior local acceptance evidence in [PROJECT_STATE.md](PROJECT_STATE.md). This plan is the work register for the remaining local-only conversion and must not be read as production deployment evidence.
