#!/usr/bin/env bash
set -euo pipefail
pnpm prisma:generate
pnpm prisma:validate
pnpm prisma:migrate:dev --name baseline_full_backend
printf '\nCommit the generated prisma/migrations/* directory before production deployment.\n'
