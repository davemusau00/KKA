# KKA LAW FIRM OS
## Current Product, Engineering & Production Gap Register

**Repository:** `davemusau00/KKA`  
**Audit basis:** `main` at `4b496caa9d4bf8a44eb18b141bfb38235df8a067`  
**Audit date:** 14 September 2026  
**Previous gap-register refresh:** `2a461056a238348f9637bb4882bd3454a9f65662`  
**Purpose:** Maintain one truthful register of what is complete, what is partially implemented, what has regressed, and what must be proven before KKA can be treated as an operational law-firm system.

---

# 1. Executive status

KKA has crossed the architectural bridge from the original browser-only prototype into a real full-stack application. The repository now contains the production-shaped core we originally required: React web application, NestJS/Fastify API, Prisma/PostgreSQL, Redis/BullMQ worker infrastructure, real authentication flows, object-level authorization, legal workflow services, finance ledgers, document infrastructure, Docker/Caddy deployment assets, automated tests and a predeployment workflow.

However, **the current `main` branch is not release eligible**.

The latest GitHub Actions predeployment run for HEAD `4b496caa` fails at:

```text
pnpm prisma:validate && pnpm typecheck && pnpm build
```

Because this foundational gate fails, the downstream acceptance stages are skipped, including public-site SSR/boundary checks, web test typechecking, API/document tests, authorization regressions, migration/bootstrap verification, worker acceptance and cross-origin browser acceptance.

The ten most recent visible predeployment runs, **61 through 70**, are all red. Therefore previous statements describing the CI gate as passing must be treated as historical, not current.

## Current classification

| Area | Current state | Release effect |
|---|---|---|
| Core architecture | **Implemented** | Strong foundation |
| Backend/API | **Implemented** | Strong foundation |
| PostgreSQL persistence | **Implemented** | Strong foundation |
| Authentication lifecycle | **Implemented** | Strong foundation |
| Server-side RBAC/object access | **Implemented and tested previously** | Must re-pass CI |
| Finance ledger controls | **Implemented and tested previously** | Must re-pass CI |
| Court outcome/deadline engine | **Implemented and tested previously** | Must re-pass CI |
| PI backend domain | **Broadly implemented** | Frontend authority still partial |
| PI frontend hydration | **Substantially advanced** | Acceptance incomplete |
| Operations / meetings | **Expanded on current main** | Unaccepted while CI is red |
| Routing / deep links | **Improved** | Coverage/refresh proof still needed |
| Help center / guided tour | **Implemented visually** | Non-blocking |
| Live provider integrations | **Credential/deployment dependent** | Open |
| Client portal public E2E | **Incomplete acceptance** | Open |
| VPS production proof | **Not completed** | Blocking |
| Disaster recovery restore proof | **Not completed** | Blocking |
| Current CI | **FAILING** | **P0 blocker** |

### Release verdict

> **Implementation maturity is high, but current release status is BLOCKED.**

Do not label the current SHA “production ready”, “predeployment complete” or “fully accepted” until a full green predeployment run executes all downstream stages against the same commit that is proposed for release.

---

# 2. What changed since the previous gap-register refresh

There are 12 commits on `main` after the previous gap-register refresh commit `2a461056`. The important product changes are:

### PI workspaces moved toward server authority

Server loading/error handling and live mutations were added or expanded in:

- `IncidentEvidenceWorkspace`
- `MedicalManagementWorkspace`
- `ClaimNegotiationWorkspace`
- `HearingPreparationWorkspace`
- `SettlementDistributionWorkspace`

This materially closes the old gap where these screens were mainly client-side representations of backend capabilities.

### Resource deep linking improved

Client, task and court selections now have URL/deep-link support. This is a meaningful improvement over workspace-only navigation and is the correct direction for reloadable operational URLs.

### Guided onboarding expanded

A `GuidedTourEngine` and a significantly expanded Help Center have been added. This addresses the earlier usability/onboarding gap, although onboarding is not a substitute for acceptance of core legal workflows.

### Operations expanded

The current branch adds:

- project financial summaries
- meeting-series models and API operations
- recurring meeting occurrence logic
- Operations workspace support for the new capabilities

This closes part of the earlier “internal projects / meetings / firm operations” product gap.

### Schema changed materially

The Prisma schema changed substantially while meeting-series/project functionality was introduced. That makes clean migration, fixture migration and upgrade-path acceptance especially important before release.

### CI regressed

The feature work above landed while the predeployment workflow remained red. This is the dominant new gap and takes priority over further feature expansion.

---

# 3. P0 blockers: must close before any operational release

## P0-01 — Restore the predeployment pipeline to green

**Status:** OPEN / REGRESSION  
**Owner class:** Engineering  
**Priority:** Immediate

Current HEAD fails the combined Prisma validation, TypeScript typecheck and build gate. All later acceptance stages are consequently skipped.

### Required closure

1. Reproduce the failing command locally against exact HEAD.
2. Fix every Prisma/type/build error rather than bypassing the gate.
3. Push one coherent repair commit.
4. Require a green `Predeployment acceptance` run on that commit.
5. Confirm downstream stages actually execute, rather than merely seeing the workflow marked completed.
6. Preserve the green commit SHA as the candidate release baseline.

### Acceptance evidence

```text
prisma:validate             PASS
typecheck                   PASS
build                       PASS
public SSR/boundary         PASS
web test typecheck          PASS
API/document tests          PASS
authorization regressions   PASS
clean migrations            PASS
fixture/repeat migration    PASS
upgrade migration           PASS
worker acceptance           PASS
browser acceptance          PASS
```

No release exception should override this blocker.

---

## P0-02 — Re-prove schema and migration safety after the latest Prisma changes

**Status:** BLOCKED BY P0-01

The meeting-series/project work materially changed `prisma/schema.prisma`. The CI migration stages that normally prove clean bootstrap, fixture migration, repeated deployment and upgrade from the original baseline are currently skipped because the earlier build gate fails.

### Required closure

- `prisma validate` passes.
- Empty database bootstrap succeeds from migrations only.
- Existing fixture database upgrades without destructive drift.
- `prisma migrate deploy` is idempotent on a fully migrated database.
- The upgrade path from the known production/baseline schema is exercised.
- No manual “schema fix” script is required to make production start.
- Meeting-series rows and relations survive restart/redeploy.

Until this is proven, the new Operations schema is **implemented but unaccepted**.

---

## P0-03 — Finish authoritative PI CRUD, not just server hydration

**Status:** PARTIAL

The PI UI conversion is real progress, but several screens still fail the full “server record → reload → same result” contract.

### Confirmed current examples

#### Incident / Evidence

Server mode now loads the PI profile and creates incident/profile, vehicle and witness records. However:

- removing a vehicle currently filters React state only;
- removing a witness currently filters React state only;
- those removals are not persisted by a server DELETE mutation in the workspace;
- therefore deleted rows can return after reload.

#### Medical Management

Server mode now loads injuries, treatments and medical reports and can create injuries/report requests. However:

- removing an injury currently changes local state only;
- removing a medical report currently changes local state only;
- providers, P3 and imaging/records are still not fully hydrated into the current live screen model;
- the live screen therefore represents only part of the medical case domain.

#### Negotiation

Offers are now persisted to the PI API and settlement authority is written to the server, but insurer/claim header data is not yet being hydrated from a first-class server claim record in this workspace.

### Required closure

For every editable control in Incident, Medical, Liability/Quantum, Negotiation, Hearing, Judgment, Recovery, Settlement and Closure:

```text
Create → server record
Edit   → server mutation
Delete → server mutation / audited archival behavior
Reload → exact persisted state
Second authorized session → same state
Unauthorized session → denied
Audit event → present where material
```

A control must not look operational if it only changes component state.

---

## P0-04 — Remove synthetic legal/financial fallback values from live mode

**Status:** OPEN / DATA-TRUTHFULNESS REGRESSION

The system previously removed broad fake operational seed behavior from server mode. Some newer PI UI logic has reintroduced synthetic numeric fallbacks that can produce plausible-looking live values even when the server has no corresponding record.

### Confirmed example: Claim Negotiation

The current live calculation path falls back to values such as:

```text
Insurer offer:          1,200,000
Firm demand:            1,850,000
Recommended settlement: 1,400,000
```

when corresponding ledger/settlement values are absent.

That is acceptable in explicit demo mode only. In live mode, an empty server record must render as empty/unknown/not recorded, never as a believable legal or financial fact.

### Required closure

- All monetary/legal fallback facts gated behind explicit demo mode.
- Live KPIs return `0`, `null`, “Not recorded” or a disabled state when no server evidence exists.
- No generated insurer, doctor, police, court, settlement or client fact appears in live mode.
- Add an automated regression test for empty PI matters.

> In a law-firm OS, a beautiful invented number is worse than an empty field.

---

## P0-05 — Settlement/distribution must use authoritative finance rules

**Status:** PARTIAL

SettlementDistribution now reads the server finance settlement position and PI settlement record, which is a major improvement. However the UI still performs business-critical calculations locally, including default professional-fee and VAT calculations, and the live “disburse now” path is not implemented through the server UI flow.

### Current concerns

- default professional fee calculation is effectively `20%` when no fee has been entered;
- VAT is calculated client-side at `16%`;
- outstanding-disbursement detail is not being populated from the authoritative finance settlement position into the editable breakdown;
- server-mode `handleDisburseNow` intentionally returns without executing a payout;
- saving a PI settlement record is not the same operation as posting a client-funds disbursement journal.

### Required closure

- Fee policy must come from configured/legal engagement terms, not a hard-coded UI percentage.
- VAT/tax treatment must be configuration/domain logic, not presentation logic.
- Settlement statement must be generated from authoritative ledger evidence.
- Partner/client approvals must be real approval records.
- Client payout must post through the finance service with balanced journal entries, idempotency and audit.
- UI must never imply “paid/disbursed” until finance confirms the transaction.

---

## P0-06 — Re-run browser acceptance for the new hydrated workspaces

**Status:** BLOCKED BY P0-01

Because the current workflow fails before browser acceptance, the new PI hydration, deep-link routing, guided tour and Operations additions do not yet have current browser acceptance evidence.

### Browser acceptance must cover

- login and session restore;
- client deep link and refresh;
- task deep link and refresh;
- court event/filing deep link and refresh;
- PI incident create/edit/delete/reload;
- PI medical create/edit/delete/reload;
- negotiation create/save/reload;
- hearing preparation save/reload;
- settlement position load/save/reload;
- permissions for restricted users;
- direct URL navigation after server restart;
- separate web/API origins with production-like cookie/CORS behavior.

---

## P0-07 — Staging VPS deployment proof

**Status:** OPEN

Repository infrastructure is no longer the main problem. Operational proof is.

### Required closure

Deploy the candidate green SHA to a real staging VPS with:

- PostgreSQL
- Redis
- API
- web application
- worker
- document engine/converters
- Caddy/TLS
- persistent document storage
- production environment variables
- backup jobs

Then prove:

- HTTPS/TLS
- cookie security and login persistence
- CORS across intended origins
- restart recovery
- worker recovery
- document upload/download/preview
- database migration at deploy time
- log capture
- health/readiness endpoints
- resource limits
- reverse-proxy upload limits/timeouts

---

## P0-08 — Disaster recovery restore drill

**Status:** OPEN

Backups do not count as a recovery system until restoration is proven.

### Required closure

1. Create database + document-storage backup.
2. Destroy or isolate the staging data services.
3. Restore into clean infrastructure.
4. Log in with a real test user.
5. Open representative clients/matters/documents/finance records.
6. Verify audit continuity and document integrity.
7. Record RPO/RTO and exact restore runbook.

---

# 4. P1 gaps: required for firm rollout / strong controlled release

## P1-01 — Finish PI screen coverage beyond the currently hydrated slices

**Status:** PARTIAL

The backend domain is broader than the current authoritative frontend coverage. Complete server-backed UX for:

- medical providers;
- P3 details;
- imaging and medical records;
- insurer/claim record;
- notice/demand metadata and delivery evidence;
- negotiation approval workflow;
- hearing witnesses/documents/readiness;
- judgment/award capture;
- recovery/execution;
- settlement approvals and statement;
- closure checklist and supervisor approval.

The release contract remains: no fake state, full reload survival, authorization and audit.

---

## P1-02 — Operations and meeting-series acceptance

**Status:** IMPLEMENTED / UNACCEPTED

The current branch introduces substantial project-financial and recurring-meeting capability, including API/controller/service/schema/UI work.

### Required closure

- CI green with this schema.
- Meeting recurrence edge cases tested: timezone, month-end, skipped occurrence, edited series, cancelled occurrence.
- Role/branch visibility verified.
- Meeting action items create/relate to real tasks where intended.
- Project financials reconcile to finance data rather than duplicate it.
- Delete/archive rules defined for meeting series.

---

## P1-03 — Complete deep-link routing coverage

**Status:** PARTIAL / IMPROVED

Clients, tasks and court resources now have deep-link support. Extend the same pattern consistently to operational resources that staff will share/bookmark:

- `/matters/:id`
- `/clients/:id`
- `/tasks/:id`
- `/court/events/:id`
- `/court/filings/:id`
- `/documents/:id`
- `/approvals/:id`
- `/intakes/:id`
- relevant Operations records

### Acceptance

A copied URL must survive refresh, login redirect, app restart and direct browser entry without depending on pre-existing AppContext navigation state.

---

## P1-04 — Live provider integrations

**Status:** OPEN / DEPLOYMENT DEPENDENT

Keep every integration explicitly truthful until real credentials and network acceptance exist.

Required provider acceptance as applicable:

- transactional email / invitations / resets;
- Google calendar/workspace integration;
- WhatsApp/SMS provider;
- M-Pesa/bank import paths;
- any Judiciary/CTS integration only where an actual supported integration exists.

No “connected”, “successful”, “encrypted”, “synced” or equivalent operational label should be shown on a timer/simulation.

---

## P1-05 — Client portal public journey

**Status:** PARTIAL

The internal product should remain the priority, but before exposing a client portal externally prove:

- invitation/magic-link lifecycle;
- expiry/replay protection;
- client-to-matter scoping;
- approved-document visibility only;
- upload request flow;
- public upload virus/type/size controls;
- rate limiting;
- SMS/email delivery;
- revocation;
- audit trail;
- no privileged notes, internal strategy or unrelated matter data leakage.

---

## P1-06 — Real data migration rehearsal and UAT

**Status:** OPEN

Before rollout:

- define import templates;
- deduplicate clients/parties;
- map branch/staff/matter ownership;
- generate/retain legacy references;
- import representative documents;
- reconcile opening finance balances;
- run dry-run migration;
- obtain firm review of imported sample matters;
- freeze/re-run final migration procedure.

No production migration should be invented around assumptions about the firm’s still-unconfirmed physical file numbering convention or second-branch metadata.

---

## P1-07 — Offline behavior must be explicitly scoped

**Status:** NOT PROVEN FOR AUTHORITATIVE WRITES

Before claiming offline support, define whether the release supports:

- read-only cached matter data;
- queued notes/tasks;
- queued document metadata;
- conflict detection;
- idempotency keys;
- retry/backoff;
- attachment queue limits;
- user-visible sync center.

Until that exists and is tested, describe the deployed system as an online web application/PWA, not an offline-first legal OS.

---

# 5. P2 gaps: post-MVP hardening and scale

These do not block the first controlled internal release once the P0/P1 acceptance bar is met, but should stay visible:

- MFA/TOTP;
- enterprise OIDC/SSO;
- OCR and full-text document search;
- retention schedules / legal hold / timestamping;
- multi-node/high-availability deployment;
- broader observability and alerting;
- dependency/security scanning policy;
- performance budgets and bundle splitting;
- accessibility audit;
- richer responsive/mobile court workflows;
- advanced offline mutation/conflict engine;
- provider webhooks and reconciliation automation;
- advanced management analytics.

---

# 6. Foundations already completed and to be protected from regression

The following should no longer be treated as “missing architecture”. They are existing capabilities that must remain green through regression tests.

### Platform

- monorepo structure;
- React web application;
- NestJS/Fastify API;
- Prisma/PostgreSQL;
- Redis/BullMQ worker infrastructure;
- Docker/Caddy deployment assets;
- shared contracts/packages.

### Security and access

- real staff login/session lifecycle;
- invite flow;
- password reset lifecycle;
- server-side role/record access service;
- branch/matter/client/task access enforcement;
- server-side notification access controls.

### Legal operations

- real intake/conflict/KYC foundation;
- transactional matter creation/reference generation;
- stage assignment/workflow services;
- matter channels;
- court outcome propagation;
- legal deadline engine;
- task/deadline creation from court outcomes;
- broad PI backend domain.

### Finance

- CLIENT vs OFFICE ledger separation;
- balanced journals;
- sequential vouchers;
- transfers/clearing;
- accounting periods/reconciliation locks;
- settlement-position service;
- server-side finance tests from the previously accepted baseline.

### Documents and workers

- document-engine architecture;
- conversion worker path;
- controlled document/download infrastructure from the accepted baseline.

### Internal operations

- HR/leave foundation;
- procurement integrity controls;
- project/operations foundation;
- meeting-series implementation now present on `main` pending current acceptance.

These items should not be rebuilt from scratch. Fix regressions and finish the authoritative UI/deployment proof around them.

---

# 7. Immediate build order

Do not add another layer of decorative functionality before the current release path is healthy.

1. **Fix current Prisma/type/build failure.**
2. **Get one complete green predeployment run on current architecture.**
3. **Re-run clean/fixture/upgrade migration acceptance after the latest schema changes.**
4. **Remove all live-mode synthetic PI monetary/legal fallbacks.**
5. **Wire server-side delete/archive mutations for Incident and Medical records.**
6. **Finish authoritative insurer/medical/hearing/settlement field coverage.**
7. **Move settlement fee/tax/payout rules into authoritative backend/configured domain logic.**
8. **Run browser acceptance across PI, clients, tasks, court and deep links.**
9. **Deploy the exact green SHA to staging VPS.**
10. **Prove TLS/cookies/CORS/storage/worker/restart behavior.**
11. **Wire live providers and mark only genuinely connected services as connected.**
12. **Run representative data-migration rehearsal and firm UAT.**
13. **Run backup/restore disaster-recovery drill.**
14. **Only then nominate a production release SHA.**

---

# 8. Release acceptance contract

A feature is considered operational only if the following are true where applicable:

```text
1. Browser action creates/updates/deletes an authoritative server record.
2. The state survives a full page reload.
3. The same state is visible from a second authorized session.
4. Unauthorized/incorrect-branch users are denied server-side.
5. Duplicate/concurrent submissions are controlled.
6. Material legal/financial mutations are auditable.
7. No demo/synthetic fact leaks into live mode.
8. API/service tests cover the domain rule.
9. Browser acceptance covers the real user flow.
10. Typecheck/build/migration acceptance is green on the same SHA.
```

A component existing in the codebase does not close a gap by itself.

---

# 9. Production nomination checklist

- [ ] Current candidate SHA has a fully green predeployment workflow.
- [ ] No skipped downstream acceptance stage due to an earlier failure.
- [ ] Clean database migration passes.
- [ ] Existing/baseline database upgrade passes.
- [ ] PI live-mode synthetic data regression tests pass.
- [ ] PI create/edit/delete/reload tests pass for critical workflows.
- [ ] Finance settlement/payout uses ledger-backed authoritative mutations.
- [ ] Object-level access regression suite passes.
- [ ] Direct deep links survive refresh/login/restart.
- [ ] Staging VPS deployment succeeds from documented procedure.
- [ ] TLS/cookie/CORS acceptance passes.
- [ ] Document upload/download/conversion survives restart.
- [ ] Redis/worker recovery is proven.
- [ ] Provider integrations used at launch are live-tested.
- [ ] Representative data migration is reviewed by the firm.
- [ ] Backup restoration drill passes.
- [ ] UAT sign-off is recorded.
- [ ] Release SHA/tag is immutable and documented.

---

# 10. Current priority summary

| Priority | Gap | State |
|---|---|---|
| **P0** | CI Prisma/type/build regression | **OPEN** |
| **P0** | Migration proof after latest schema changes | **BLOCKED** |
| **P0** | PI authoritative CRUD completeness | **PARTIAL** |
| **P0** | Synthetic live PI monetary/legal fallbacks | **OPEN** |
| **P0** | Settlement authoritative fee/tax/payout logic | **PARTIAL** |
| **P0** | Current browser acceptance | **BLOCKED** |
| **P0** | Staging VPS deployment proof | **OPEN** |
| **P0** | Disaster recovery restore drill | **OPEN** |
| **P1** | Remaining PI screen coverage | **PARTIAL** |
| **P1** | Operations/meeting-series acceptance | **UNACCEPTED** |
| **P1** | Full deep-link coverage | **PARTIAL** |
| **P1** | Live provider integrations | **OPEN** |
| **P1** | Client portal public E2E | **PARTIAL** |
| **P1** | Real data migration/UAT | **OPEN** |
| **P1** | Offline scope/queue proof | **OPEN** |
| **P2** | MFA/SSO/OCR/HA/performance/accessibility | **DEFERRED** |

---

# 11. Audit note

This register intentionally gives precedence to **observable repository state and current acceptance evidence** over optimistic documentation language.

The system is no longer “just a prototype”; the full-stack foundation is real. The danger has moved elsewhere: a sophisticated interface can now outrun the acceptance evidence behind it.

The next milestone is therefore not “more screens”. It is:

> **one green SHA, authoritative PI workflows, a real staging deployment, and proof that the system survives reloads, restarts, concurrency and restoration.**
