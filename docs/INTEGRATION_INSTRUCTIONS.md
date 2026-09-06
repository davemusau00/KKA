# Frontend & Backend Integration Runbook

This guide documents the implementation architecture, developer workflows, and patterns used to integrate the React 19 frontend (`apps/web`) with the NestJS/Fastify backend API (`apps/api`), Prisma 7 database (`packages/database`), and BullMQ worker (`apps/worker`).

---

## 1. Monorepo Architecture Overview

The repository is organized into distinct workspace packages to enforce clear separation of concerns:

```text
apps/
  web/             -> React 19 SPA with Tailwind CSS, Lucide, and Motion
  api/             -> NestJS + Fastify REST & Realtime API Engine (32 modules)
  worker/          -> BullMQ background job processing daemon
packages/
  contracts/       -> Shared Zod schemas, DTOs, and interface contracts
  database/        -> Prisma 7.10.0 database client, repositories, and schema
```

### Module Resolution & Aliases
- In `apps/web/vite.config.ts`:
  - `@/` maps to `apps/web/src`
  - `@contracts/` maps to `packages/contracts/src`
- In `apps/web/tsconfig.json` and `tsconfig.base.json`:
  - Path mappings ensure full TypeScript autocomplete and strict type safety across packages.

---

## 2. Progressive Hybrid Bridge Pattern

Rather than risking regressions by replacing `AppContext.tsx` in a single breaking migration, we use a **Progressive Hybrid Bridge pattern**:

```text
┌─────────────────────────────────────────────────────────────┐
│                       apps/web UI                           │
│        (Workspaces, Drawers, Modals, Action Bars)           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                  Hybrid AppContext Bridge                   │
│   - Provides unified state and action methods to UI         │
│   - Dispatches mutations to live typed API client           │
│   - Merges server responses into active frontend state      │
│   - Falls back gracefully to localStorage when offline      │
└───────────────┬─────────────────────────────┬───────────────┘
                │ (Online)                    │ (Offline / Fallback)
┌───────────────▼──────────────┐ ┌────────────▼───────────────┐
│     Typed API Client         │ │     Local Storage Cache    │
│  (apps/web/src/lib/api/)     │ │  (Deterministic Seed Data) │
└───────────────┬──────────────┘ └────────────────────────────┘
                │ HTTP (Cookies / JSON)
┌───────────────▼──────────────┐
│    Vite Dev Reverse Proxy    │ (port 5173 -> port 3000)
└───────────────┬──────────────┘
                │
┌───────────────▼──────────────┐
│  NestJS / Fastify API Server │
│   (Guards, Services, Prisma) │
└──────────────────────────────┘
```

### Key Principles
1. **Zero UI Regression**: UI workspaces continue operating seamlessly whether the backend is live or offline.
2. **Optimistic Updates**: Changes are reflected in the UI immediately, and server responses update identifiers and persisted timestamps asynchronously.
3. **Graceful Fallback**: If an API endpoint is unreachable, actions fall back to local storage and queue background synchronization without throwing unhandled exceptions.

---

## 3. Local Development Workflows

### Prerequisites
- Node.js `>=24 <25 || >=26 <27` (tested on Node 26.5.0)
- `pnpm@10.15.1`

### Running the Full Development Stack
Start each service in a separate terminal:

```bash
# 1. Start the API server on port 3000
pnpm dev:api

# 2. Start the BullMQ worker
pnpm dev:worker

# 3. Start the Web frontend on port 5173
pnpm dev:web
```

### Dev Proxy Configuration
`apps/web/vite.config.ts` automatically proxies:
- `/api/v1/*` -> `http://127.0.0.1:3000/api/v1/*`
- `/socket.io/*` -> `http://127.0.0.1:3000/socket.io/*`

This eliminates CORS issues and ensures that the `kka_sid` session cookie flows naturally between browser and API.

---

## 4. Progressive Integration Status

### Completed Tiers

- **Tier 0: Transport, Proxy & Client**
  - Vite dev proxy configured.
  - Typed HTTP client with cookie credentials (`apps/web/src/lib/api/client.ts`).
  - `ConnectionStatusBadge.tsx` placed in `AppShell.tsx`.

- **Tier 1: Read-Only Catalogs & Independent Lookups**
  - System health (`/health/live`).
  - Third-party directory lookups (`/directory`).
  - Branch definitions (`/organization/branches`).
  - Active staff and roles (`/users`).
  - System notifications (`/notifications`).

- **Tier 2: Basic CRUD, Authentication & Configuration**
  - Real credentials login modal (`LoginModal.tsx`) with dev personas.
  - Boot hydration via `authApi.me()`.
  - Global database search (`/search`).
  - Firm profile & numbering scheme sync (`/settings`).
  - Truthful integration diagnostic tester (`/integrations/test`).

- **Tier 3: Core Operational Workspaces**
  - Client management lifecycle (`/clients`).
  - Task board & status transitions (`/tasks`).
  - Intake lead capture, conflict check engine, and conversion (`/intake`).

### Upcoming Tiers

- **Tier 4: Calendar, Court Operations & Approvals** *(Next up)*
  - Temporal Command Centre events and rescheduling policies (`/calendar`).
  - Court Diary, CTS filing queues, and process service tracking (`/court`).
  - Expense and leave approvals (`/approvals`).
- **Tier 5: Communications & Real-Time Events**
- **Tier 6: Documents & Digital Seals**
- **Tier 7: Matter Spine & 16-Stage Personal Injury Engine**
- **Tier 8: Ledger-Grade Finance & Client Trust Accounting**
- **Tier 9: Full PWA Offline Sync & Seed Teardown**

---

## 5. Verification Commands

Always run these commands before submitting pull requests or deploying:

```bash
# Validate Prisma schema
pnpm prisma:validate

# Typecheck all workspace projects
pnpm typecheck

# Run automated tests
pnpm test

# Build production artifacts
pnpm build
```

---

## 6. Production Invariants

1. **PostgreSQL Authority**: PostgreSQL is the sole authoritative system of record for structured business data. Redis is never used as the sole copy of legal or financial records.
2. **Server-Side Authorization**: All authorization decisions, stage-gate handoffs, and approval thresholds are enforced on the server.
3. **Integration Truthfulness**: Provider adapters (Judiciary CTS, M-Pesa Daraja, WhatsApp, SMS) must never simulate success. Unreachable or unconfigured services must return explicit error states.
4. **Firm Mark Immutability**: Applying firm stamps, signatures, or seals produces a new, immutable document version with audited user, timestamp, and placement metadata.
5. **Trust Fund Separation**: Client trust money is strictly isolated from office operational funds in separate ledgers with double-entry invariants.
