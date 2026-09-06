# 23 - Full Product Domain and Module Expansion

## 1. Product shape

The full product is an integrated legal ERP, CRM, DMS, PSA/project platform and collaboration system. A module may have its own workspace, but data should remain connected through shared domain objects and events.

## 2. Organization and firm operations

Submodules:
- legal entities;
- branches and offices;
- departments;
- teams;
- cost centres;
- practice groups;
- staff directory;
- rooms/resources;
- office holidays/hours;
- vendors and service providers;
- internal policies;
- stationery and identity assets.

## 3. CRM, intake and business development

Submodules:
- enquiries;
- referral sources;
- campaigns/source attribution;
- intake pipeline;
- appointments;
- conflict search;
- KYC/CDD;
- risk review;
- accept/decline;
- retainer/warrant to act;
- engagement documents;
- client onboarding;
- relationship graph;
- referral partner reporting.

Full-product additions:
- configurable intake forms per practice area;
- duplicate detection;
- follow-up SLAs;
- conflict result explanation and override approval;
- client consent/preferences;
- lead conversion metrics;
- rejected-lead archive with reason controls.

## 4. Matters and legal work

Matter workspace should aggregate:
- overview;
- workflow;
- parties;
- proceedings;
- timeline;
- tasks;
- deadlines;
- calendar;
- documents;
- communications;
- evidence;
- medical;
- liability/quantum;
- negotiation;
- filing/service;
- hearing;
- judgment/recovery;
- finance;
- time;
- approvals;
- portal sharing;
- audit.

## 5. Personal injury domain packs

Create separate, configurable matter-type packs rather than one hard-coded PI object:

### Motor vehicle personal injury
- accident details;
- vehicles/drivers/owners;
- police abstract/OB details;
- insurer/policy/claim;
- NTSA/search records;
- witnesses/CCTV/photos;
- treatment and reports;
- P3;
- disability;
- special damages;
- liability;
- precedents/quantum;
- demand/negotiation;
- litigation/recovery.

### Fatal claim
- deceased details;
- administrator/estate authority;
- dependants;
- funeral expenses;
- dependency/loss calculations;
- estate documents;
- fatal-claim specific templates and approvals.

### Workplace/WIBA
- employer;
- employment details;
- incident report;
- occupational injury/disease;
- medical assessment;
- statutory forms;
- WIBA compensation track;
- third-party liability track where relevant;
- compensation received and recovery offsets.

### General negligence
- incident type;
- duty/breach facts;
- responsible party;
- causation evidence;
- injuries/damages;
- demand and litigation flow.

## 6. Court operations

Submodules:
- proceeding registry;
- filing packages;
- filing queue;
- filing fee requisitions;
- court receipt capture;
- summons tracking;
- service queue;
- service attempts;
- affidavits of service;
- cause-list/diary import where lawful/supported;
- attendance sheets;
- outcome capture;
- order/direction extraction;
- next-date creation;
- hearing brief;
- submissions;
- judgment/decree;
- execution/recovery;
- appeal/review decision.

## 7. Document management

Submodules:
- document library;
- matter file view;
- folder/taxonomy profiles;
- versions;
- check-in/out or edit coordination;
- review and approval;
- signatures/stamps;
- templates;
- document assembly;
- OCR;
- full-text search;
- document comparison;
- redaction workflow;
- sharing;
- retention;
- legal hold;
- archive/export bundle.

## 8. Communications and collaboration

Submodules:
- internal channels;
- matter channels;
- comments/mentions;
- email capture;
- shared mailbox;
- WhatsApp/SMS;
- phone/call notes;
- correspondence log;
- message-to-task;
- client update queue;
- notification inbox;
- meetings/minutes/action items.

## 9. Time, billing and finance

Submodules:
- timers/time entries;
- rate cards;
- fee notes/invoices;
- professional fees;
- disbursements;
- office expenses;
- client money/trust receipts;
- client ledger;
- office ledger;
- matter ledger;
- allocations;
- transfers subject to policy;
- payment receipts;
- M-Pesa/bank import;
- reconciliations;
- petty cash;
- procurement;
- supplier payments;
- settlement distribution;
- budgets;
- WIP;
- aged receivables;
- profitability.

Finance must distinguish client money from firm money in data model, permissions, workflows and reports.

## 10. HR and people

Submodules:
- employee profile;
- contract/documents;
- roles and branches;
- leave;
- attendance where needed;
- performance cycles;
- supervision;
- training/CPD;
- disciplinary records;
- onboarding/offboarding;
- equipment/assets;
- emergency contacts;
- skills/competencies;
- workload/capacity.

## 11. Procurement and assets

- purchase requisitions;
- approvals;
- supplier directory;
- purchase orders;
- goods/service receipt;
- invoice matching;
- payment request;
- petty cash linkage;
- branch budgets;
- fixed/portable asset register;
- assignment/custody;
- maintenance;
- disposal.

## 12. Knowledge and precedents

- precedent library;
- legal research notes;
- case-law bookmarks;
- template clauses;
- internal playbooks;
- matter closing lessons;
- expertise directory;
- tags/taxonomy;
- review dates;
- owner/curator;
- superseded content;
- permissions;
- citation/source metadata.

## 13. Reporting and BI

- operational dashboards;
- partner dashboard;
- branch dashboard;
- practice dashboard;
- workload;
- stage aging;
- deadline risk;
- court diary;
- intake conversion;
- client service;
- finance/client money;
- disbursement exposure;
- time/WIP;
- settlement/recovery;
- document throughput;
- HR/leave/workload;
- integration/system health;
- configurable report builder;
- scheduled report delivery.

## 14. Client and external portal

- secure external identity;
- matter status/milestones;
- court dates;
- approved documents;
- document upload;
- messages;
- requests for information;
- approvals/instructions;
- settlement authority;
- invoices/payment instructions;
- receipts/settlement statements;
- consent/preferences;
- portal audit.

## 15. Platform administration

- configuration studio;
- integration registry;
- workflow/form builders;
- custom fields;
- feature flags;
- API clients;
- webhooks;
- job monitor;
- storage/backup status;
- audit;
- imports/exports;
- system health;
- migration/upgrade tooling.
