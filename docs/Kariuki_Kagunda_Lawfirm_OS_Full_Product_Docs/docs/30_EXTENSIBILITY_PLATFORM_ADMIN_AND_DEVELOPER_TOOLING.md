# 30 - Extensibility, Platform Administration and Developer Tooling

## 1. API platform

The internal web app should consume the same versioned API principles made available to approved integrations. Use `/api/v1` with OpenAPI and stable resource IDs.

API concerns:
- authentication;
- authorization;
- idempotency keys for mutations;
- pagination;
- filtering/sorting;
- optimistic concurrency/version tokens;
- error envelopes;
- audit context;
- request correlation IDs;
- rate limiting;
- deprecation policy.

## 2. Event catalogue

Publish domain events internally, for example:
- `matter.created`;
- `matter.stage.changed`;
- `handoff.created`;
- `task.overdue`;
- `court.event.outcome_recorded`;
- `document.version.approved`;
- `client_money.receipt.posted`;
- `settlement.distribution.authorized`;
- `client.portal.instruction_received`.

Events should use an outbox pattern so committed business data and event delivery do not drift.

## 3. Webhooks

Admin UI should support:
- endpoint URL;
- event subscriptions;
- signing secret;
- active/paused;
- retry policy;
- delivery history;
- request/response metadata with sensitive values redacted;
- replay;
- secret rotation;
- IP allowlist optional;
- test event.

Webhook payloads must not include unrestricted sensitive legal data by default.

## 4. API clients

Records:
- client name;
- owner;
- scopes;
- branch/matter restrictions if applicable;
- secret/key metadata;
- expiry;
- last use;
- rate limits;
- disabled/revoked;
- audit.

## 5. Extension architecture

Do not support arbitrary server code uploads in the first full-product release. Prefer controlled extension points:
- webhooks;
- API clients;
- automation actions;
- template helpers;
- custom fields/forms;
- configuration packages;
- optional signed plugin modules deployed by administrators in later maturity.

A future plugin SDK can expose bounded interfaces rather than database access.

## 6. Feature flags

Feature flags require:
- key;
- description;
- owner;
- allowed environments/scopes;
- rollout percentage/user/branch targeting where justified;
- start/end date;
- dependency;
- reason;
- audit.

No flag should be used as a permanent substitute for permissions.

## 7. Job administration

BullMQ operations UI should show:
- queue;
- job type;
- state;
- attempts;
- created/start/finish time;
- correlation/matter ID when safe;
- last error;
- retry/cancel action subject to permission;
- dead-letter/failure state;
- worker health.

Examples: OCR, email send, notification fanout, calendar sync, document conversion, report generation, backup verification, webhook delivery.

## 8. Integration connection registry

Every provider connection should be a backend record with:
- provider type;
- display name;
- scope;
- environment;
- credential references;
- status;
- status reason;
- last test;
- last successful sync;
- last error;
- rate/quota status;
- webhook status;
- sync cursor;
- mapping profile;
- owner.

Status values should distinguish `not_configured`, `configured_untested`, `connected`, `degraded`, `error`, `disabled`, `demo`.

## 9. System operations console

Sections:
- application/version/build;
- database connectivity/migrations;
- Redis;
- workers/queues;
- document storage/capacity;
- search/OCR;
- email queue;
- webhook queue;
- scheduled jobs;
- backups/last restore test;
- TLS/domain;
- error tracking;
- logs/correlation search;
- maintenance mode;
- feature flags.

## 10. Diagnostics bundle

Technical admin can generate a support bundle containing version, health, anonymized configuration metadata and logs for a chosen time window. It must exclude secrets and should redact sensitive client/matter content by default.

## 11. Developer workflow

Repository standards:
- pnpm workspace;
- strict TS;
- lint/typecheck/test/build in CI;
- database migration review;
- generated OpenAPI contracts;
- test fixtures, not production data;
- feature-level README/ADR where necessary;
- no unimplemented operational buttons in production navigation.
