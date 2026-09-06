#!/usr/bin/env bash
set -euo pipefail

# Requires restic repository credentials in environment or RESTIC_PASSWORD_FILE.
SOURCE="/srv/kklaw/data/documents"

restic backup "$SOURCE" \
  --tag kklaw-documents

restic forget \
  --keep-daily 7 \
  --keep-weekly 4 \
  --keep-monthly 12 \
  --prune
