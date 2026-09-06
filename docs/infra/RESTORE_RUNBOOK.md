# Restore Runbook

## Principle

Never test a restore over the production instance.

Create an isolated restore environment.

## Database pilot restore

1. Stop any isolated target API/worker.
2. Start a clean PostgreSQL 18 target.
3. Create target database.
4. Restore:

```bash
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --dbname="$RESTORE_DATABASE_URL" \
  /path/to/backup.dump
```

5. Run application against target database.
6. Confirm:
   - organization loads,
   - user login works,
   - known matter opens,
   - known task is present,
   - known finance record is present.

## Documents

Restore to an isolated directory:

```bash
restic restore latest \
  --target /srv/kklaw-restore \
  --tag kklaw-documents
```

Confirm database document storage keys resolve to restored files.

## Completion record

Record:
- backup timestamp
- restore date
- person performing restore
- database success
- document success
- application smoke-test result
- problems found
