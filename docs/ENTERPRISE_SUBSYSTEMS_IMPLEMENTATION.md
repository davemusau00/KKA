# Enterprise Subsystems Increment

This increment activates KKA data models that already existed in `prisma/schema.prisma` but did not yet have complete operational UI/API coverage. It intentionally adds **no Prisma migration**.

## Included

### People operations
- Employee profile register over the existing `EmployeeProfile` model.
- Self-service leave requests.
- HR firm-wide leave register.
- Approval, rejection and cancellation workflow.
- Overlapping leave protection and audit events.

### Procurement
- Vendor register.
- Purchase requisition register and creation.
- Requisition approval/rejection.
- Purchase-order creation from an approved requisition.
- Partial/full receipt state.
- Audited state changes.

### Asset custody
- Asset register and automatic asset numbering.
- Explicit custody assignment records.
- Return-to-stock workflow.
- Repair/retired/lost status controls.
- Audit history for creation, custody and status changes.

### Projects and meetings
- Internal project register and project creation.
- Meeting register and scheduling.
- Minutes and meeting lifecycle updates.
- Meeting decisions.
- Meeting actions with optional conversion to a persisted task.

### Knowledge
- Searchable internal knowledge library.
- Draft, review, publish and archive lifecycle.
- Editing published content returns it to draft.
- Optional link to a stored document.
- Audited editorial changes.

### Help Center
- Task-oriented OS field guide.
- Searchable FAQ.
- Lightweight guided onboarding progress stored only as a UI preference.

## Routes

- `/operations`
- `/knowledge`
- `/help`

The installer adds navigation entries to the existing application shell.

## Permissions

Existing permission keys are reused:

- `module.operations`
- `operations.manage`
- `hr.manage`
- `procurement.manage`
- `assets.manage`
- `module.knowledge`
- `knowledge.manage`

Self-service leave and the Help Center are available to authenticated users even when they do not hold broad operations-management permissions. Sensitive mutations remain permission-gated by the API.

## Deliberately deferred

Per the build instruction for this increment, automated tests and acceptance evidence are deferred. This means implementation does **not** change the release classification of these domains to locally accepted. Before staff launch, each vertical slice still needs reload, second-user, cross-firm, stale/concurrent, audit and browser acceptance evidence.
