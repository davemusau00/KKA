# Branding and document workflow verification

Updated 2026-09-07. This evidence covers the branding/document milestone, not completion of the broader law-firm OS.

## Implemented workflows

- Firm Profile uploads, previews, persists, replaces and restores the app logo. The firm setting selects an immutable LOGO version. Public branding is scoped by `PUBLIC_BRANDING_FIRM_ID`; stamps, signature files and history remain authenticated. The default pillar source is preserved, with display opacity corrected for its unusually faint alpha channel.
- Marks use private storage and API-backed versions, policy editing, retirement and history. PNG/JPEG files receive a full decoded-image validation, dimension limits, normalized PNG storage and checksums. Signature uploads reset approval. Uploaded, drawn and typed representations are supported, with explicit expiring and revocable delegation.
- Documents supports real upload/download/version selection, multi-page PDF placement, drag/resize and numeric controls, reusable presets, rendered previews, password confirmation, approvals and immutable draft outputs. Approval and rendering completion are separate states. Database version allocation and audit appends are serialized; operation keys prevent duplicate output on retries.
- Templates supports structured headings/paragraphs/tables/header/footer and uploaded DOCX, immutable draft versions, preview, publication, retirement and queued generation. Merge values come from authorized records and allowlisted inputs. Logos are pinned when queued. Controlled template placements are loaded onto the generated PDF for review and application through the same approval pipeline; generation alone does not apply them. Editable DOCX contains no application-pipeline stamps or personal signatures.

## Evidence

- The original 13 frontend integration errors were repaired; explicit web typechecking now exists. The full monorepo production build and all workspace typechecks passed.
- Six rendering/storage tests passed, including corrupt/mislabelled images, decoded dimensions, rotated PDF bounds, original preservation, allowlisted merges, portable storage paths and wide-logo Word embedding.
- Eleven API/worker integration tests passed against disposable PostgreSQL and Redis, including firm isolation, reauthentication, retired assets, approval separation/retry, private signatures, concurrency, structured preview/generation and real LibreOffice DOCX/PDF conversion.
- The final API run includes delegation selection/use/revocation and simultaneous identical-request deduplication; all eleven passed against the packaged worker without source overlays.
- All nine browser tests passed in the final run: persistence/default restoration, PDF placement/preview, six light/dark layouts at 360, 768 and 1440 pixels, wide transparent branding/favicon/keyboard/failure fallback, and template authoring/publication/generation/reload. Screenshots were visually inspected.
- Blank database deployment and upgrade from the original schema passed. The upgrade schema diff reported no changes.
- The worker converter image built with LibreOffice, Chromium and fonts (LibreOffice 7.4.7.2 and Chromium 152.0.7977.82); cross-platform API-to-worker integration exposed and led to a fix for Windows path separators.

The local test logs and screenshots are in ignored `.artifacts/`. Earlier blanket claims that an empty runner proved acceptance, or that every OS module was integrated, are superseded by this scoped evidence. Production deployment, production data migration, S3-provider behavior and operational backup/restore are not established by these local tests.

## Repeatable local checks

Start the dedicated dependencies with `docker compose -f infra/docker-compose.document-tests.yml up -d`. Use a local ignored environment file with the dedicated database, Redis, encryption key, storage roots and explicit public branding firm. Never point the integration tests at production; they require a database name beginning `kka_documents_` and create synthetic fixtures.

Run `pnpm prisma:generate`, `pnpm prisma:validate`, `pnpm build`, `pnpm --filter @kka/web typecheck` and `pnpm --filter @kka/document-engine test`. Start the built API and worker with the same database and shared private storage. The worker needs `LIBREOFFICE_PATH` and `CHROMIUM_EXECUTABLE_PATH`, or use its Dockerfile. Windows and Linux roots may differ, but the relative stored keys and mounted files must match.

From `apps/api`, run `node --env-file=../../.env.documents.local --import tsx --test test/document-workflows.test.ts`. From `apps/web`, with Vite on 5173 and the API on 3015, run `node --env-file=../../.env.documents.local node_modules/@playwright/test/cli.js test`. The browser suite uses installed Chrome.

Run `node --env-file=.env.documents.local --import tsx scripts/seed-document-templates.ts` to add demonstration letter, pleading and Word-letter drafts once. It uses the explicitly configured firm and seed administrator. Review and publish these drafts in Documents ? Templates; they are demonstration material, not approved legal forms.

## Converter references

Word conversion uses LibreOffice's documented [`writer_pdf_Export` command interface](https://help.libreoffice.org/latest/eo/text/shared/guide/pdf_params.html). Structured output uses Chromium through [Playwright `page.pdf`](https://playwright.dev/docs/next/api/class-page#page-pdf), with script execution disabled and network requests blocked for generated pages.
