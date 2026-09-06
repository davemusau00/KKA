# 00. Product Charter

## Product name

Working name: **Kariuki Kagunda Lawfirm OS**

The name can be rebranded later without changing architecture.

## Product thesis

A law firm does not primarily manage "records". It manages:
- responsibility,
- deadlines,
- evidence,
- documents,
- money,
- communication,
- court events,
- transitions between people and stages.

Therefore the system must model **work in motion**.

The product should answer, within seconds:

- What matters need attention today?
- Who is responsible?
- What is blocking them?
- What happens next?
- When is the next court event?
- Which document is current?
- What has been spent on this matter?
- What money has been received?
- What did the client last hear from us?
- Who handled this stage?
- Which cases have gone quiet?
- Which deadlines are dangerous?
- What happened yesterday across both branches?

## MVP definition

"Full-scale MVP" means:
- broad enough to run real firm operations,
- intentionally shallow in a few advanced areas,
- stable core data model,
- cohesive UI,
- operational end-to-end flows,
- extension points for later depth.

It does not mean:
- every accounting standard is automated,
- every court system is directly integrated,
- every compliance/security control is fully hardened,
- every practice area has a bespoke workflow on day one.

## Success criteria

The MVP succeeds when staff can stop relying on a patchwork of:
- notebooks,
- WhatsApp reminders,
- verbal handoffs,
- scattered spreadsheets,
- individual calendars,
- unversioned local documents,
for the core daily operations represented in this specification.

## Design principles

### Matter-centric
The matter is the operational center.

### Stage-aware
Ownership can change as a matter progresses.

### Event-driven
Important actions create timeline/activity events and can trigger notifications or tasks.

### Configurable
Practice workflows should be data-driven.

### Searchable
Users should be able to find records by human identifiers.

### Responsive
Every core task must work on mobile.

### Offline-tolerant
Intermittent internet must not make the application unusable.

### Explicit states
Users should always understand whether data is:
- saved,
- queued,
- syncing,
- synced,
- failed.

### Fast-path first
Common actions should take very few interactions.

## Main workspaces

1. Home
2. Matters
3. Clients
4. Tasks
5. Calendar
6. Documents
7. Communications
8. Finance
9. Reports
10. Administration
11. Search / command palette

## Later workspaces

- Client portal
- HR depth
- Payroll
- Full accounting
- Advanced compliance
- Court portal automation
- AI drafting/knowledge tools
