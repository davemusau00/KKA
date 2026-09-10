# Current gap audit — 10 September 2026

Status: corrective changes implemented and locally verified. This pass covers public publishing, release serving, generated SEO and deployment/CI coverage. Document-workflow runtime acceptance, broader permission combinations, lead concurrency and complete accessibility remain to be audited. The earlier menu and workspace-resolution fixes are not treated as proof of these other areas.

The fixes in this pass are local source changes only; no production deployment is claimed. Renderer probes wrote separate artifacts. The scheduling probe used PostgreSQL but intentionally rolled back its entire transaction. Local release 14 remains active.

## Current remediation state

The original findings below are retained for traceability. Their current state is recorded here after the corrective changes and local probes:

| Gap | Current state | Local evidence |
| --- | --- | --- |
| G01 worker image missing public publisher | Fixed in source; runtime image pending | Clean Docker `build` target packages the renderer, public app and bundles; the runtime target was blocked by the external Chromium download. |
| G02 rollback consumes due scheduled content | Fixed locally | `audit-public-schedule-rollback.cjs` keeps the due page `SCHEDULED` and excludes it from the rollback snapshot. |
| G03 retained hashed assets return 404 | Fixed locally | `audit-retained-assets.mjs` returns HTTP 200 for an asset found only in a retained release. |
| G04 missing core pages become soft 404s | Fixed locally | `audit-public-release.mjs` reports `missingCorePageRejected: true`. |
| G05 publication SEO overrides ignored | Fixed locally | The same renderer audit reports custom title, description and canonical applied. |
| G06 scalar video URLs remain API-bound | Fixed locally | The renderer audit reports `scalarVideoUrlLocalized: true`. |
| G07 CI skips public publishing coverage | Coverage added; remote run pending | Workflow now runs public SSR, boundary and worker-image checks. |
| G08 worker install is not lockfile-reproducible | Fixed locally | Dockerfile uses `pnpm install --frozen-lockfile`; the clean Docker `build` target completed with the exact lockfile graph. |

The local fixes do not claim a production deployment, provider-backed publishing, a registry/pilot image run, or a remote CI result.

## Original findings (pre-fix baseline)

The descriptions below capture the defects as originally reproduced. They are retained as historical evidence; use the remediation table above for the current implementation state.

### G01 — High: the production worker image cannot run the public publisher

`apps/worker/Dockerfile:10` through its build stage copy API/worker package manifests and shared packages, then only the worker application. They never copy `scripts/render-public-release.mjs`, the public application or its client/server bundles. `apps/worker/src/processors/website-publish.processor.ts:44` invokes that script from the workspace root; the script imports `apps/site/dist-server/entry-server.js` and copies `apps/site/dist`.

Consequence: public publishing that works in the developer checkout cannot work in this worker image as defined. This is confirmed from the Dockerfile dependency chain; a fresh image was not built in this audit.

Required fix: package the renderer, both public bundles, and their runtime dependencies into the publishing worker, then run an actual publish job inside that image.

### G02 — High: rollback consumes due scheduled content without publishing it

`apps/api/src/modules/website/website-publishing.service.ts:21` selects the supplied historical snapshot during rollback, but lines 23–24 still promote all due scheduled pages/publications to `APPROVED`. The dispatcher subsequently searches only for `SCHEDULED` rows.

Reproduction: `node --env-file=.artifacts/public.env scripts/audit-public-schedule-rollback.cjs`. A due page became `APPROVED` while `duePageIncludedInRollbackSnapshot` was false. The audit transaction was deliberately aborted, so no fixture or release was committed.

Consequence: a rollback at a schedule boundary can silently cancel automatic publication. The content waits for another manual/unrelated publish.

Required fix: keep rollback separate from scheduled-state consumption and only acknowledge scheduled revisions actually included in the intended release.

### G03 — High: release switching makes older asset URLs unavailable

`scripts/serve-public-release.mjs:32`–35 only resolves files listed in the active release. Retaining older release directories does not make their hashed assets reachable.

Live read-only probe: `assets/index-B4QAv2LZ.js` exists in retained release `cmtvp9scz0000xgi4l768whyk` but returns HTTP 404 while release 14 is active. Probe source: `.artifacts/audit-retained-assets.mjs`.

Consequence: HTML obtained before activation can request its JavaScript/CSS afterward and fail to hydrate or style. The probe confirms asset unavailability; the exact mid-navigation race was not artificially triggered.

Required fix: use release-scoped asset URLs or safely serve immutable hashed files from retained releases. Test a publish between the HTML response and dependent asset requests.

### G04 — Medium: missing core pages become indexed soft 404s

`scripts/render-public-release.mjs:34` unconditionally adds core routes. Line 44 accepts any rendered body containing an h1; the not-found component has one. A missing `/about` therefore still produces `about/index.html` and remains in the sitemap. The static server serves listed files with HTTP 200.

Reproduction: remove `about` from a copied snapshot and run `node scripts/audit-public-release.mjs`. The renderer succeeds, emits the not-found message under `/about`, and lists `/about` in `sitemap.xml`.

Required fix: validate mandatory pages before building, or omit absent routes and return a real 404. Propagate router status instead of checking for an h1 substring.

### G05 — Medium: publication SEO overrides are ignored in generated HTML

The publication route metadata spreads `p.seo` and then overwrites its title/description with ordinary content fields. The canonical URL is always derived from the route at `scripts/render-public-release.mjs:45`.

Reproduction: the renderer probe supplies distinct custom SEO title, description and canonical values. All three are ignored in the emitted article head. A later browser effect changing metadata does not correct the original static response.

Required fix: resolve metadata once with explicit field precedence and use the same result for static HTML, hydration and navigation.

### G06 — Medium: scalar video URLs are not localized into the static release

`SiteContentService.capture` resolves `videoAssetId` to a scalar API `videoUrl`. `scripts/render-public-release.mjs:20` only localizes objects with both `id` and `url`; it leaves scalar video URLs unchanged even when the media file is copied into the release.

Reproduction: the renderer probe includes an API media URL in the hero's video field and a corresponding static-media mapping. The emitted snapshot still points at the API. An existing portrait file is used only to prove URL rewriting behavior; video playback itself is not claimed tested.

Consequence: uploaded video remains dependent on the API instead of using the static copy. Static byte-range support does not fix this URL path.

Required fix: represent referenced video as a media DTO or localize typed scalar media references, then test real playback and seeking during an API outage.

### G07 — Medium: a green current CI run does not exercise public publishing

`.github/workflows/predeployment.yml:55` runs root build, but the public package's `build` only runs the client build; `build:ssr` is a separate command. The workflow invokes document acceptance at line 94 and OS browser tests, but not public release, menu, editor or website integration checks.

Consequence: public runtime packaging and publishing regressions can survive this pipeline even after workspace typechecking is repaired. The clean typecheck/build success from the prior pass remains valid within its measured scope.

Required fix: add public SSR build and isolated public-platform acceptance to CI, including a containerized publish and failure/recovery probes.

### G08 — Medium: worker container dependencies are not lockfile-reproducible

`apps/worker/Dockerfile` does not copy `pnpm-lock.yaml` and runs `pnpm install --no-frozen-lockfile`. CI uses a frozen install. Dependency ranges can therefore resolve differently in the deployable worker from the checkout that passed acceptance.

Required fix: copy and enforce the lockfile and declare all required workspace manifests before installation. Verify a clean image build with that exact dependency graph.

## Renderer evidence

`scripts/audit-public-release.mjs` generated `.artifacts/release-gap-audit/1789066868463/site` and reports `missingCorePageRejected`, `customSeoTitleApplied`, `customSeoDescriptionApplied`, `customCanonicalApplied` and `scalarVideoUrlLocalized` as true. The generated site is an isolated test artifact and was not activated.

## Next audit areas

- Real document-worker execution, authorization boundaries and failure recovery, beyond the six engine tests.
- Publication review/approval semantics, archived/deleted content and scoped draft-media handling.
- Concurrent lead ownership/status changes, replay after form-version changes and acknowledgement retry behavior.
- Public route accessibility, failure-state behavior and complete reference-image acceptance.
