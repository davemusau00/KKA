#!/usr/bin/env bash
set -euo pipefail
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.production.yml}"
BACKUP_ROOT="${KKA_BACKUP_ROOT:-/srv/kklaw/backups}/postgres"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_ROOT"
docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc > "$BACKUP_ROOT/kka-${STAMP}.dump"
find "$BACKUP_ROOT" -type f -name 'kka-*.dump' -mtime +35 -delete
printf 'Created %s\n' "$BACKUP_ROOT/kka-${STAMP}.dump"
