# 34 - Full Product Acceptance Matrix

## 1. Purpose

This matrix defines full-product acceptance outcomes. It does not imply all outcomes ship in one release. A feature is accepted only when its workflow, persistence, permissions, audit, error states and relevant integrations are functional end-to-end.

| Domain | Acceptance outcome |
|---|---|
| Authentication | Real user can sign in/out, sessions expire/revoke, no seeded persona masquerades as auth |
| RBAC | Server denies unauthorized API action even if frontend is bypassed |
| Matter access | Restricted matter is absent from unauthorized search/list/detail/export |
| Branches | User can operate across allowed branches; responsible/originating branch are distinct |
| Intake | Lead can progress through conflict, KYC, approval and conversion with full audit |
| Conflicts | Search records parties/criteria/results/reviewer and blocks conversion according to policy |
| Matter numbering | Concurrent creation cannot issue duplicate references |
| Workflow | Matter is pinned to a workflow version; transition gates are enforced server-side |
| Handoff | Stage handoff persists, recipient acknowledges, supervisor sign-off enforced where configured |
| Deadlines | Official deadline is separate from task working date; changes are audited and risk-alerted |
| Calendar | Court event can create/drive tasks/reminders and provider sync has conflict/error handling |
| Tasks | Dependencies, blockers, recurrence, review and SLA states function across web/mobile |
| Documents | Bytes stored privately; metadata/version/checksum retained; preview/download authorized |
| Document review | Submit/approve/reject/sign/file creates auditable state transitions |
| Marks/signatures | Applying a mark creates new version and records exact asset/version/placement/actor |
| Templates | Generated document records template version and merge snapshot/source IDs |
| Search | Authorized full-text/global search finds core records without leaking restricted data |
| Email outbound | Message is queued, sent through real provider and delivery/failure state recorded |
| Email inbound | Mail is captured, threaded and routed/triaged to correct matter with attachment handling |
| WhatsApp/SMS | Provider status and consent rules are real; delivery not fabricated |
| Notifications | Rules target correct users/channels; escalation and acknowledgement work |
| Court operations | Filing/service/outcome workflow links documents, expenses, dates and tasks |
| PI evidence | Vehicles/witnesses/exhibits support multi-row records and document links |
| PI medical | Treatment/report requests track status/cost/documents and due follow-ups |
| Liability/quantum | Structured assessment and evidence links support review/version history |
| Negotiation | Offers/counteroffers/client authority create immutable negotiation ledger |
| Judgment/recovery | Award, decree, payments/execution and recovery tasks remain linked to matter ledger |
| Client money | Each receipt/payment is attributable to account and separate client/matter ledger |
| Reconciliation | Bank/mobile statement import can be reconciled with unresolved exceptions visible |
| Fees | Fee note lines/tax/rates/allocations are reproducible and auditable |
| Expenses | Request, approval, disbursement, receipt and reconciliation are separate states |
| Settlement | Distribution statement cannot release without configured approvals/client-money checks |
| Timekeeping | Timer survives navigation; posted entries cannot be silently rewritten after billing lock |
| HR | Employee/leave/records permissions are separate from normal user-directory access |
| Procurement | Requisition through approval/order/receipt/payment can be traced and reported |
| Assets | Asset custody/history is retained across assignment/return/disposal |
| Knowledge | Published precedent has version, owner, review date and usage provenance |
| Meetings | Meeting decisions/action items link to tasks/matters and remain searchable |
| Client portal | External user sees only explicitly allowed matter data and all access is auditable |
| Custom fields | Admin can create field/data collection for matter type without code deployment |
| Forms | Admin can publish versioned conditional intake/internal/portal forms |
| Automation | Rule executes idempotently, is versioned, testable and has execution log |
| Settings | Effective value shows source/inheritance/history; secrets masked; high-impact changes approved |
| Integrations | Status reflects real connection test; disabled/demo states are explicit |
| API/webhooks | Scoped API client and signed webhook delivery/retry/audit function |
| Offline | Supported mutation queues locally, syncs idempotently and surfaces conflicts |
| Audit | Sensitive mutations produce append-only server audit with correlation and actor context |
| Retention | Policy can archive/delete only when no legal hold and approvals are satisfied |
| Backups | Automated backup succeeds and periodic documented restore test proves recoverability |
| Observability | Health, job failures, storage pressure and integration failures are visible/alerted |
| Responsive | Core operational screens remain usable on supported desktop/tablet/mobile widths |
| Accessibility | Keyboard, focus, contrast and semantic control requirements pass agreed baseline |
| Performance | Agreed list/search/detail SLOs are measured against production-like data volume |
| Truthfulness | No simulated action is displayed as successfully connected, paid, filed, signed or delivered |
