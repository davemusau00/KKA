# 12. Testing and QA

## 1. Testing pyramid

### Unit
- validation
- date/deadline calculations
- money formatting
- workflow transition rules
- permission helpers

### Integration
- services against test database
- migrations
- storage metadata
- event creation
- offline queue serializer

### E2E
Core user journeys.

Use Playwright or equivalent.

## 2. Required E2E journeys

### Intake to Matter
- create intake
- accept
- create client
- activate matter
- reference assigned
- matter visible in search

### Stage Handoff
- assign stage owner
- complete checklist
- move stage
- handoff logged
- next tasks generated
- assignee notified

### Court Event
- create hearing
- link matter
- event appears on calendar
- reminder state created
- add outcome
- next task created

### Document Versioning
- create document
- upload v1
- upload v2
- approve v2
- v1 remains accessible
- activity timeline correct

### Expense
- create matter expense
- attach receipt
- submit
- approve
- appears in matter finance
- appears in branch finance report

### Offline Task
- load task
- disconnect
- complete task
- queue visible
- reconnect
- server confirms
- queue clears

## 3. Responsive QA

Test widths:
- 360
- 390
- 768
- 1024
- 1440

Core flows must not require horizontal scroll.

## 4. Accessibility QA

- keyboard traversal
- dialog focus
- labels
- contrast
- reduced motion
- mobile touch target

## 5. Empty states

Test:
- new organization
- branch with no matters
- matter with no documents
- no upcoming calendar
- no notifications

## 6. Failure states

Test:
- expired Google token
- failed file upload
- notification provider down
- database network error
- offline mutation conflict
- duplicate reference attempt

## 7. Seeded test personas

- Managing Partner
- Advocate
- Paralegal
- Administrator
- Court Clerk
- Finance
- Technical Admin

## 8. Acceptance gates

CI must block merge on:
- typecheck failure
- lint failure
- test failure
- build failure

Critical E2E suite should run on main/preview.
