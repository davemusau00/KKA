# 19 — Full Product Vision and Capability Map

## 1. Product definition

Kariuki Kagunda & Co. Advocates OS is a full law-firm enterprise operating system for a Kenyan multi-branch legal practice.

Its primary current practice focus is personal injury, but the platform must support future practice areas without creating separate applications.

The product should be designed as the intersection of:

- legal practice management;
- CRM and client intake;
- workflow/BPM;
- project, task and SLA management;
- document and knowledge management;
- calendaring and court operations;
- finance and client-money accounting;
- procurement and expense control;
- staff/HR operations;
- communications and collaboration;
- reporting/BI;
- client/external portals;
- platform administration;
- integrations and automation;
- auditable enterprise configuration.

## 2. Full-product outcome

A mature deployment should allow the firm to operate the majority of its daily internal administrative and legal workflows from one system.

A user should not manually reproduce the same court date, client detail, document, expense, contact, payment, hearing outcome, task or workflow status in multiple places.

Example propagation:

```text
Court outcome recorded
    ↓
matter timeline updated
    ↓
orders stored
    ↓
next court event created
    ↓
deadline rules evaluated
    ↓
tasks generated
    ↓
assigned staff notified
    ↓
client-update requirement created
    ↓
matter stage readiness recalculated
    ↓
management dashboards updated
```

## 3. Capability domains

### 3.1 Firm and organization management

- legal entity profile;
- branches;
- departments and teams;
- practice areas;
- cost centres and reporting units;
- physical office locations;
- rooms and shared resources;
- office hours and holidays;
- numbering schemes;
- stationery/letterhead profiles;
- firm brands;
- branch-specific marks, signatures and contact details;
- firm-wide and branch-level defaults.

### 3.2 Identity and access governance

- users and employees;
- external collaborators;
- roles and permissions;
- matter-level access;
- client-level access;
- restricted matters / ethical walls;
- delegated access and acting-role periods;
- branch and practice-area access;
- maker/checker controls;
- approval limits;
- finance authorization limits;
- session/device controls;
- SSO/MFA support;
- account lifecycle and offboarding.

### 3.3 CRM, enquiries and client intake

- enquiries and leads;
- referral/source attribution;
- intake queues and appointments;
- configurable questionnaires;
- conflict checking;
- KYC/CDD;
- document verification records;
- risk flags;
- eligibility review;
- accept/decline reasons;
- engagement/retainer documents;
- consents;
- preferred language;
- communication preferences;
- source-of-funds checks where relevant;
- conversion to client and matter.

### 3.4 Client and relationship management

- individual and organization clients;
- households/related persons;
- related companies;
- representatives and guardians;
- next of kin / dependants;
- relationship graph;
- all matters;
- communication history;
- finance relationship;
- portal access;
- shared documents;
- KYC lifecycle;
- conflict history;
- preferences and restrictions.

### 3.5 Matter management

Every matter should be able to carry:

- internal reference;
- court/external references;
- client;
- matter type;
- practice area;
- originating branch;
- responsible branch;
- supervising advocate;
- current stage owner;
- court clerk/process role;
- finance contact;
- responsible team;
- workflow;
- limitation/deadline profile;
- parties;
- proceedings;
- documents;
- tasks;
- events;
- expenses;
- fees;
- client-money ledger;
- messages/correspondence;
- evidence;
- medical records;
- negotiation history;
- settlement/judgment/recovery;
- timeline;
- audit;
- archive state.

### 3.6 Workflow/BPM

- matter-type workflow templates;
- reusable stage libraries;
- required fields/documents/tasks;
- stage SLAs;
- statutory deadlines;
- transition gates;
- approvals;
- handoff checklists and acknowledgment;
- automatic assignment;
- workload routing;
- escalation;
- conditional branches;
- rework/reopen;
- skip/override with reason;
- workflow versioning and history;
- scheduled and event-driven automation;
- sandbox/test mode.

### 3.7 Personal injury operations

The full PI domain should cover:

```text
Accident / incident
→ intake
→ conflict and KYC
→ evidence acquisition
→ police/vehicle/insurance records
→ medical records and reports
→ liability analysis
→ quantum analysis
→ statutory/insurer notices
→ demand
→ negotiation
→ client authority
→ litigation decision
→ pleadings
→ filing
→ summons
→ service
→ defence
→ compliance / pre-trial
→ hearing preparation
→ hearing / evidence
→ submissions
→ judgment
→ decree / costs
→ payment / execution / declaratory process where applicable
→ client account receipt
→ deductions and settlement statement
→ client distribution
→ closure / archive
```

Matter packs should eventually include road traffic injury, fatal claims, WIBA/workplace injury, third-party workplace claims and general negligence.

### 3.8 Court operations

- court/registry directory;
- court stations and case types;
- filing queue;
- filing packages;
- fee assessment and payment requisition;
- e-filing reference;
- filed/stamped copies;
- summons;
- service queue;
- process-server assignment;
- service attempts and affidavits;
- daily court diary;
- attendance;
- mentions;
- directions;
- hearings;
- rulings;
- judgments;
- orders;
- deadlines;
- next dates;
- cause-list linkage when supported;
- court outcome propagation;
- appeal/review decision tracking.

### 3.9 Tasks and internal projects

Support matter and non-matter work:

- personal/team/branch tasks;
- operational projects;
- recurring tasks;
- dependencies;
- subtasks/checklists;
- assignees/reviewers/watchers;
- internal due date vs official deadline;
- blocked / waiting external / waiting review;
- escalation and SLA timers;
- comments/attachments;
- time entries;
- activity history.

### 3.10 Calendar and resources

- month/week/day/agenda;
- user/team/branch/court calendars;
- limitation calendar;
- rooms/resources;
- appointment booking;
- recurrence;
- drag/drop with policy restrictions;
- availability/conflicts;
- reminders;
- court-event protections;
- travel time;
- virtual meeting links;
- Google/Microsoft sync;
- attachments.

### 3.11 Meetings and decisions

- partner, branch, case, client and operations meetings;
- attendance;
- agenda;
- minutes;
- decisions/resolutions;
- action items;
- linked matters/projects;
- approval/sign-off;
- recurring series;
- confidential minutes.

### 3.12 Document management

- private storage;
- metadata;
- categories;
- versioning;
- check-in/edit locks where needed;
- PDF/image preview;
- templates and merge fields;
- precedent generation;
- review/approval;
- signing workflow;
- firm marks/stamps;
- watermarks;
- OCR/full-text search;
- document relationships;
- signed/filed/stamped versions;
- exhibits and bundles;
- redaction support;
- retention/legal hold;
- chain of custody.

### 3.13 Knowledge and precedents

- precedent library;
- clause library;
- legal research notes;
- court practice notes;
- reusable arguments;
- insurer/provider playbooks;
- SOPs and practice manuals;
- versioning/approval;
- owner and review dates;
- full-text search;
- links to matters.

### 3.14 Communications

- internal matter/team channels;
- email;
- SMS;
- WhatsApp;
- calls/contact logs;
- formal correspondence register;
- automated notifications;
- templates;
- delivery tracking;
- consent and do-not-contact controls;
- matter auto-linking;
- inbound mailbox routing;
- shared mailboxes;
- message-to-task/document.

### 3.15 Finance and legal accounting

Keep office money and client money separate.

Full product should support:

- client/trust accounts;
- office accounts;
- petty cash;
- matter ledgers;
- client-money receipts/allocations/transfers;
- authorized deductions;
- settlement distribution;
- fee notes/invoices;
- disbursements;
- expense requisitions/approvals;
- vendor bills;
- M-Pesa/bank imports;
- bank and client-account reconciliation;
- budgets;
- matter profitability;
- WIP/timekeeping;
- write-offs/refunds/reversals;
- period locks;
- tax settings;
- audit and reports.

### 3.16 Procurement, vendors and assets

- vendor directory;
- quotations;
- purchase requests;
- approvals;
- purchase orders;
- vendor bills;
- recurring suppliers;
- stationery/printing/transport;
- filing and medical-report fees;
- asset register;
- laptops/phones/printers/licenses;
- assignment, warranty, maintenance, disposal.

### 3.17 HR and people

- employee profile;
- employment records;
- leave/attendance;
- performance;
- disciplinary records;
- training/CPD;
- practicing credentials;
- role/branch history;
- policy acknowledgment;
- onboarding/offboarding;
- asset issuance;
- access review.

### 3.18 Client and external portals

- secure client login;
- selected matter status/timeline;
- appointments/court dates;
- document sharing and upload;
- messages and information requests;
- settlement authority;
- approvals/acknowledgments;
- receipts/payment instructions;
- notification preferences;
- restricted expert/doctor/process-server collaboration.

### 3.19 Reporting and BI

- pipeline, aging and bottlenecks;
- limitation/court risk;
- staff workload;
- filing/service turnaround;
- intake conversion;
- source/referral performance;
- client-money balances;
- unreconciled transactions;
- expenses, fees, WIP, collections, profitability;
- branch performance;
- integration health;
- audit/security events;
- data-quality exceptions.

### 3.20 Platform administration

- global/scoped settings;
- branches;
- practices/matter types;
- workflow builder;
- custom fields/forms/views;
- numbering;
- templates;
- stamps/signatures/letterheads;
- email/calendar/communication providers;
- notification rules;
- finance policy;
- retention;
- security/SSO;
- API keys/webhooks;
- feature flags;
- queues/jobs;
- health/logs;
- imports/exports;
- audit.

## 4. Configuration before customization

If two legitimate legal teams could reasonably want different behavior, prefer an administrator-configurable setting over a hard-coded branch in application code.

Do not make everything configurable. Accounting integrity, audit invariants, security boundaries and record immutability remain enforced in code.

The goal is **safe configurability**, not a no-code free-for-all.
