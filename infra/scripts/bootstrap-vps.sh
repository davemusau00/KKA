#!/usr/bin/env bash
set -euo pipefail
DATA_ROOT="${KKA_DATA_ROOT:-/srv/kklaw/data}"
APP_ROOT="${KKA_APP_ROOT:-/srv/kklaw/app}"
BACKUP_ROOT="${KKA_BACKUP_ROOT:-/srv/kklaw/backups}"
LOG_ROOT="${KKA_LOG_ROOT:-/srv/kklaw/logs}"
ENV_ROOT="${KKA_ENV_ROOT:-/srv/kklaw/env}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (or with sudo)." >&2
  exit 1
fi

mkdir -p "$APP_ROOT" "$DATA_ROOT"/{postgres,redis,documents,marks,caddy/data,caddy/config} "$BACKUP_ROOT" "$LOG_ROOT" "$ENV_ROOT"
# API/worker images run as the Node image's uid 1000.
chown -R 1000:1000 "$DATA_ROOT/documents" "$DATA_ROOT/marks"
chmod 750 "$DATA_ROOT/documents" "$DATA_ROOT/marks" "$BACKUP_ROOT" "$ENV_ROOT"

echo "Created KKA directories under /srv/kklaw."
echo "Copy the repository to $APP_ROOT and production.env to $ENV_ROOT/production.env."
