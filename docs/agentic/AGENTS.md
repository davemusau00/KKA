# AGENTS.md
## Mandatory Instructions for Agentic Coding Systems

This file is the operating contract for any coding AI working on Kariuki Kagunda & Co. Advocates OS.

The agent must treat this documentation set as the source of truth.

---

## 1. Mission

Build a responsive, production-capable modern MVP for the firm's internal operations.

Do not build a visual prototype.

Do not build a dashboard shell filled with nonfunctional cards.

Do not substitute placeholder UI for specified behavior.

The application must support real daily operation by staff across two branches.

---

## 2. Priority order

When requirements conflict, resolve them in this order:

1. Data integrity
2. Functional correctness
3. Matter-centric architecture
4. User workflow simplicity
5. Responsiveness
6. Offline resilience
7. Accessibility
8. Visual polish
9. Performance optimization
10. Future extensibility

---

## 3. Strict build rules

### 3.1 No dead controls

Every visible button, menu item, link, drag action, search field, filter, tab or form submission must:
- perform the intended action,
- show a disabled state with a clear reason,
- or be hidden behind a feature flag.

Never leave a visible control that only logs to console, shows "coming soon", or performs a fake state change.

### 3.2 No data model improvisation

Before adding a field or table:
1. locate the corresponding domain concept in this documentation,
2. add or modify the documented model if required,
3. create a database migration,
4. update generated types,
5. update validation schemas,
6. update test fixtures.

Never silently invent parallel structures.

### 3.3 No duplicate sources of truth

Examples:
- A court hearing is a calendar event with court metadata, not a separate manually duplicated calendar item.
- A document version belongs to one document record.
- An expense linked to a matter is also part of that matter's financial view.
- A task linked to a calendar event references the event; do not copy the event date into an unrelated text field.

### 3.4 No hard-coded workflow status labels in UI

Matter stages, task statuses, event types, expense categories and document states must come from:
- enums where globally fixed,
- database configuration where admin-configurable,
- workflow template data where practice-specific.

### 3.5 Approved core stack

Unless an ADR explicitly changes it, use:

- React 19 + Vite 8 frontend
- Node.js 24 LTS
- NestJS + Fastify backend
- Prisma ORM 7.x
- PostgreSQL 18
- Redis 8.2 Extended Support
- BullMQ
- Caddy
- Docker Compose
- Dexie + Workbox/vite-plugin-pwa for offline/PWA

Do not re-introduce Supabase, Firebase, Appwrite, PocketBase or another hosted backend/BaaS.

Do not add Kubernetes, Kafka, Elasticsearch, RabbitMQ or another infrastructure service unless an actual measured requirement justifies it and an ADR is approved.

### 3.6 Strict TypeScript

- `strict: true`
- Do not use `any` unless an integration SDK forces it and the boundary is immediately narrowed.
- Prefer discriminated unions.
- All API payloads must be validated with Zod or an equivalent runtime schema.

### 3.7 Migrations first

A feature that needs schema changes is not complete until:
- migration exists,
- migration runs on a blank database,
- migration runs from previous schema state,
- seed still works,
- type generation passes.

### 3.8 Functional vertical slices

Implement by vertical slice, not by "all database first, then all UI".

A valid slice is:

`create matter -> save -> assign -> display -> search -> edit -> audit -> offline-safe behavior -> test`

Then move to the next slice.

### 3.9 Feature completion rule

A feature is only complete if it includes:
- database schema,
- service/repository logic,
- server endpoint/action if required,
- UI,
- validation,
- empty/loading/error states,
- permissions hook,
- mobile behavior,
- tests,
- audit or activity event where appropriate.

### 3.10 Do not overengineer security in MVP, but do not remove basics

Advanced hardening is deferred. Minimum baseline remains:
- authenticated access,
- role/assignment-based authorization,
- tenant/firm scoping,
- protected private storage access,
- secrets never shipped to client,
- basic audit events,
- backups.

See `docs/15_SECURITY_SCOPE.md`.

### 3.11 Maintain documentation

At the end of each development work unit:
- update `PROJECT_STATE.md`,
- update affected docs,
- list migrations added,
- list tests added,
- list incomplete items honestly.


### 3.12 VPS deployment invariants

- The production application must be reproducible from source using Docker Compose.
- The frontend must build to static assets served by Caddy.
- The browser must never connect directly to PostgreSQL or Redis.
- PostgreSQL and Redis ports must not be published to the public internet.
- API and worker use the same domain service packages where possible.
- Long-running jobs belong in the worker, not in HTTP request handlers.
- Uploaded files must live on a persistent mounted volume or an S3-compatible driver, never the container layer.
- Schema migrations run as an explicit deploy step, not automatically from every API replica.
- Caddy is the only service that should normally bind public 80/443.
- Production environment secrets never enter the frontend build.

---

## 4. Required development workflow for coding agents

For every issue:

### Step A: Read
Read:
- this file,
- relevant domain doc,
- relevant UX doc,
- relevant data model section.

### Step B: State plan
Produce a short implementation plan with:
- files to touch,
- schema impact,
- API impact,
- UI impact,
- tests,
- offline implications.

### Step C: Implement smallest complete vertical slice
Avoid giant unreviewable changes.

### Step D: Run gates
Required:
- typecheck
- lint
- unit tests
- integration tests for affected service
- build
- relevant E2E smoke test

### Step E: Manual acceptance
Check:
- desktop
- tablet
- narrow mobile
- offline state where relevant
- empty dataset
- slow loading
- error response

### Step F: Update project state
Never claim complete if a test is skipped or a control remains nonfunctional.

---

## 5. Naming conventions

Use:
- `organization_id`
- `branch_id`
- `matter_id`
- `client_id`
- `assigned_to`
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

Database:
- snake_case
- UUID primary keys
- timestamptz
- explicit foreign keys
- indexes on frequently filtered relations

TypeScript:
- PascalCase for types/components
- camelCase for values/functions
- no abbreviations unless industry-common

---

## 6. Business invariants

These invariants must not be violated.

1. Every matter belongs to one firm/organization.
2. Every matter has an immutable internal reference after activation.
3. A matter may have zero, one or many court proceedings.
4. Court number is not the same as internal matter reference.
5. Every task may optionally link to a matter, event, document or internal project.
6. A legal deadline must retain its official due date even if an internal work target changes.
7. Document version history is append-only in normal operation.
8. An approved/filed version must not be overwritten in place.
9. Matter money-out must identify category, amount, date and payer/source where known.
10. Client money and office money must remain distinguishable in the data model.
11. A stage handoff must identify from/to ownership and time.
12. Branch-scoped users must not accidentally see another branch's restricted work.
13. Offline mutations must never be silently lost.
14. Deleted records with legal/financial significance should usually be archived/voided, not hard deleted.
15. The audit/activity feed is append-oriented.

---

## 7. UI implementation rules

- Mobile-first layout.
- Sidebar becomes bottom navigation or drawer on narrow screens.
- Tables must have responsive alternatives.
- Never force horizontal scrolling for core task completion.
- Use sheets/drawers for quick edits on mobile.
- Use command palette/global search.
- Use skeletons for loading.
- Use toasts only for transient confirmation, not critical information.
- Destructive actions require confirmation.
- Avoid modal-on-modal flows.
- Keep a persistent matter context indicator when working inside a matter.
- Important dates show absolute date and relative hint where useful.
- Currency defaults to KES but amount model must support currency codes.

---

## 8. Offline rules

Do not attempt to make every screen fully offline in MVP.

Offline-capable:
- app shell,
- recently viewed matters,
- user's task list,
- upcoming calendar items,
- recently viewed document metadata,
- cached PDF/image previews when intentionally opened,
- draft notes,
- draft tasks,
- queued task status changes,
- queued expense drafts,
- queued client/matter notes.

Online-required:
- first-time authentication,
- Google sync,
- WhatsApp/email sending,
- large document uploads unless explicitly queued,
- bank/M-Pesa imports,
- full global search outside local cache,
- actions requiring server-side uniqueness if safe offline resolution is not possible.

Never claim a queued action has synced until server confirms.

---

## 9. Git/commit discipline for agents

Preferred commit scope:
- one vertical slice or migration per commit.

Commit format:
`feat(matters): add stage handoff workflow`
`fix(calendar): preserve official deadline on reschedule`
`test(finance): add petty cash approval integration coverage`
`docs(agent): clarify offline mutation conflict behavior`

Do not combine formatting noise with business logic.

---

## 10. Definition of Done

A work item is DONE only when:
- acceptance criteria pass,
- no visible dead control exists,
- tests pass,
- build passes,
- mobile view checked,
- no console error in normal path,
- schema/docs updated,
- project state updated.

If any condition fails, label the item PARTIAL.

## Full Product Agent Mandate - 2026-09-06

- The final product boundary is the full enterprise OS, not an MVP.
- Read `FULL_PRODUCT_INDEX.md` plus docs 19-36 before major architecture work.
- Do not add more browser-only business truth to `AppContext`/`localStorage`.
- Do not create a green integration status using timers, mocks or hard-coded text outside explicit Demo mode.
- Do not store provider secrets, scanned signatures, real bank details or client data in frontend state or source control.
- Do not mutate a signed/approved/filed document version in place.
- Applying a firm mark/signature/stamp creates a new immutable version and an audit record.
- A visual signature image is not a cryptographic digital signature. Name it accurately.
- Never fabricate a court/registry seal, stamp, barcode or receipt.
- Use the settings/configuration service for configurable firm policy; do not grow monolithic settings JSON without definitions/scopes.
- Every high-impact configuration change needs history and, where policy requires, approval/effective dating.
- Workflow definitions are versioned. Existing matters remain pinned unless explicitly migrated.
- All finance/client-money balances come from authoritative server ledger records.
- All protected reads as well as writes are authorization checked server-side.
- Build every vertical slice with loading, empty, error, denied and audit behavior.
