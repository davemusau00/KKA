# Predeployment foundation

Updated 2026-09-07. This record covers install, browser/API transport and authorization corrections. Broader launch phases remain tracked in [PRODUCTION_CONVERSION.md](PRODUCTION_CONVERSION.md).

## Clean install

1. Install the repository Node/pnpm versions, then `pnpm install --frozen-lockfile`.
2. Configure a clean PostgreSQL database and run `pnpm prisma:migrate:deploy`. Do not generate a new baseline.
3. Review `PUBLIC_BRANDING_FIRM_ID`, `BOOTSTRAP_FIRM_NAME`, `BOOTSTRAP_FIRM_SHORT_NAME`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD` and `BOOTSTRAP_BRANCHES_JSON`. The branch JSON is an array of explicit `code`/`name` objects; no second office is inferred from prototype labels.
4. Run `pnpm bootstrap:production`. Remove the bootstrap password from the environment after use. This creates one firm, one legal entity, reviewed branches, the initial administrator, the technical administrator permission catalog and one audit event. It does not create clients, matters, templates, published workflow policy, ledgers, balances or provider connections.
5. Configure firm-approved operational policies through the subsequent delivery phases before staff launch.

Bootstrap serializes concurrent runs inside a database transaction. An exact repeat is a no-op, including when a different password is supplied; it is not a password-reset command. It refuses an existing installation without its bootstrap evidence. `pnpm seed:fixtures` and the legacy Prisma seed are synthetic test/development tools and reject `NODE_ENV=production`.

## Browser/API boundary

- The API rejects production startup with insecure/shared session cookies, disabled CSRF, missing public firm selection, non-HTTPS origins or an invalid encryption key. Session cookies never set Domain.
- CSRF covers login, invitation acceptance, uploads, PDF previews and other mutating routes. Signed expiring tokens are delivered through a no-store endpoint and an HttpOnly host cookie. Valid tokens are reused across tabs; the client shares concurrent token acquisition, respects expiration and retries once only after the server's explicit pre-handler `CSRF_INVALID` rejection.
- Mutating browser requests with an Origin outside the exact configured allowlist are rejected before business handlers. CORS remains credentialed.
- Branding images and favicon canvas use credentialed CORS loading. Rendered PDF previews use the central API client and its CSRF handling. Template preview links carry the configured API host.
- Production navigation permissions come from the authenticated server response, never the local role matrix. Persona switching is disabled in production builds, including builds accidentally given the demo flag. Logout errors remain visible; successful logout reloads the application to discard in-memory records before the next session.
- Every legacy context read/write to business local storage uses a development-only adapter, including the separate marks, signature, fee-note and timer effects. Stored theme preferences remain available. This does not complete the local business mutations still awaiting server-backed workflows.
- Both request authorization and controlled-document actor refresh exclude inactive and cross-firm role memberships.

The boundary follows [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [host-only cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie) and [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html). Local separate-origin evidence does not establish real-domain HTTPS or DNS readiness.

## Repeatable acceptance

- `pnpm --filter @kka/api test`: non-empty foundation tests with real Fastify request injection; guards run before a counted business handler.
- `node --import tsx --test scripts/bootstrap.test.ts`: requires `TEST_BOOTSTRAP_DATABASE_URL` pointing to a fresh migrated database named `kka_bootstrap_*`; tests concurrency, audit, empty business tables, no password reset and refusal of a second installation.
- `node --env-file=.env.documents.local scripts/run-foundation.mjs`: requires the dedicated document test PostgreSQL/Redis database and running document worker. Builds must already exist. Starts its own API at 3016 and web at 5174, enables CSRF and uses direct cross-origin URLs, runs API then browser acceptance, and stops only its own child processes. Evidence goes to `.artifacts/` and browser `test-results/`.
- After an unchanged API has passed, `ACCEPTANCE_BROWSER_ONLY=true` selects the browser portion for UI regression. The default always runs both portions. Latest local results: 13 API/worker and 12 browser tests passed, plus 3 foundation, 6 engine and 1 fresh-bootstrap test. No skipped tests are included in those counts.
- `.github/workflows/predeployment.yml` installs from the lockfile, typechecks/builds, runs foundation/engine/bootstrap checks, blank/repeat/upgrade migrations, then API/worker/browser workflows with real LibreOffice and Chromium. Remote CI execution must be checked separately; adding the workflow is not a passed CI run.

No new database migration is required for this increment. Existing models, catalog definitions and migrations are reused.

## Organization profile conversion

Firm Profile reads the existing Firm, LegalEntity and Branch records through `GET /organization/profile`, with no prototype identifiers, invented head office or enabled court-provider switches. Legal entity and branch selection is explicit. Registration and contacts remain blank until configured; inactive records are read-only. Tagline, website and broader policy configuration remain future catalog work rather than implicit defaults.

`PATCH /organization/profile`, `PATCH /organization/legal-entities/:id` and `PATCH /organization/branches/:id/contact` validate shared allowlisted contracts. They require settings/branch administration permissions, restrict every target to the session firm, reject inactive targets and require the timestamp read at edit start. A conditional update returns `409 VERSION_CONFLICT` for stale or duplicate writes. Each successful update and its audit event commit together. No new schema or migration is required.

The first domain-specific [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/quick-start) hook now owns this profile. Query caches are scoped to the current user, held only in memory and cleared on session changes. Mutations are online-required, have no optimistic/local save or queued retry, and invalidate only server-confirmed profile data. The form retains its original version during background refresh, preserves unsaved inputs on failure and provides reload/cancel controls.

Acceptance adds concurrent/stale writes, direct permission/cross-firm denial, input validation, inactive entity denial, second-user reads, browser save/reload, failed network save and stale browser edits. The existing unversioned branch administration endpoints and the rest of the organization workspace remain outside this converted slice.

The frontend now explicitly installs React 19 type declarations. Their absence had masked legacy state/field errors in prior checks. Corrections align task deadlines/priorities, notification recipient/category fields, audit arguments and filing/service field names. The filing simulator no longer manufactures court or receipt references; local filing/service saves are disabled outside development demo mode. Those workspaces remain incomplete.

## Remaining launch work

The context still contains legacy business mutations and seed imports. Remaining domain Query/Router conversion, server-controlled module flags, exhaustive action capability register, account recovery/MFA/session administration, complete domain workflows and broad record-access policy enforcement remain open. The API tests here cover foundation, organization profile and document workflows; they are not acceptance for finance, HR, procurement, portal, communications or advanced platform modules. Staging provider isolation, packaged release rehearsal, monitored outages, reviewed imports and measured off-site restoration remain release gates.
