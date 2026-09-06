#!/usr/bin/env bash
set -euo pipefail
corepack enable
corepack prepare pnpm@10.15.1 --activate
pnpm install --no-frozen-lockfile
pnpm prisma:generate
pnpm prisma:validate
printf '\nDependencies installed and Prisma client generated.\n'
printf 'Next: start PostgreSQL, then run: pnpm prisma:migrate:dev --name baseline_full_backend\n'
printf 'Commit pnpm-lock.yaml and the generated migration before deployment.\n'
