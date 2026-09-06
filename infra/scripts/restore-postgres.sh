#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then echo "Usage: $0 /path/to/backup.dump" >&2; exit 2; fi
BACKUP="$1"
COMPOSE_FILE="${COMPOSE_FILE:-infra/docker-compose.production.yml}"
[[ -f "$BACKUP" ]] || { echo "Backup not found: $BACKUP" >&2; exit 2; }
read -r -p "This will restore into ${POSTGRES_DB}. Type RESTORE to continue: " CONFIRM
[[ "$CONFIRM" == "RESTORE" ]] || exit 1
cat "$BACKUP" | docker compose -f "$COMPOSE_FILE" exec -T postgres pg_restore -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists --no-owner
