# KKA LAW FIRM OS

## Current Product, Engineering & Production Gap Register

**Repository:** `davemusau00/KKA`
**Audit basis:** `main` at `e1c70cfae10898eb21a8e2d98451ca5a6e733575`
**Audit date:** 11 September 2026
**Purpose:** define the current remaining work between the repository as it exists now and a dependable, staff-ready, firm-wide law-firm operating system.

---

# 1. Executive status

KKA is now a substantial application rather than a prototype shell.

The repository has a credible production-shaped architecture comprising React, NestJS/Fastify, Prisma/PostgreSQL, Redis, BullMQ, shared contracts, document generation, Docker infrastructure, Caddy, server-side authentication and a growing set of authoritative backend domains.

The current release register itself correctly distinguishes between implemented code and accepted workflows. A workflow is not complete merely because an API route, screen, database model or test exists. Full acceptance requires authoritative persistence, reload survival, second-user visibility, authorization, failure handling, auditing, concurrency handling and browser acceptance.

The principal remaining risk has shifted.

Earlier KKA's greatest weakness was polished frontend functionality backed by synthetic state.

The greatest weakness now is:

> **inconsistent completion across security boundaries, workflow boundaries and operational proof.**

The application increasingly has the right backend primitives. It does not yet apply those primitives uniformly across every path.

### Current classification

| Area                       | Current status                                                   |
| -------------------------- | ---------------------------------------------------------------- |
| Architecture               | Strong                                                           |
| Backend platform           | Strong foundation                                                |
| Authentication core        | Substantial                                                      |
| Object-level authorization | Partially implemented, still unsafe on some paths                |
| Intake conversion          | Strong backend, acceptance incomplete                            |
| Matters                    | Strong backend foundation, acceptance incomplete                 |
| PI workflow                | Major truthfulness improvements, partial server conversion       |
| Documents                  | Most mature operational domain                                   |
| Tasks                      | Server-backed core, authorization gaps remain                    |
| Calendar                   | Server-backed foundation                                         |
| Court operations           | Backend foundation, end-to-end propagation incomplete            |
| Notifications              | Partially secured                                                |
| Audit                      | Substantially improved                                           |
| Finance                    | Real ledger foundations now exist, still not trust-account ready |
| Communications             | Incomplete                                                       |
| Client portal              | Partial                                                          |
| HR / operations            | Incomplete                                                       |
| Routing                    | Prototype-style workspace routing                                |
| Offline                    | Explicitly deferred                                              |
| Deployment                 | Not production-proven                                            |
| Disaster recovery          | Not proven                                                       |
| Staff UAT                  | Not performed                                                    |
| Production readiness       | Controlled-development / predeployment stage                     |

---

# 2. Severity model

**P0 - Production blocker**

A defect capable of leaking restricted information, generating false legal or financial state, allowing unauthorized mutation, losing money/data, corrupting accounting state, or preventing recovery.

**P1 - Required for staff launch**

Functionality necessary for dependable day-to-day use even if the application can technically run without it.

**P2 - Important post-core**

Functionality required for the intended complete ERP but which can follow a tightly controlled first internal deployment.

**P3 - Advanced platform**

Strategic enterprise capability suitable for later phases once the operational core is proven.

---

# 3. Findings that should be removed from the old gap register

Several previous findings are now stale and should not remain documented as though nothing changed.

## 3.1 Seeded PI legal facts

**Old status:** P0 unsafe.

**Current status:** substantially remediated.

PI judgment, liability, recovery, settlement, incident/evidence, medical, negotiation, hearing, pleadings, pre-trial and closure screens no longer represent their previous synthetic outcomes as real records in normal mode. The current release register explicitly treats this as a truthfulness remediation rather than completion of those workflows.

Judgment and liability/quantum are already progressing further by loading and saving server-backed PI records.

This old gap should therefore be replaced by the broader PI conversion gap described later.

## 3.2 Password-reset backend

The old "forgot password does nothing" finding is no longer current.

Password reset now has request and token-consumption server flows, hashed expiring tokens, audit events, session revocation and a browser-facing reset UI. Production mail delivery and full browser acceptance are still incomplete.

## 3.3 Audit matter confidentiality

Audit listing now filters matter-linked audit events through the shared record-access policy.

This materially closes the previous risk of administrators with audit visibility automatically receiving restricted-matter audit records.

## 3.4 Finance has moved beyond simulated accounting

Finance now contains real balanced journal posting, reversal logic, receipt posting foundations, matter ledger reads, source/reference idempotency keys and database uniqueness constraints.

It should no longer be described as merely a local ledger imitation.

It is still not client-money production ready.

---

# 4. P0 - Object-level authorization is not consistently enforced

This is currently the most important technical gap.

KKA now has a shared `RecordAccessService` that constructs matter visibility based on firm, explicit user access, team access and the `matter.access_manage` override.

That architectural decision is correct.

The remaining problem is that not every service operation actually uses it.

---

# 5. P0 - Matter search can overwrite the record-access predicate

The global search service obtains the shared matter predicate and then spreads it into a new object while adding another top-level `OR` for text search.

The access predicate itself also contains an `OR`.

This means the text-search `OR` can replace the authorization `OR` rather than combine with it.

The same composition pattern exists in the matter list when a `q` search is supplied.

### Required correction

Search criteria and authorization criteria must be composed explicitly:

```ts
where: {
  AND: [
    matterAccessPredicate,
    {
      OR: [
        referenceSearch,
        titleSearch,
        summarySearch
      ]
    }
  ]
}
```

### Required regression test

Create:

* Matter A unrestricted.
* Matter B restricted to another user.
* Both contain the same search term.
* User without access searches that term.

Only Matter A may appear.

This must be tested for:

* global search;
* matter list search;
* client-derived search;
* document search;
* task search;
* court proceeding search;
* reports/export search.

---

# 6. P0 - Matter write operations do not consistently use object-level access

Matter reads increasingly use `RecordAccessService`.

Matter mutations do not yet consistently do so.

Current matter update checks only:

```text
matter.id + firmId
```

before mutating the record.

Stage validation and stage transition also locate the matter through firm-level scope rather than the actor's record-access predicate.

This creates an important distinction:

A staff member may possess `matter.edit` or `matter.stage_advance` as a general capability while still being excluded from one particular restricted matter.

Action permission does not replace record permission.

### Required architecture

Create shared server-side assertions such as:

```text
assertCanViewMatter(user, matterId)
assertCanEditMatter(user, matterId)
assertCanAdvanceMatter(user, matterId)
assertCanUseMatterFinance(user, matterId)
assertCanManageMatterAccess(user, matterId)
```

Every matter-derived service should call one of these rather than rebuilding access logic independently.

---

# 7. P0 - Client mutations do not inherit restricted-matter access

Client list and client detail now use the shared matter scope.

Client update does not.

`ClientsService.update()` currently verifies the client using `id + firmId`, then performs the update.

This becomes important where a client is associated only with confidential/restricted matters.

### Required policy decision

Define whether client visibility is:

1. firm-wide regardless of matter confidentiality;
2. derived from at least one accessible matter;
3. individually restrictable; or
4. a hybrid model.

The current read implementation effectively follows option 2.

Writes must obey the same policy.

---

# 8. P0 - Task mutations are not consistently record-scoped

Task listing uses `RecordAccessService`.

Task create, status change, update and archive currently validate firm/matter ownership but not the caller's matter visibility.

That means the task authorization model currently has two layers that are not fully joined:

* general task/matter action permissions;
* record-level matter access.

### Required correction

All matter-linked task mutations must resolve the matter through the caller's record-access scope before writing.

Dependency validation must also reject dependencies that belong to inaccessible matters.

---

# 9. P0 - Finance write operations need object-level matter authorization

Finance matter-ledger reads have now been upgraded to call `canViewMatter()`.

That is a good correction.

However, journal posting, journal reversal, expense creation, expense approval, expense disbursement and receipt recording still operate primarily using firm/action-level authorization.

Any operation associated with a matter must additionally prove that the actor may use that matter for the requested finance action.

### Required policy

Finance requires at least:

```text
finance.view
finance.post
finance.trust_ledger
finance.expense_create
finance.expense_approve
finance.expense_disburse
```

plus matter-level visibility.

For sensitive trust/client money, consider a stronger separate record permission rather than ordinary matter visibility.

---

# 10. P0 - Notification creation does not validate recipient matter access

Notification listing and read-state changes now re-check matter visibility.

Creation does not.

A notification is created, emitted through realtime and external delivery may be queued before the recipient's matter access is checked.

This means REST filtering can hide an unauthorized notification later while the original realtime event or provider message may already have exposed its contents.

### Required correction

Before creating a matter-linked notification:

1. resolve recipient user;
2. build that recipient's current record-access context;
3. verify visibility;
4. only then persist;
5. only then emit realtime;
6. only then queue email/SMS/WhatsApp/push.

Access should be re-checked again immediately before external delivery where confidentiality matters.

---

# 11. P0 - Record-access policy is not yet proven across every information surface

The repository's current release document correctly keeps the universal access-policy requirement open.

Current improvements cover substantial portions of:

* matters;
* clients;
* tasks;
* documents;
* search;
* PI;
* audit;
* some reporting;
* portal administration;
* notification reads;
* finance matter-ledger reads.

But the system still needs one complete access matrix covering:

* lists;
* details;
* mutation endpoints;
* search;
* dashboard metrics;
* reports;
* exports;
* document downloads;
* audit;
* notifications;
* communications;
* finance;
* client portal;
* background workers;
* provider delivery;
* file URLs;
* websocket messages.

Until that matrix is complete, authorization remains a release gate.

---

# 12. P0 - Finance is not yet client-money / trust-account ready

Finance has progressed meaningfully.

It now includes balanced journal validation, journal reversal, receipts, matter ledger views and idempotency foundations.

However, the current release document correctly keeps client money unaccepted until additional accounting invariants are proven.

### Remaining finance requirements

The finance system still needs proven:

* strict client-fund vs office-fund separation;
* immutable posted journals;
* controlled reversal rather than modification;
* cleared vs uncleared funds;
* allocation of one receipt across matters/invoices where required;
* allocation reversal;
* trust balance per client and matter;
* bank reconciliation;
* M-Pesa reconciliation;
* unexplained transaction queue;
* duplicate receipt handling;
* accounting period locks;
* transaction locks during reconciliation;
* fee-note posting;
* WIP posting;
* disbursement recovery;
* VAT treatment;
* settlement distribution derived only from ledger state;
* exception reporting;
* audit trails for every posting action;
* privileged approval for high-risk client-money actions.

---

# 13. P0 - Finance idempotency is not fully concurrency-proof

Recent changes add unique indexes for:

```text
JournalEntry(firmId, sourceType, sourceId)
PaymentReceipt(firmId, referenceNumber)
```

and service-level pre-checks for previously processed records.

This is a strong foundation.

However, a classic race still exists:

```text
request A checks -> none
request B checks -> none
request A inserts
request B inserts -> unique violation
```

Sequential retry handling is not the same as concurrent idempotency.

### Required correction

Use one of:

* atomic upsert;
* transaction with conflict-safe lookup;
* catch unique violation then return the canonical row;
* explicit idempotency-key table with transaction lock.

### Acceptance

Fire concurrent duplicate journal and receipt requests.

Exactly one canonical transaction must exist.

Every caller must receive the same canonical business result rather than one caller receiving a database exception.

---

# 14. P0 - Settlement distribution is not ledger-derived

The PI settlement/distribution UI has been made safer by disabling false normal-mode payout behavior.

But this workflow is not complete until the settlement distribution is computed from authoritative ledger state.

It must not trust:

* manually entered "funds received";
* UI-computed fees;
* local deduction arrays;
* synthetic disbursement balances;
* manually assumed cleared funds.

### Required source of truth

Settlement distribution must depend on:

* actual cleared receipt(s);
* client ledger balance;
* approved professional fees;
* VAT;
* recorded disbursements;
* recoverable expenses;
* approved deductions;
* signed/recorded client settlement statement;
* approval state;
* payout journal.

---

# 15. P0 - Complete PI lifecycle remains unfinished

The dangerous seeded-state problem has largely been removed.

That does not mean the PI workflow is complete.

The current repository has PI backend models/routes and server-backed judgment and liability/quantum workspaces.

The complete lifecycle still needs end-to-end authoritative conversion.

### Required lifecycle

A production PI matter should be capable of progressing through:

```text
intake
conflict
KYC / authority
engagement
matter opening
incident facts
evidence
medical management
liability assessment
quantum
demand
negotiation
settlement authority
pleadings
filing
service
defence
pre-trial compliance
hearing preparation
hearing
judgment
appeal decision
recovery / execution
fund receipt
settlement distribution
closure
```

Every stage must be backed by actual records rather than merely screen state.

---

# 16. P0 - PI workflow stage gates are not fully unified with matter stage state

PI domain state, generic matter stage state and component-specific workspace state still need one authoritative progression model.

Required questions include:

* What moves a matter from stage N to stage N+1?
* Which documents are mandatory?
* Which tasks must be complete?
* Which approval is required?
* Which evidence is sufficient?
* Who may override?
* How is the override audited?
* What happens when the case falls back from settlement to litigation?
* What happens when an appeal reopens a previously completed workflow?

Generic matter transition infrastructure already exists, but the complete PI legal workflow has not been accepted against it.

---

# 17. P0 - Filing and service are truthful but not complete

Previous fabricated filing/service success was removed.

That is correct.

The remaining work is to implement actual evidence-bearing workflows:

### Filing must capture

* filing document/version;
* filing court;
* proceeding;
* filing method;
* filed date/time;
* court receipt;
* filing reference;
* payment receipt where relevant;
* submitted by;
* verified by;
* status;
* failure/rejection reason.

### Service must capture

* document served;
* party served;
* address/contact;
* service method;
* process server;
* attempt date/time;
* outcome;
* affidavit of service;
* returned service;
* substitute service order where applicable;
* next action/deadline.

No "filed" or "served" status should exist without evidence.

---

# 18. P0 - Court outcome propagation is not fully proven

Court/calendar foundations exist.

The remaining requirement is atomic propagation from a hearing or mention outcome into downstream operational state.

For example:

```text
hearing adjourned
-> court event updated
-> next court date created
-> court order recorded
-> matter next action updated
-> deadlines recalculated
-> tasks created/reassigned
-> responsible staff notified
-> client communication queued
-> timeline/audit updated
```

This must either succeed coherently or fail coherently.

Partial propagation is operationally dangerous.

---

# 19. P1 - Deadline engine requires legal semantics

A law-firm deadline is not merely a date field.

The system still needs one consistent deadline model supporting:

* source event;
* legal rule;
* calendar days vs business days;
* excluded days;
* court order override;
* reminder schedule;
* responsible person;
* escalation;
* completion;
* extension;
* vacation/stay periods where relevant;
* audit of recalculation.

Deadline recalculation should never silently overwrite the historical basis of an earlier date.

---

# 20. P1 - Password recovery needs production delivery and browser acceptance

Password reset backend and UI exist.

Remaining work includes:

* real SMTP/provider delivery;
* reset URL route;
* token carried by URL rather than manual entry;
* expiry UX;
* used-token UX;
* delivery failure states;
* browser tests;
* second-session/session-revocation tests;
* administrative support procedure.

The current release register explicitly keeps browser acceptance and mail delivery open.

---

# 21. P1 - Invitation acceptance journey remains incomplete

Backend invitation acceptance exists, but the end-to-end onboarding experience remains incomplete.

Required flow:

```text
administrator creates user
-> invite generated
-> delivery recorded
-> user opens invite URL
-> token validated
-> password created
-> invite consumed
-> account activated
-> permissions/branch confirmed
-> first-login onboarding
-> audit recorded
```

The flow should handle:

* expired token;
* reused token;
* revoked invite;
* superseded invite;
* suspended account;
* wrong firm;
* password validation;
* invitation resend.

---

# 22. P1 - MFA is not implemented

MFA remains a staff-launch security gap for sensitive roles.

At minimum support:

* TOTP enrollment;
* recovery codes;
* challenge on login;
* administrative recovery/reset;
* mandatory MFA by role or permission.

Higher-risk actions can later require step-up authentication.

---

# 23. P1 - Administrative session management is incomplete

Self-service logout-all exists.

Administrative session controls still need:

* list active sessions;
* created time;
* last seen;
* source/IP/device metadata where appropriate;
* revoke one session;
* revoke all sessions;
* force reauthentication;
* automatically terminate sessions for suspended users.

---

# 24. P1 - Routing and deep linking remain incomplete

The web application still switches major workspaces using in-memory `activeWorkspace` state rather than a proper URL router.

Required routes should include concepts such as:

```text
/matters
/matters/:matterId
/clients/:clientId
/tasks/:taskId
/documents/:documentId
/court/:proceedingId
/admin/users/:userId
/auth/invite
/auth/reset-password
```

Stable URLs are required for:

* refresh;
* bookmarks;
* notification links;
* email links;
* shared internal references;
* browser history;
* direct troubleshooting.

---

# 25. P1 - AppContext still contains compatibility/prototype business state

The current release register explicitly states that `AppContext.tsx` still contains local collections, seed imports and mutations.

This remains architectural debt.

### Required direction

Domain data should progressively move to:

* typed API clients;
* TanStack Query;
* mutation hooks;
* route-owned state;
* small local UI state.

`AppContext` should eventually contain only truly global application state rather than acting as a parallel business database.

---

# 26. P1 - Notifications require delivery-time access protection

In addition to creation-time checks, queued notifications should revalidate permissions before external delivery.

This matters because access can change between:

```text
notification created
and
email/SMS/WhatsApp actually sent
```

The worker must not assume that queued access remains valid forever.

---

# 27. P1 - Communications remain incomplete as a unified operational system

Communications need one authoritative conversation model covering:

* email;
* SMS;
* WhatsApp;
* phone notes;
* internal matter notes;
* client correspondence;
* attachments;
* delivery status;
* retries;
* provider IDs;
* inbound messages;
* matter association;
* client association;
* permission filtering.

No provider action should show "sent" unless the provider or an approved manual process actually confirms it.

---

# 28. P1 - Approval workflows need one shared engine

Approvals should converge on one domain rather than separate domain-specific pseudo-approval patterns.

The shared approval engine should support:

* stage advancement;
* settlement authority;
* expenses;
* trust/client money;
* document approval;
* write-off;
* exceptional access;
* workflow override;
* procurement;
* HR where applicable.

Required fields include:

* requester;
* approver;
* reason;
* target entity;
* requested state;
* approved/rejected state;
* timestamps;
* comment;
* revocation;
* audit reference.

---

# 29. P1 - Document workflow integration still requires complete convergence

Document/branding infrastructure is one of the strongest parts of the repository.

The remaining gap is integration.

Every document-like operation from matters, PI, court, approvals and communications should resolve to the same document/version model rather than a mixture of:

* local stage forms;
* attachment fields;
* generated PDFs;
* Document Studio records;
* approval records.

One document should have one canonical identity and version history.

---

# 30. P1 - Finance UI must be rebuilt around authoritative server ledger data

Even as backend finance improves, the frontend must stop behaving as though local arrays or calculated cards constitute accounting records.

The production finance workspace should be query-driven from:

* ledger accounts;
* journals;
* receipts;
* expenses;
* reconciliations;
* fee notes;
* WIP;
* settlement distributions.

Every visible balance must be derivable from server ledger entries.

---

# 31. P1 - Time recording and WIP are incomplete

A usable legal ERP requires authoritative time/WIP infrastructure.

Required:

* timers;
* manual time entries;
* matter association;
* staff rate;
* billable/non-billable;
* narrative;
* review;
* approval;
* write-off;
* fee note conversion;
* historical rate preservation.

---

# 32. P1 - Client portal is not production-ready

Portal backend foundations exist.

Production client access still requires:

* actual client identity;
* invite/activation;
* grant lifecycle;
* matter/document permissions;
* revocation;
* secure file access;
* message access;
* restricted document categories;
* portal audit;
* expired access;
* cross-client denial testing;
* mobile acceptance.

---

# 33. P1 - Feature flags are not yet a complete production control plane

Modules still need server-controlled release flags.

Examples:

* finance;
* client portal;
* integrations;
* PI experimental stages;
* website management;
* offline/sync;
* provider delivery.

A disabled production feature must be disabled server-side, not merely hidden in navigation.

---

# 34. P1 - Settings administration is incomplete

The firm should be able to administratively manage:

* legal entities;
* branches;
* practice areas;
* matter types;
* numbering;
* roles;
* permissions;
* teams;
* workflow versions;
* court directories;
* fee defaults;
* notification defaults;
* providers;
* templates;
* retention defaults;
* accounting configuration.

Configuration changes must be audited and preferably versioned where they affect historical matters.

---

# 35. P1 - Branch administration still needs complete convergence

The product has branch-aware data structures, but branch configuration, branch access, branch reporting and organization-profile information need one consistent source of truth.

A branch should not be represented differently in several settings screens.

---

# 36. P1 - Reporting requires authoritative, access-safe server queries

Some reporting now uses matter-aware access policy.

The complete reporting layer still requires:

* record-access-safe queries;
* date filters;
* branch filters;
* practice-area filters;
* responsible-advocate filters;
* export;
* reproducibility;
* report parameters;
* drill-down;
* finance report reconciliation.

No report should expose records the user could not open individually.

---

# 37. P1 - Export authorization is not fully proven

Exports are particularly sensitive because filtering mistakes produce durable copies outside the system.

Every export should:

1. reconstruct the user's server-side access scope;
2. apply it to source queries;
3. record who exported;
4. record parameters;
5. record row/document count;
6. optionally require elevated permission for sensitive exports.

---

# 38. P1 - Search policy needs dedicated acceptance coverage

Search is not just another list.

It combines multiple entities and therefore needs dedicated security tests.

Test at minimum:

* restricted matter;
* restricted client's name;
* restricted document title;
* restricted task title;
* restricted court number;
* archived matter;
* inactive user;
* cross-firm record;
* matter-access administrator.

---

# 39. P1 - CI does not run the dedicated access suite

The current predeployment workflow runs the general API tests and document-engine tests but does not invoke the dedicated `test:access` suite.

This is now a major mismatch because access tests cover increasingly important security behavior.

### Required change

Add:

```text
pnpm --filter @kka/api test:access
```

as a mandatory CI step.

No authorization-related code should merge while those tests are outside the release pipeline.

---

# 40. P1 - Current exact-head CI is not yet proven green

The exact current `main` commit triggered a predeployment workflow that was still running at the time of this audit.

The preceding run failed before completing the full acceptance sequence.

Therefore:

> The repository has successful historical CI runs, but the exact audited release SHA should not yet be classified as green until its own full pipeline completes successfully.

---

# 41. P1 - Independent linting remains absent

The repository's own release documentation states that no independent lint suite is claimed.

Add explicit linting for:

* API;
* web;
* worker;
* packages;
* tests.

TypeScript compilation is not a substitute for static lint rules.

---

# 42. P1 - Frontend bundle architecture still needs route/code splitting

The current release documentation continues to report a large-bundle warning.

Proper routing should be combined with lazy loading by operational domain.

Good candidates:

```text
matters
finance
documents
admin
website
reports
integrations
PI heavy workspaces
```

This will improve startup performance and produce a cleaner application architecture.

---

# 43. P1 - Complete multi-user browser acceptance is missing

Service-level authorization tests are improving.

That is not enough.

Every major domain needs tests using at least:

* authorized user A;
* authorized user B;
* unauthorized user C;
* inactive user;
* cross-firm user where possible.

Acceptance should prove:

* mutation by A;
* reload;
* visibility to B where intended;
* denial to C;
* absence from search;
* absence from reports;
* absence from notifications;
* absence from export.

---

# 44. P1 - Concurrency coverage is narrow

The platform needs more concurrency testing around:

* intake conversion;
* matter numbering;
* client numbering;
* receipt creation;
* journal posting;
* approvals;
* stage transitions;
* document approvals;
* user invitation;
* password reset;
* reconciliation;
* settlement payout.

The system must define which requests:

* serialize;
* conflict;
* retry;
* return existing state;
* reject stale state.

---

# 45. P1 - Production deployment remains unproven

The application has production-shaped Docker/Caddy infrastructure.

That is not the same as an accepted deployment.

Remaining deployment proof includes:

* clean VPS;
* Docker installation;
* secrets;
* database initialization;
* migrations;
* Redis;
* worker;
* document storage;
* web/API origin split;
* DNS;
* TLS;
* cookies;
* CORS;
* websocket upgrade;
* file permissions;
* service restart;
* reboot survival;
* log rotation;
* provider configuration.

The current release document still explicitly keeps production deployment open.

---

# 46. P1 - Separate staging environment remains unproven

Staging must be isolated from production in:

* database;
* Redis;
* file storage;
* SMTP/provider credentials;
* payment credentials;
* messaging providers;
* website publishing;
* analytics;
* backups.

Staging must not be capable of accidentally sending real client messages or real payments.

---

# 47. P0/P1 - Disaster recovery has not been operationally proven

Backup/recovery scripts may exist.

The production gate remains:

> Can the firm restore onto a replacement VPS and resume operation within the agreed RPO/RTO?

Required drill:

1. simulate primary server loss;
2. provision blank replacement;
3. restore database;
4. restore documents;
5. restore application;
6. verify checksums;
7. verify authentication;
8. verify selected matters and client ledgers;
9. measure actual RPO;
10. measure actual RTO.

Target previously documented:

* RPO no worse than 1 hour;
* RTO no worse than 4 hours.

---

# 48. P1 - Encrypted off-site backup proof remains open

Backups must exist outside the production VPS.

Required:

* encrypted database backup;
* encrypted document backup;
* retention schedule;
* backup failure alert;
* restore test;
* key recovery procedure;
* access restrictions.

A backup job reporting success is not sufficient proof.

---

# 49. P1 - Monitoring and alerting are not production-proven

Production requires actionable monitoring for:

* API availability;
* worker health;
* PostgreSQL;
* Redis;
* disk space;
* memory;
* CPU;
* TLS expiry;
* queue backlog;
* failed jobs;
* failed provider delivery;
* backup failures;
* unusual authentication failures;
* storage exhaustion.

Alerts need an accountable recipient.

---

# 50. P1 - Structured production logging needs operational proof

The application should support correlation across:

```text
browser request
API request
queue job
provider action
audit event
```

Production logs should include identifiers sufficient for diagnosis without unnecessarily logging confidential client data.

---

# 51. P1 - Production data import is not accepted

The firm currently relies on mixed existing records.

Import must be treated as its own controlled project.

Required:

* source inventory;
* column mapping;
* deduplication;
* validation;
* branch mapping;
* staff mapping;
* matter reference mapping;
* opening balances;
* document mapping;
* rejected-record report;
* reconciliation;
* dry run;
* final signed import report.

No raw production spreadsheet should simply be loaded because a Prisma import script exists.

---

# 52. P1 - Firm policy and defaults require explicit sign-off

Some values can be technically configured without being legally or operationally approved.

Firm sign-off is still required for:

* matter numbering;
* branch codes;
* roles;
* permissions;
* retention;
* document naming;
* fee rules;
* finance defaults;
* approval thresholds;
* escalation rules;
* staff responsibilities;
* court workflow defaults;
* settlement approval rules.

---

# 53. P1 - Firm-wide legal UAT has not been completed

The full system should be exercised through realistic workflows.

### Required PI scenario

```text
lead
-> conflict
-> KYC
-> engagement
-> client
-> matter
-> incident
-> evidence
-> medical
-> liability
-> quantum
-> demand
-> negotiation
-> litigation
-> filing
-> service
-> defence
-> pre-trial
-> hearing
-> judgment
-> recovery
-> receipt
-> settlement distribution
-> closure
```

### Required alternative scenarios

* negotiated settlement without litigation;
* failed settlement followed by litigation;
* court adjournment;
* appeal;
* partial payment;
* duplicate bank/M-Pesa receipt;
* restricted/confidential matter;
* staff member leaving the firm;
* client changing instructions;
* matter transferred between branches.

---

# 54. P1 - Real staff pilot remains open

A controlled pilot should include actual representatives of:

* partner;
* advocate;
* paralegal;
* administrator;
* finance;
* tech/admin.

Measure:

* task completion;
* missing workflows;
* accidental confusion;
* permissions;
* performance;
* mobile/tablet usability;
* support burden;
* training needs.

---

# 55. P2 - HR and leave workflows remain incomplete

Backend/domain foundations are not equivalent to an accepted staff-management system.

Still required:

* employee lifecycle;
* leave requests;
* approvals;
* leave balances;
* handover;
* branch/team assignments;
* inactive/suspended staff;
* departure workflow;
* reassignment of matters/tasks.

---

# 56. P2 - Procurement/vendor/custody workflows remain incomplete

For a complete ERP, the operations layer still needs:

* vendors;
* purchase requests;
* approval;
* purchase orders;
* receipts;
* office assets;
* custody;
* assignment;
* return;
* disposal;
* recurring costs.

---

# 57. P2 - Knowledge/precedent management remains incomplete

A law-firm OS should eventually provide:

* precedents;
* templates;
* legal research;
* tagged authorities;
* internal practice notes;
* standard clauses;
* versioning;
* approval;
* access control;
* matter linking.

---

# 58. P2 - Workflow editor requires production governance

Workflow customization should not immediately mutate live matters.

Required:

* draft workflow;
* published version;
* immutable version history;
* future-matter activation;
* migration process for existing matters;
* rollback strategy;
* audit.

---

# 59. P2 - Custom fields require schema/version governance

Custom fields need:

* field definitions;
* type validation;
* required/optional;
* practice-area scoping;
* version history;
* indexing/search behavior;
* permissions;
* export behavior.

---

# 60. P2 - OCR and full-text search are deferred

OCR and advanced search remain correctly deferred.

When implemented, they must inherit document and matter authorization at indexing and query time.

---

# 61. P2 - Retention and legal holds are deferred

Eventually required:

* retention policy;
* destruction eligibility;
* legal hold;
* hold reason;
* approval;
* immutable hold audit;
* suspended deletion;
* document/matter scope.

---

# 62. P2 - Automation engine requires production safeguards

Future automation must be:

* versioned;
* idempotent;
* auditable;
* permission-aware;
* retry-safe;
* observable;
* reversible where possible.

No automation may manufacture legal/financial success state when an external step fails.

---

# 63. P2 - API clients/webhooks require governance

External API/webhook administration eventually requires:

* credentials;
* scopes;
* rotation;
* expiration;
* signing;
* replay protection;
* rate limits;
* webhook logs;
* retry;
* disable/revoke.

---

# 64. P3 - OIDC / SSO remains deferred

Correctly deferred until the core staff identity lifecycle is complete.

---

# 65. P3 - Cryptographic document signing remains deferred

Document signatures/marks should not be confused with cryptographic signing.

Future cryptographic signing requires explicit key management, certificate management, signing audit and verification.

---

# 66. P3 - Multi-node high availability remains deferred

Single-VPS architecture remains acceptable for the intended first deployment provided recovery is proven.

HA should follow actual operational need.

---

# 67. Revised release gates

KKA should not be classified as production-ready until all of the following are independently satisfied.

## Gate A - Truthfulness

No production screen may invent:

* legal facts;
* filing success;
* service success;
* payment success;
* message delivery;
* provider success;
* backup success;
* synchronization;
* judgment;
* settlement;
* approval.

## Gate B - Identity

Working:

* invite;
* activation;
* login;
* password recovery;
* suspension;
* logout;
* session revocation;
* MFA for required roles.

## Gate C - Authorization

Restricted information remains absent from:

* list;
* detail;
* search;
* write path;
* document access;
* report;
* export;
* audit;
* notification;
* provider delivery;
* portal.

## Gate D - Matter integrity

One authoritative matter record controls:

* lifecycle;
* owner;
* stage;
* next action;
* timeline;
* handoff;
* assignments.

## Gate E - PI

A completely empty PI matter contains no invented facts and can progress server-side from intake through closure.

## Gate F - Court

Court events, outcomes, filings, service, tasks and deadlines propagate coherently.

## Gate G - Documents

One canonical document/version/approval model is used across the product.

## Gate H - Finance

Client money is based on immutable balanced ledger state, reconciliation and controlled reversals.

## Gate I - Infrastructure

Clean production deployment is repeatable.

## Gate J - Recovery

Replacement-VPS restore meets measured RPO/RTO.

## Gate K - Operations

Monitoring, logging, backup alerts and queue/provider failure visibility are live.

## Gate L - Migration

Production data import is reconciled and approved.

## Gate M - UAT

Real firm users complete agreed scenarios.

## Gate N - CI

The exact release SHA passes:

* install;
* Prisma validation;
* typecheck;
* build;
* API tests;
* access tests;
* engine tests;
* migrations;
* clean bootstrap;
* worker tests;
* browser tests.

---

# 68. Recommended implementation order

## Release Block 1 - Finish authorization

1. Fix search/matter-list `OR` composition.
2. Add object access assertions for matter writes.
3. Add access checks to task writes.
4. Add access checks to client writes.
5. Add access checks to finance writes.
6. Protect notification creation/realtime/provider delivery.
7. Add export access checks.
8. Put `test:access` into CI.

Do not continue expanding features until this block is complete.

## Release Block 2 - Complete identity

1. Invite acceptance route/UI.
2. Production password-reset delivery.
3. MFA.
4. Administrative session management.
5. Suspension and staff departure acceptance.

## Release Block 3 - Finish PI server conversion

Convert remaining workspaces one at a time using the acceptance contract:

```text
API
-> authorization
-> persistence
-> audit
-> UI
-> reload
-> second user
-> unauthorized user
-> failure case
-> browser test
```

## Release Block 4 - Finish court + filing + service + deadlines

Make legal progression coherent before adding optional platform features.

## Release Block 5 - Complete finance

1. client/office fund separation;
2. journals;
3. reversals;
4. receipts;
5. reconciliation;
6. expenses;
7. fee notes;
8. WIP;
9. settlement;
10. payout;
11. finance reports.

## Release Block 6 - Communications and portal

Only after record access is fully trustworthy.

## Release Block 7 - Production commissioning

1. staging;
2. production VPS;
3. provider configuration;
4. import dry run;
5. monitoring;
6. off-site backup;
7. replacement restore;
8. staff UAT;
9. pilot;
10. release.

---

# 69. Revised readiness assessment

These values are qualitative engineering estimates, not measured completion percentages.

| Domain                                        |                        Estimated readiness |
| --------------------------------------------- | -----------------------------------------: |
| Architecture                                  |                                        92% |
| Core backend/platform                         |                                        87% |
| Authentication core                           |                                        78% |
| Object-level authorization                    |                                        70% |
| Intake/client foundations                     |                                        78% |
| Matter workflow backend                       |                                        75% |
| PI workflow                                   |                                        70% |
| Court/legal operations                        |                                        63% |
| Documents                                     |                                        85% |
| Tasks/calendar                                |                                        72% |
| Finance                                       |                                        50% |
| Communications                                |                                        50% |
| Portal                                        |                                        50% |
| HR/operations                                 |                                        45% |
| Production infrastructure                     |                                        58% |
| Recovery readiness                            |                                        40% |
| Firm UAT/readiness                            |                                        25% |
| Overall controlled internal release readiness |                          approximately 73% |
| Full firm-wide production readiness           | lower than the architecture alone suggests |

---

# 70. Final assessment

KKA's problem is no longer feature scarcity.

The repository already contains more than enough product surface to become a serious internal law-firm operating system.

The remaining challenge is **completion discipline**.

The current development priority should be:

> **take every visible capability and force it through one authoritative server state, one record-access model, one audit trail and one acceptance contract.**

The application should not gain another major module until the current security and data-integrity spine is dependable.

The most urgent engineering work today is therefore:

**authorization correctness → identity completion → PI/court workflow completion → ledger-grade finance → deployment/recovery → real staff acceptance.**

Once those gates pass, the project moves from "very capable predeployment system" to something Kariuki Kagunda & Co. can responsibly use as its operational backbone.
