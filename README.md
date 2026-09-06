# Kariuki Kagunda & Co. Advocates OS

Enterprise law-firm operating system for Kariuki Kagunda & Co. Advocates, built as a unified TypeScript monorepo with an interactive React frontend, NestJS/Fastify API, BullMQ worker, and Prisma 7 database.

---

## 1. Monorepo Architecture

The repository is structured as a `pnpm` monorepo with strict package boundaries:

```text
KKA/
├── apps/
│   ├── web/           # React 19 + Vite + Tailwind CSS SPA (@kka/web)
│   ├── api/           # NestJS + Fastify REST & Realtime API (@kka/api)
│   └── worker/        # BullMQ Asynchronous Job Processing Daemon (@kka/worker)
├── packages/
│   ├── contracts/     # Shared Zod schemas, DTOs & type definitions (@kka/contracts)
│   └── database/      # Prisma 7.10.0 Client, repositories & DB schema (@kka/database)
├── prisma/
│   ├── schema.prisma  # Authoritative relational database schema
│   └── migrations/    # Version-controlled SQL migration history
├── infra/
│   ├── Caddyfile      # Production reverse proxy and TLS configuration
│   ├── docker-compose.production.yml  # VPS production orchestration
│   └── scripts/       # Deployment, backup, and restore shell runbooks
├── docs/              # Architectural specifications (00 through 37)
├── pnpm-workspace.yaml
├── prisma.config.ts
├── tsconfig.base.json
└── package.json
```

---

## 2. Technology Stack

- **Runtime & Engines**: Node.js `>=24 <25 || >=26 <27` (certified on Node 24 LTS and Node 26.5.0) with `pnpm@10.15.1`.
- **Backend API**: NestJS 11 with `@nestjs/platform-fastify` and Fastify plugins (rate limiting, multipart, cookies, helmet).
- **Frontend SPA**: React 19, Vite 6, Tailwind CSS, Lucide icons, Motion, and an interactive domain workspace architecture.
- **Database & ORM**: PostgreSQL 18 with Prisma ORM 7.10.0 (`prisma.config.ts` configuration).
- **Queues & Ephemeral Store**: Redis 8.2 with BullMQ for asynchronous jobs (mail delivery, document conversions, audit aggregation).
- **Realtime**: Socket.IO gateway for live event broadcasting.
- **Reverse Proxy**: Caddy 2 with automatic HTTPS and HTTP/2 proxying to NestJS and static web assets.
- **Security & Auth**: Argon2id password hashing, opaque server-side session tokens in Redis (`kka_sid`), and server-side RBAC guards.

---

## 3. Developer Quickstart

### Prerequisites
- Node.js 24.x or 26.x (`node --version`)
- pnpm 10.15.1 (`npm install -g pnpm@10.15.1`)
- Docker Engine & Compose (for PostgreSQL 18 & Redis 8.2)

### Installation
```bash
# Clone the repository
git clone https://github.com/davemusau00/KKA.git
cd KKA

# Install all monorepo dependencies
pnpm install

# Copy environment configuration
cp .env.backend.example .env
```

Generate the application encryption key:
```bash
openssl rand -base64 32
```
Paste this value into `APP_ENCRYPTION_KEY_BASE64` inside `.env`.

### Database Setup
```bash
# Generate the typed Prisma client
pnpm prisma:generate

# Validate the relational schema
pnpm prisma:validate

# Apply migrations (or deploy in production)
pnpm prisma:migrate:dev --name init
pnpm prisma:seed
```

### Running Local Development Servers

You can launch components individually:

```bash
# Frontend web application (runs Vite on http://localhost:5173 with proxy to API)
pnpm dev:web

# Backend API server (runs NestJS/Fastify on http://localhost:3000)
pnpm dev:api

# BullMQ asynchronous worker
pnpm dev:worker
```

> **Note on Port Proxy**: The frontend runs on port `5173`. Its Vite dev server automatically proxies all `/api/v1` and `/socket.io` requests to `http://127.0.0.1:3000`, allowing cookie credentials (`kka_sid`) to flow cleanly without cross-origin issues.

---

## 4. Codebase Validation Gates

Run the verification gate across the entire monorepo:

```bash
# Validate Prisma schema
pnpm prisma:validate

# Typecheck all 5 workspace projects (contracts, database, api, worker, web)
pnpm typecheck

# Run automated tests
pnpm test

# Build all workspace packages for production
pnpm build
```

All validation gates are automated and verified clean with 0 errors.

---

## 5. Frontend-to-Backend Progressive Integration

The frontend uses a **Progressive Hybrid Bridge pattern** (`apps/web/src/context/AppContext.tsx` and `apps/web/src/lib/api/`):
- High-fidelity UI components make calls through domain slices in `AppContext`.
- Integrated domains dispatch typed requests to the live backend API.
- If the backend is offline or during rollout, the client gracefully falls back to local storage and seed models with zero visual disruption.

### Integration Progress Matrix

```
[Tier 0: Transport & Proxy] ────► [Tier 1: Lookups & Catalogs] ────► [Tier 2: Auth, Search & Config] ────► [Tier 3: Clients, Tasks & Intake]
          ✅ COMPLETE                         ✅ COMPLETE                         ✅ COMPLETE                         ✅ COMPLETE
                                                                                                                           │
[Tier 7: Matter Spine & PI] ◄──── [Tier 6: Documents & Stamps] ◄──── [Tier 5: Comms & Realtime] ◄──── [Tier 4: Calendar, Court & Approvals]
          ⏳ ROADMAP                          ⏳ ROADMAP                          ⏳ ROADMAP                          🔷 NEXT UP
```

| Tier | Focus | Status | Key Features |
|---|---|---|---|
| **Tier 0** | Transport & Dev Proxy | **Completed** | Vite dev proxy (`/api/v1` -> `:3000`), typed HTTP client with cookie credentials (`apps/web/src/lib/api/client.ts`), live `ConnectionStatusBadge` in shell. |
| **Tier 1** | Catalogs & Independent Lookups | **Completed** | Health diagnostics (`/health/live`), third-party directory contacts (`/directory`), branches (`/organization/branches`), active staff list (`/users`), system notifications (`/notifications`). |
| **Tier 2** | Auth, Search & Configuration | **Completed** | Real credentials login modal with dev personas (`/auth/login`, `/auth/me`, `/auth/logout`), live database global search (`/search`), settings studio sync (`/settings`), truthful integration tests (`/integrations/test`). |
| **Tier 3** | Clients, Tasks & Intake Pipeline | **Completed** | Client lifecycle and editing (`/clients`), task board & status mutations (`/tasks`, `/tasks/:id/status`), intake leads & conflict checks (`/intake`). |
| **Tier 4** | Calendar, Court Ops & Approvals | **Next Up** | Temporal Command Centre (`/calendar`), Court Diary & CTS filings (`/court`), expense/leave sign-offs (`/approvals`). |
| **Tier 5** | Communications & Real-Time | Roadmap | Messaging threads, SMS/WhatsApp outbox, Socket.IO live events. |
| **Tier 6** | Documents & Digital Seals | Roadmap | Private VPS storage adapter, versioning, official firm execution blocks and stamps. |
| **Tier 7** | Matter Spine & 16-Stage PI Engine | Roadmap | Authoritative server-side matter lifecycle, stage gates, limitation trackers, medical record indexes. |
| **Tier 8** | Ledger-Grade Finance | Roadmap | Double-entry client trust accounts vs. office funds, fee notes, disbursements, M-Pesa statements. |
| **Tier 9** | Offline PWA & Teardown | Roadmap | IndexedDB outbox synchronization, replay engine, retirement of mock localStorage state. |

For detailed integration instructions and specs, see [backend-frontend-integration.md](file:///c:/Users/Admin/Downloads/kka/KKA/backend-frontend-integration.md).

---

## 6. Docker & Production VPS Deployment

### Architecture Topology
```text
Internet
   │
   ▼
 Caddy (Ports 80 / 443)
   ├── Static Web SPA Build (apps/web/dist)
   └── Reverse Proxy: /api/v1/* & /socket.io/*
              │
              ▼
         NestJS API (Port 3000)
         ├── PostgreSQL 18 (Private Network)
         ├── Redis 8.2 (Private Network)
         └── Private Document Volume
              │
              ▼
        BullMQ Worker Daemon
```

### Production Stack Build & Launch
```bash
# Build and deploy all production containers
docker compose -f infra/docker-compose.production.yml up -d --build

# View container logs
docker compose -f infra/docker-compose.production.yml logs -f --tail=200

# Stop the stack
docker compose -f infra/docker-compose.production.yml down
```

### Infrastructure Documents
- [Deployment Checklist](file:///c:/Users/Admin/Downloads/kka/KKA/infra/DEPLOYMENT_CHECKLIST.md)
- [Disaster Recovery & Restore Runbook](file:///c:/Users/Admin/Downloads/kka/KKA/infra/RESTORE_RUNBOOK.md)
- [Caddy Configuration](file:///c:/Users/Admin/Downloads/kka/KKA/infra/Caddyfile)

---

## 7. Core Architectural Invariants

1. **Matter-Centric Spine**: Every operational object (tasks, court mentions, deadlines, documents, invoices, messages) relates back to an authoritative Matter.
2. **Integration Truthfulness**: Provider adapters (Judiciary CTS, M-Pesa Daraja, WhatsApp Cloud, Africa's Talking) never fabricate success. Unavailable or unconfigured providers explicitly report unconfigured status.
3. **Firm Seals, Signatures & Stamps**: The marks subsystem operates with controlled, versioned vector assets. Applying a mark generates an immutable document version with audited user, checksum, placement, and timestamp.
4. **Trust Fund Separation**: Client trust money is strictly isolated from office operational funds in separate ledgers with double-entry invariants.
5. **Private Document Storage**: All legal documents reside outside the public web root and are accessed exclusively through audited, authorized API streams.

---

## 8. Documentation Index

The repository includes a comprehensive specification suite in the `docs/` directory:

| Section | Key Documents |
|---|---|
| **Full Product Index** | [FULL_PRODUCT_INDEX.md](file:///c:/Users/Admin/Downloads/kka/KKA/docs/FULL_PRODUCT_INDEX.md), [MASTER_DEVELOPER_GUIDE.md](file:///c:/Users/Admin/Downloads/kka/KKA/docs/MASTER_DEVELOPER_GUIDE.md) |
| **System Architecture** | `01_SYSTEM_ARCHITECTURE.md`, `18_VPS_STACK.md`, `19_FULL_PRODUCT_VISION_AND_CAPABILITY_MAP.md` |
| **Domain & Data Models** | `02_DOMAIN_MODEL.md`, `03_DATA_MODEL.md`, `23_FULL_PRODUCT_DOMAIN_AND_MODULE_EXPANSION.md` |
| **Workflows & Operations** | `04_WORKFLOWS.md`, `06_CALENDAR_TASKS_COMMS.md`, `25_WORKFLOW_AUTOMATION_CUSTOM_FIELDS_FORMS.md` |
| **Documents & Firm Marks** | `07_DOCUMENTS.md`, `21_FIRM_MARKS_SIGNATURES_STAMPS_AND_EXECUTION_BLOCKS.md` |
| **Finance & Ledgers** | `08_FINANCE.md`, `33_SETTINGS_SCOPE_PRECEDENCE_MATRIX.md` |
| **Configuration & Admin** | `20_ADMIN_SETTINGS_CONFIGURATION_ARCHITECTURE.md`, `37_CONFIGURATION_CATALOG_FULL_PRODUCT.md` |
| **Testing & Deployment** | `12_TESTING_QA.md`, `16_DEPLOYMENT_OPERATIONS.md`, `34_FULL_PRODUCT_ACCEPTANCE_MATRIX.md` |
