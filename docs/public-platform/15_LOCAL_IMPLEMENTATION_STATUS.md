# Local public-platform implementation

The approved plan covers the public renderer, governed CMS, immutable static publishing, media, lead handoff, local deployment rehearsal and acceptance evidence. Production and staging are excluded.

## Acceptance register

| Area | Required evidence | Status |
| --- | --- | --- |
| Shared presentation boundary | Import check; public/OS builds | Public boundary check passed for 33 files; API, worker and public builds passed; OS typecheck passed |
| Reference fidelity | Desktop/mobile screenshots and inspected responsive states | Nine widths passed without overflow; desktop/mobile inspected. Clean original hero and portrait assets and final visual acceptance remain open |
| CMS and preview | Edit, review, isolated preview, conflict detection | Page/publication conflict detection and review permission verified against PostgreSQL. Private token, no-store and unauthenticated rejection passed; full editor acceptance tracked below |
| Publishing | Frozen snapshot, HTML artifacts, atomic activation, rollback | Real render, frozen capture, draft isolation, failed-build preservation and snapshot rollback passed |
| Media | Variants, private drafts, retained release references | Approved portrait variants generated; static copies and file hashes verified; public byte-range response passed. S3 export remains explicitly blocked |
| Leads | Validation, receipt, retries, ownership, calendar, qualified intake | Browser submission persisted and visible to authenticated staff. Replay, cross-firm rejection, concurrent appointments/intakes and conversion gate passed. Local SMTP capture verified |
| Local rehearsal | Real database/Redis, local release server, recovery | Isolated migrated PostgreSQL, Redis and Mailpit running. Caddy origins returned 200. Cold database-outage recovery and isolated backup restore passed |
| Launch readiness | Approved original assets and verified business claims | Future launch gate |

Existing website migration history is preserved. Manifest JSON can hold complete release snapshots without rewriting applied migrations. Reference-derived assets remain development assets. No provider delivery, staging or production success is implied by local checks.

## Evidence from 10 September 2026

- `apps/api/test/website-integration.test.cjs`: passed against `kka_public_local`, including a deliberate unsupported-block build failure and rollback. These failed fixture releases remain in the local release history as evidence.
- API foundation/JSON suite: six tests passed, covering scoped permissions, CSRF and JSON preservation/validation.
- `scripts/check-public-browser.mjs`: passed at 360, 390, 430, 640, 768, 1024, 1280, 1440 and 1920 pixels. No browser page errors; menu, validation, persisted receipt, staff visibility, reload, 404, preview token access and media ranges passed.
- Browser evidence: `.artifacts/public-browser/result.json`, with a dated screenshot directory. Public JavaScript: approximately 136.84 KB gzip in the checked build.
- `scripts/check-public-recovery.mjs`: cold-started a separate site process with an unreachable database and verified the cached release HTML and its static media.
- `scripts/check-public-backup.mjs`: restored a fixture dump into `kka_public_restore_1789058203223`, matched key table counts and verified every file in the active release. Evidence: `.artifacts/public-backup/kka_public_restore_1789058203223/verification.json`. This covers the isolated database and active artifact, not a full production storage/retained-history restore.

## Remaining acceptance work

The platform is not yet claimed fully launch-ready. Outstanding work includes clean original visual assets and final reference acceptance, exhaustive accessibility/performance checks, scheduled-publish and interrupted-worker recovery, redirect history, publication video/caption management and playback fixtures, complete role-by-role CMS acceptance, and a full retained-history/storage backup restoration. External delivery and all staging/production work remain outside this local scope.

Use [the local rehearsal runbook](16_LOCAL_REHEARSAL.md) for startup, data isolation, publishing and recovery commands.
