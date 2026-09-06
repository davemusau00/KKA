# Prisma migrations

This kit intentionally includes the authoritative `prisma/schema.prisma` but does not pretend a generated migration was validated when dependencies were unavailable in the artifact-building environment.

After merging and installing dependencies, generate and commit the first migration on a disposable development PostgreSQL 18 database:

```bash
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:migrate:dev --name baseline_full_backend
```

Commit the generated directory under `prisma/migrations/`. Production must use only:

```bash
pnpm prisma:migrate:deploy
```

Never run `migrate dev` against production.
