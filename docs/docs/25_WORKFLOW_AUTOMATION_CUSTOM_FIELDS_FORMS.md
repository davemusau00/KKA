# 25 - Workflow, Automation, Custom Fields and Forms

## 1. Principle

Matter types must be configurable packages that combine workflow, participants, data collections, forms, templates, document requirements, automation and permissions. This is a mature legal-practice pattern and is the correct extension of the existing PI workflow model.

## 2. Matter type package

A `MatterTypeDefinition` should include:
- practice area;
- name/code;
- enabled state;
- default workflow version;
- permitted branches/teams;
- party/participant roles;
- custom data collections;
- intake form;
- matter layout;
- document/folder profile;
- template pack;
- deadline rules;
- rate/billing defaults;
- access policy;
- closure checklist;
- portal policy;
- report tags.

## 3. Workflow version model

Do not update live historical matters by mutating a shared workflow object. Use:
- `WorkflowDefinition`;
- `WorkflowVersion`;
- `StageDefinition`;
- `TransitionDefinition`;
- `MatterWorkflowInstance`;
- `MatterStageInstance`.

New matters receive the active version. Existing matters remain pinned unless an authorized migration explicitly upgrades them.

## 4. Stage definition

A stage may contain:
- name/code;
- description;
- entry criteria;
- exit criteria;
- required fields;
- required documents;
- required tasks;
- checklist;
- responsible role/team;
- assignment rule;
- target duration;
- SLA;
- deadlines generated at entry;
- task templates;
- approval gates;
- notification rules;
- automation on enter/exit;
- allowed transitions;
- skip/rollback policy;
- portal milestone visibility.

## 5. Transition gates

Gate types:
- all required tasks complete;
- selected task group complete;
- required fields populated;
- required documents present and correct status;
- approval complete;
- client instruction recorded;
- payment received;
- court event outcome recorded;
- no unresolved critical risk flag;
- custom rule expression.

A transition blocked by a gate must explain exactly what is missing and link users to fix it.

## 6. Assignment engine

Assignment strategies:
- named user;
- role in responsible branch;
- team queue;
- round robin;
- least active workload;
- supervisor chooses;
- previous stage owner;
- client relationship owner;
- court clerk assigned to matter;
- finance contact assigned to matter.

Assignment rules need fallback and escalation if no eligible user exists.

## 7. Automation engine

Triggers:
- record created/updated;
- stage entered/exited;
- task completed;
- deadline approaching/overdue;
- document uploaded/approved/signed;
- court outcome recorded;
- payment received;
- message received;
- client portal action;
- scheduled time/cron;
- webhook/integration event;
- manual button.

Actions:
- create/update task;
- create deadline/event;
- send notification/email/SMS/WhatsApp;
- create document from template;
- request approval;
- assign/reassign;
- set field;
- create communication record;
- add portal request;
- enqueue integration job;
- invoke webhook;
- create audit note.

Automation must be idempotent. Each execution should have a rule version and execution key.

## 8. Rule expression model

Use a safe rules DSL, not arbitrary JavaScript stored in the database. Example:

```text
WHEN matter.stage == "demand_negotiation"
AND negotiation.last_offer_amount >= matter.quantum.minimum_recommended
AND client.settlement_authority_status != "approved"
THEN request_approval("client_settlement_authority")
```

The engine should have validation, test mode and an explanation view.

## 9. Custom data collections

Support single-row and multi-row collections. Examples:
- Accident Details: single row;
- Vehicles: multi-row;
- Witnesses: multi-row;
- Medical Treatment Episodes: multi-row;
- Special Damages: multi-row;
- Dependants: multi-row.

Field types:
- text/textarea;
- number/currency/percentage;
- date/datetime/time;
- boolean;
- single/multi-select;
- hierarchical select;
- phone/email/url;
- person/contact reference;
- matter/client/document reference;
- address;
- calculated field;
- rich text;
- file/document request;
- signature/acknowledgement field where allowed.

## 10. Field properties

Each custom field needs:
- key;
- label/help text;
- data type;
- validation;
- required rule;
- conditional visibility;
- default;
- options/provider;
- permissions;
- searchable/indexed flag;
- merge-field availability;
- portal visibility;
- audit sensitivity;
- retention classification.

## 11. Form builder

Forms can be used for:
- intake;
- client data collection;
- internal review;
- court attendance;
- expense request;
- matter closure;
- client portal request;
- HR workflows.

Builder capabilities:
- sections/pages;
- conditional branching;
- repeated groups;
- validation;
- save/resume;
- attachments;
- computed fields;
- approval/review;
- versioning;
- mobile-first rendering;
- print/PDF snapshot.

## 12. Views and layouts

Admin-configurable list and matter views:
- visible columns;
- filters;
- sort;
- grouping;
- saved views;
- role defaults;
- branch defaults;
- board stages;
- card fields;
- matter tab layout;
- field section order.

Do not allow view customization to bypass field-level permissions.

## 13. Workflow sandbox

Before publishing a workflow version, admins should run simulated scenarios with demo data and see:
- stages visited;
- generated tasks/deadlines;
- notifications that would be sent;
- approvals required;
- assignment outcomes;
- rule errors;
- unreachable stages;
- cycles;
- missing templates/fields;
- estimated SLA timeline.

## 14. Current repository migration

The existing `PracticeAreaWorkflow`, `WorkflowStageConfig` and PI seed data are useful source concepts. Migrate them into versioned database definitions. Existing frontend editors can be retained as early UI but must call backend workflow APIs and cannot edit active versions in place.
