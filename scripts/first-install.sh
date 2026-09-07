#!/usr/bin/env bash
set -euo pipefail
command -v pnpm >/dev/null || { printf 'Install pnpm 10.15.1 before running this script.\n'; exit 1; }
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm prisma:validate
printf '\nDependencies installed and Prisma client generated.\n'
printf 'Next: configure a clean PostgreSQL database, then run pnpm prisma:migrate:deploy.\n'
printf 'Production: review BOOTSTRAP_* configuration, then pnpm bootstrap:production.\n'
printf 'Synthetic development/test database only: pnpm seed:fixtures.\n'
