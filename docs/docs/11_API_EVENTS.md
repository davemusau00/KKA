# 11. Application Services, APIs and Events

## 1. Service contracts

Examples of explicit business operations.

### Matters
- createMatterDraft
- activateMatter
- updateMatter
- closeMatter
- reopenMatter
- assignMatterUser
- changeMatterStage
- handoffMatterStage

### Tasks
- createTask
- updateTask
- completeTask
- blockTask
- reassignTask

### Calendar
- createCalendarEvent
- updateCalendarEvent
- cancelCalendarEvent
- recordCourtOutcome
- createDeadline

### Documents
- createDocument
- uploadDocumentVersion
- submitVersionForReview
- approveDocumentVersion
- markVersionFiled
- linkDocumentToEntity

### Finance
- createExpenseDraft
- submitExpenseRequest
- approveExpenseRequest
- recordExpense
- recordPaymentReceipt
- reconcileTransaction

## 2. API style

The public application API is implemented in **NestJS + Fastify**.

Use:
- REST endpoints under `/api/v1`,
- OpenAPI generation,
- Socket.IO for realtime,
- shared validation/contracts package.

Business rules belong in NestJS application/domain services, not controllers and never React components.

Controllers:
- parse/validate request,
- authorize,
- call service,
- map typed result to HTTP response.

Services:
- enforce business rules,
- open transactions,
- emit domain events.

Repositories:
- perform persistence access through Prisma/SQL.

## 3. Validation

Every public mutation:
- Zod request validation
- domain validation
- authorization
- transaction
- result/error object

## 4. Error model

Use typed errors:
- ValidationError
- NotFoundError
- PermissionError
- ConflictError
- IntegrationError
- SyncRequiredError

User-facing messages should be actionable.

## 5. Domain event table

Columns:
- id
- organization_id
- matter_id nullable
- event_type
- entity_type
- entity_id
- actor_user_id
- payload jsonb
- created_at
- processed_at nullable

## 6. Event handlers

Example:
`calendar.court_event_created`
- create activity event
- schedule reminders
- optionally create preparation task
- enqueue Google sync

`matter.stage_changed`
- record handoff
- generate template tasks
- notify new owner

`document.review_requested`
- notify reviewer

`expense.submitted`
- notify approver

## 7. Idempotency

External integrations and queued offline writes should use idempotency keys.

Never send duplicate WhatsApp/email messages because of a retry.

## 8. Background jobs

MVP jobs:
- reminder dispatch
- daily digest
- Google sync
- failed notification retry
- stalled-matter scan
- overdue task scan

Implement with:
- BullMQ queues,
- Redis 8.2,
- dedicated `worker` process/container,
- cron-style repeatable BullMQ jobs where suitable.

No serverless dependency is required.

Jobs must be:
- idempotent,
- retry-aware,
- observable,
- dead-letter/failure visible to an administrator.
