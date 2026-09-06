# 22 - Current Repository Audit and Full-Product Gap Register

## 1. Audit baseline

Repository: `davemusau00/KKA`  
Branch: `main`  
Audited head: `932a49192e460f1d9ef7dc7dce4226cd2ef85f08`  
Audit date: 2026-09-06

The current repository is a broad, high-fidelity React prototype with substantial legal-domain modeling. It is not yet the production system described by the VPS architecture documents.

## 2. What should be preserved

Preserve and progressively refactor:
- visual system and responsive app shell;
- matter-centric navigation;
- PI workflow concepts;
- current domain vocabulary;
- intake/conflict/KYC concepts;
- stage ownership/handoff concepts;
- court operations screens;
- document review/version concepts;
- finance workspace concepts;
- approvals workspace;
- calendar and deadline UX;
- third-party directory;
- client portal UX concepts;
- global search, quick-create and time-tracking interaction patterns.

The target is not a rewrite for its own sake. The target is moving business truth and enforcement out of browser state into a real server architecture.

## 3. Grounded codebase state

### 3.1 Frontend package

The current `package.json` contains React, Vite 6, Tailwind, Motion, Express and Google GenAI. It does not yet contain the approved NestJS/Fastify/Prisma/Redis/BullMQ backend stack or the approved TanStack Router/Query, Dexie and Socket.IO frontend stack.

### 3.2 Navigation

`src/App.tsx` switches workspaces with `activeWorkspace` and conditional rendering. It has no real route tree, deep-linkable matter routes, route loaders, URL-preserved filters or server authorization guards.

### 3.3 State/persistence

`AppContext.tsx` is currently the de facto application service layer. It owns nearly all collections and mutators and hydrates many of them from `localStorage`. This is acceptable for prototype behavior only.

### 3.4 Current settings

`settingsData.ts` hard-codes firm profile, finance, document and security values. These appear realistic and therefore must be treated as unverified demo seed until confirmed by the firm. Any real credentials, bank details, tax identifiers or personal data must not live in a public repository.

### 3.5 Integrations

The integration UI has Google Workspace, WhatsApp, Judiciary CTS, M-Pesa and Africa's Talking screens, but connection tests are simulated with timers and success messages. Production UI must never report a connector as live unless a backend-owned test has actually succeeded.

### 3.6 Current admin

The admin workspace currently covers staff/personas, permissions, role assignment, branches and audit. It is a strong seed for a much larger Configuration Studio.


## 3.7 Improvements already present at the audited head

The repository has moved beyond several issues noted in earlier prototype research. At the audited head:
- `MattersWorkspace` renders the full `workflowStages.map(...)` board rather than truncating the PI pipeline;
- the `Matter` type now separates `supervisingUserId` from `currentStageOwnerId`;
- `StageHandoff` is modeled and the AppContext exposes handoff acknowledgment behavior, although it is still browser/localStorage state rather than database state;
- the Matter detail imports dedicated workspaces for evidence, medical, liability/quantum, negotiation, authority to litigate, pleadings, filing, service, defence, pre-trial, hearing preparation, court outcome, submissions, judgment, recovery, settlement distribution and closure;
- finance/document/calendar/approvals workspaces have received substantial recent implementation work.

This is important: do not re-open already-fixed UI gaps simply because they appeared in an earlier audit. The remaining gap is converting these concepts to durable, permissioned, testable backend behavior and then deepening the full-product modules.

## 4. Full-product gap severity definitions

| Severity | Meaning |
|---|---|
| P0 | blocks production truth, security, legal/financial integrity or deployability |
| P1 | core operational capability required before serious firm use |
| P2 | major full-product capability needed for scale/automation |
| P3 | maturity, optimization or advanced administration |
| P4 | optional innovation / future ecosystem |

## 5. P0 gaps

| Gap | Current condition | Required fix |
|---|---|---|
| Real backend | Browser prototype | Create NestJS API and worker apps |
| Durable persistence | localStorage/seeds | PostgreSQL + migrations + repositories/services |
| Real auth/session | seeded current user/persona | Argon2id + server session + Redis + cookies |
| Authorization enforcement | frontend permission checks | server-side authorization on every API action |
| Document storage | data URLs / simulated | private storage adapter + checksums + authorized streams |
| Finance integrity | aggregate UI state | double-entry/ledger-grade records, account-specific transactions, immutable posting controls |
| Client money separation | conceptual | explicit client/trust ledgers per client/matter/account and reconciliations |
| Audit integrity | client-side arrays | append-only server audit with actor/session/context |
| Integration truth | simulated success | backend adapters + health state + clear Demo/Disabled status |
| Secrets | browser settings model | backend secret vault/encrypted secrets, never returned raw |
| Deployment | frontend scaffold | monorepo + Docker Compose + Caddy + Postgres + Redis + worker |
| Backups | docs only | implementation + offsite target + restore tests |
| Tests | missing/minimal | unit, integration, contract, E2E, finance invariants, permission tests |
| Environment | AI Studio env template | production VPS env contract |

## 6. P1 gaps

- real routed application with deep links;
- API-backed clients, intakes, matters, tasks, events, documents, finance and comms;
- workflow engine with versioned templates and enforced transition gates;
- persisted stage handoff, acknowledgment and supervisor sign-off;
- atomic numbering service;
- branch and responsible-branch rules;
- real deadline engine and immutable official due date;
- calendar provider integration with conflict handling;
- inbound/outbound email capture;
- document version storage and preview;
- approvals service;
- notification service and delivery log;
- search index over authoritative records;
- import/migration tools;
- admin settings architecture;
- firm marks/signature execution controls;
- real offline queue and conflict resolution;
- production observability and job failure visibility.

## 7. P2 gaps

- custom fields/data collections;
- form builder;
- workflow builder and automation rule builder;
- knowledge/precedent management;
- meeting/minutes/action items;
- HR/leave/performance/training;
- procurement/vendors/assets;
- configurable reporting/BI;
- mature client portal;
- accounting import/reconciliation workbench;
- portal payment flow;
- external collaborator access;
- SSO/OIDC/SAML;
- multi-entity support;
- storage provider migration tooling;
- OCR/indexing pipeline;
- data retention and legal hold tooling;
- API/webhook developer platform.

## 8. P3/P4 maturity gaps

- rules/automation simulation sandbox;
- advanced workload/capacity routing;
- document assembly designer;
- custom dashboard builder;
- integration marketplace / plugin SDK;
- data warehouse/export pipelines;
- anomaly/risk insights;
- AI-assisted summarization and drafting with strict provenance and review;
- advanced cryptographic signature provider integrations;
- HA infrastructure and multi-node scale-out.

## 9. Specific prototype correctness fixes

Before expanding visual surfaces further, correct these model/UI mismatches:
- preserve the current separation of `supervisingUserId` and `currentStageOwnerId` when moving the model to the backend;
- move the existing browser/localStorage `StageHandoff` records and acknowledgements into authoritative server/database rows;
- required tasks/documents must be evaluated from authoritative records, not display-only checklists;
- use atomic backend matter reference sequences, not `matters.length + 1`;
- matter creation must choose practice area, matter type and workflow, not default all matters to PI/RTA;
- conflict/KYC labels must derive from real records;
- branch two must remain configurable until confirmed;
- normalize task statuses, calendar event taxonomy and document category identifiers;
- trust balances must come from ledger transactions, not broad receipt-minus-expense arithmetic;
- offline sync must use an idempotent mutation queue and conflict detection;
- document preview/download must use real authorized document streams;
- integration tests must call real backend adapters;
- any claim such as encryption, MFA, CTS sync or client portal token security must reflect implemented capability.

## 10. Public repository hygiene

Because the repository is public, immediately review:
- `settingsData.ts` for realistic tax, bank, phone, email and registration values;
- seed client/matter data for personal information;
- API tokens/keys in all history;
- screenshots/assets for sensitive file names;
- integration values;
- generated document examples.

If a secret has ever been committed, rotating it is more important than merely deleting the current file.

## 11. Definition of "production-converted"

The codebase is not considered converted until:
1. core records load from PostgreSQL through the API;
2. all protected actions are server-authorized;
3. uploads are stored in private durable storage;
4. real login/session exists;
5. simulated integrations are clearly removed/flagged or replaced;
6. finance posting has invariant tests;
7. audit is server-generated;
8. background jobs are real BullMQ jobs;
9. offline queue can reconcile against server versions;
10. the Docker Compose deployment can be built, deployed, backed up and restored from documentation.
