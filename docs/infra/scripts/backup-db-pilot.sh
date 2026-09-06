#!/usr/bin/env bash
set -euo pipefail

# Pilot-safe logical backup example.
# Production-critical deployment should graduate to pgBackRest/PITR.
#
# Required env:
# POSTGRES_DB POSTGRES_USER PGPASSWORD
# Optional:
# BACKUP_DIR

BACKUP_DIR="${BACKUP_DIR:-/srv/kklaw/backups/postgres}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$BACKUP_DIR"

docker compose -f /srv/kklaw/app/infra/docker-compose.production.yml exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc \
  > "$BACKUP_DIR/${POSTGRES_DB}_${STAMP}.dump"

find "$BACKUP_DIR" -type f -name '*.dump' -mtime +14 -delete
echo "Database backup completed: $STAMP"
