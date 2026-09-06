# 29 - Reporting, BI, Data Governance and Records Management

## 1. Reporting principles

Reports should derive from authoritative transactional data and should be reproducible. Dashboard numbers must have drill-through to source records and clear time/scope filters.

## 2. Core report families

### Matter operations
- active matters by branch/practice/type/stage;
- stage aging;
- stalled matters;
- open handoffs;
- overdue tasks;
- upcoming critical deadlines;
- court dates and outcomes;
- filing/service turnaround;
- closure rate and duration.

### PI practice
- evidence completeness;
- medical-report aging;
- liability assessment status;
- demand/offer history;
- settlement values;
- judgment/recovery aging;
- insurer/third-party turnaround;
- special damages evidence gaps.

### Intake/CRM
- lead volume/source;
- conflict outcomes;
- acceptance/decline;
- conversion rate;
- time to first response;
- time to open matter;
- referral source performance.

### Finance
- client-money balances by account/client/matter;
- reconciliation exceptions;
- unallocated receipts;
- office receivables;
- fee notes;
- WIP/time;
- matter disbursements;
- petty cash;
- branch/cost-centre expenses;
- settlement distributions;
- profitability.

### People
- workload/capacity;
- leave coverage;
- task SLA;
- court attendance volume;
- time entries;
- training/CPD;
- onboarding/offboarding status.

### System
- integration health;
- mail delivery failures;
- job failures;
- storage usage;
- backup freshness;
- audit/security events;
- API/webhook volume.

## 3. Report builder

Authorized admins should build reports from approved semantic datasets rather than raw SQL. Features:
- dimensions/measures;
- filters;
- date windows;
- grouping;
- pivot/table/chart;
- saved reports;
- role/branch scope;
- scheduled PDF/CSV/XLSX delivery;
- row-level authorization;
- export audit.

## 4. Data dictionary

Maintain a machine-readable data catalogue:
- object/field;
- business definition;
- owner/steward;
- source of truth;
- sensitivity;
- retention class;
- search/index policy;
- portal eligibility;
- reporting eligibility;
- lineage.

## 5. Data quality

Rules may detect:
- duplicate clients/contacts;
- invalid phone/email formats;
- missing client ID/KYC fields;
- matter without responsible branch;
- matter with no stage owner;
- court event without proceeding;
- received client money without client/matter allocation;
- expense without evidence where policy requires;
- contradictory closure states;
- orphaned documents;
- stale external directory details.

A data-quality issue should be assignable and auditable.

## 6. Retention and archiving

Retention is policy-driven, not a single `archivalRetentionYears` number. Define retention classes by data/document category, legal/business requirements and firm policy. Support:
- trigger event: closure, last transaction, employment end, etc.;
- retention duration;
- legal hold override;
- archive tier;
- deletion/anonymization workflow;
- approval;
- deletion certificate/log;
- preservation exceptions.

The Advocates (Accounts) Rules require specified accounting records to be preserved for at least six years. Product retention policies may be longer where legally/business appropriate, but the system must not silently shorten a legal minimum.

## 7. Legal holds

A legal hold can target matter, client, document collection, employee record or date range. While active it blocks automated destruction for covered records and is itself auditable.

## 8. Privacy/data protection operations

Support operational tooling for:
- processing purpose/legal basis register as firm policy requires;
- sensitive-data classification;
- access logging;
- correction/update workflows;
- data export/search for data subject requests;
- deletion/restriction decisions where legally permitted;
- breach/incident record;
- third-party processor/integration inventory;
- retention mapping.

Health and financial/legal records in PI matters require especially careful access controls.

## 9. Analytics architecture

Start reporting from PostgreSQL read models/materialized views. As volume grows, add a separate analytical store or warehouse without moving transactional truth out of PostgreSQL. Avoid adding Elasticsearch/warehouse technology before measured need.
