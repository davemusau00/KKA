# KKA Full Backend Infrastructure

Production-oriented backend package for the Kariuki Kagunda & Co. Advocates internal OS.

This package is designed to be merged into the existing `davemusau00/KKA` repository and converted into the approved monorepo topology:

```text
KKA/
├── apps/
│   ├── web/       # existing React/Vite frontend moved here
│   ├── api/       # NestJS/Fastify API from this package
│   └── worker/    # BullMQ worker from this package
├── packages/
│   ├── contracts/
│   └── database/
├── prisma/
├── infra/
├── scripts/
├── docs/
├── pnpm-workspace.yaml
├── prisma.config.ts
├── tsconfig.base.json
└── package.json
```

## Architecture

- Node.js 24 LTS target
- NestJS + Fastify
- PostgreSQL 18
- Prisma 7
- Redis 8.2
- BullMQ workers
- Socket.IO realtime foundation
- private document/mark storage abstraction
- Docker Compose
- Caddy reverse proxy and HTTPS
- opaque server-side sessions with Argon2id password hashing
- server RBAC, audit, workflow and approval foundations

## Package contents

The backend includes modules for authentication, users, branches, clients, intake/conflicts/KYC, matters, workflows and stage handoffs, tasks/deadlines, calendar, document storage/versioning/reviews, court operations, personal-injury sub-workflows, finance/client-money ledgers, approvals, communications, notifications, integrations, SMTP/mail, firm marks/signatures/stamps, settings/configuration, automation, custom fields/forms, reporting, search, knowledge, operations, procurement/assets, portal access, developer tools and audit.

## Important validation status

The source package has been assembled and structurally checked. This execution environment did not contain Node 24, pnpm, installed project dependencies, or the Prisma CLI, so the package has **not** been certified with the final dependency-backed `pnpm install`, Prisma validation/migration, full TypeScript typecheck, Jest run, or production Docker build.

Run the validation gate below after merging and before production use. Do not deploy client data or money workflows until it passes.

## Merge into the existing KKA repository

Create a branch first:

```bash
git checkout -b feat/full-backend
```

Move the existing frontend into `apps/web` while preserving its Git history if practical. At minimum move the current frontend files such as `src`, `public`, `index.html`, `vite.config.ts`, and frontend package metadata into that directory.

Then copy this package's `apps/api`, `apps/worker`, `packages`, `prisma`, `infra`, `scripts`, `pnpm-workspace.yaml`, `prisma.config.ts`, `tsconfig.base.json`, `.env.backend.example`, and `.gitignore.backend.additions` into the repository root.

Use `package.monorepo.json` as the basis for the new root `package.json`. Merge any scripts or dev tooling you still need from the old frontend package instead of blindly deleting them.

Merge `.gitignore.backend.additions` into the repository `.gitignore`.

## First install

Use Node 24 LTS and pnpm 10.15.1:

```bash
corepack enable
corepack prepare pnpm@10.15.1 --activate
pnpm install --no-frozen-lockfile
```

Copy and edit the environment file:

```bash
cp .env.backend.example .env
```

Generate the application encryption key:

```bash
openssl rand -base64 32
```

Put it in `APP_ENCRYPTION_KEY_BASE64` in `.env`.

## Database and Prisma

Start or point the app to PostgreSQL 18, then run:

```bash
pnpm prisma:generate
pnpm prisma:format
pnpm prisma:validate
pnpm prisma:migrate:dev --name baseline_full_backend
pnpm prisma:seed
```

Commit the generated `prisma/migrations/` directory and `pnpm-lock.yaml`.

Production must use:

```bash
pnpm prisma:migrate:deploy
```

not `migrate dev`.

## Validation gate

Run all of the following before deployment:

```bash
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:format
pnpm prisma:validate
pnpm typecheck
pnpm test
pnpm build
docker compose -f infra/docker-compose.production.yml config
docker compose -f infra/docker-compose.production.yml build
```

Then start a staging environment and test at minimum:

1. login/logout/session expiry;
2. RBAC across two distinct users;
3. intake → client → matter conversion;
4. task dependency and stage-gate enforcement;
5. handoff creation + acknowledgement;
6. real document upload/download/versioning;
7. controlled calendar reschedule + revision/audit;
8. court filing/service tracking;
9. expense approval and posting;
10. client-money vs office-money separation;
11. firm mark/signature application creating a new immutable document version;
12. worker jobs and retry behavior;
13. backup and restore rehearsal.

## Initial administrator

The seed process supports:

```env
SEED_ADMIN_EMAIL=admin@example.co.ke
SEED_ADMIN_NAME=System Administrator
SEED_ADMIN_PASSWORD=replace-with-a-long-random-bootstrap-password
```

After seeding, change the password immediately and remove the bootstrap password from environment/config history.

## VPS deployment

The target topology is:

```text
Internet
   │
   ▼
 Caddy :80/:443
   ├── static React build
   └── /api + /socket.io
              │
              ▼
         NestJS API
         ├── PostgreSQL
         ├── Redis
         └── private storage
              │
              ▼
           BullMQ worker
```

Only HTTP/HTTPS and restricted SSH should be public. PostgreSQL and Redis must remain private.

Useful files:

- `infra/docker-compose.production.yml`
- `infra/Caddyfile`
- `infra/DEPLOYMENT_CHECKLIST.md`
- `infra/RESTORE_RUNBOOK.md`
- `infra/scripts/bootstrap-vps.sh`
- `infra/scripts/deploy.sh`
- `infra/scripts/backup-postgres.sh`
- `infra/scripts/backup-documents-restic.sh`

## Integration truthfulness rule

Provider adapters must never simulate production success. A provider that is not implemented or not configured must return an explicit unavailable/not-configured/not-implemented status. Court filing, messaging and money movement must never be represented as successful unless the external provider actually confirms it.

## Firm seals, signatures and stamps

The marks subsystem is designed around controlled, versioned assets and immutable document output. Applying a mark/signature should create a new document version and audit the mark asset/version, placement, signer/authorizer, input/output checksum and timestamp. Visual marks must never be described as cryptographic digital signatures unless a genuine signing provider performed that operation. Court/registry seals must never be fabricated.
