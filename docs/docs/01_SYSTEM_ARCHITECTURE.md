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
