# 04. Workflow Engine and Legal Operations

## 1. Workflow engine objective

The firm needs predictable operational movement without forcing every matter into a rigid one-size-fits-all path.

A workflow template defines:
- stages,
- order,
- stage owners or default role,
- required tasks,
- required document types,
- completion checklist,
- optional approval gate,
- transition rules,
- reminder rules.

## 2. Default Personal Injury / Road Traffic Accident Workflow

This is an operational starting template and must remain configurable by the firm's supervising advocates.

### Stage 1: Lead / Referral
Capture:
- prospective client
- incident summary
- incident date
- source/referrer
- contact details
- preliminary conflict information

Completion:
- intake sufficiently complete
- assigned for review

### Stage 2: Intake / Acceptance
Tasks:
- intake interview
- capture client identification
- confirm contact details
- open prospective file
- acceptance/decline decision

Outputs:
- active matter
- internal matter reference

### Stage 3: Initial Evidence Collection
Possible records:
- police abstract
- treatment notes
- P3 where relevant
- receipts
- photographs
- witness contacts
- vehicle details
- insurer details

Use missing-document checklist.

### Stage 4: Medical Documentation
- collect treatment records
- arrange medical report/examination
- record medical provider
- track report request/payment/receipt

### Stage 5: Liability / Claim Preparation
- liability review
- identify defendant(s)
- insurer details
- demand/notice drafting
- valuation inputs

### Stage 6: Pre-Litigation Demand / Negotiation
- issue correspondence
- track response deadlines
- capture offers
- client instructions
- settlement authority

### Stage 7: Authority to Litigate
- partner/advocate review
- confirm necessary documents
- litigation decision

### Stage 8: Pleadings Drafting
Documents can include:
- plaint
- verifying affidavit
- witness statements
- list of witnesses
- list/bundle of documents
- other required suit papers

Status flow:
draft -> review -> approved -> signed

### Stage 9: Filing
- upload final approved versions
- record court
- record filing transaction
- filing fee
- payment reference
- court receipt
- court case number
- stamped copies

### Stage 10: Summons and Service
- request/obtain summons
- assign service
- record served party/method/date
- upload affidavit of service

### Stage 11: Defence / Pleadings Close
- record appearance/defence
- upload served responses
- assign advocate review
- capture next procedural step

### Stage 12: Pre-Trial / Compliance
- issue/compliance checklist
- bundles
- witness readiness
- outstanding documents
- court directions

### Stage 13: Hearing Preparation
- preparation tasks
- witness confirmations
- document bundle
- advocate brief
- transport/logistics if needed

### Stage 14: Hearing
Court event is central.
After event:
- outcome note
- next date
- follow-up tasks
- costs/expenses

### Stage 15: Submissions
- draft
- review
- file
- serve
- record receipt

### Stage 16: Judgment / Ruling
- judgment date
- outcome
- award details
- document upload
- next action decision

### Stage 17: Decree / Costs / Recovery
- decree
- certificate
- taxation/costs where relevant
- demand for payment
- execution/recovery activity

### Stage 18: Receipt / Settlement
- incoming funds
- client account classification
- deductions/disbursements
- client settlement statement

### Stage 19: Closure
Checklist:
- client informed
- final documents complete
- financial reconciliation complete
- balance addressed
- closure note
- archive

## 3. Handoff behavior

When stage changes:
1. current owner is recorded,
2. completion notes stored,
3. required checklist validated,
4. next stage instance created,
5. new owner assigned,
6. stage handoff event created,
7. notifications sent,
8. template tasks created,
9. activity timeline updated.

## 4. Exception workflow

Users with appropriate permission may:
- skip optional stage,
- reopen previous stage,
- add ad hoc stage,
- put matter on hold.

Every override requires a reason.

## 5. Stage board

Provide Kanban-style view by current stage.

Columns show:
- stage
- matter count
- overdue tasks
- days in stage
- assigned owner

Cards show:
- internal ref
- client/matter title
- next action
- next deadline
- assignee
- inactivity indicator

## 6. Stalled matter logic

A matter is "stalled" when:
- no meaningful activity for configurable N days,
- OR stage exceeds target duration,
- OR required item has been pending too long.

Stalled is an alert, not necessarily a status.

## 7. Workflow templates for future practice areas

Admin can clone a workflow and edit:
- stage names
- order
- default roles
- task templates
- document checklist
- target duration
- approval gates

Do not require code changes for every new practice area.
