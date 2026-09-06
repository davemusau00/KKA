# 27 - HR, Procurement, Assets and Internal Operations

## 1. HR purpose

The OS should eventually manage the staff lifecycle alongside legal work, without mixing confidential HR records into ordinary staff-directory permissions.

## 2. Employee record

- personal/contact information;
- employee/staff number;
- legal name/display name;
- employment status;
- job title;
- department/team;
- home/additional branches;
- manager/supervisor;
- start/end dates;
- contract type;
- bar/admission details where relevant;
- emergency contact;
- payroll identifiers only if payroll integration requires them;
- employment documents;
- leave balances;
- training/CPD;
- performance records;
- disciplinary records;
- assigned assets;
- system account linkage.

## 3. Onboarding

Configurable onboarding checklist:
- contract/offer documents;
- ID/tax/payroll details;
- confidentiality/data protection acknowledgement;
- user account;
- roles/branch;
- device allocation;
- email/calendar setup;
- induction/training;
- supervisor assignment;
- practice/workflow access;
- completion sign-off.

## 4. Offboarding

Critical workflow:
- termination/end date;
- revoke login/session/API tokens;
- remove external integration access;
- reassign open matters/stages/tasks;
- transfer calendar/mail responsibilities where permitted;
- revoke signature delegation;
- return assets;
- settle expenses/advances;
- archive HR records under policy;
- record final handover.

## 5. Leave

- leave types;
- entitlement/accrual;
- branch holidays;
- request/approval;
- attachments where appropriate;
- team coverage warning;
- court-date/deadline conflict warning;
- delegate tasks/matters during leave;
- calendar blocking;
- carry-forward rules;
- audit.

## 6. Performance and supervision

- performance cycle;
- objectives/KPIs;
- competency framework;
- 1:1/check-ins;
- matter supervision metrics;
- quality review;
- training plans;
- review acknowledgement;
- access restricted to HR/authorized management.

Do not mechanically rank lawyers by outcomes such as case wins without contextual/legal review. Performance metrics should emphasize timeliness, quality, client service, compliance, workload and professional development.

## 7. Training and CPD

- course/event;
- provider;
- date/hours;
- practice area;
- certificate/document;
- required/optional;
- approval/budget;
- expiry/renewal;
- reports.

## 8. Procurement

Lifecycle:

```text
Need identified
 -> purchase requisition
 -> budget/cost-centre check
 -> approval
 -> vendor selection/quotation
 -> purchase order
 -> goods/service received
 -> invoice captured
 -> three-way/two-way match where applicable
 -> payment request
 -> payment/reconciliation
 -> asset creation if capital item
```

## 9. Vendor management

- supplier identity;
- contacts;
- category;
- tax/payment data;
- bank details protected;
- contract documents;
- rates;
- branch coverage;
- performance notes;
- approved/suspended status;
- duplicate detection;
- audit.

Legal third parties such as process servers, doctors and valuers may appear in the external directory but vendor/payee attributes should be permissioned separately.

## 10. Assets

- asset ID/barcode;
- class;
- description/model/serial;
- purchase info;
- vendor;
- branch/location;
- custodian;
- status;
- warranty;
- maintenance;
- assignment history;
- return;
- loss/damage;
- disposal.

## 11. Office operations

Additional modules:
- facilities issues;
- room/resource booking;
- stationery requests;
- courier/logistics register;
- incoming/outgoing physical mail register;
- visitor/appointment register if required;
- branch operational checklists.

## 12. Permissions

HR, procurement and assets require separate permission namespaces. Matter access does not imply access to salary/disciplinary information; finance access does not automatically imply access to employee personal files.
