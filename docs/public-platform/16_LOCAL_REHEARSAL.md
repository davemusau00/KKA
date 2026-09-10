# Local public-platform rehearsal

This environment uses the isolated `kka_public_local` database. It must not be pointed at the existing `kka_os` database or production. The original database had no matching migration history; it was left untouched.

## Local addresses

| Component | Address |
| --- | --- |
| Published static site | http://127.0.0.1:5175 |
| OS development app | http://127.0.0.1:5173 |
| Private preview renderer | http://127.0.0.1:5174/preview |
| API | http://127.0.0.1:3016 |
| Local SMTP capture UI | http://127.0.0.1:18025 |
| Caddy public / OS rehearsal | http://127.0.0.1:18085 / http://127.0.0.1:18087 |

The direct development origins are used for authenticated browser acceptance. The Caddy origins have read-only proxy smoke evidence; authenticated Caddy-origin flows require matching origin configuration and separate verification.

## Setup and build

Run from the repository root, using the existing local PostgreSQL service. Do not print or commit `.artifacts/public.env`.

```powershell
node --env-file=.env scripts/setup-public-local.mjs
node --env-file=.artifacts/public.env node_modules/prisma/build/index.js migrate deploy
node --env-file=.artifacts/public.env --import tsx prisma/seed.ts
node --env-file=.artifacts/public.env --import tsx prisma/seed-website.ts
node --env-file=.artifacts/public.env scripts/seed-public-reference.mjs
node --env-file=.artifacts/public.env --import tsx scripts/bootstrap-public-permissions.ts
pnpm.cmd --filter @kka/api build
pnpm.cmd --filter @kka/worker build
pnpm.cmd --filter @kka/public-site build
pnpm.cmd --filter @kka/public-site build:ssr
node --env-file=.artifacts/public.env scripts/seed-public-media.cjs
```

Redis uses `127.0.0.1:16380`. Mailpit uses SMTP `127.0.0.1:11025`; its UI is on `18025`. Containers created for this rehearsal are `kka-public-redis`, `kka-public-mailpit`, and `kka-public-caddy`. Preserve other containers and occupied ports.

Start these commands in separate terminals, or use hidden Windows background processes with recorded PIDs:

```powershell
node --env-file=.artifacts/public.env apps/api/dist/main.js
node --env-file=.artifacts/public.env apps/worker/dist/main.js
node --env-file=.artifacts/public.env scripts/serve-public-release.mjs
```

The OS Vite process needs `VITE_BACKEND_URL=http://127.0.0.1:3016`. The preview Vite process needs `SITE_API_ORIGIN=http://127.0.0.1:3016`. Load the isolated environment explicitly when starting each app. Do not stop a PID unless its command line identifies a process started for this rehearsal.

## Publishing and recovery

Use Website & Growth in the OS to save a draft, preview, approve, and publish. A publish request captures a complete snapshot before queueing. The worker renders HTML and media, checks every artifact hash, then activates the completed release. The static server retains its last known release during a subsequent database outage. A cold start without a reachable database is still unavailable.

Failed builds leave the prior release active. The publishing panel exposes errors and release status. Rollback creates a new release from the historical snapshot and preserves current editorial drafts. Retained releases keep their referenced media protected from deletion.

`scripts/publish-public-local.cjs` provides deterministic local fixture publishing without requiring a running worker. Stop the rehearsal worker when using this helper or the integration test, to avoid two consumers processing the same fixture release.

```powershell
node --env-file=.artifacts/public.env scripts/publish-public-local.cjs
$env:RUN_WEBSITE_DATABASE_TESTS='1'
node --env-file=.artifacts/public.env --test apps/api/test/website-integration.test.cjs
node --env-file=.artifacts/public.env scripts/check-public-browser.mjs
node scripts/check-public-boundary.mjs
```

The integration test writes fixture drafts, releases, enquiries, appointments, and intakes in the isolated database. Do not run it against business data. Browser screenshots and results are under `.artifacts/public-browser`; release HTML, media, and checksums are under `.artifacts/public-releases`.

Acknowledgements are accepted only by the configured localhost SMTP capture. A captured message proves local SMTP acceptance, not external delivery. No production or staging deployment is included in this rehearsal.

## Remaining launch gates

Obtain clean, approved original hero/portrait/media assets; verify contact details, professional identities, metrics and testimonial permissions. The supplied concept crops are development references, including baked text in the hero crop. Complete visual acceptance, accessibility and performance checks, authenticated preview/editor acceptance, scheduling/retry recovery, redirect history, and backup restoration before claiming full readiness. S3 media export is explicitly blocked until implemented and verified.
