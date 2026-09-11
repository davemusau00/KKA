# KKA current release state

**Status date:** 2026-09-11  
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
- Notification listing and read-state mutations now re-check matter visibility, preventing restricted matter content from being returned or acknowledged by an unauthorized recipient. Creation-time delivery filtering and multi-user browser acceptance remain open.
- PI judgment, liability/quantum, recovery, and settlement workspaces no longer surface seeded legal, recovery, payment, or client-money outcomes in normal mode. Their browser-only save/disbursement paths are disabled unless the explicit local demo flag is enabled; empty screens now state that server-backed evidence is unavailable. This is a truthfulness remediation, not acceptance of the PI lifecycle.

## Implemented, acceptance incomplete

- Client, intake, matter, task, calendar, court, document, finance, communication, notification, portal, reporting, and website surfaces have backend modules or UI paths, but not every path has proven reload persistence, second-user visibility, scoped authorization, failure behavior, concurrency behavior, and audit evidence.
- `AppContext.tsx` still contains local business collections, seed imports, and mutations. These are compatibility/prototype paths until each domain is moved behind an authoritative API/query boundary.
- PI stage models and routes exist, but the complete lifecycle from empty matter through closure is not accepted as one gated workflow.
- Finance models and routes exist, but client money is not launch-ready until balanced immutable journals, fund separation, idempotency, reversals, reconciliation, locks, and ledger-derived settlement distribution are proven.
- Filing, service, court outcome propagation, communications, portal grants, search access policy, settings administration, feature flags, routing, and notifications require domain-specific acceptance evidence.
- The current release build retains a large-bundle warning and has no independent lint suite claim.

## Not implemented or not proven

- Password-recovery browser journey, MFA, administrative session inspection/revocation, and end-to-end invite acceptance journey remain incomplete. The password-reset API and self-service logout-all slice are locally accepted; browser automation and mail delivery remain open.
- One shared record-access policy applied consistently to search, lists, details, exports, reports, documents, notifications, and portal grants. Matter/client/task/document/search reads, matter-derived reports, portal administration, and notification reads are implemented locally; exports, notification creation-time filtering, approval/expense report scope, and multi-user browser acceptance remain open.
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
