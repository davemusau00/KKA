#!/usr/bin/env bash
set -euo pipefail
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.production.yml}"
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm typecheck
pnpm test
pnpm build
pnpm prisma:migrate:deploy
pnpm --filter @kka/web build || true
docker compose -f "$COMPOSE_FILE" build --pull api worker
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
sleep 5
docker compose -f "$COMPOSE_FILE" ps
