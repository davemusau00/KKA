# Project state and release evidence

> Current cross-domain status is maintained in [CURRENT_RELEASE_STATE.md](CURRENT_RELEASE_STATE.md). This file records dated verification evidence and remains the evidence ledger.

Updated 2026-09-07. Repository: `davemusau00/KKA`.

## Product and launch authority

The full operating product and its launch gates are defined in [PRODUCTION_CONVERSION.md](PRODUCTION_CONVERSION.md). Staff launch occurs after all agreed phases pass. Frontend: `https://os.kariukikagunda.com`. API: `https://api.kariukikagunda.com/api/v1`. Business writes are online and server-confirmed; offline synchronization and multi-node high availability are deferred.

The implementation register for local-only conversion work is [LOCAL_ONLY_CONVERSION_PLAN.md](LOCAL_ONLY_CONVERSION_PLAN.md). It covers work that can be built and verified against the local API, PostgreSQL, Redis, worker and browser stack without deployment or external provider credentials.

This record supersedes the historical tier checklist. Backend module existence, a rendered screen, compilation and empty test runners do not establish a completed workflow. Branch names, deadlines, retention and accounting defaults in synthetic fixtures require firm approval.

## Implemented increments and evidence

| Increment | Implemented behavior | Evidence and limits |
|---|---|---|
| Branding/documents | Persistent logo management, private marks/signatures, controlled PDF application, immutable drafts, approvals, queued DOCX/structured generation | [DOCUMENT_WORKFLOWS.md](DOCUMENT_WORKFLOWS.md). Earlier run: 11 API/worker, 9 browser and 6 engine tests; packaged converters and blank/upgrade migrations. |
| Clean bootstrap | Explicit firm/branch/admin inputs; atomic creation; concurrent request serialization; demo database refusal; no credential/policy reset on repeat | One test passed on fresh migrated `kka_bootstrap_foundation_0907`, including concurrency, empty business tables and one audit record. No new schema. |
| Browser/API boundary | Signed expiring CSRF tokens on login/invites and writes, exact-origin checks, credentialed images/favicon, common-client PDF preview, host-only cookies and production startup validation | Three foundation tests passed. Full separate-origin regression is tracked below. |
| Permissions/session UI | Server permissions drive production navigation; persona switching disabled; logout failures visible; successful logout clears in-memory state; inactive/cross-firm roles excluded | Role-context test passed; browser acceptance added. Full record-access policy audit remains open. |
| Organization profile | First TanStack Query domain hook; existing firm/entity/branch data replaces hard-coded profile; audited conditional writes and explicit record selection | Two additional API tests passed for concurrent/stale edits, permissions, cross-firm targets, validation, inactive entities and second-user reads. Browser save/reload, failure and stale-edit acceptance passed. No new schema. |
| Repeatable acceptance | Lockfile install, builds/typechecks, non-empty tests, bootstrap, blank/repeat/upgrade migrations, real converters and separate-origin browser/API tests | [CI workflow](../.github/workflows/predeployment.yml) added; remote CI execution remains unverified. |

See [PREDEPLOYMENT_FOUNDATION.md](PREDEPLOYMENT_FOUNDATION.md) for commands and implementation details. Local evidence is in ignored `.artifacts/`.

## Current verification run

- Foundation HTTP/configuration/role tests: **3 passed**.
- Clean bootstrap integration: **1 passed**.
- Separate-origin API/worker regression with CSRF enabled: **13 passed**, none skipped (`organization-acceptance.log`).
- Engine regression: **6 passed**, none skipped (`foundation-engine-tests.log`).
- Separate-origin browser regression: **12 passed**, none skipped (`organization-final-browser.log`), including 360/768/1440 light/dark layouts and keyboard controls. Updated screenshots inspected at all three widths.
- Full typecheck: **passed** (`organization-final-typecheck.log`). Installing missing React declarations exposed additional legacy field/type mismatches; these were corrected, and the web check now passes with the declarations present.
- Full build and browser-test typecheck: **passed** (`organization-final-build.log`, `organization-final-browser-typecheck.log`). The frontend retains a large-bundle warning; route-based code splitting remains part of the routing conversion.
- Caddy two-host configuration: **valid**, checked with the packaged Caddy 2.10 image. This does not test live DNS or certificates.
- Schema changes: **none**. All three committed migrations deployed to the fresh bootstrap database.
- The web lint command is currently TypeScript checking; no independent repository lint suite is claimed.

## Remaining predeployment work

| Phase | Required before acceptance |
|---|---|
| 0 | Exhaustive per-action capability register, server-controlled module flags, removal of remaining synthetic business state, verified CI/clean install. |
| 1 | Remaining domains on TanStack Query; Router and stable detail URLs; account recovery/MFA/session administration; complete organization/settings administration; shared record-access policies. |
| 2 | Server-confirmed conflict/KYC/consent/engagement, matter lifecycle/gates, assignments/timeline and reviewed imports. |
| 3 | Tasks/deadlines/calendar propagation, filing/service evidence, hearings/outcomes, PI lifecycle through closure and document integration. |
| 4 | Communications, delivery states, providers/manual alternatives, authorized attachments, reminders and safe retries. |
| 5 | Client/office ledgers, allocations/reversals, reconciliation, fees/WIP, settlements, locks and financial reports. |
| 6 | HR/leave, procurement/vendors/custody, meetings/knowledge and explicit external grants with cross-client denial tests. |
| 7 | OIDC, OCR/search, reporting/exports, versioned automation, API clients/webhooks, retention/holds and cryptographic signing. |
| 8 | Staging provider isolation, identified release artifact, imports, cross-role acceptance, outage/performance tests, monitoring and measured off-site restore. |

`AppContext.tsx` still contains local business mutations and seed imports. Disabling persistence does not make those workflows server-confirmed. Those domains remain incomplete and unsuitable for routine staff launch.

The legacy matter filing/service editors now use the declared field names and empty initial records. Fabricated receipt/case generation was removed; their local save controls are disabled outside explicit development demo mode, with an explanation. This is prototype removal, not completion of filing/service evidence workflows.

## Deployment-dependent gates

Separate staging/production provisioning, real-domain DNS/TLS/cookies/CORS/WebSockets/files, approved imports and firm policy, accountable staff acceptance, and replacement-VPS restoration remain open. Demonstrate at most one hour of data loss and restoration within four hours. Local tests do not establish these operational results.
