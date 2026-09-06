# Kariuki Kagunda & Co. Advocates OS
## Master Developer Guide — VPS / Self-Hosted Edition


---

# Kariuki Kagunda & Co. Advocates OS
## Full-Scale Modern MVP Developer Documentation
### VPS / Self-Hosted Backend Edition

This repository specification defines the first production-capable MVP of the internal operating system for Kariuki Kagunda & Co. Advocates, a Kenyan law firm with two branches and a personal-injury-heavy practice.

The product is not a generic CRM with a legal skin. It is an integrated law-firm operating system in which every operational object can be related back to a **Matter**: tasks, deadlines, calendar events, court activity, documents, communications, expenses, money movements, assignments, medical records, filings, service, settlements and audit history.

The infrastructure is deliberately **self-hosted on a VPS**. The application owns its backend, database, jobs, realtime layer and document storage abstraction. External services are only used where the function is inherently external, such as Google Calendar, email delivery, WhatsApp and off-site backups.

## Product priorities

1. Internal matter and case operations
2. Stage-based workflow and handoffs
3. Tasks, deadlines and calendar
4. Document management and versioning
5. Internal communication and notifications
6. Matter expenses, client funds and basic finance
7. Staff, branch, role and user administration
8. Dashboards, reporting and search
9. Google, email and WhatsApp integration
10. Offline-capable PWA behavior
11. Later client portal and advanced compliance/security hardening

## Core architectural rule

> Enter data once. Link it to the matter. Reuse it everywhere.

A court date created in a matter must automatically become visible in:
- the matter timeline,
- the assigned advocate's calendar,
- relevant dashboard widgets,
- notifications,
- preparation tasks,
- document context,
- management reports.

A document linked to that court date must be accessible from:
- the matter,
- the calendar event,
- the related task,
- the document browser,
- global search.

The system must never devolve into isolated modules that merely share a navigation sidebar.

---

# Approved VPS technology stack

This is the default implementation stack. Coding agents must not swap core technologies without recording and approving an Architecture Decision Record (ADR).

## Frontend

- **React 19**
- **Vite 8**
- **TypeScript strict mode**
- **TanStack Router**
- **TanStack Query**
- **Tailwind CSS**
- **shadcn/ui / Radix primitives**
- **React Hook Form + Zod**
- **Dexie / IndexedDB**
- **vite-plugin-pwa / Workbox**
- **FullCalendar**
- **PDF.js**
- **Socket.IO client**

Why: the application is an internal operational web app, not an SEO-first website. A Vite SPA is simpler to self-host, easier to make genuinely offline-capable, avoids an unnecessary frontend Node server, and keeps the deployment architecture clean.

## Backend API

- **Node.js 24 LTS**
- **NestJS**
- **Fastify adapter**
- **TypeScript strict mode**
- **REST-first API with OpenAPI**
- **Socket.IO/WebSocket gateway for realtime**
- **Zod or generated DTO validation at API boundaries**
- **Prisma ORM 7.x**
- raw SQL for advanced PostgreSQL features when justified

Why: a single TypeScript language across frontend, API and workers improves developer velocity and agentic-code consistency. NestJS provides strong modular boundaries, dependency injection, testing support and a mature application structure. Fastify is the HTTP adapter.

## Database

- **PostgreSQL 18**
- always pin the current PostgreSQL 18 minor release in production
- `pg_trgm` and PostgreSQL full-text search for MVP search
- database migrations committed to source control
- no database exposed publicly

PostgreSQL is the system of record.

## Cache, queues and ephemeral coordination

- **Redis 8.2 Extended Support line**
- **BullMQ**
- use Redis for:
  - job queues,
  - rate limiting,
  - session storage,
  - ephemeral realtime coordination,
  - short-lived caches.

Redis is never the only copy of legal/financial business data.

## Authentication

Self-hosted backend authentication:
- user records in PostgreSQL,
- Argon2id password hashing,
- opaque server-side sessions,
- session data in Redis,
- secure HttpOnly cookies,
- role/permission resolution from PostgreSQL.

Do not introduce a hosted auth dependency for the MVP.

## Documents / object storage

MVP production:
- private document volume mounted on the VPS,
- documents stored outside the web root,
- all access goes through the API,
- storage service uses an adapter interface.

Required storage interface:
- LocalPrivateStorageDriver
- S3StorageDriver

Start with local private storage for operational simplicity. The S3 driver makes later migration to distributed/S3-compatible object storage possible without rewriting document business logic.

**Never store uploaded documents in the application container filesystem.**

## Reverse proxy and TLS

- **Caddy 2**
- serves the built React app
- proxies `/api/*` to NestJS
- proxies WebSocket connections
- automatically obtains and renews TLS certificates
- applies compression and basic security headers

## Containers / deployment

- **Docker Engine**
- **Docker Compose**
- one production Compose stack on the VPS

Core containers:
1. caddy
2. api
3. worker
4. postgres
5. redis

The frontend is compiled into static assets and served by Caddy.

No Kubernetes for the MVP.

## Backups

Production baseline:
- PostgreSQL backups kept independently from the primary VPS
- document-volume backups kept independently from the primary VPS
- encrypted off-site repository
- documented restore procedure
- scheduled restore tests

Recommended:
- `pgBackRest` for PostgreSQL backup/WAL strategy when configured
- `restic` for private document-volume backup to a remote S3/B2-compatible target
- a second backup destination when the firm reaches production-critical dependence

A backup that has never been restored is not considered verified.

## Observability

MVP:
- structured JSON logs
- health endpoints
- Docker healthchecks
- Caddy access/error logs
- background-job failure dashboard
- application error tracking
- optional self-hosted Uptime Kuma

Later:
- Prometheus/Grafana/Loki if operational scale justifies it

---

# Production topology

```text
                         Internet
                            │
                       80 / 443
                            │
                     ┌──────▼──────┐
                     │    Caddy    │
                     │ TLS / Proxy │
                     └──┬───────┬──┘
                        │       │
             static SPA│       │/api + websocket
                        │       ▼
                        │  ┌─────────────┐
                        │  │ NestJS API  │
                        │  │  Fastify    │
                        │  └──────┬──────┘
                        │         │
                        │    ┌────┴─────────────┐
                        │    │                  │
                        │    ▼                  ▼
                        │ PostgreSQL          Redis
                        │    ▲                  ▲
                        │    │                  │
                        │    └──────┬───────────┘
                        │           │
                        │     ┌─────▼─────┐
                        │     │  Worker   │
                        │     │  BullMQ   │
                        │     └───────────┘
                        │
                        └── private file requests through API
                                    │
                              VPS document volume
                                    │
                              encrypted off-site backup
```

## Scaling path

The stack is intentionally designed so that scaling does not require a rewrite.

### Stage A: one VPS
Caddy + API + worker + PostgreSQL + Redis + document volume.

### Stage B: larger single host
More CPU/RAM, separate NVMe volumes, multiple API containers behind Caddy, more worker concurrency.

### Stage C: split services
Move PostgreSQL, Redis and documents to dedicated machines/services while keeping the same application API.

### Stage D: high availability
Multiple API nodes, Redis shared coordination, PostgreSQL replica/failover, S3-compatible document storage, external load balancer.

The MVP should not pay Stage D complexity costs on day one.

---

## Documentation map

Start here:
1. `agentic/AGENTS.md`
2. `agentic/BUILD_PROMPT.md`
3. `docs/00_PRODUCT_CHARTER.md`
4. `docs/01_SYSTEM_ARCHITECTURE.md`
5. `docs/18_VPS_STACK.md`
6. `docs/02_DOMAIN_MODEL.md`
7. `docs/03_DATA_MODEL.md`
8. `docs/04_WORKFLOWS.md`
9. `docs/05_UI_UX_SYSTEM.md`
10. `docs/06_CALENDAR_TASKS_COMMS.md`
11. `docs/07_DOCUMENTS.md`
12. `docs/08_FINANCE.md`
13. `docs/09_OFFLINE_PWA.md`
14. `docs/10_INTEGRATIONS.md`
15. `docs/11_API_EVENTS.md`
16. `docs/12_TESTING_QA.md`
17. `docs/13_DELIVERY_PLAN.md`
18. `docs/14_SEED_SCENARIOS.md`
19. `docs/15_SECURITY_SCOPE.md`
20. `docs/16_DEPLOYMENT_OPERATIONS.md`
21. `docs/17_ACCEPTANCE_MATRIX.md`
22. `database/schema.sql`
23. `infra/docker-compose.production.yml`
24. `infra/Caddyfile`
25. `infra/DEPLOYMENT_CHECKLIST.md`

## Non-negotiable MVP standards

- No dead buttons.
- No fake integrations presented as working.
- No hard-coded demo data in production screens.
- No duplicate source of truth for a business object.
- No page should require desktop width to function.
- Every mutation must provide loading, success and error states.
- Every important business object needs timestamps and creator/updater metadata.
- Every user-visible list needs empty, loading, error and permission-denied states.
- Every major object must be globally searchable by at least its reference/name.
- Every matter-relevant object must be linkable back to a matter.
- All visible features must work end-to-end or be hidden behind a feature flag.
- Offline behavior must be explicit. Never silently discard offline writes.
- PostgreSQL is authoritative for business data.
- Redis is never the sole durable store for legal or financial information.
- Documents are never stored inside disposable application containers.
- Production deploys use pinned versions and controlled migrations.
- Every production backup strategy includes a documented restore path.


---

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


---

# Master Prompt for an Agentic Coding AI

You are the implementation agent for **Kariuki Kagunda & Co. Advocates OS**, a two-branch Kenyan law-firm operating system.

Your job is to build the application, not merely produce mockups.

Read `agentic/AGENTS.md` first. Then read the relevant documentation before each task.

## Approved technical architecture

Build against the following stack unless an ADR is explicitly approved:

- Frontend: React 19, Vite 8, TypeScript, TanStack Router/Query, Tailwind, shadcn/ui, Dexie, PWA service worker
- API: Node.js 24 LTS, NestJS, Fastify, REST/OpenAPI, Socket.IO
- Persistence: PostgreSQL 18, Prisma ORM 7.x
- Queues/cache/sessions: Redis 8.2 Extended Support, BullMQ
- Files: private VPS persistent volume through a storage adapter; S3 adapter prepared for future migration
- Reverse proxy/TLS/static hosting: Caddy
- Runtime packaging: Docker + Docker Compose
- Production target: Ubuntu 24.04 LTS-class VPS or an equivalently supported Linux distribution

Do not build on Supabase/Firebase/hosted BaaS.

## Product architecture

The central domain object is the **Matter**.

All of the following may link to a matter:
- client
- parties
- assignments
- workflow stage
- tasks
- deadlines
- court dates
- appointments
- documents
- document versions
- comments/messages
- expenses
- payments
- client-money transactions
- filing records
- service records
- medical records
- evidence
- settlements
- judgments
- audit/activity events

The UI must make these relationships navigable.

## Primary MVP objective

Create a reliable internal system staff can use every day for:
- opening and managing matters,
- tracking personal-injury workflows,
- assigning work by stage,
- scheduling court dates and appointments,
- managing tasks and deadlines,
- sharing internal matter communications,
- uploading and versioning documents,
- recording matter expenses and basic finance,
- receiving notifications,
- managing two branches and staff,
- monitoring workloads and stalled cases,
- working acceptably on phones and intermittent connectivity.

## Implementation priorities

Build in this sequence unless dependencies require adjustment:

1. Foundation, auth, organization, branches, users
2. Clients and intake
3. Matters and internal reference
4. Matter workspace and activity timeline
5. Workflow stages and assignments
6. Tasks and deadlines
7. Calendar and court events
8. Documents and versions
9. Internal communications
10. Expenses/petty cash/basic ledgers
11. Notifications
12. Search
13. Dashboards
14. Offline/PWA behavior
15. Google Calendar/Gmail integration
16. WhatsApp notifications
17. Import/export and migration tools
18. Polish, accessibility, performance

## Prohibited shortcuts

Do not:
- use static JSON as the permanent backend,
- store critical business data only in client state,
- create duplicate tables for the same concept,
- create fake upload buttons,
- hard-code case status in JSX,
- hide incomplete behavior behind optimistic UI without persistence,
- call a feature "integrated" unless the integration works,
- use uncontrolled global `any`,
- silently swallow errors,
- make the mobile experience an afterthought.

When a requirement is ambiguous, prefer a configurable implementation and record the decision in `PROJECT_STATE.md`.


---

# Project State

Status: Documentation baseline complete. Implementation not yet started.

## Confirmed business facts

- Firm: Kariuki Kagunda & Co. Advocates
- Two branches
- Personal injury is the main current practice focus
- Future practice areas must be supported
- Known role families: senior partners, administrator, technical role, paralegals; additional advocate, clerk, finance and reception-style roles should be supported
- Ordinary Gmail accounts are currently used
- Finance records currently come from a mixture of Excel, physical/manual records, M-Pesa statements and bank statements
- Client portal is desired later
- Internal operations are the first priority
- Existing physical file numbering convention is still to be confirmed

## MVP build state

- [ ] Application scaffold
- [ ] Authentication
- [ ] Organization / branches
- [ ] User profiles / roles
- [ ] Client intake
- [ ] Matters
- [ ] Matter workflows
- [ ] Assignments and handoffs
- [ ] Tasks and deadlines
- [ ] Calendar
- [ ] Documents
- [ ] Internal communication
- [ ] Finance
- [ ] Notifications
- [ ] Search
- [ ] Dashboards
- [ ] Offline/PWA
- [ ] Google integration
- [ ] WhatsApp integration
- [ ] Imports
- [ ] Deployment


## Infrastructure decision update — 2026-09-05

Accepted ADR-001:
- self-host on VPS
- React + Vite frontend
- NestJS/Fastify custom backend
- PostgreSQL 18
- Prisma 7.x
- Redis 8.2 Extended Support
- BullMQ worker
- Caddy
- Docker Compose
- private VPS document volume through storage adapter
- encrypted off-site backups
- no Supabase/BaaS


---

# 00. Product Charter

## Product name

Working name: **Kariuki Kagunda Lawfirm OS**

The name can be rebranded later without changing architecture.

## Product thesis

A law firm does not primarily manage "records". It manages:
- responsibility,
- deadlines,
- evidence,
- documents,
- money,
- communication,
- court events,
- transitions between people and stages.

Therefore the system must model **work in motion**.

The product should answer, within seconds:

- What matters need attention today?
- Who is responsible?
- What is blocking them?
- What happens next?
- When is the next court event?
- Which document is current?
- What has been spent on this matter?
- What money has been received?
- What did the client last hear from us?
- Who handled this stage?
- Which cases have gone quiet?
- Which deadlines are dangerous?
- What happened yesterday across both branches?

## MVP definition

"Full-scale MVP" means:
- broad enough to run real firm operations,
- intentionally shallow in a few advanced areas,
- stable core data model,
- cohesive UI,
- operational end-to-end flows,
- extension points for later depth.

It does not mean:
- every accounting standard is automated,
- every court system is directly integrated,
- every compliance/security control is fully hardened,
- every practice area has a bespoke workflow on day one.

## Success criteria

The MVP succeeds when staff can stop relying on a patchwork of:
- notebooks,
- WhatsApp reminders,
- verbal handoffs,
- scattered spreadsheets,
- individual calendars,
- unversioned local documents,
for the core daily operations represented in this specification.

## Design principles

### Matter-centric
The matter is the operational center.

### Stage-aware
Ownership can change as a matter progresses.

### Event-driven
Important actions create timeline/activity events and can trigger notifications or tasks.

### Configurable
Practice workflows should be data-driven.

### Searchable
Users should be able to find records by human identifiers.

### Responsive
Every core task must work on mobile.

### Offline-tolerant
Intermittent internet must not make the application unusable.

### Explicit states
Users should always understand whether data is:
- saved,
- queued,
- syncing,
- synced,
- failed.

### Fast-path first
Common actions should take very few interactions.

## Main workspaces

1. Home
2. Matters
3. Clients
4. Tasks
5. Calendar
6. Documents
7. Communications
8. Finance
9. Reports
10. Administration
11. Search / command palette

## Later workspaces

- Client portal
- HR depth
- Payroll
- Full accounting
- Advanced compliance
- Court portal automation
- AI drafting/knowledge tools


---

# 01. System Architecture
## Self-Hosted VPS Architecture

## 1. Architectural style

Use a **modular monolith** for the MVP, split into deployable process roles:

- `web`: compiled static React application
- `api`: NestJS HTTP/WebSocket application
- `worker`: NestJS/BullMQ background process
- `postgres`: primary durable system of record
- `redis`: queues, sessions, ephemeral coordination
- `caddy`: TLS, reverse proxy and static web hosting

This delivers strong internal modularity without microservice operational overhead.

Do not begin with microservices or Kubernetes.

## 2. Why this stack

The system is an internal operational application. It needs:
- predictable deployment,
- strong relational transactions,
- file handling,
- queues,
- realtime UI,
- offline client behavior,
- long-term maintainability,
- an easy path from one VPS to multiple machines.

The chosen stack uses boring, mature primitives and keeps the number of infrastructure services small.

### Frontend
React + Vite is preferred over server-rendered frameworks for this product because:
- SEO is irrelevant for internal operations,
- static deployment is extremely simple,
- PWA/service-worker behavior is straightforward,
- the frontend and backend remain independently scalable,
- no frontend Node runtime is required in production.

### Backend
NestJS provides explicit modules, dependency injection, guards, interceptors, queues and testability. Use the Fastify adapter.

### Database
PostgreSQL is authoritative for business data.

### Redis
Redis handles ephemeral and async workload only.

### Files
Private filesystem storage behind an adapter gives the first VPS deployment maximum simplicity. The adapter contract makes S3 migration non-disruptive.

## 3. Approved versions at documentation update

Pin versions at project bootstrap and update deliberately.

- Node.js: 24 LTS line
- PostgreSQL: 18 current minor
- Redis: 8.2 Extended Support line
- Vite: 8 stable line
- React: 19 stable line
- Prisma: 7.x supported stable line

The codebase should use automated dependency checks, but production upgrades are deliberate changes, not floating tags.

## 4. Logical application layers

### Frontend presentation layer

Packages/features:
- routing
- query cache
- offline storage
- form validation
- realtime subscriptions
- UI system

The browser talks only to the application API and WebSocket endpoint.

### API application layer

NestJS modules:
- AuthModule
- OrganizationModule
- BranchModule
- UserModule
- ClientModule
- IntakeModule
- MatterModule
- WorkflowModule
- TaskModule
- CalendarModule
- DocumentModule
- CommunicationModule
- FinanceModule
- NotificationModule
- SearchModule
- IntegrationModule
- AuditModule
- HealthModule

### Worker layer

Background processors:
- reminder jobs
- daily digests
- outbound email
- outbound WhatsApp
- Google Calendar sync
- stalled matter scans
- overdue task scans
- document maintenance jobs
- import processing
- future OCR/indexing

Worker imports shared domain/application services but does not run public HTTP endpoints.

### Persistence layer

Prisma repositories around PostgreSQL.

For advanced PostgreSQL:
- full-text search,
- trigram search,
- recursive queries,
- reporting queries,
use raw/typed SQL where it produces a clearly superior result.

Avoid ORM gymnastics when SQL is the right tool.

## 5. Suggested monorepo structure

```text
apps/
  web/
    src/
      app/
      components/
      features/
      routes/
      offline/
      realtime/
  api/
    src/
      modules/
      common/
      main.ts
  worker/
    src/
      processors/
      main.ts

packages/
  contracts/
  domain/
  ui/
  config/
  validation/
  eslint-config/
  tsconfig/

prisma/
  schema.prisma
  migrations/
  seed.ts

infra/
  docker-compose.production.yml
  Caddyfile
  scripts/
  backups/
  restore/

docs/
```

Use pnpm workspaces.

## 6. API architecture

REST-first.

Base:
`/api/v1`

Example:
- `GET /api/v1/matters`
- `POST /api/v1/matters`
- `GET /api/v1/matters/:id`
- `POST /api/v1/matters/:id/stage-transitions`
- `GET /api/v1/tasks`
- `POST /api/v1/calendar-events`
- `POST /api/v1/documents/:id/versions`

Generate OpenAPI documentation from the backend.

Do not make the frontend import backend implementation code.

Shared package may contain:
- Zod schemas
- enums
- DTO/result types

## 7. Realtime

Use Socket.IO gateway.

Realtime events:
- task.updated
- matter.stage_changed
- message.created
- notification.created
- calendar.event_updated
- document.review_updated

Single VPS:
- one API process may handle Socket.IO.

Scale-out:
- multiple API replicas use Redis adapter.

Do not use realtime as the persistence mechanism.

## 8. Domain events

Persist significant domain events in PostgreSQL.

Examples:
- matter.created
- matter.stage_changed
- matter.assigned
- task.completed
- calendar.court_event_created
- document.version_uploaded
- expense.approved
- payment.received

Domain events support:
- activity timeline,
- notifications,
- background work,
- audit trace.

## 9. Database

PostgreSQL 18.

Recommended extensions:
- `pgcrypto`
- `pg_trgm`
- optionally `citext`

Search MVP:
- B-tree indexes for identifiers
- trigram indexes for names/reference fuzzy search
- Postgres full-text for summaries/messages/document metadata

Do not add Elasticsearch/Meilisearch until PostgreSQL search is demonstrably insufficient.

## 10. Redis

Use Redis for:
- BullMQ queues
- server sessions
- rate limiting
- temporary locks
- websocket scaling adapter later
- short-lived cached aggregate results

Persistence mode:
- AOF is recommended for operational resilience even though Redis is not the business source of truth.

A Redis outage should degrade:
- sessions,
- jobs,
- realtime,
not corrupt matter/finance records.

## 11. Authentication

Backend-owned sessions.

Flow:
1. user signs in via API
2. password verified with Argon2id
3. opaque random session created
4. session stored in Redis
5. secure HttpOnly SameSite cookie returned
6. authorization data resolved from PostgreSQL and cache

Offline:
- cached UI can remain viewable according to local cache policy
- server mutations wait for reconnect/authentication

Later:
- MFA
- SSO
- passkeys

## 12. File storage

Create interface:

```ts
interface PrivateStorageDriver {
  put(input: PutObjectInput): Promise<StoredObject>;
  open(key: string): Promise<Readable>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getMetadata(key: string): Promise<ObjectMetadata>;
}
```

Implementations:
- LocalPrivateStorageDriver
- S3StorageDriver

MVP production driver:
`LocalPrivateStorageDriver`

Physical root:
`/srv/kklaw/data/documents`

API authorizes user then streams file.

Never expose `/srv/kklaw/data/documents` from Caddy.

## 13. Caddy topology

Routes:

```text
https://lawos.example.com/*
  -> static React SPA

https://lawos.example.com/api/*
  -> api:3000

https://lawos.example.com/socket.io/*
  -> api:3000
```

Caddy handles:
- TLS
- HTTP->HTTPS redirect
- compression
- reverse proxy
- access logs
- SPA fallback

## 14. Offline architecture

Browser:
- Workbox/service worker for app shell
- TanStack Query persisted cache
- Dexie for domain cache and mutation queue

API:
- mutations accept idempotency keys
- mutable records expose revision
- server detects stale writes

## 15. Two-branch model

Data model remains organization-scoped.

Users:
- home branch
- additional memberships

Matters:
- originating branch
- responsible branch

Reports:
- branch filter
- firm-wide view for leadership

## 16. Infrastructure layout on one VPS

Suggested host paths:

```text
/srv/kklaw/
  compose/
  env/
  data/
    postgres/
    redis/
    documents/
  backups/
  logs/
```

Containers should not depend on anonymous Docker volumes for critical persistent data.

## 17. Scaling path

### One VPS
Suitable for MVP and normal early firm use.

### Vertical scale
Increase VPS CPU/RAM/NVMe.

### Multiple app replicas
Run multiple stateless API containers; Caddy load balances. Use shared Redis.

### Split database
Move PostgreSQL to dedicated host or managed PostgreSQL.

### Split object storage
Switch storage driver to S3-compatible service.

### High availability
Add PostgreSQL replication/failover, multiple API hosts and redundant storage.

This path requires infrastructure movement, not an application rewrite.

## 18. Reliability rules

- use healthchecks
- use restart policies
- pin Docker image versions
- never use `latest` in production Compose
- database migrations are a controlled deployment step
- keep off-site backups
- test restore
- keep at least one previous deploy image/tag for rollback
- jobs must be idempotent where retries are possible
- external notification sends must have idempotency keys


---

# 18. VPS Stack Decision
## Architecture Decision Record: ADR-001

Status: **Accepted**

Date: 2026-09-05

## Decision

Deploy Kariuki Kagunda & Co. Advocates OS as a self-hosted modular monolith on a VPS.

### Chosen stack

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite 8 + TypeScript |
| UI | Tailwind + shadcn/ui/Radix |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Forms | React Hook Form + Zod |
| Offline | Dexie + IndexedDB + Workbox/vite-plugin-pwa |
| API | NestJS + Fastify |
| Runtime | Node.js 24 LTS |
| ORM | Prisma ORM 7.x |
| Database | PostgreSQL 18 |
| Search | PostgreSQL FTS + pg_trgm |
| Queue | BullMQ |
| Cache/session | Redis 8.2 Extended Support |
| Realtime | Socket.IO |
| Documents | Private VPS volume via StorageDriver |
| Reverse proxy | Caddy 2 |
| Containers | Docker + Docker Compose |
| DB backup | pgBackRest direction / pg_dump during pilot |
| File backup | restic encrypted off-site |
| Package manager | pnpm workspaces |

## Why not Supabase/Firebase

The product is intended to run on the firm's VPS with an owned backend and database layer. BaaS platforms add an architectural dependency we do not need.

## Why not Next.js

Next.js is excellent, but this product:
- is an authenticated internal app,
- does not need SEO,
- benefits strongly from SPA-style offline caching,
- already has a dedicated backend.

A Vite React SPA means:
- simpler VPS deployment,
- static frontend,
- smaller failure surface,
- no frontend server process,
- clearer frontend/backend boundaries.

The client portal can still be built with the same React stack or a separate public frontend later.

## Why NestJS

Benefits:
- explicit module boundaries,
- mature dependency injection,
- guards/interceptors,
- OpenAPI support,
- WebSocket gateways,
- BullMQ integration,
- strong testing conventions,
- good fit for a large domain implemented by multiple developers/agents.

Use Fastify rather than Express for the HTTP adapter.

## Why PostgreSQL

The domain is highly relational:
- clients,
- matters,
- parties,
- assignments,
- workflow state,
- court events,
- document versions,
- finance.

PostgreSQL gives:
- ACID transactions,
- mature indexes,
- full-text search,
- JSONB where appropriate,
- excellent backup tooling,
- long-term ecosystem stability.

## Why Redis

We need:
- queues,
- sessions,
- temporary locks,
- fast transient state.

Redis is not used as the legal data source.

The selected 8.2 line is an Extended Support release.

## Why Prisma 7 instead of immediately adopting a brand-new ORM architecture

Prisma 7 remains supported and uses a widely understood production model. The project favors a stable, familiar migration/query workflow over adopting a very new major ORM architecture solely because it is newer.

A future upgrade can be planned as its own change.

## Why Caddy

Caddy reduces VPS operational friction:
- automatic HTTPS,
- certificate renewal,
- reverse proxy,
- WebSocket proxying,
- static frontend hosting.

## Why Docker Compose

For one VPS, Compose is enough:
- reproducible,
- portable,
- easy rollback,
- easy local parity,
- significantly less operational complexity than Kubernetes.

If the system later grows beyond one host, the containers and service boundaries remain useful.

## Why local private file storage initially

For a two-branch firm MVP:
- simplest operational model,
- fastest upload/download path,
- no extra object-storage daemon,
- private files remain behind API authorization.

We still implement a storage adapter from day one.

When needed:
`LocalPrivateStorageDriver -> S3StorageDriver`

without changing document-domain logic.

## Explicitly rejected for MVP

- Kubernetes
- Kafka
- RabbitMQ
- Elasticsearch/OpenSearch
- microservices
- self-hosted MinIO on a single small VPS as a mandatory dependency
- direct browser-to-database architecture
- hosted BaaS
- serverless-only deployment
- full collaborative document editing
- full accounting ERP engine

These can be reconsidered only when real requirements justify them.

## Failure-domain awareness

A single VPS is still a single failure domain.

Therefore "reliable VPS deployment" requires:
- off-site backups,
- tested restore,
- monitoring,
- controlled deploys,
- upgrade discipline.

No software stack can make a single machine physically highly available.

The architecture, however, makes later service separation straightforward.


---

# 02. Domain Model

## 1. Organization

Represents the law firm.

Fields:
- id
- name
- legal_name
- default_currency
- timezone
- settings

MVP assumes one organization, but schema should remain organization-scoped.

## 2. Branch

Fields:
- id
- organization_id
- name
- code
- address
- phone
- email
- is_active

## 3. User Profile

Auth identity and firm identity are separate concerns.

Fields:
- id
- auth_user_id
- organization_id
- home_branch_id
- full_name
- job_title
- phone
- email
- is_active
- avatar_path

Relationships:
- roles
- branch memberships
- matter assignments
- task assignments

## 4. Client

A client may be:
- person,
- company/organization.

Core fields:
- id
- organization_id
- client_type
- display_name
- first_name
- last_name
- legal_name
- id_number
- phone
- alternate_phone
- email
- postal_address
- physical_address
- preferred_contact_method
- status
- notes

PI extensions may capture:
- next of kin,
- occupation,
- employer,
- date of birth,
- injury context.

Keep highly specific data in related records where practical.

## 5. Intake / Lead

Represents a prospective matter before formal opening.

Fields:
- source
- referrer
- contact details
- incident date
- brief description
- practice area
- assigned intake owner
- disposition
- converted_matter_id

Statuses:
- new
- contacting
- awaiting_information
- under_review
- accepted
- declined
- duplicate
- converted

## 6. Matter

The main operational object.

Fields:
- id
- organization_id
- internal_reference
- title
- client_id
- practice_area_id
- matter_type_id
- workflow_template_id
- originating_branch_id
- responsible_branch_id
- supervising_user_id
- current_stage_id
- opened_at
- status
- priority
- summary
- next_action
- closed_at
- closure_reason

Statuses:
- draft
- active
- on_hold
- closed
- archived

Do not confuse matter status with workflow stage.

## 7. Matter Party

Represents:
- plaintiff/claimant
- defendant
- insurer
- advocate
- witness
- doctor
- police station/contact
- employer
- third party

Fields:
- matter_id
- party_type
- name
- organization_name
- contact fields
- role_description
- notes

## 8. Court Proceeding

A matter can have multiple proceedings.

Fields:
- id
- matter_id
- court_name
- station
- division
- case_number
- proceeding_type
- filed_at
- status
- judge_or_magistrate
- opposing_counsel
- notes

## 9. Workflow Template

Defines reusable stages for a matter type.

A workflow template contains ordered Stage Templates.

## 10. Matter Stage Instance

Represents the current/previous stages of an actual matter.

Fields:
- matter_id
- stage_template_id
- status
- started_at
- completed_at
- owner_user_id
- owner_team_id
- completion_notes

Keep history.

## 11. Matter Assignment

Represents responsibility.

Fields:
- matter_id
- user_id
- role_on_matter
- stage_id
- assigned_at
- unassigned_at
- assigned_by
- is_primary

## 12. Stage Handoff

Fields:
- matter_id
- from_stage_id
- to_stage_id
- from_user_id
- to_user_id
- handoff_notes
- created_at
- created_by
- acknowledged_at

## 13. Task

Fields:
- title
- description
- matter_id nullable
- internal_project_id nullable
- stage_id nullable
- calendar_event_id nullable
- document_id nullable
- assigned_to
- created_by
- reviewer_id
- priority
- status
- start_at
- due_at
- official_deadline_at nullable
- completed_at
- blocked_reason
- is_recurring

Task statuses:
- todo
- in_progress
- blocked
- waiting_external
- waiting_review
- completed
- cancelled

## 14. Deadline

Use when the legal/business deadline itself must exist independently of work tasks.

Fields:
- matter_id
- title
- deadline_type
- official_due_at
- source
- risk_level
- notes
- completed_at

A deadline can generate one or more preparation tasks.

## 15. Calendar Event

Types:
- court
- client_meeting
- internal_meeting
- medical
- filing
- deadline
- other

Fields:
- matter_id
- title
- event_type
- start_at
- end_at
- all_day
- location
- virtual_meeting_url
- assigned_user_id
- organizer_id
- court_proceeding_id
- notes
- external_google_event_id
- sync_state

## 16. Document

Represents the logical document.

Examples:
- Plaint
- Medical Report
- Police Abstract
- Demand Letter
- Judgment
- Receipt

Fields:
- matter_id
- title
- document_type_id
- category_id
- status
- confidentiality_level
- current_version_id
- owner_user_id

## 17. Document Version

Append-only normal flow.

Fields:
- document_id
- version_number
- storage_path
- original_filename
- mime_type
- file_size
- checksum
- uploaded_by
- created_at
- status
- notes

Statuses:
- draft
- review
- approved
- signed
- filed
- served
- superseded
- archived

## 18. Communication

Unified record for:
- internal message,
- email log,
- WhatsApp log,
- phone call note,
- client update,
- letter metadata.

Fields:
- matter_id
- communication_type
- direction
- subject
- body/summary
- from_actor
- to_actor
- occurred_at
- external_message_id
- attachment links

## 19. Channel / Thread

Internal Slack-like channels:
- firm-wide
- branch
- team
- matter

Messages support:
- replies
- mentions
- attachments
- task conversion
- matter references

## 20. Expense

Represents actual spend.

Fields:
- matter_id nullable
- branch_id
- category_id
- amount
- currency
- spent_at
- description
- paid_by_user_id
- payment_source
- receipt_document_id
- status

## 21. Expense Request

Approval flow:
- requested
- approved
- rejected
- disbursed
- reconciled
- cancelled

## 22. Financial Account

Account type:
- office
- client
- petty_cash
- bank
- mobile_money
- other

MVP does not implement a full general ledger but must preserve account type distinctions.

## 23. Financial Transaction / Ledger Entry

Fields:
- account_id
- matter_id nullable
- transaction_type
- amount
- currency
- direction
- occurred_at
- reference
- counterparty
- evidence_document_id
- notes

## 24. Invoice / Receipt

Basic billing and receipt records.

## 25. Personal Injury Extension

Use related tables:
- incident
- injury
- medical_provider
- medical_record
- insurer_claim
- police_record
- vehicle
- liability_assessment
- settlement

Do not overload the base matter table.

## 26. Filing Record

Tracks internal court filing operation.

Fields:
- matter_id
- court_proceeding_id
- filing_type
- submitted_at
- submitted_by
- fee_amount
- payment_reference
- receipt_document_id
- filing_reference
- status
- stamped_document_id
- notes

## 27. Service Record

Fields:
- matter_id
- document_id
- party_id
- service_method
- served_at
- served_by
- affidavit_document_id
- status
- notes

## 28. Settlement

Fields:
- matter_id
- offer_amount
- offer_date
- party
- status
- accepted_at
- settlement_amount
- settlement_terms
- related_documents

## 29. Audit / Activity Event

Immutable-style event:
- actor
- action
- entity_type
- entity_id
- matter_id
- timestamp
- metadata

It powers the matter timeline and management traceability.


---

# 03. Data Model Guidance

This document explains implementation decisions beyond `database/schema.sql`.

## 0. Persistence implementation

PostgreSQL 18 is the authoritative database.

Use **Prisma ORM 7.x** for:
- schema contract,
- standard CRUD queries,
- transactions,
- migration workflow,
- type generation.

Use checked-in SQL migrations/raw SQL when PostgreSQL-specific capabilities are more appropriate.

Do not use a hosted database abstraction.

`database/schema.sql` is the domain-reference schema. The implementation must convert it into the canonical Prisma schema and migration history.

## 1. PostgreSQL conventions

- UUID primary keys
- `timestamptz` everywhere for date/time
- `numeric(18,2)` for money
- currency code stored explicitly
- JSONB only for flexible metadata, never as a substitute for normal relational modeling
- soft archive state for operational/legal/financial records

## 2. Common columns

Most tables:
- id
- organization_id
- created_at
- updated_at
- created_by
- updated_by

Join/history tables may omit updated fields when append-only.

## 3. Search indexes

Index:
- matter internal_reference
- court case_number
- client display_name
- client phone
- client id_number
- document title
- task due_at/status
- calendar start_at
- matter current_stage/status
- expense matter/date/category

Use Postgres full-text indexes for:
- matter title/summary
- client names
- document metadata
- communication subject/summary

File-content indexing is a later enhancement.

## 4. Reference generation

Use a database function or server transaction for internal matter references.

Do not generate human references purely in the browser.

Until the firm's current numbering convention is confirmed:
- implement a configurable template,
- provide default format like `KKC/{PRACTICE}/{YYYY}/{SEQ}`,
- allow sequence scope by year and practice area.

Never change an activated matter reference automatically after creation.

## 5. Custom fields

Future practice areas require extension.

Recommended model:
- `custom_field_definitions`
- `custom_field_values`

Use only for genuinely variable metadata.

Do not put core fields such as `client_id` into custom fields.

## 6. Status strategy

Prefer database enums or check constraints for stable global states.

Prefer configuration tables for:
- practice-specific stages,
- document categories,
- expense categories,
- matter types.

## 7. Audit pattern

Create application audit events for business actions.

Database-level auditing can be added later for high-security needs.

Audit metadata example:

```json
{
  "from_stage": "drafting",
  "to_stage": "filing",
  "from_user": "...",
  "to_user": "...",
  "reason": "Pleadings approved"
}
```

## 8. Financial data

Never store money as float.

Use:
`numeric(18,2)` + currency code.

Separate:
- requested expense,
- actual expense,
- ledger transaction,
- document evidence.

## 9. Files

Database stores metadata and storage path, not file bytes.

Each new document version:
- upload file,
- compute/checksum if available,
- insert version,
- update document current_version_id.

Never overwrite prior storage object path for a legal version.

## 10. Offline identity

Client-generated UUIDs are allowed for offline-created draft objects where safe.

If a server-generated human reference is required, object remains:
`local_pending`
until sync assigns official reference.

## 11. Conflict resolution metadata

Synced mutable records should include:
- updated_at
- updated_by
- optional revision integer

Offline update uses optimistic concurrency:
- send base revision,
- server rejects if stale,
- client prompts user to refresh/merge.

Do not silently last-write-wins important legal data.


## 12. Connection management

Use the PostgreSQL connection pool provided by the application/Prisma stack.

Rules:
- no browser database access,
- no public PostgreSQL port,
- set sane connection limits,
- worker and API pool sizes configured separately,
- long reports should not starve interactive API traffic.

If workload later requires it, introduce PgBouncer as an infrastructure change. Do not add it before a measured need.

## 13. Database backup compatibility

Schema changes must preserve:
- standard PostgreSQL backup tooling,
- point-in-time recovery strategy when enabled,
- restore into a clean PostgreSQL 18 instance.

Every destructive migration requires:
- documented impact,
- backup confirmation,
- rollback or forward-repair plan.


---

# 04. Workflow Engine and Legal Operations

## 1. Workflow engine objective

The firm needs predictable operational movement without forcing every matter into a rigid one-size-fits-all path.

A workflow template defines:
- stages,
- order,
- stage owners or default role,
- required tasks,
- required document types,
- completion checklist,
- optional approval gate,
- transition rules,
- reminder rules.

## 2. Default Personal Injury / Road Traffic Accident Workflow

This is an operational starting template and must remain configurable by the firm's supervising advocates.

### Stage 1: Lead / Referral
Capture:
- prospective client
- incident summary
- incident date
- source/referrer
- contact details
- preliminary conflict information

Completion:
- intake sufficiently complete
- assigned for review

### Stage 2: Intake / Acceptance
Tasks:
- intake interview
- capture client identification
- confirm contact details
- open prospective file
- acceptance/decline decision

Outputs:
- active matter
- internal matter reference

### Stage 3: Initial Evidence Collection
Possible records:
- police abstract
- treatment notes
- P3 where relevant
- receipts
- photographs
- witness contacts
- vehicle details
- insurer details

Use missing-document checklist.

### Stage 4: Medical Documentation
- collect treatment records
- arrange medical report/examination
- record medical provider
- track report request/payment/receipt

### Stage 5: Liability / Claim Preparation
- liability review
- identify defendant(s)
- insurer details
- demand/notice drafting
- valuation inputs

### Stage 6: Pre-Litigation Demand / Negotiation
- issue correspondence
- track response deadlines
- capture offers
- client instructions
- settlement authority

### Stage 7: Authority to Litigate
- partner/advocate review
- confirm necessary documents
- litigation decision

### Stage 8: Pleadings Drafting
Documents can include:
- plaint
- verifying affidavit
- witness statements
- list of witnesses
- list/bundle of documents
- other required suit papers

Status flow:
draft -> review -> approved -> signed

### Stage 9: Filing
- upload final approved versions
- record court
- record filing transaction
- filing fee
- payment reference
- court receipt
- court case number
- stamped copies

### Stage 10: Summons and Service
- request/obtain summons
- assign service
- record served party/method/date
- upload affidavit of service

### Stage 11: Defence / Pleadings Close
- record appearance/defence
- upload served responses
- assign advocate review
- capture next procedural step

### Stage 12: Pre-Trial / Compliance
- issue/compliance checklist
- bundles
- witness readiness
- outstanding documents
- court directions

### Stage 13: Hearing Preparation
- preparation tasks
- witness confirmations
- document bundle
- advocate brief
- transport/logistics if needed

### Stage 14: Hearing
Court event is central.
After event:
- outcome note
- next date
- follow-up tasks
- costs/expenses

### Stage 15: Submissions
- draft
- review
- file
- serve
- record receipt

### Stage 16: Judgment / Ruling
- judgment date
- outcome
- award details
- document upload
- next action decision

### Stage 17: Decree / Costs / Recovery
- decree
- certificate
- taxation/costs where relevant
- demand for payment
- execution/recovery activity

### Stage 18: Receipt / Settlement
- incoming funds
- client account classification
- deductions/disbursements
- client settlement statement

### Stage 19: Closure
Checklist:
- client informed
- final documents complete
- financial reconciliation complete
- balance addressed
- closure note
- archive

## 3. Handoff behavior

When stage changes:
1. current owner is recorded,
2. completion notes stored,
3. required checklist validated,
4. next stage instance created,
5. new owner assigned,
6. stage handoff event created,
7. notifications sent,
8. template tasks created,
9. activity timeline updated.

## 4. Exception workflow

Users with appropriate permission may:
- skip optional stage,
- reopen previous stage,
- add ad hoc stage,
- put matter on hold.

Every override requires a reason.

## 5. Stage board

Provide Kanban-style view by current stage.

Columns show:
- stage
- matter count
- overdue tasks
- days in stage
- assigned owner

Cards show:
- internal ref
- client/matter title
- next action
- next deadline
- assignee
- inactivity indicator

## 6. Stalled matter logic

A matter is "stalled" when:
- no meaningful activity for configurable N days,
- OR stage exceeds target duration,
- OR required item has been pending too long.

Stalled is an alert, not necessarily a status.

## 7. Workflow templates for future practice areas

Admin can clone a workflow and edit:
- stage names
- order
- default roles
- task templates
- document checklist
- target duration
- approval gates

Do not require code changes for every new practice area.


---

# 05. UI / UX System

## 1. Product feel

The application should feel:
- calm,
- dense but not cluttered,
- professional,
- fast,
- modern,
- information-rich,
- designed for frequent daily use.

Avoid:
- oversized marketing-style cards,
- decorative gradients everywhere,
- dashboard gimmicks,
- tiny legal-software typography,
- excessive modal dialogs.

## 2. Responsive breakpoints

Design mobile-first.

Suggested:
- small: < 640
- medium: 640-1024
- large: > 1024

Do not rely on breakpoint values as business logic.

## 3. App shell

Desktop:
- persistent left navigation
- top command/search bar
- contextual right utility area only where useful

Mobile:
- bottom navigation for top-level destinations
- hamburger/drawer for secondary modules
- sticky context header

Suggested bottom tabs:
- Home
- Matters
- Tasks
- Calendar
- More

## 4. Home dashboard

Personalized.

Sections:
- Today
- Upcoming court
- My overdue tasks
- Waiting on me
- Recently opened matters
- Notifications
- Quick create

Management dashboard toggles:
- firm
- branch
- team
- personal

## 5. Quick create

Global `+` menu:
- New Matter
- New Client
- Task
- Court Date
- Meeting
- Upload Document
- Expense
- Note

When opened from inside a matter, prefill matter context.

## 6. Matter workspace

Desktop:
- matter header
- compact key facts
- tab navigation

Tabs:
- Overview
- Workflow
- Tasks
- Calendar
- Documents
- Communications
- Parties
- Court
- Medical/Evidence
- Finance
- Timeline

Mobile:
- Overview first
- tabs become horizontally scrollable or section selector
- quick action FAB/menu

Matter header displays:
- internal reference
- matter title/client
- current stage
- responsible branch
- lead/supervisor
- next court date
- next deadline
- status

## 7. Overview page

Use compact sections:
- next actions
- workflow stage
- assigned team
- key dates
- missing documents
- latest activity
- financial snapshot

## 8. Lists and tables

Desktop:
- dense sortable tables
- column selection where useful

Mobile:
- card/list representation
- do not shrink table into unreadable columns

Every list:
- search
- filters
- sort
- pagination/infinite load
- empty state

## 9. Calendar UX

Views:
- day
- week
- month
- agenda/list

Filters:
- me
- team
- branch
- event type
- matter
- court

Drag:
- ordinary appointments/tasks may reschedule
- legal deadlines show warning and preserve official deadline
- court dates require confirmation before changing

## 10. Task UX

Views:
- My Work
- Board
- List
- Calendar
- Team workload

Fast actions:
- complete
- reassign
- change due date
- mark blocked
- add comment

## 11. Document UX

Split-pane desktop:
- list/tree left
- preview right

Mobile:
- list -> detail -> preview

Version history must be easy to find.

## 12. Finance UX

Never overload with accounting jargon in daily expense flow.

Fast expense:
- amount
- category
- matter
- payer/source
- receipt photo
- submit

Advanced details behind "More".

## 13. Global search / command palette

Keyboard shortcut on desktop.

Search:
- matters
- clients
- court case numbers
- tasks
- documents
- contacts
- events

Recent search history local only.

## 14. Visual system

Use semantic tokens:
- background
- foreground
- muted
- border
- primary
- success
- warning
- danger
- info

Do not encode meaning by color alone.

## 15. Typography

Use a highly legible modern sans-serif.
Recommended UI size:
- body 14-16px
- dense tables 13-14px
- never below 12px for operational text

## 16. Accessibility baseline

- keyboard navigable
- visible focus
- semantic labels
- minimum touch targets
- color contrast
- screen reader labels for icons
- confirmation for destructive actions


---

# 06. Calendar, Tasks, Deadlines and Internal Communications

## 1. Unified planning model

Calendar, tasks and communications are linked but not identical.

- Calendar = when something happens.
- Deadline = when something must legally/business-wise be completed.
- Task = work required.
- Communication = message/update/call/email.

They may reference each other.

## 2. Calendar event creation

Required:
- title
- event type
- start
- end or duration
- assignee/organizer

Optional:
- matter
- court proceeding
- location
- remote meeting link
- notes
- linked documents
- reminder schedule

For court event:
- matter required
- court/proceeding strongly expected
- event outcome captured afterwards

## 3. Court event lifecycle

Statuses:
- scheduled
- attended
- adjourned
- completed
- cancelled

Post-event capture:
- attendance
- outcome
- orders/directions
- next date
- documents required
- new tasks
- expense quick-add
- note

## 4. Deadline distinction

A deadline object has:
- official due date,
- source,
- risk level.

A preparation task can have an earlier internal target.

If task date changes, official deadline remains unchanged.

## 5. Task creation

Required:
- title
- assignee
- status
- due date optional but encouraged

Matter-linked tasks should inherit:
- matter reference display
- branch context
- stage context where available

## 6. Task dependencies

MVP supports:
- blocked by task
- blocks task

Do not build a full project graph engine yet.

## 7. Recurring tasks

Support simple recurrence:
- daily
- weekly
- monthly
- custom RRULE if library supports it safely

Use for:
- cash reconciliation
- branch review
- file review
- weekly management meeting

## 8. Internal channels

Channel types:
- firm
- branch
- team
- matter

Matter channel automatically follows matter membership by default.

## 9. Message features

MVP:
- text
- mentions
- replies/thread
- attachments
- emoji reaction optional
- pin
- convert to task
- link matter/task/document/event

Not MVP:
- voice rooms
- video chat
- complicated presence
- Slack-equivalent app ecosystem

## 10. Convert message to task

Action:
"Create task"

Prefill:
- message text as description
- matter context
- link back to message
- assigner = current user

User selects:
- title
- assignee
- due date
- priority

## 11. Notification center

Categories:
- assignment
- deadline
- court event
- task mention
- document review
- expense approval
- system/integration

Each notification:
- read/unread
- action URL
- entity context
- created timestamp

## 12. Notification policy

Default:
- in-app for most
- email for important
- WhatsApp for selected urgent classes

Allow user preference, except mandatory critical classes configured by admin.

## 13. Reminder examples

Court event:
- 7 days
- 1 day
- 2 hours

Critical deadline:
- 30 days
- 14 days
- 7 days
- 3 days
- 1 day
- overdue escalation

Task:
- user configurable
- due soon
- overdue

## 14. Daily digest

Optional daily email:
- today's court
- tasks due
- overdue
- approvals waiting
- matters stalled

## 15. Meeting scheduling

Internal meeting:
- select attendees
- see conflicts from internal calendar
- optionally sync to Google
- attach agenda
- link to internal project or matter
- attach meeting notes after

Future:
- free/busy Google lookup where permitted.


---

# 07. Document and File Management

## 1. Objectives

Replace scattered local files and ambiguous "final" filenames with:
- central matter-linked storage,
- version history,
- preview,
- approval states,
- links from tasks/calendar,
- searchable metadata.

## 2. Logical document vs version

Example:

Document:
`Plaint`

Versions:
1. Plaint v1 draft
2. Plaint v2
3. Plaint v3 approved
4. Plaint signed
5. Plaint filed

UI displays one logical document with version history.

## 3. Storage path convention

Do not expose user filenames as the only storage key.

Suggested:
`organization/{orgId}/matters/{matterId}/documents/{documentId}/versions/{versionId}/{sanitizedFilename}`

## 4. Upload flow

1. choose file
2. choose or create logical document
3. select type/category
4. select matter
5. add note/status
6. upload
7. create version record
8. update current version
9. create activity event

## 5. Drag-and-drop

Desktop:
- drag files onto matter Documents area.

Mobile:
- file picker
- camera capture for receipts/evidence where permitted

## 6. Preview

MVP:
- PDF
- images
- plain text
- browser-supported media where reasonable

Office files:
- show metadata + download/open externally
- later add server-side conversion if desired

Do not pretend to render DOCX if it is not actually supported.

## 7. Version rules

- version numbers monotonic
- previous versions immutable in normal UI
- uploaded version notes optional
- filed/signed version cannot be replaced in place

## 8. Document status

Suggested:
- draft
- review
- approved
- signed
- filed
- served
- superseded
- archived

Status changes may require permission.

## 9. Document links

A document can link to:
- matter
- task
- calendar event
- filing record
- service record
- expense
- communication

Use join table where multiple links are required.

## 10. Document checklist

Workflow stage can define required document types.

Example:
Filing stage requires:
- approved plaint
- signed verifying affidavit
- witness statement
- list of documents

UI shows:
- complete
- missing
- under review

## 11. Review flow

MVP:
- submit for review
- reviewer notified
- approve
- request changes
- comment

Avoid building full collaborative word processing.

## 12. Search

Search metadata by:
- title
- type
- matter ref
- filename
- uploader
- status

Later:
- OCR
- full content indexing
- semantic search

## 13. Offline

Cache:
- metadata
- intentionally opened small previews where feasible

Do not automatically cache every confidential file.

Offline upload:
- small files may queue later
- MVP may require online state for large upload
- UI must make this explicit


---

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


---

# 09. Offline-Capable PWA

## 1. Objective

The app must remain useful during unreliable connectivity without creating hidden data-loss risks.

Offline capability is selective, not universal.

## 2. Installability

PWA requirements:
- Vite-built SPA
- `vite-plugin-pwa`/Workbox service worker
- manifest
- app icons
- service worker
- standalone display
- offline fallback shell
- HTTPS in production

## 3. Cache layers

### Static shell cache
- JS/CSS
- icons
- core shell assets

### Query cache
Persist selected TanStack Query data.

### IndexedDB domain cache
Use Dexie/IndexedDB for:
- recently viewed matters
- my tasks
- upcoming events
- selected client summaries
- pending mutations
- drafts

## 4. Offline banner

Always show explicit state:
- Online
- Offline
- Syncing
- Sync error

A subtle but visible banner/chip is sufficient.

## 5. Mutation queue

Queue format:
- id
- entity_type
- operation
- payload
- created_at
- dependency_ids
- retry_count
- status
- last_error

Statuses:
- pending
- syncing
- synced
- failed
- conflict

## 6. Safe offline mutations

Allowed:
- create draft note
- create draft task
- update task status
- draft expense
- add local comment
- draft client update
- edit noncritical task description

Conditional:
- create matter draft, but official reference assigned on sync

Online required:
- final court filing record if uniqueness/confirmation required
- Google sync
- message sending through email/WhatsApp
- final financial reconciliation
- large file upload
- privileged approval if policy requires fresh server state

## 7. Conflict behavior

For stale mutable records:
- server returns conflict
- client shows server version vs local changes
- user chooses reload/merge where practical

Do not silently overwrite:
- official deadline
- financial amount
- matter stage
- document status
- assignment

## 8. Document caching

Do not automatically cache all matter files.

Cache only:
- metadata,
- intentionally opened file if size policy allows,
- preview thumbnails.

Provide "Available offline" later as explicit user action.

## 9. Background sync

Where supported:
- attempt queued mutation sync when connection returns.

Also run foreground sync:
- app open
- network restored
- manual "Retry sync"

## 10. Sync center

Provide a small page:
- pending actions
- failed actions
- conflicts
- last successful sync

Users must be able to retry.

## 11. Offline testing scenarios

- lose network while editing task
- complete task offline
- reconnect
- conflict with server edit
- create expense draft offline
- app reload offline
- cached matter opens
- uncached matter shows clear unavailable state


## 12. API support required for offline writes

Backend endpoints used by the mutation queue must support:
- client-generated UUIDs where safe,
- `Idempotency-Key`,
- revision/version checks for conflict-prone updates,
- deterministic duplicate handling,
- explicit conflict status.

The offline client must never depend on direct database access.


---

# 10. Integrations

## 1. Integration architecture

Use provider adapters.

Interfaces:
- CalendarProvider
- EmailProvider
- MessagingProvider
- FileImportProvider

Do not spread Google/Twilio/Meta-specific code throughout domain UI.

## 2. Google account integration

Firm currently uses ordinary Gmail accounts.

Support per-user OAuth connection.

Features:
- Google Calendar event push
- update/cancel sync
- optional import selected events
- Gmail outbound/inbound metadata later

Store:
- provider account id
- token metadata securely server-side
- sync status
- external event/message ids

## 3. Calendar sync strategy

The law-firm OS is authoritative for matter-linked legal events.

Direction:
- internal event -> Google event
- selected Google event -> optional imported internal event

Avoid uncontrolled two-way duplication.

Map:
- title
- start/end
- location
- description summary
- attendees when permitted
- internal deep link

Do not expose confidential matter detail in Google event title by default. Use configuration.

## 4. Gmail

MVP options:
- send notification/digest via provider
- allow user to connect Google for calendar

Later:
- link email thread to matter
- create task from email
- ingest attachments
- search connected mailbox

Avoid trying to build full email client in MVP.

## 5. WhatsApp

Use Meta WhatsApp Business Cloud API or a provider abstraction.

Initial uses:
- staff urgent reminders
- optional client reminders later

Message templates:
- court reminder
- task escalation
- appointment reminder
- payment/receipt confirmation where appropriate

Store delivery status.

Do not make WhatsApp the source of truth.

## 6. Email notifications

Provider can be:
- Resend,
- Postmark,
- SMTP,
- other.

Domain layer calls generic notification service.

## 7. Excel/CSV

Use a robust parser.
Support:
- clients
- matters
- expenses
- payments
- contacts

Always preview before commit.

## 8. Calendar export

Even without OAuth:
- ICS export for event
- ICS feed later if needed

## 9. Future integrations

Possible:
- accounting software
- M-Pesa API
- bank feeds
- Judiciary/e-filing if a usable official integration path exists
- Google Drive
- document signing
- SMS


## 10. Self-hosted integration boundary

All OAuth callbacks, provider secrets, webhook verification and outbound provider calls live in the NestJS backend.

The React frontend:
- begins connection flow,
- displays connection state,
- never receives provider client secrets,
- never talks directly to WhatsApp/email provider APIs.

Webhook endpoints:
- `/api/v1/webhooks/google/...` where applicable
- `/api/v1/webhooks/whatsapp`
- `/api/v1/webhooks/email`

Provider events should be normalized into internal integration events before business logic consumes them.


---

# 11. Application Services, APIs and Events

## 1. Service contracts

Examples of explicit business operations.

### Matters
- createMatterDraft
- activateMatter
- updateMatter
- closeMatter
- reopenMatter
- assignMatterUser
- changeMatterStage
- handoffMatterStage

### Tasks
- createTask
- updateTask
- completeTask
- blockTask
- reassignTask

### Calendar
- createCalendarEvent
- updateCalendarEvent
- cancelCalendarEvent
- recordCourtOutcome
- createDeadline

### Documents
- createDocument
- uploadDocumentVersion
- submitVersionForReview
- approveDocumentVersion
- markVersionFiled
- linkDocumentToEntity

### Finance
- createExpenseDraft
- submitExpenseRequest
- approveExpenseRequest
- recordExpense
- recordPaymentReceipt
- reconcileTransaction

## 2. API style

The public application API is implemented in **NestJS + Fastify**.

Use:
- REST endpoints under `/api/v1`,
- OpenAPI generation,
- Socket.IO for realtime,
- shared validation/contracts package.

Business rules belong in NestJS application/domain services, not controllers and never React components.

Controllers:
- parse/validate request,
- authorize,
- call service,
- map typed result to HTTP response.

Services:
- enforce business rules,
- open transactions,
- emit domain events.

Repositories:
- perform persistence access through Prisma/SQL.

## 3. Validation

Every public mutation:
- Zod request validation
- domain validation
- authorization
- transaction
- result/error object

## 4. Error model

Use typed errors:
- ValidationError
- NotFoundError
- PermissionError
- ConflictError
- IntegrationError
- SyncRequiredError

User-facing messages should be actionable.

## 5. Domain event table

Columns:
- id
- organization_id
- matter_id nullable
- event_type
- entity_type
- entity_id
- actor_user_id
- payload jsonb
- created_at
- processed_at nullable

## 6. Event handlers

Example:
`calendar.court_event_created`
- create activity event
- schedule reminders
- optionally create preparation task
- enqueue Google sync

`matter.stage_changed`
- record handoff
- generate template tasks
- notify new owner

`document.review_requested`
- notify reviewer

`expense.submitted`
- notify approver

## 7. Idempotency

External integrations and queued offline writes should use idempotency keys.

Never send duplicate WhatsApp/email messages because of a retry.

## 8. Background jobs

MVP jobs:
- reminder dispatch
- daily digest
- Google sync
- failed notification retry
- stalled-matter scan
- overdue task scan

Implement with:
- BullMQ queues,
- Redis 8.2,
- dedicated `worker` process/container,
- cron-style repeatable BullMQ jobs where suitable.

No serverless dependency is required.

Jobs must be:
- idempotent,
- retry-aware,
- observable,
- dead-letter/failure visible to an administrator.


---

# 12. Testing and QA

## 1. Testing pyramid

### Unit
- validation
- date/deadline calculations
- money formatting
- workflow transition rules
- permission helpers

### Integration
- services against test database
- migrations
- storage metadata
- event creation
- offline queue serializer

### E2E
Core user journeys.

Use Playwright or equivalent.

## 2. Required E2E journeys

### Intake to Matter
- create intake
- accept
- create client
- activate matter
- reference assigned
- matter visible in search

### Stage Handoff
- assign stage owner
- complete checklist
- move stage
- handoff logged
- next tasks generated
- assignee notified

### Court Event
- create hearing
- link matter
- event appears on calendar
- reminder state created
- add outcome
- next task created

### Document Versioning
- create document
- upload v1
- upload v2
- approve v2
- v1 remains accessible
- activity timeline correct

### Expense
- create matter expense
- attach receipt
- submit
- approve
- appears in matter finance
- appears in branch finance report

### Offline Task
- load task
- disconnect
- complete task
- queue visible
- reconnect
- server confirms
- queue clears

## 3. Responsive QA

Test widths:
- 360
- 390
- 768
- 1024
- 1440

Core flows must not require horizontal scroll.

## 4. Accessibility QA

- keyboard traversal
- dialog focus
- labels
- contrast
- reduced motion
- mobile touch target

## 5. Empty states

Test:
- new organization
- branch with no matters
- matter with no documents
- no upcoming calendar
- no notifications

## 6. Failure states

Test:
- expired Google token
- failed file upload
- notification provider down
- database network error
- offline mutation conflict
- duplicate reference attempt

## 7. Seeded test personas

- Managing Partner
- Advocate
- Paralegal
- Administrator
- Court Clerk
- Finance
- Technical Admin

## 8. Acceptance gates

CI must block merge on:
- typecheck failure
- lint failure
- test failure
- build failure

Critical E2E suite should run on main/preview.


---

# 13. Delivery Plan

The sequence below is optimized for a coding agent or small product team.

## Phase 0: Foundation
Deliver:
- pnpm monorepo
- React + Vite web app
- NestJS + Fastify API
- NestJS/BullMQ worker
- PostgreSQL 18
- Prisma 7 schema/migrations
- Redis 8.2
- Docker Compose local stack
- Caddy production scaffold
- environment config
- design tokens
- app shell
- backend session authentication
- organization/branch seed
- error handling
- test harness

Exit criteria:
- user can sign in
- branch context loads
- responsive shell works

## Phase 1: Users, Roles and Branches
Deliver:
- user profiles
- role assignment
- branch membership
- admin user screen
- basic permission helper

Exit:
- admin can create/configure staff profile
- role affects navigation/action permission

## Phase 2: Clients and Intake
Deliver:
- client CRUD
- intake form
- intake status
- convert intake to matter/client
- client search

Exit:
- complete intake-to-client flow

## Phase 3: Matters
Deliver:
- create/activate matter
- reference generator
- matter workspace
- parties
- court proceeding basic record
- timeline

Exit:
- staff can open and manage a real matter

## Phase 4: Workflow and Assignments
Deliver:
- workflow templates
- stage instances
- matter stage board
- assignments
- handoffs
- template tasks

Exit:
- personal injury matter can move through configured stages

## Phase 5: Tasks and Deadlines
Deliver:
- task CRUD
- list/board
- blocked state
- deadlines
- overdue detection
- dashboard widgets

## Phase 6: Calendar
Deliver:
- day/week/month/agenda
- court events
- meetings
- event detail
- post-court outcome
- drag rules
- reminders

## Phase 7: Documents
Deliver:
- storage
- logical documents
- version upload
- PDF/image preview
- version history
- review/approval
- links to task/event

## Phase 8: Communications
Deliver:
- matter channel
- team/branch channels
- mentions
- task conversion
- notification center

## Phase 9: Finance
Deliver:
- expense
- expense request
- petty cash account
- basic financial account
- payment receipt
- matter finance
- CSV import

## Phase 10: Search and Management Reporting
Deliver:
- global search
- stalled matters
- workload
- branch dashboard
- matter stage analytics
- expense summaries

## Phase 11: Offline/PWA
Deliver:
- manifest/service worker
- app shell cache
- task/event/matter cache
- mutation queue
- sync center
- conflict UX

## Phase 12: Integrations
Deliver:
- Google OAuth
- Calendar sync
- notification email provider
- WhatsApp urgent reminder provider
- sync logs

## Phase 13: Polish
Deliver:
- accessibility fixes
- responsive refinements
- performance
- empty/error states
- audit pass
- seed demo
- deployment docs

## Phase 14: Pilot
Use one branch/team first if firm agrees.
Collect:
- missing fields
- workflow mismatches
- notification noise
- slow screens
- confusing language
- reporting gaps

Then iterate before full rollout.


---

# 14. Seed Data and Demo Scenarios

Seed data should feel like a real firm without using real client secrets.

## Organization
Kariuki Kagunda & Co. Advocates

## Branches
- Nairobi Branch
- Branch Two

Names can be changed when confirmed.

## Users
- Senior Partner
- Advocate A
- Paralegal A
- Administrator
- Court Clerk
- Finance Officer
- Technical Administrator

## Scenario A: Active RTA Matter

Internal ref:
`KKC/PI/2026/00427`

Client:
Jane Wanjiku Demo

Current stage:
Medical Documentation

Tasks:
- Follow up medical report
- Upload police abstract
- Confirm insurer

Documents:
- Treatment Notes v1
- Police Abstract v1
- ID Copy v1

Calendar:
- Client follow-up
- Medical appointment

Expenses:
- medical report request
- transport

## Scenario B: Filed Matter

Current stage:
Service

Court proceeding:
Demo MCCC E1234/2026

Documents:
- Plaint v3 filed
- Verifying Affidavit signed
- Filing receipt

Tasks:
- Serve defendant
- Upload affidavit of service

## Scenario C: Hearing Matter

Calendar:
- Hearing tomorrow 09:00

Linked:
- hearing preparation task
- bundle
- witness statement
- medical report

Post-event test:
- adjourned
- next date created
- follow-up task generated

## Scenario D: Matter with Stalled Warning

No activity for 35 days.
Stage target exceeded.

Expected:
- appears in management stalled list.

## Scenario E: Expense Approval

Paralegal requests:
KES 2,500 process server expense.

Senior partner approves.
Finance disburses.
Receipt later attached.
Request reconciled.

## Scenario F: Offline Task

Advocate opens task while online.
Network drops.
Task marked complete.
Queue persists through refresh.
Network returns.
Task syncs.
Timeline updated.


---

# 15. MVP Security Scope and Deferred Hardening

The project has explicitly prioritized getting a full working internal MVP built before deep security/compliance work.

This does **not** mean security should be ignored entirely.

## Minimum security required in MVP

1. Backend-owned authentication
2. Argon2id password hashing
3. HttpOnly secure server-side session cookie
4. Organization scoping
5. Role/assignment authorization
6. Private file storage outside the public web root
7. Server-side secrets only
8. PostgreSQL and Redis not publicly exposed
9. Basic audit/activity events
10. Secure OAuth token storage server-side
11. Off-site backups
12. HTTPS through Caddy

## Can be deferred

- advanced device management
- SSO
- mandatory MFA
- fine-grained legal ethical walls
- full data retention engine
- advanced DLP
- download watermarking
- immutable WORM storage
- SIEM
- penetration testing program
- formal ISO controls
- full compliance reporting
- advanced encryption-key management
- sophisticated anomaly detection
- zero-trust network architecture

## Important RBAC baseline

Even in MVP:
- Technical Admin should not automatically get blanket document visibility.
- Finance should not require medical document access.
- Branch access should be scoped.
- Matter access should respect assignment or leadership permissions.

## Permission key examples

- matter.read
- matter.create
- matter.update
- matter.assign
- matter.close
- document.read
- document.upload
- document.approve
- finance.expense.create
- finance.expense.approve
- finance.client_money.read
- calendar.manage
- admin.users.manage
- reports.firm.read

Use role -> permissions mapping.

## Future hardening backlog

When product is operational, run a separate security/compliance phase covering:
- Kenyan data protection requirements
- legal professional confidentiality
- backup/restore testing
- penetration testing
- MFA
- retention policies
- incident response
- security event monitoring


---

# 16. Deployment and Operations
## VPS Production Runbook

## 1. Supported production shape

Primary deployment target:
- one Linux VPS,
- Docker Engine,
- Docker Compose,
- Caddy,
- React static bundle,
- NestJS API,
- NestJS worker,
- PostgreSQL,
- Redis,
- persistent private document volume.

Recommended operating system:
- Ubuntu 24.04 LTS or another currently supported conservative Linux distribution.

Avoid deploying the first production version to an unmanaged rolling-release OS.

## 2. Initial VPS sizing

Practical starting point for the firm:

### Minimum pilot
- 4 vCPU
- 8 GB RAM
- 160+ GB NVMe
- daily off-site backup

### Recommended production starting point
- 6 to 8 vCPU
- 16 GB RAM
- 250+ GB NVMe
- separate/expandable storage strategy for documents
- off-site backup

Storage requirements depend far more on uploaded scans/PDFs than database size.

Monitor first, scale from actual measurements.

## 3. Public network surface

Public:
- TCP 80
- TCP 443
- SSH, restricted by firewall/source where practical

Private/container network only:
- PostgreSQL 5432
- Redis 6379
- API internal port 3000

Do not publish database/cache ports.

## 4. DNS

Create DNS:
`lawos.example.com -> VPS public IP`

Caddy obtains TLS automatically once DNS points correctly and 80/443 are reachable.

## 5. Host layout

```text
/srv/kklaw/
  app/                 # deployment repository / compose
  data/
    postgres/
    redis/
    documents/
  backups/
  logs/
  env/
    production.env
```

Set ownership/permissions deliberately.

## 6. Containers

### caddy
Responsibilities:
- TLS
- static SPA
- reverse proxy
- websocket proxy
- compression

### api
Responsibilities:
- REST API
- auth
- Socket.IO
- business logic
- document authorization/streaming

### worker
Responsibilities:
- BullMQ consumers
- scheduled jobs
- integrations
- digests/reminders

### postgres
Durable system of record.

### redis
Sessions, queues and ephemeral coordination.

## 7. Docker image policy

- multi-stage builds
- run application as non-root where practical
- pin base-image major/minor
- no `latest` tag in production
- image tagged with Git commit SHA/release
- retain previous stable image for rollback

## 8. Deployment sequence

1. pull source/release
2. build immutable images
3. run tests
4. confirm backup state
5. put deployment lock
6. run Prisma migration deploy command once
7. start/update worker
8. start/update API
9. build/swap web assets
10. Caddy reload if config changed
11. health check
12. smoke test
13. release deployment lock

For breaking schema changes use expand/contract migrations.

## 9. Database migrations

Source controlled.

Rules:
- no manual production schema editing,
- no destructive reset command in production,
- migration must run against staging first,
- migration is an explicit deployment step.

## 10. PostgreSQL persistence

Bind mount:
`/srv/kklaw/data/postgres`

Recommended:
- current PostgreSQL 18 minor release,
- periodic VACUUM/ANALYZE defaults,
- sensible shared memory configuration after measuring workload,
- log slow queries.

Do not prematurely hand-tune dozens of PostgreSQL parameters.

## 11. Redis persistence

Bind mount:
`/srv/kklaw/data/redis`

Use AOF configuration for useful operational recovery.

Redis loss must not cause permanent business-data loss.

## 12. Document persistence

Bind mount:
`/srv/kklaw/data/documents`

Never:
- store legal files in `/tmp`,
- store only inside API container,
- expose directory directly through public Caddy file server.

API authorizes and streams.

## 13. Backup strategy

### Database
Preferred production-grade direction:
- pgBackRest,
- encrypted remote repository/S3-compatible destination,
- WAL archiving/PITR when the firm depends materially on the system.

At minimum during early pilot:
- scheduled `pg_dump` custom-format backup,
- encrypted off-site copy,
- retention.

### Documents
Use restic or equivalent:
- encrypted,
- incremental,
- remote destination,
- retention policy.

### Critical rule
Database and document backups must be restorable to a coordinated point.

## 14. Suggested retention baseline

Adjust later with the firm's legal/compliance policy.

Operational infrastructure baseline:
- 7 daily
- 4 weekly
- 12 monthly

This is a technical starting point, not the legal record-retention policy.

## 15. Restore test

At least monthly during early production:
- create isolated restore environment,
- restore database,
- restore sample document set,
- log in,
- open sample matters,
- verify document download,
- record result.

## 16. Health endpoints

API:
- `/api/v1/health/live`
- `/api/v1/health/ready`

Readiness checks:
- PostgreSQL reachable
- Redis reachable if required for normal operation

Do not make readiness depend on optional external Google/WhatsApp providers.

## 17. Docker healthchecks

Configure:
- api HTTP health
- postgres `pg_isready`
- redis `PING`
- worker heartbeat mechanism

Use restart policy:
`unless-stopped`

Avoid infinite rapid crash loops by observing health/restart logs.

## 18. Logs

Structured JSON application logs.

Include:
- request id
- user id where safe
- organization id
- route
- status
- duration
- job id
- integration provider

Never log:
- passwords
- session secrets
- OAuth refresh tokens
- entire confidential document contents

## 19. Monitoring

MVP:
- disk usage alert
- CPU/RAM
- container status
- application error rate
- job failures
- backup success/failure
- certificate state
- uptime check

Optional:
- self-host Uptime Kuma.

Later add Prometheus/Grafana/Loki when justified.

## 20. Disk safety

Uploaded documents can fill the VPS.

Required:
- storage usage metric,
- warning threshold,
- critical threshold,
- failed upload if safe minimum space breached,
- alert administrator.

## 21. Rollback

Application rollback:
- deploy previous image tag.

Database:
- prefer forward-fix migrations.
- destructive migration rollback requires explicit restoration plan.

Never automatically restore an old database merely because application deploy fails.

## 22. Staging

Maintain separate staging:
- separate database
- separate Redis
- separate document volume
- separate Google OAuth callback/domain if necessary.

Staging must never use production client documents.

## 23. Scaling

When CPU/API pressure:
- add API replicas.

When job pressure:
- add worker replicas/concurrency.

When PostgreSQL is bottleneck:
- tune indexes/query patterns first,
- then separate database host.

When files dominate disk:
- move StorageDriver to S3-compatible storage.

The domain code should not care where the storage driver physically stores objects.


---

# 17. MVP Acceptance Matrix

## Authentication and user
- [ ] Staff can sign in
- [ ] Deactivated user cannot access app
- [ ] Branch context visible
- [ ] Role affects actions

## Clients
- [ ] Create person client
- [ ] Create organization client
- [ ] Search by name/phone/ID
- [ ] View matters for client

## Intake
- [ ] Record new enquiry
- [ ] Assign owner
- [ ] Mark accepted/declined
- [ ] Convert accepted intake

## Matters
- [ ] Create draft matter
- [ ] Activate and generate reference
- [ ] Add parties
- [ ] Add court proceeding
- [ ] Assign staff
- [ ] View timeline
- [ ] Close/archive

## Workflow
- [ ] Personal injury template exists
- [ ] Current stage visible
- [ ] Required checklist visible
- [ ] Stage can complete
- [ ] Handoff recorded
- [ ] New owner notified
- [ ] Stage tasks generated

## Tasks
- [ ] Create/edit/complete
- [ ] Assign/reassign
- [ ] Mark blocked
- [ ] Link to matter
- [ ] Link to calendar event
- [ ] Overdue appears on dashboard

## Deadline
- [ ] Official deadline distinct from task target
- [ ] Critical reminders generated
- [ ] Rescheduling work task does not alter official date

## Calendar
- [ ] Month/week/day/agenda
- [ ] Court event
- [ ] Client meeting
- [ ] Internal meeting
- [ ] Event links to matter
- [ ] Documents accessible
- [ ] Post-event outcome
- [ ] Next date creation

## Documents
- [ ] Upload
- [ ] Version
- [ ] Preview PDF/image
- [ ] View history
- [ ] Review/approve
- [ ] Link to task/event
- [ ] Filed version preserved

## Communications
- [ ] Matter channel
- [ ] Branch/team channel
- [ ] Mention
- [ ] Thread/reply
- [ ] Convert message to task

## Finance
- [ ] Record expense
- [ ] Expense request
- [ ] Approval
- [ ] Attach receipt
- [ ] Petty cash view
- [ ] Matter ledger
- [ ] Payment receipt
- [ ] Client/office account distinction
- [ ] CSV/Excel preview import

## Notifications
- [ ] In-app
- [ ] Email important event
- [ ] WhatsApp adapter for urgent configured event
- [ ] Read/unread
- [ ] Deep link

## Search
- [ ] Matter reference
- [ ] Court number
- [ ] Client name
- [ ] Phone
- [ ] Document title
- [ ] Task

## Dashboard
- [ ] Today
- [ ] Upcoming court
- [ ] Overdue tasks
- [ ] Stalled matters
- [ ] Branch filter
- [ ] Workload view

## Offline/PWA
- [ ] Installable
- [ ] Offline shell
- [ ] Cached recent matters
- [ ] Cached my tasks/upcoming events
- [ ] Queue safe mutation
- [ ] Sync state visible
- [ ] Conflict visible
- [ ] Failed queue retry

## Google
- [ ] User connects Google
- [ ] Internal event syncs to Google
- [ ] Update reflected
- [ ] Disconnect supported
- [ ] Failure shown

## Responsive
- [ ] All core flows at 360px
- [ ] No critical horizontal scroll
- [ ] Touch-friendly actions
- [ ] Desktop dense views remain usable

# Full Product Addendum - Governing Instruction

This addendum is higher-level product scope guidance for all implementation agents.

1. Build toward a complete working law-firm enterprise product. "MVP" means an implementation phase only.
2. Configuration is a product domain. Do not hard-code firm policy that should be admin-configurable.
3. Preserve the existing prototype's useful UX/domain work, but do not preserve localStorage/browser-only architecture as production truth.
4. Every sensitive action must be server-authorized and audited.
5. Every integration status must be truthful. Simulations are allowed only in an explicitly labeled development/demo mode.
6. Matter type must be a configurable package: workflow + data + participant roles + forms + templates + deadlines + policies.
7. Documents, signatures, marks and stamps must use versioned, permissioned, auditable server-side workflows.
8. Client money and office money must remain structurally distinct.
9. Settings must support scope, inheritance, version history, secrets, validation and high-impact approvals.
10. Read `FULL_PRODUCT_INDEX.md` and docs `19` through `36` before adding a major new module.
