# KKA LAW FIRM OS

## Current Product, Engineering & Production Gap Register

**Repository:** `davemusau00/KKA`
**Audit basis:** current `main` at SHA `1f1ed2ac21dd45536ca89027f70f763d42032d11`
**Audit date:** 11 September 2026
**Purpose:** identify everything that remains between the present repository and a dependable, firm-wide production law-firm operating system.

---

# 1. Executive status

KKA is no longer merely a frontend prototype.

The repository now has a legitimate application architecture consisting of a React application, NestJS/Fastify API, BullMQ worker, PostgreSQL/Prisma data layer, shared contracts, document engine, Redis, Docker production topology and Caddy reverse proxy.

However, the repository's own release documentation correctly warns that **a rendered screen, an API module, compilation or an isolated passing test does not establish a completed workflow**. The intended release standard is an authoritative server-backed workflow that survives reload, behaves correctly for another user, enforces authorization, audits important changes and handles failures/concurrency correctly.

### Current readiness classification

| Level                            | Status                                    |
| -------------------------------- | ----------------------------------------- |
| Architecture                     | **Strong**                                |
| Development environment          | **Strong**                                |
| Production-shaped infrastructure | **Strong foundation**                     |
| Core server platform             | **Substantial**                           |
| Documents/branding               | **Most mature operational vertical**      |
| Intake/client/task foundations   | **Partially converted**                   |
| Calendar foundations             | **Partially converted**                   |
| Matter lifecycle                 | **Incomplete**                            |
| PI workflow                      | **Prototype-heavy / unsafe for live use** |
| Court operations                 | **Incomplete**                            |
| Finance/client money             | **Not production ready**                  |
| Communications                   | **Incomplete**                            |
| HR/operations                    | **Incomplete**                            |
| Client portal                    | **Prototype/incomplete**                  |
| Authentication lifecycle         | **Incomplete**                            |
| Production deployment proof      | **Missing**                               |
| Disaster recovery proof          | **Missing**                               |
| Firm-wide pilot acceptance       | **Missing**                               |

The central issue is therefore no longer **“does KKA have enough features?”**

It is:

> **Which visible features are actually authoritative operational systems, and which are still polished interfaces sitting over incomplete workflows?**

That distinction should control the rest of development.

---

# 2. Severity model

**P0 — Production blocker**

A defect or missing workflow capable of producing false legal, financial, operational or access-control information, losing data, leaking restricted data, or preventing ordinary recovery/operation.

**P1 — Required for staff launch**

Essential functionality expected in everyday firm operations. The system may technically start without it, but routine firm adoption would be compromised.

**P2 — Important post-core capability**

Needed for the intended full product but may reasonably follow the first controlled internal deployment.

**P3 — Advanced platform capability**

Strategic enterprise capability that can follow after the operational core is stable.

---

# 3. P0: Personal-injury workflow currently invents legal facts

This is one of the most serious outstanding product defects.

Several PI stage components still initialize an empty matter with **example legal facts instead of empty state**.

The current Judgment/Award workspace, for example, inserts:

* 20/80 liability apportionment
* KES 1,350,000 general damages
* KES 295,000 special damages
* KES 180,000 future medical expenses
* KES 185,000 costs
* 14% interest
* KES 1,556,000 award
* automatically calculated payment/appeal deadlines
* `recoveryTriggered: true`

when no judgment record exists.

That means absence of data can visually become positive evidence that a judgment exists.

### Required correction

Every PI stage must initialize with genuinely empty or explicitly unknown values.

No screen may create an implied:

* judgment;
* medical report;
* settlement;
* payment;
* court order;
* filing;
* recovery instruction;
* liability finding;
* service attempt;
* hearing result;
* approval;

unless the server contains that record.

### Acceptance criteria

A completely new PI matter must display an empty lifecycle.

Saving a stage must:

1. call an authorized API;
2. persist the exact record;
3. create the appropriate audit evidence;
4. survive page reload;
5. appear in a second authorized session;
6. never silently fabricate defaults.

**Priority: P0**

---

# 4. P0: PI stage persistence remains incomplete

The presence of PI API modules does not mean the complete PI experience is using them.

The current product plan still requires every stage of the PI lifecycle to become authoritative server state with persisted transition gates.

Outstanding operational stages include, at minimum:

* incident and evidence collection;
* initial medical state;
* treatment tracking;
* medical reports;
* permanent incapacity assessment;
* liability analysis;
* quantum analysis;
* demand preparation;
* negotiation;
* authority to litigate;
* pleadings;
* filing;
* service;
* defence;
* pre-trial compliance;
* witness/evidence preparation;
* hearing;
* submissions;
* judgment;
* decree;
* recovery/execution;
* settlement distribution;
* closure.

Several existing components still depend on local context or component-level state.

### Gap

The beautiful PI workflow currently runs ahead of the authoritative data model actually driving it.

### Required architecture

Each stage needs:

`Matter → WorkflowVersion → StageInstance → StageRecord → Documents/Evidence → Checklist → Approval/Gate → Audit → Transition`

A stage transition should be rejected unless its required conditions are satisfied.

**Priority: P0**

---

# 5. P0: Matter spine is not yet universally authoritative

A real matter backend exists, and recent work significantly improved transactional intake-to-matter conversion.

That conversion now performs conflict/KYC gating, client creation, server numbering, matter creation, matter parties and opening records inside an authoritative transaction. This is a major improvement over the earlier audit.

However, the broader application still contains matter manipulation inside `AppContext.tsx`, including local workflow transitions, stage handoffs and several matter-linked domain collections. The current release documentation explicitly says this remaining local business state is unsuitable for routine launch.

### Remaining matter gaps

Matter creation outside the validated intake conversion path must be reconciled.

Matter detail views must consume authoritative records.

Assignments must be server-backed.

Stage owner changes must be server-backed.

Handoffs must be persisted.

Matter reopen/close operations must be persisted.

Matter timeline must be generated from authoritative domain events.

Matter confidentiality/access restrictions must apply everywhere.

Matter-linked records must not exist as parallel client-only objects.

### Required invariant

There should only ever be **one authoritative representation of a matter**.

**Priority: P0/P1**

---

# 6. P0: Search authorization needs a complete record-access policy

The earlier source audit found that search operated primarily at firm scope and did not fully enforce assignment/confidentiality restrictions.

The newer project state still lists **shared record-access policies** as unfinished.

This matters because global search is one of the easiest places to accidentally reveal:

* restricted clients;
* confidential matters;
* settlement information;
* documents;
* opposing parties;
* sensitive medical data;
* financial information.

### Required correction

Search permissions must be applied before results leave the API.

Filtering results only in React is unacceptable.

The same policy engine must apply to:

* search;
* list endpoints;
* detail endpoints;
* exports;
* reports;
* document downloads;
* portal grants;
* notifications;
* global command palette;
* audit searches.

### Required test

Create:

* Partner A;
* Advocate B;
* Paralegal C;
* Finance user D;
* restricted Matter X;
* ordinary Matter Y.

Then verify what every user can and cannot discover through every possible route.

**Priority: P0**

---

# 7. P0: Finance is still not ledger-grade

Finance is probably the single biggest functional area that should **not be switched on for live money yet**.

The production conversion plan still explicitly requires:

* separate client and office ledgers;
* receipts;
* allocations;
* reversals;
* reconciliation;
* expenses;
* WIP;
* fee notes;
* settlements;
* locks;
* reporting.

The earlier UI audit found that the current finance screens could mutate local arrays and derive “trust balance” values from application state rather than accepted journal postings.

### Required financial core

KKA needs a true accounting kernel based on immutable journal entries.

At minimum:

**Accounts**

* client trust/client account;
* office account;
* bank;
* cash;
* M-Pesa clearing;
* receivables;
* expenses;
* fee income;
* disbursement recovery.

**Transactions**

* receipt;
* allocation;
* transfer;
* fee note;
* expense;
* disbursement;
* reversal;
* write-off;
* settlement receipt;
* client distribution.

### Critical invariants

Every journal must balance.

A posted transaction must never simply be edited.

Corrections happen through reversal/adjustment.

Trust funds and office funds must remain separate.

Every client-money movement must be attributable to the relevant client/matter.

Duplicate webhook/import/posting protection must exist.

Closed periods must be lockable.

### Required testing

Test at least:

`KES 1,000,000 settlement → client account → legal fees → disbursements → statutory/approved deductions → client balance → client payout → zero residual reconciliation`

and deliberately retry every posting twice.

**Priority: P0**

---

# 8. P0: Settlement distribution must eventually depend on the ledger

The legal workflow currently contains settlement distribution concepts.

That cannot remain its own independent numerical universe.

Settlement distribution must eventually be derived from:

* actual recovered funds;
* cleared client-money receipt;
* approved fee note;
* approved reimbursable expenses;
* prior client advances;
* deductions;
* final client entitlement.

### Rule

The legal workflow can propose a distribution.

Only the finance ledger should authorize and record the actual movement of money.

**Priority: P0**

---

# 9. P0: Document system is split into two realities

The standalone document workflow is one of KKA's strongest implemented areas.

The repo has persistent branding, marks/signatures, immutable generated versions, controlled operations and document approvals with meaningful acceptance evidence.

However, the matter workflow and centralized approvals historically consumed the older `AppContext` document collection instead.

The earlier audit also found local signing logic capable of manufacturing “digitally signed” status independent of the real document engine.

### Required consolidation

There must be exactly one:

* document ID;
* document version model;
* storage system;
* approval system;
* mark/signature application pipeline;
* checksum model;
* permission model.

Matter documents, Documents Studio and Approvals must all display the same underlying objects.

### Required states

A document should have explicit states such as:

`DRAFT → REVIEW → APPROVED → EXECUTED → FILED/SERVED → SUPERSEDED/ARCHIVED`

with separate immutable events rather than arbitrary flags.

**Priority: P0**

---

# 10. P1: Cryptographic signing remains missing

The current marks/signatures subsystem handles visual signature assets.

The architecture deliberately distinguishes this from cryptographic signing.

That is correct.

However, if KKA eventually labels something “digitally signed”, it needs independently verifiable certificate-based signing rather than a pasted visual mark.

This remains Phase 7 work.

**Priority: P2 unless required by initial firm workflow**

---

# 11. P0/P1: Filing and service workflows remain incomplete

The project state explicitly says fabricated filing/service generation was removed and production saves were disabled.

That was the correct repair.

But disabled fake workflow is not the same thing as a completed workflow.

KKA still needs authoritative models for:

### Filing

* court;
* registry;
* matter;
* document set;
* filing type;
* filed-by;
* filing date/time;
* Judiciary reference;
* fee/payment evidence;
* receipt;
* upload evidence;
* acceptance/rejection;
* follow-up deadline.

### Service

* target party;
* process server;
* documents served;
* service method;
* attempt;
* location;
* date/time;
* success/failure;
* affidavit of service;
* next action.

No random reference or UI button should ever imply that Judiciary CTS accepted anything.

**Priority: P0/P1**

---

# 12. P1: Court workflow must become one atomic workflow

Calendar integration has improved since the September 7 audit. Server-backed calendar CRUD now exists, and later work added stronger transaction support.

The remaining gap is the **legal propagation layer**.

A court event can produce:

* orders;
* filing deadlines;
* mention/hearing date;
* advocate assignment;
* document requirements;
* follow-up tasks;
* client notification;
* internal notification;
* next stage.

Those outcomes should be committed as a coordinated transaction or workflow job.

### Failure example

It is unacceptable for:

* court result to save;
* calendar next date to save;
* but deadline creation to fail;
* while UI reports success.

### Acceptance

Record an adjournment and prove all resulting objects appear after reload and for another user.

**Priority: P1**

---

# 13. P1: Deadline engine needs stronger legal semantics

Deadlines should not simply be arbitrary task dates.

KKA ultimately needs distinction between:

* court-imposed deadline;
* statutory deadline;
* internal SLA;
* partner instruction;
* limitation period;
* follow-up reminder.

Changes to a court date should not silently rewrite historical dates.

The original date, revision, reason, actor and source should remain auditable.

**Priority: P1**

---

# 14. P1: Client/task/intake conversion has improved but is not fully accepted

The September 8 conversion work significantly improved:

* task update/archive;
* client adapters;
* search adapters;
* intake persistence;
* server-confirmed mutations;
* transactional intake conversion.

The local conversion plan records those improvements.

Therefore the older U10/U11/U12 findings should no longer simply be called “unimplemented.”

### Remaining work

#### Clients

* complete detail workflow;
* relationships;
* duplicate detection;
* KYC status;
* conflict identity normalization;
* second-user acceptance;
* delete/archive policy.

#### Tasks

* dependencies;
* blocking;
* delegated assignment;
* escalation;
* recurring tasks;
* deadline linkage;
* stage-generated tasks;
* complete cross-user testing.

#### Intake

* full intake UI driven by server state;
* conflict match review;
* partner override;
* consent/authority/retainer evidence;
* rejected/deferred leads;
* duplicate conversion protection;
* concurrency testing.

**Priority: P1**

---

# 15. P1: Account recovery does not exist as a usable workflow

The current login screen literally displays:

`Forgot password?`

as a styled `<span>` without an action.

### Required workflow

`Request reset → generic acknowledgement → expiring single-use token → new password → invalidate/reset sessions → audit event`

Additional controls:

* rate limiting;
* token expiry;
* one-time use;
* no email-account enumeration;
* password policy;
* session revocation.

**Priority: P1 and launch blocker**

---

# 16. P1: Invite acceptance has backend capability but lacks complete user journey

Invitation support exists at backend/adapter level, but the audited frontend had no proper invite acceptance route.

KKA needs a URL such as:

`/accept-invite/:token`

which handles:

* invitation validation;
* expired invitation;
* already-used invitation;
* user identity;
* password establishment;
* applicable roles/branch;
* successful account activation;
* login.

Invitation and first login should be testable without an administrator touching the database.

**Priority: P1**

---

# 17. P1: Staff administration remains fragmented

Staff Directory cannot simply create a frontend `usr-*` record.

The full user lifecycle should be:

`Invite → Pending → Active → Suspended → Departed/Disabled`

Administrative actions need server-backed support for:

* role assignment;
* branch membership;
* title;
* team;
* supervisor;
* suspension;
* reactivation;
* session revocation.

The repository's current release plan still lists complete organization/settings administration as unfinished.

**Priority: P1**

---

# 18. P1: MFA is absent

There is currently no accepted:

* MFA enrollment;
* TOTP challenge;
* backup recovery code;
* MFA removal/recovery;
* enforced MFA policy.

For a system holding legal files, medical information and financial data, MFA should be part of the production identity milestone.

**Priority: P1/P2 depending pilot scope**

---

# 19. P1: Session administration is absent

Users/admins should eventually be able to inspect and revoke active sessions.

At minimum:

* current device/session;
* recent login;
* logout-all;
* admin forced logout following suspension/password compromise.

**Priority: P1**

---

# 20. P2: OIDC/SSO remains deferred

The full product scope calls for OIDC/SSO later.

This is appropriately Phase 7 rather than an immediate internal-pilot blocker.

**Priority: P2/P3**

---

# 21. P1: Permission administration is not yet the same system as permission enforcement

Production navigation now uses server permissions, which was an important fix.

But legacy permission/persona administrative surfaces still reflect local-role concepts.

The product needs one authoritative role/permission model for:

* API enforcement;
* navigation;
* action buttons;
* settings;
* staff administration;
* reports;
* search.

Changing a user's role in Admin should demonstrably change their access after refresh.

**Priority: P1**

---

# 22. P1: Feature flags need server-controlled production use

The release plan requires unfinished modules to be controlled by authoritative module flags.

A screen that exists in source should not automatically become available to production users.

Needed flags might include:

* finance;
* court integrations;
* communications;
* portal;
* HR;
* advanced reporting;
* developer functions.

**Priority: P1**

---

# 23. P1: Routing and deep links remain incomplete

The older application shell relied heavily on in-memory workspace selection rather than complete URL routing.

The production plan still explicitly calls for a real router and stable detail URLs.

Expected examples:

`/matters/:matterId`

`/matters/:matterId/documents/:documentId`

`/clients/:clientId`

`/tasks/:taskId`

`/calendar/events/:eventId`

`/admin/users/:userId`

Deep links must survive:

* reload;
* login redirect;
* browser back/forward;
* permission denial.

**Priority: P1**

---

# 24. P1: `AppContext` is still carrying too much business domain state

`AppContext.tsx` remains a transitional monolith containing collections and mutators for a huge percentage of the product, including legal workflows, finance-related state, staff, communications and PI records.

The repository itself acknowledges that remaining business mutation logic must leave this architecture.

### Target

`AppContext` should eventually contain mostly:

* theme;
* current navigation shell state;
* session/access convenience;
* transient global UI.

Business entities should use:

* TanStack Query;
* typed domain hooks;
* API cache invalidation;
* stable routes.

**Priority: P1 engineering debt**

---

# 25. P1: Offline sync is not implemented

The earlier false “synced” simulation has been correctly removed.

Queued mutations now report failed/unavailable rather than pretending to synchronize. This correction was implemented on September 8.

That closes the **truthfulness defect**.

It does not implement offline sync.

The current project authority explicitly defers offline synchronization for the first production release.

### Therefore

Production should either:

* hide the Sync Center; or
* clearly show online-only mode.

Offline business writes should not queue unless an actual synchronization protocol exists.

**Priority: deferred**

---

# 26. P1: Integrations are now truthful, but mostly not operational

Earlier integration controls manufactured successes for Google, Judiciary, WhatsApp and Daraja.

That dangerous behavior was subsequently removed. Failed/unconfigured providers now truthfully report unavailable, and fake WhatsApp/M-Pesa transactions are no longer generated.

Good fix.

The remaining gap is the actual integration platform.

### Still required

**Email**

* SMTP/provider configuration;
* outbound messages;
* inbound threading where required;
* delivery/failure state.

**WhatsApp**

* Meta Cloud API;
* templates;
* webhook status;
* inbound messages;
* retry.

**SMS**

* Africa's Talking or chosen provider;
* delivery receipts.

**M-Pesa**

* Daraja authentication;
* webhooks;
* idempotency;
* transaction verification;
* ledger reconciliation.

**Judiciary**

* whatever legitimate integration/data flow is actually available;
* otherwise auditable manual workflow.

The project standard correctly requires real provider adapters **or explicit manual alternatives**, never pretend success.

**Priority: P1/P2 by provider**

---

# 27. P1: Communications are not yet a real shared communication system

Outstanding:

* persisted internal threads;
* matter correspondence;
* actual attachment bytes;
* sender/recipient identities;
* delivery state;
* retry;
* inbound triage;
* email;
* SMS;
* WhatsApp;
* client correspondence;
* audit trail.

A notification is not the same thing as a communication record.

**Priority: P1**

---

# 28. P1: Notification mutations need full server persistence

Server notification hydration exists.

But the product must ensure that:

* mark-read;
* clear/archive;
* action state;

survive reload and multiple sessions.

Notifications should also be generated by authoritative domain events, not scattered UI state.

**Priority: P1**

---

# 29. P1: Approvals need one central engine

The current document engine has meaningful approval functionality.

Other approvals historically existed separately in UI collections:

* expense approval;
* settlement approval;
* handoff approval;
* closure approval.

The centralized Approvals workspace should be backed by a single approval request model.

Possible design:

`ApprovalRequest`

with:

* type;
* target entity;
* requested by;
* requested at;
* approver policy;
* status;
* decision;
* reason;
* decided by;
* decided at.

**Priority: P1**

---

# 30. P1: Audit Trail UI needs authoritative server events

KKA has server-side audit infrastructure.

The user-facing Audit Trail must consume that authoritative source rather than local context events.

Required support:

* actor;
* action;
* target;
* matter/client;
* before/after or metadata;
* timestamp;
* request/correlation ID;
* IP/device where appropriate;
* filter/search;
* export permissions.

**Priority: P1**

---

# 31. P1: Branch administration remains split

Organization profile is one of the converted TanStack Query/server-backed slices.

Legacy branch registry behavior still historically operated through local context.

All branch consumers should share one source:

* firm profile;
* branch registry;
* staff assignment;
* matter creation;
* reporting filters;
* letterhead/entity configuration.

**Priority: P1**

---

# 32. P1: Settings architecture is broader than the UI actually uses

The backend has sophisticated settings concepts.

Several legacy frontend configuration surfaces still work as local settings.

Outstanding categories include:

* numbering;
* document policies;
* finance/rates;
* workflows;
* custom fields;
* retention;
* feature flags.

Every setting needs:

* definition;
* value type;
* validation;
* scope;
* effective precedence;
* edit permission;
* history;
* audit;
* optional approval.

**Priority: P1/P2**

---

# 33. P1: Workflow editor remains incomplete as a production workflow engine

The UI can conceptually edit practice workflows.

For production, workflows need immutable published versions.

Existing matters should not unexpectedly change because someone edits tomorrow's workflow.

Required lifecycle:

`Draft → Validate → Publish → Retire`

A matter pins to its chosen workflow version.

**Priority: P1**

---

# 34. P1: Custom fields need authoritative schema/versioning

Custom fields are powerful but dangerous if merely frontend metadata.

They need:

* stable IDs;
* field type;
* validation;
* scope;
* requiredness;
* permissions;
* versioning;
* retirement;
* query/report support;
* historical value preservation.

**Priority: P2**

---

# 35. P1: Reports/dashboard need server-derived analytics

The earlier audit found several reports and dashboard values derived from local context and fixed targets.

Every production statistic must eventually answer:

> “Which authoritative records produced this number?”

Required examples:

* open matters;
* matters by stage;
* matters by advocate;
* stale matters;
* upcoming hearings;
* overdue tasks;
* outstanding fee notes;
* client-money balances;
* unapproved expenses;
* average matter cycle time.

Each aggregate should permit drill-through where appropriate.

**Priority: P1**

---

# 36. P1: Time recording/WIP remains incomplete

The frontend contains time tracking concepts, including browser-local timer state.

Production needs:

* matter;
* user;
* activity;
* start/end/duration;
* rate;
* billable/nonbillable;
* narrative;
* approval/locking;
* fee-note relationship.

Rates should come from authoritative configuration rather than arbitrary frontend defaults.

**Priority: P1/P2**

---

# 37. P1: Client portal is not production-ready

The earlier portal was effectively a staff-side simulation and did not represent a genuine external security boundary.

The backend has grant/token concepts, but the complete portal experience remains outstanding.

### Required client portal

* external entry point;
* expiring grant;
* revocation;
* client identity;
* matter-specific visibility;
* document-specific visibility;
* secure downloads;
* secure uploads;
* client instructions;
* message/enquiry submission;
* cross-client denial tests.

A client must never be able to alter an ID in a URL and view another client's file.

**Priority: P1/P2**

---

# 38. P2: Firm HR/leave operations are incomplete

Backend operations foundations exist, but complete staff lifecycle surfaces are not present.

Future HR scope includes:

* employee record;
* leave;
* approvals;
* leave balances;
* emergency contacts;
* employment dates;
* role history;
* perhaps performance/training later.

This can follow the legal core.

**Priority: P2**

---

# 39. P2: Procurement/vendor/assets remain incomplete

Backend concepts exist for:

* vendors;
* purchase requisitions;
* assets;
* custody.

No complete operational user journey has been accepted.

**Priority: P2**

---

# 40. P2: Knowledge and precedents are incomplete

A knowledge backend exists, but a genuine knowledge workspace and precedent reuse workflow remain outstanding.

Useful eventual capabilities:

* precedents;
* templates;
* legal research notes;
* authority library;
* tagging;
* practice area;
* document reuse;
* permissions.

**Priority: P2**

---

# 41. P2: OCR/full-text document search is not complete

The advanced product vision includes OCR and authorized search.

Needed eventual architecture:

`upload → virus/file validation → store original → OCR/extract → index → authorized search`

Search indexing must preserve access rules.

**Priority: P2**

---

# 42. P2: Retention and legal holds are not complete

Eventually the system needs retention policies for:

* closed matters;
* documents;
* financial records;
* HR data;
* audit records.

Legal holds must override automatic deletion.

**Priority: P2/P3**

---

# 43. P2: Automation engine requires production versioning/idempotency

Automation concepts exist.

A production automation engine needs:

* trigger;
* conditions;
* actions;
* published version;
* retry behavior;
* idempotency;
* audit;
* failure state;
* job visibility.

Example:

`Court event outcome = adjourned → create next-date task + notify responsible advocate`

must not create duplicate tasks when retried.

**Priority: P2**

---

# 44. P2: API client/webhook administration incomplete

The developer backend includes foundations for API clients/webhooks.

A real management system needs:

* scoped credentials;
* rotation/revocation;
* webhook signing;
* replay protection;
* delivery logs;
* retries;
* rate limits.

**Priority: P3**

---

# 45. P0/P1: Production deployment has not been proven

The repo contains a production-shaped topology:

`Caddy → web/API → PostgreSQL → Redis → Worker → private document volume`.

That is infrastructure **definition**, not infrastructure proof.

Remaining requirements:

* clean VPS;
* Docker installation;
* DNS;
* TLS;
* secrets;
* PostgreSQL volume;
* Redis;
* document volume;
* Caddy;
* migrations;
* production bootstrap;
* API health;
* worker health;
* frontend;
* WebSockets;
* restart;
* redeploy.

The current project documentation explicitly states real DNS/certificates have not been established by local tests.

**Priority: P0 before production**

---

# 46. P0: Staging environment is not proven

There should be a separate staging installation before production.

Staging should use:

* separate database;
* separate Redis;
* separate storage;
* separate provider credentials;
* separate domains/config;
* synthetic data.

Production testing should not become the staging strategy.

**Priority: P0 before launch**

---

# 47. P0: Backup creation and recovery are not operationally proven

The fake local snapshot/restore behavior was correctly removed.

The repo now has infrastructure scripts/runbooks and later backup/recovery work.

But a backup system is only proven after restoration.

The current release contract requires encrypted off-site backups and explicitly defines a recovery target of:

* at most **1 hour data loss**;
* restoration within **4 hours**;

with actual replacement-VPS proof.

### Required disaster test

1. populate staging;
2. create documents;
3. create matters;
4. create finance test records;
5. take backup;
6. destroy staging stack;
7. provision blank VPS;
8. restore DB/files/config;
9. restart;
10. verify checksums and records;
11. record actual RPO/RTO.

**Priority: P0**

---

# 48. P1: Monitoring/alerting needs production implementation

Required operational visibility includes:

* API availability;
* worker availability;
* queue failures;
* PostgreSQL;
* Redis;
* disk;
* memory;
* CPU;
* document storage;
* failed login spikes;
* backup freshness;
* certificate expiry;
* provider failures.

Someone must receive alerts.

**Priority: P1**

---

# 49. P1: Structured production logging needs operational proof

Logs should carry:

* timestamp;
* service;
* environment;
* request ID;
* user where appropriate;
* matter/entity IDs where appropriate;
* status;
* error category.

Avoid recording sensitive document contents/passwords/tokens.

**Priority: P1**

---

# 50. P1: CI evidence is not yet completely authoritative

A predeployment workflow exists and the repository now contains substantially stronger automated acceptance infrastructure.

However, the project's own current documents still describe remote CI execution as unverified in parts of the release evidence, while the newer public-platform audit says its expanded CI coverage is **“remote run pending.”**

The current commit status endpoint also does not provide a completed status set for the audited SHA.

Therefore I would **not use “CI is green” as a production fact yet**.

### Required

Protected branch/release policy should require:

* frozen clean install;
* Prisma validate;
* typecheck;
* lint;
* tests;
* build;
* blank migration;
* upgrade migration;
* API acceptance;
* browser acceptance;
* document-engine tests;
* public-site SSR/build/publish checks;
* container build.

**Priority: P1**

---

# 51. P2: Independent linting does not yet exist

The project state explicitly notes that the web “lint” currently amounts to TypeScript checking rather than a separate lint suite.

Add actual ESLint/static rules.

Useful rules include:

* floating promises;
* unsafe `any`;
* hooks;
* accessibility;
* import boundaries;
* dead imports;
* inappropriate direct API access.

**Priority: P2**

---

# 52. P2: Frontend bundle remains large

The project state records a large-bundle warning and expects route-based code splitting as routing is converted.

This is not a launch blocker but should be fixed alongside routing.

**Priority: P2**

---

# 53. P1: Cross-role acceptance testing remains incomplete

Passing tests as an administrator is not enough.

Run the same flows as:

* Managing/Senior Partner;
* Advocate;
* Paralegal;
* Administrator;
* Finance;
* clerk/registry role if retained;
* restricted user;
* external client.

Test both positive and negative access.

**Priority: P1**

---

# 54. P1: Concurrency testing needs expansion

Organization profile already has meaningful stale-edit/concurrency tests.

That model now needs spreading to:

* matters;
* intake;
* court dates;
* financial postings;
* approvals;
* publications;
* client updates;
* assignments;
* stage transitions.

Example:

Two advocates open the same settlement recommendation.

A approves KES 800k.

B approves stale KES 650k.

The second request must not silently overwrite the first.

**Priority: P1**

---

# 55. P1: Data imports need controlled tooling

The intended production database is clean.

Real firm records will therefore need controlled migration/import tooling.

Requirements:

* CSV/template import;
* dry run;
* validation;
* duplicate detection;
* preview;
* batch identifier;
* import report;
* rollback or compensating process;
* audit;
* reconciliation.

Never load production by executing a random seed script.

**Priority: P1 before migration**

---

# 56. P1: Firm policy/configuration values need formal approval

Synthetic fixtures currently contain assumptions about:

* branches;
* users;
* deadlines;
* numbering;
* rates;
* workflows;
* retention;
* accounting defaults.

The repo's project state explicitly says these values still require firm approval.

A production readiness checklist should obtain sign-off for each policy.

**Priority: P1**

---

# 57. P1: End-to-end legal UAT has not been completed

The ultimate acceptance test should not be “open every page.”

It should be:

### Scenario A: Personal injury matter

`Lead → Conflict → KYC/authority → Client → Matter → Incident → Medical → Liability → Demand → Negotiation → Litigation authority → Pleadings → Filing → Service → Defence → Pre-trial → Hearing → Judgment → Recovery → Client money → Distribution → Closure`

Every record should remain intact.

### Scenario B: Failed settlement

Settlement negotiations fail and the case transitions into litigation without losing negotiation evidence.

### Scenario C: Adjournment

Court hearing is adjourned; next date, orders, tasks and deadlines propagate correctly.

### Scenario D: Settlement recovery

Money enters client account, fees/disbursements are approved and client balance is distributed.

### Scenario E: Restricted matter

Unauthorized employee cannot locate it through search, reports, document endpoints or exports.

**Priority: P0/P1**

---

# 58. P1: Real staff pilot remains outstanding

Automated tests do not reveal operational friction such as:

* “I need Excel for this.”
* “I still need WhatsApp to ask where the file is.”
* “There is nowhere to record this court instruction.”
* “This requires six clicks instead of two.”
* “I cannot tell what I should do next.”

Run a controlled pilot with real intended users.

The most valuable metric is:

> **How often does the user leave KKA to finish a task KKA claims to manage?**

Every unnecessary exit becomes backlog.

**Priority: P1**

---

# 59. Public website/platform: major defects fixed, production proof still incomplete

The newer public-platform audit is materially more positive than the September 7 OS audit.

Eight identified publishing defects have been corrected locally, including:

* public publisher packaging;
* scheduled rollback handling;
* retained assets;
* soft 404 generation;
* SEO overrides;
* localized video references;
* CI coverage;
* frozen-lockfile worker builds.

These should therefore **not** remain open implementation defects.

### Remaining public-platform proof gaps

* production deployment;
* actual worker runtime image execution;
* registry/pilot image run;
* provider-backed production publishing;
* remote CI confirmation;
* broader publication permission combinations;
* publication review semantics;
* archived/deleted content behavior;
* scoped draft-media behavior;
* lead ownership/status concurrency;
* replay after form-version changes;
* acknowledgement retry;
* complete accessibility acceptance;
* real document-worker execution/failure recovery.

The public website is consequently in a **locally verified implementation state**, not yet a production-certified state.

---

# 60. Documentation drift itself is now a gap

KKA has unusually extensive documentation, which is valuable.

However different documents represent different moments in a fast-moving implementation.

For example:

* `VALIDATION_STATUS.md` still contains the older Tier 4–9 matrix;
* `PROJECT_STATE.md` supersedes that tier model;
* `LOCAL_ONLY_CONVERSION_PLAN.md` records later client/task/intake changes;
* the public gap audit records still later September 10–11 remediation.

Therefore agents can easily follow an obsolete “truth.”

### Required correction

Create:

`docs/CURRENT_RELEASE_STATE.md`

with exactly four sections:

**Implemented and accepted**

**Implemented, acceptance incomplete**

**Not implemented**

**Explicitly deferred**

All older documents should link to it and state whether they are:

* normative;
* historical;
* design-only;
* superseded.

**Priority: P1 for an agent-built codebase**

---

# 61. Agent coding guardrails need stronger state-awareness

Because agentic coding tools are working in this repo, every coding agent should be instructed:

1. never infer completeness from an existing component;
2. read `CURRENT_RELEASE_STATE.md`;
3. read the relevant domain specification;
4. identify current backend + frontend paths;
5. remove parallel prototype paths;
6. add acceptance evidence;
7. update release-state documentation;
8. never manufacture operational success.

This will prevent the codebase from accumulating beautiful parallel systems.

**Priority: P1 engineering governance**

---

# 62. Security hardening remains unfinished

Even though deeper security work was intentionally deferred during the rapid MVP build, it remains a production gap.

Existing positives include:

* Argon2id;
* server-side sessions;
* Redis session state;
* CSRF;
* origin checks;
* RBAC;
* Helmet/rate limiting;
* private document architecture.

Remaining production hardening should include:

* MFA;
* session administration;
* complete object-level authorization;
* secrets handling;
* encryption-key lifecycle;
* dependency/security scans;
* upload MIME/content verification;
* malware scanning strategy;
* CSP;
* audit review;
* brute-force controls;
* secure password recovery;
* least-privilege DB/service accounts;
* penetration testing.

**Priority: P0/P1 before broad external exposure**

---

# 63. Accessibility requires full-system acceptance

Some browser testing now checks multiple widths and keyboard controls.

The public-platform gap audit nevertheless explicitly lists complete accessibility as still open.

Full acceptance should include:

* keyboard-only operation;
* visible focus;
* semantic controls;
* modal focus traps;
* labels;
* error association;
* contrast;
* screen-reader naming;
* mobile touch targets.

**Priority: P2 but should accompany every converted workflow**

---

# 64. Final release gates

KKA should not be declared **firm-production-ready** until the following are all true.

### Gate A — Truth

No screen manufactures:

* payments;
* filings;
* deliveries;
* synchronization;
* judgments;
* settlements;
* backups;
* provider success.

### Gate B — Identity

Invite, login, recovery, suspension and session revocation work.

### Gate C — Authorization

Cross-role and restricted-matter tests pass.

### Gate D — Matter

One matter is authoritative across every module.

### Gate E — PI

A completely empty PI file contains no invented facts and can proceed from intake to closure.

### Gate F — Court

Events, outcomes, filings, service, tasks and deadlines persist correctly.

### Gate G — Documents

Matter documents, Document Studio and Approvals use one engine.

### Gate H — Finance

Trust/client money is driven by immutable balanced ledger postings.

### Gate I — Infrastructure

Clean VPS deployment succeeds.

### Gate J — Recovery

Replacement-VPS restore satisfies the target RPO/RTO.

### Gate K — Operations

Monitoring, logs and backup alerts exist.

### Gate L — Migration

Firm data imports pass dry-run and reconciliation.

### Gate M — UAT

Real users successfully complete agreed scenarios.

### Gate N — CI

The exact release commit passes the complete remote release pipeline.

---

# 65. Recommended build order from here

## Release Block 1 — Remove dangerous ambiguity

Finish:

* empty PI stages;
* account recovery;
* invite acceptance;
* staff administration;
* shared record-access policy;
* stable routing;
* feature flags;
* remove/hide deferred offline controls.

## Release Block 2 — Matter + legal spine

Finish:

* matter server state;
* assignments;
* workflow stage instances;
* stage transitions;
* handoffs;
* timeline;
* court events;
* filings;
* service;
* document integration;
* approvals.

## Release Block 3 — PI completion

Convert each remaining PI screen one by one.

No massive rewrite.

For each screen:

`API → Persistence → Authorization → UI → Audit → Reload → Second-user test → Failure test`

## Release Block 4 — Finance

Build and prove:

* chart/ledgers;
* postings;
* receipts;
* expenses;
* fee notes;
* reconciliation;
* settlement distribution.

Finance should be treated almost as a subsystem inside KKA rather than another dashboard.

## Release Block 5 — Communications + portal

Persist communications and then expose properly restricted client access.

## Release Block 6 — Production commissioning

Provision staging.

Deploy.

Configure providers.

Import trial data.

Run cross-role UAT.

Restore a backup onto a blank VPS.

Run pilot.

Then cut production.

---

# 66. Current release judgment

The codebase has moved far enough that its biggest risk is no longer underbuilding.

Its biggest risk is **mistaking breadth for completion**.

There are now many surfaces, models and backend capabilities. What remains is the painstaking work of making each important legal operation pass through one authoritative chain:

> **UI → API → authorization → database → audit → related workflow effects → reload → another authorized user**

Anything that does not complete that circuit is not yet a production workflow.

For the immediate internal MVP, I would define the critical path as:

**Identity → Intake → Matter → PI Legal Lifecycle → Court → Documents/Approvals → Finance → Recovery/Backup → UAT.**

Everything else can orbit that nucleus.

### Overall classification

**Architecture:** ~90% ready
**Core platform:** ~80–85%
**Operational legal workflows:** ~60–70%
**Finance/client money:** ~40–50%
**Production operations:** ~50–60%
**Firm-wide production readiness:** approximately **65–75%**

The remaining 25–35% is the expensive part of the iceberg: not more screens, but **truthfulness, persistence, authorization, workflow cohesion, accounting correctness, recovery and operational proof**.

That is where development effort should now be concentrated.
