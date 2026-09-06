# Prisma migrations

`202609060000_baseline` captures the schema before the branding/document workflows. Later migrations add processing provenance, signature application references, the firm branding setting and signature dimensions. Blank deployment and upgrading a disposable copy of the original schema have been exercised; use the verification record in `docs/DOCUMENT_WORKFLOWS.md`.

For a blank database, run `pnpm prisma:migrate:deploy`. For an existing database that already has the original schema but no migration history, first compare it to the baseline. Only after confirming equivalence, mark `202609060000_baseline` as applied with `prisma migrate resolve --applied 202609060000_baseline`, then deploy the remaining migrations. Do not run the baseline CREATE statements against existing tables.

Run `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code` after deployment to detect drift. Existing signature versions retain nullable dimensions; new uploads store decoded dimensions. Historical files and document versions are retained.

Production uses `migrate deploy`, never `migrate dev`. The disposable local upgrade does not substitute for checking the actual deployment database and its backup.
