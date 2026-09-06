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
