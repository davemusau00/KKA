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

- **Node.js >=24 <25 || >=26 <27 (Node 24 LTS and Node 26 supported)**
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

## Full Product Expansion - 2026-09-06

The product target is now explicitly the **full working enterprise product**, not an MVP as the final boundary. References to MVP in the original material remain useful as delivery sequencing, but they do not limit the product model.

Read `FULL_PRODUCT_INDEX.md` first for the additive full-product specification. The most important new requirements are:
- extensive configuration/settings architecture with scoped inheritance;
- matter-type/workflow/form/custom-field builders;
- real SMTP/inbound mail and provider configuration;
- firm marks/signatures/stamps/execution-block controls;
- HR/procurement/assets/knowledge/meetings;
- mature finance/client-money/reconciliation;
- client portal and external collaboration;
- reporting/BI/data governance;
- API/webhooks/platform operations;
- full current-repository conversion plan.

The current `davemusau00/KKA` repository should be treated as a valuable interactive prototype. Production work should preserve its domain/UX strengths while moving authoritative state, security, documents, finance, workflow enforcement and integrations into the approved VPS backend.
