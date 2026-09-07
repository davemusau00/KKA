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
│   ├── database/      # Prisma 7.10.0 Client, repositories & DB schema (@kka/database)
│   └── document-engine/ # Shared API/worker rendering and application logic
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

- **Runtime & Engines**: Node.js `>=24 <25 || >=26 <27` with `pnpm@10.15.1`. Current verification versions are recorded with acceptance evidence.
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

# Apply the committed migrations to a clean database
pnpm prisma:migrate:deploy

# Production only, after reviewing BOOTSTRAP_* settings
pnpm bootstrap:production

# Alternative for an isolated synthetic development/test database only
# pnpm seed:fixtures
```

### Running Local Development Servers

You can launch components individually:

```bash
# Frontend web application (runs Vite on http://localhost:5173 with proxy to API)
pnpm dev:web

# Backend API server (set API_PORT=3015 for the default Vite proxy)
pnpm dev:api

# BullMQ asynchronous worker
pnpm dev:worker
```

> Local development uses web port `5173` and API port `3015` (override `VITE_BACKEND_URL` when needed). Use local `WEB_ORIGIN`, `API_PUBLIC_URL` and cookie settings. Production uses separate HTTPS hosts: `os.kariukikagunda.com` and `api.kariukikagunda.com`. The separate-origin acceptance runner is described in [PREDEPLOYMENT_FOUNDATION.md](docs/PREDEPLOYMENT_FOUNDATION.md).

---

## 4. Codebase Validation Gates

Run the verification gate across the entire monorepo:

```bash
# Validate Prisma schema
pnpm prisma:validate

# Typecheck all six workspace projects, plus browser tests
pnpm typecheck
pnpm --filter @kka/web typecheck:tests

# Run automated tests
pnpm test

# Build all workspace packages for production
pnpm build
```

See [PROJECT_STATE.md](docs/PROJECT_STATE.md) for current results and gaps. Browser and API integration tests require isolated dependencies; no blanket full-product acceptance is claimed.

---

## 5. Production conversion status

The approved phased plan is [PRODUCTION_CONVERSION.md](docs/PRODUCTION_CONVERSION.md). Verified branding/document behavior is recorded in [DOCUMENT_WORKFLOWS.md](docs/DOCUMENT_WORKFLOWS.md), and the clean bootstrap, transport and session increment in [PREDEPLOYMENT_FOUNDATION.md](docs/PREDEPLOYMENT_FOUNDATION.md).

Business local storage and persona switching are development-only. Legacy business mutations still in `AppContext.tsx` require server-backed conversion and acceptance. API failure must not expose synthetic records or report local work as saved. [PROJECT_STATE.md](docs/PROJECT_STATE.md) lists the remaining launch phases; the historical hybrid-bridge tier matrix is superseded.

---

## 6. Docker & Production VPS Deployment

### Architecture Topology
```text
Internet
   │
   ▼
 Caddy (Ports 80 / 443)
   ├── os.kariukikagunda.com -> Static SPA (apps/web/dist)
   └── api.kariukikagunda.com -> /api/v1/* & /socket.io/*
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
- [Deployment Checklist](infra/DEPLOYMENT_CHECKLIST.md)
- [Disaster Recovery & Restore Runbook](infra/RESTORE_RUNBOOK.md)
- [Caddy Configuration](infra/Caddyfile)

---

## 7. Required Architectural Invariants

1. **Matter-Centric Spine**: Every operational object (tasks, court mentions, deadlines, documents, invoices, messages) relates back to an authoritative Matter.
2. **Integration Truthfulness**: Provider adapters (Judiciary CTS, M-Pesa Daraja, WhatsApp Cloud, Africa's Talking) never fabricate success. Unavailable or unconfigured providers explicitly report unconfigured status.
3. **Firm Marks, Visual Signatures & Stamps**: The marks subsystem uses controlled, versioned image assets. Applying a mark generates an immutable document version with audited user, checksum, placement, and timestamp. Visual signatures do not imply cryptographic signing.
4. **Trust Fund Separation**: Client trust money is strictly isolated from office operational funds in separate ledgers with double-entry invariants.
5. **Private Document Storage**: All legal documents reside outside the public web root and are accessed exclusively through audited, authorized API streams.

---

## 8. Documentation Index

The repository includes a comprehensive specification suite in the `docs/` directory:

| Section | Key Documents |
|---|---|
| **Full Product Index** | [FULL_PRODUCT_INDEX.md](docs/FULL_PRODUCT_INDEX.md), [MASTER_DEVELOPER_GUIDE.md](docs/MASTER_DEVELOPER_GUIDE.md) |
| **System Architecture** | `01_SYSTEM_ARCHITECTURE.md`, `18_VPS_STACK.md`, `19_FULL_PRODUCT_VISION_AND_CAPABILITY_MAP.md` |
| **Domain & Data Models** | `02_DOMAIN_MODEL.md`, `03_DATA_MODEL.md`, `23_FULL_PRODUCT_DOMAIN_AND_MODULE_EXPANSION.md` |
| **Workflows & Operations** | `04_WORKFLOWS.md`, `06_CALENDAR_TASKS_COMMS.md`, `25_WORKFLOW_AUTOMATION_CUSTOM_FIELDS_FORMS.md` |
| **Documents & Firm Marks** | `07_DOCUMENTS.md`, `21_FIRM_MARKS_SIGNATURES_STAMPS_AND_EXECUTION_BLOCKS.md` |
| **Finance & Ledgers** | `08_FINANCE.md`, `33_SETTINGS_SCOPE_PRECEDENCE_MATRIX.md` |
| **Configuration & Admin** | `20_ADMIN_SETTINGS_CONFIGURATION_ARCHITECTURE.md`, `37_CONFIGURATION_CATALOG_FULL_PRODUCT.md` |
| **Testing & Deployment** | `12_TESTING_QA.md`, `16_DEPLOYMENT_OPERATIONS.md`, `34_FULL_PRODUCT_ACCEPTANCE_MATRIX.md` |
