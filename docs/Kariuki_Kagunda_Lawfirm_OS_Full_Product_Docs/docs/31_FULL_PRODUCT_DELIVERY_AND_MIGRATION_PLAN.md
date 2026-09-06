# 31 - Full Product Delivery and Prototype Migration Plan

## 1. Delivery principle

"Beyond MVP" does not mean attempting every screen before creating durable architecture. It means the architecture and product model are designed for the full product from the start, while implementation is delivered in safe vertical slices.

The existing prototype becomes a UX/domain reference implementation. Production conversion should be incremental and testable.

## 2. Track A - Foundation conversion

Deliver first:
- monorepo restructuring;
- NestJS API;
- worker;
- PostgreSQL/Prisma;
- Redis/BullMQ;
- Caddy/Compose;
- session auth;
- user/branch/role persistence;
- server audit;
- configuration framework;
- health/observability;
- CI.

Exit criteria: authenticated user can log in, load authoritative profile/branch/config from backend, and server authorization is enforced.

## 3. Track B - Matter spine

Convert:
- clients;
- intake/conflict/KYC;
- matters;
- parties/proceedings;
- workflow definitions/instances;
- assignments/handoffs;
- tasks/deadlines;
- matter timeline.

Exit criteria: a PI intake can become a matter and advance through persisted gated stages with audit.

## 4. Track C - Documents and communications

Convert:
- private file storage;
- document metadata/versioning;
- preview/download;
- review/approval;
- template generation;
- marks/signatures/stamps;
- email outbound/inbound;
- matter correspondence;
- notifications.

Exit criteria: real document bytes and real correspondence flow are authorized, auditable and matter-linked.

## 5. Track D - Court operations

- proceedings;
- filing packages;
- service queue;
- calendar/deadline propagation;
- outcome capture;
- hearing brief;
- judgment/recovery.

External court integration should only be added when an officially supported, reliable integration path is confirmed. Manual/deep-link/import workflows remain valid.

## 6. Track E - Finance and client money

- account model;
- journals/ledger transactions;
- receipts;
- matter/client ledgers;
- office/client separation;
- expense/requisition/disbursement;
- fee notes;
- time/WIP;
- reconciliation;
- M-Pesa/bank import;
- settlement distribution;
- locks/approvals;
- reporting.

Finance must pass invariant and reconciliation tests before production use.

## 7. Track F - Enterprise operations

- HR;
- leave;
- procurement;
- vendors/assets;
- meetings/knowledge;
- reporting builder;
- client portal;
- external collaborators;
- deeper settings and custom builders.

## 8. Track G - Platform maturity

- SSO;
- advanced retention/legal hold;
- webhook/API platform;
- plugin/extension model;
- advanced BI;
- OCR/scalable search;
- HA architecture;
- advanced digital-signature provider.

## 9. Prototype-to-production migration technique

For each workspace:
1. freeze new prototype-only state mutation;
2. define backend schema and API contract;
3. write migration/seed fixture;
4. implement backend service with authorization/audit;
5. add TanStack Query hooks;
6. replace AppContext collection with server query;
7. replace mutations with API calls;
8. add route/deep link;
9. add E2E test;
10. remove obsolete localStorage key;
11. update `PROJECT_STATE.md`.

## 10. Data migration from current real firm records

Prepare dedicated import pipelines for:
- clients;
- matter register;
- court case numbers;
- staff;
- balances/client ledgers only after finance validation;
- open tasks/dates;
- document files;
- M-Pesa/bank statements;
- Excel expense records.

Every import should support dry run, mapping, validation report, duplicate handling, error file and immutable import batch record.

## 11. Release gates

A release is not firm-production ready unless:
- backup + restore test passes;
- authorization test suite passes;
- P0 security issues are closed;
- finance invariants pass for enabled finance functions;
- simulated capabilities are absent or visibly demo-only;
- operational runbook is current;
- migration rollback exists;
- monitoring/alerts exist;
- user training and permissions review are complete.
