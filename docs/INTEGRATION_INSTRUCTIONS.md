# Integration into `davemusau00/KKA`

## Recommended sequence

1. Tag or branch the current frontend prototype so it can always be recovered.
2. Create `apps/web` and move the current React/Vite application into it.
3. Copy the backend package into the repository root.
4. Turn the root into the pnpm workspace using `package.monorepo.json`.
5. Add an `apps/web/package.json` containing the frontend's current dependencies and scripts.
6. Do not migrate frontend state to APIs all at once. Replace `AppContext` domain by domain.
7. First production vertical slice: auth → clients/intake → matters → tasks/workflow → audit.
8. Second: documents/private storage → calendar → approvals → court operations.
9. Third: finance ledger → notifications/realtime → offline outbox/replay.
10. Connect external providers only after the server-side domain is authoritative.

## Frontend transition pattern

Current prototype:

```text
React components → AppContext → localStorage
```

Target:

```text
React components
  → TanStack Query/mutations
  → /api/v1
  → NestJS services
  → PostgreSQL / private storage / Redis
```

Keep UI-only state in the frontend. Move business state and permissions to the server.

## Data migration

Do not import browser demo seed/localStorage directly into production without mapping and validation. Build explicit migration/import scripts for clients, matters, tasks, calendar dates, documents metadata and finance records. Record source, import batch, row result and reconciliation status.

## Production invariants

- PostgreSQL is authoritative for durable structured data.
- Redis is never the only copy of legal or financial business data.
- files are outside the web root and never depend on container-local ephemeral storage.
- every authorization-sensitive mutation is checked server-side.
- official legal deadlines are distinct from internal target dates.
- controlled calendar events retain revision history.
- client/trust funds remain distinct from office funds.
- audit history is generated server-side.
- provider secrets are encrypted/secret-managed, not browser-local.
- integrations never claim success without provider confirmation.
