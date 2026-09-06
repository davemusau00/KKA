# 35 - Codebase Refactor Target Map

## 1. Current to target mapping

```text
CURRENT
src/App.tsx
src/context/AppContext.tsx
src/components/**
src/data/** seed data
src/types/index.ts
localStorage

TARGET
apps/web/
  src/routes/
  src/features/
  src/components/
  src/lib/api/
  src/offline/
apps/api/
  src/modules/
apps/worker/
packages/contracts/
packages/domain/
packages/ui/
packages/config/
packages/validation/
prisma/
infra/
```

## 2. App routing

Current `activeWorkspace` routing should migrate to TanStack Router.

Suggested route tree:

```text
/login
/app
  /dashboard
  /intake
  /clients
    /:clientId
  /matters
    /:matterId
      /overview
      /workflow
      /tasks
      /court
      /documents
      /communications
      /evidence
      /medical
      /finance
      /timeline
  /tasks
  /calendar
  /court
  /documents
  /communications
  /finance
  /approvals
  /reports
  /knowledge
  /people
  /procurement
  /admin/*
  /integrations/*
/portal/*
```

## 3. AppContext decomposition

Do not move the giant context into another giant service. Split by server modules and feature clients.

Backend modules:
- AuthModule;
- OrganizationModule;
- UsersModule;
- AccessControlModule;
- ClientsModule;
- IntakeModule;
- MattersModule;
- WorkflowsModule;
- TasksModule;
- CalendarModule;
- CourtModule;
- DocumentsModule;
- CommunicationsModule;
- NotificationsModule;
- FinanceModule;
- ApprovalsModule;
- DirectoryModule;
- KnowledgeModule;
- PeopleModule;
- ProcurementModule;
- PortalModule;
- IntegrationsModule;
- ConfigurationModule;
- AuditModule;
- ReportingModule.

Frontend feature state should mostly be:
- server cache via TanStack Query;
- URL/search params;
- local component/UI state;
- small auth/shell contexts;
- Dexie only for explicit offline cache/queued mutation support.

## 4. Types

Break `src/types/index.ts` into domain contract packages. Recommended:

```text
packages/contracts/src/auth
packages/contracts/src/organization
packages/contracts/src/client
packages/contracts/src/intake
packages/contracts/src/matter
packages/contracts/src/workflow
packages/contracts/src/task
packages/contracts/src/calendar
packages/contracts/src/document
packages/contracts/src/finance
packages/contracts/src/communication
packages/contracts/src/configuration
```

Avoid using generated database types directly as public API contracts.

## 5. Seed data

Move demo fixtures to explicit development/test paths:

```text
prisma/seed.ts
apps/api/test/fixtures/
apps/web/src/dev/fixtures/   # only for isolated story/demo use
```

No realistic firm financial identifiers or real client data in public fixtures.

## 6. Integrations workspace

Current screen may be preserved visually, but refactor it around:
- `GET /api/v1/integrations`;
- `POST /api/v1/integrations/:id/test`;
- `POST /api/v1/integrations/:id/oauth/start`;
- `POST /api/v1/integrations/:id/sync`;
- `GET /api/v1/integrations/:id/deliveries`;
- masked secret write-only fields.

The UI status badge comes from backend connection state, not local booleans.

## 7. Admin workspace

Split current 51KB-style admin monolith into route-level screens and reusable admin components:
- users;
- roles;
- branches;
- audit;
- configuration studio;
- workflows;
- forms;
- document settings;
- signatures/stamps;
- communications;
- finance policy;
- security;
- system operations.

## 8. Finance workspace

Move calculations and posting rules server-side. Frontend must not compute authoritative balances from local arrays. Introduce ledger/journal services and database constraints.

## 9. Documents

Replace `fileDataUrl` as production storage. API should return signed/authorized transient stream endpoints or stream directly. Keep metadata, checksum and version IDs in PostgreSQL; bytes in private storage adapter.

## 10. Offline

Replace simulated mutation queue with:
- Dexie cache;
- mutation envelope with idempotency key;
- server entity version;
- retry/backoff;
- conflict state;
- user conflict-resolution UI;
- policy defining which mutation types can be performed offline.

Do not permit sensitive high-risk operations such as posting client-money transfers or applying a signature offline unless a future policy explicitly designs it safely.

## 11. Incremental conversion order

1. monorepo/infrastructure;
2. auth/org/users/config;
3. clients/intake/matters;
4. workflows/tasks/calendar;
5. documents;
6. court operations;
7. communications;
8. finance;
9. reporting/admin expansion;
10. portal/HR/procurement/knowledge;
11. advanced integrations/platform tooling.
