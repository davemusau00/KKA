#!/usr/bin/env bash
set -euo pipefail
: "${RESTIC_REPOSITORY:?RESTIC_REPOSITORY is required}"
: "${RESTIC_PASSWORD:?RESTIC_PASSWORD is required}"
DATA_ROOT="${KKA_DATA_ROOT:-/srv/kklaw/data}"
restic backup "$DATA_ROOT/documents" "$DATA_ROOT/marks" --tag kka-documents
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 12 --prune
