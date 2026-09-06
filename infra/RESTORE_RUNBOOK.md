# KKA Restore Runbook

1. Declare an incident owner and stop write traffic if restoring production.
2. Preserve the damaged/current state before overwriting it.
3. Select the database dump and matching document/restic snapshot by timestamp.
4. Restore PostgreSQL using `infra/scripts/restore-postgres.sh` into a clean/test target first.
5. Run `pnpm prisma:migrate:deploy` only if the restored backup predates committed migrations.
6. Restore document and mark volumes using Restic into the expected private storage roots.
7. Start API/worker; verify readiness, login, matter retrieval, document checksums, ledger balances and audit trail.
8. Compare client/trust account totals and matter/document counts with pre-incident monitoring/export records.
9. Only then return Caddy/application write traffic to users.
10. Record the incident, restore point, operator, verification evidence and any data loss window.

Never treat "backup command succeeded" as proof of recoverability. Schedule routine restore tests.
