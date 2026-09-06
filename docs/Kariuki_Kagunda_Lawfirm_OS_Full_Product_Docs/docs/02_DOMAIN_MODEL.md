# 02. Domain Model

## 1. Organization

Represents the law firm.

Fields:
- id
- name
- legal_name
- default_currency
- timezone
- settings

MVP assumes one organization, but schema should remain organization-scoped.

## 2. Branch

Fields:
- id
- organization_id
- name
- code
- address
- phone
- email
- is_active

## 3. User Profile

Auth identity and firm identity are separate concerns.

Fields:
- id
- auth_user_id
- organization_id
- home_branch_id
- full_name
- job_title
- phone
- email
- is_active
- avatar_path

Relationships:
- roles
- branch memberships
- matter assignments
- task assignments

## 4. Client

A client may be:
- person,
- company/organization.

Core fields:
- id
- organization_id
- client_type
- display_name
- first_name
- last_name
- legal_name
- id_number
- phone
- alternate_phone
- email
- postal_address
- physical_address
- preferred_contact_method
- status
- notes

PI extensions may capture:
- next of kin,
- occupation,
- employer,
- date of birth,
- injury context.

Keep highly specific data in related records where practical.

## 5. Intake / Lead

Represents a prospective matter before formal opening.

Fields:
- source
- referrer
- contact details
- incident date
- brief description
- practice area
- assigned intake owner
- disposition
- converted_matter_id

Statuses:
- new
- contacting
- awaiting_information
- under_review
- accepted
- declined
- duplicate
- converted

## 6. Matter

The main operational object.

Fields:
- id
- organization_id
- internal_reference
- title
- client_id
- practice_area_id
- matter_type_id
- workflow_template_id
- originating_branch_id
- responsible_branch_id
- supervising_user_id
- current_stage_id
- opened_at
- status
- priority
- summary
- next_action
- closed_at
- closure_reason

Statuses:
- draft
- active
- on_hold
- closed
- archived

Do not confuse matter status with workflow stage.

## 7. Matter Party

Represents:
- plaintiff/claimant
- defendant
- insurer
- advocate
- witness
- doctor
- police station/contact
- employer
- third party

Fields:
- matter_id
- party_type
- name
- organization_name
- contact fields
- role_description
- notes

## 8. Court Proceeding

A matter can have multiple proceedings.

Fields:
- id
- matter_id
- court_name
- station
- division
- case_number
- proceeding_type
- filed_at
- status
- judge_or_magistrate
- opposing_counsel
- notes

## 9. Workflow Template

Defines reusable stages for a matter type.

A workflow template contains ordered Stage Templates.

## 10. Matter Stage Instance

Represents the current/previous stages of an actual matter.

Fields:
- matter_id
- stage_template_id
- status
- started_at
- completed_at
- owner_user_id
- owner_team_id
- completion_notes

Keep history.

## 11. Matter Assignment

Represents responsibility.

Fields:
- matter_id
- user_id
- role_on_matter
- stage_id
- assigned_at
- unassigned_at
- assigned_by
- is_primary

## 12. Stage Handoff

Fields:
- matter_id
- from_stage_id
- to_stage_id
- from_user_id
- to_user_id
- handoff_notes
- created_at
- created_by
- acknowledged_at

## 13. Task

Fields:
- title
- description
- matter_id nullable
- internal_project_id nullable
- stage_id nullable
- calendar_event_id nullable
- document_id nullable
- assigned_to
- created_by
- reviewer_id
- priority
- status
- start_at
- due_at
- official_deadline_at nullable
- completed_at
- blocked_reason
- is_recurring

Task statuses:
- todo
- in_progress
- blocked
- waiting_external
- waiting_review
- completed
- cancelled

## 14. Deadline

Use when the legal/business deadline itself must exist independently of work tasks.

Fields:
- matter_id
- title
- deadline_type
- official_due_at
- source
- risk_level
- notes
- completed_at

A deadline can generate one or more preparation tasks.

## 15. Calendar Event

Types:
- court
- client_meeting
- internal_meeting
- medical
- filing
- deadline
- other

Fields:
- matter_id
- title
- event_type
- start_at
- end_at
- all_day
- location
- virtual_meeting_url
- assigned_user_id
- organizer_id
- court_proceeding_id
- notes
- external_google_event_id
- sync_state

## 16. Document

Represents the logical document.

Examples:
- Plaint
- Medical Report
- Police Abstract
- Demand Letter
- Judgment
- Receipt

Fields:
- matter_id
- title
- document_type_id
- category_id
- status
- confidentiality_level
- current_version_id
- owner_user_id

## 17. Document Version

Append-only normal flow.

Fields:
- document_id
- version_number
- storage_path
- original_filename
- mime_type
- file_size
- checksum
- uploaded_by
- created_at
- status
- notes

Statuses:
- draft
- review
- approved
- signed
- filed
- served
- superseded
- archived

## 18. Communication

Unified record for:
- internal message,
- email log,
- WhatsApp log,
- phone call note,
- client update,
- letter metadata.

Fields:
- matter_id
- communication_type
- direction
- subject
- body/summary
- from_actor
- to_actor
- occurred_at
- external_message_id
- attachment links

## 19. Channel / Thread

Internal Slack-like channels:
- firm-wide
- branch
- team
- matter

Messages support:
- replies
- mentions
- attachments
- task conversion
- matter references

## 20. Expense

Represents actual spend.

Fields:
- matter_id nullable
- branch_id
- category_id
- amount
- currency
- spent_at
- description
- paid_by_user_id
- payment_source
- receipt_document_id
- status

## 21. Expense Request

Approval flow:
- requested
- approved
- rejected
- disbursed
- reconciled
- cancelled

## 22. Financial Account

Account type:
- office
- client
- petty_cash
- bank
- mobile_money
- other

MVP does not implement a full general ledger but must preserve account type distinctions.

## 23. Financial Transaction / Ledger Entry

Fields:
- account_id
- matter_id nullable
- transaction_type
- amount
- currency
- direction
- occurred_at
- reference
- counterparty
- evidence_document_id
- notes

## 24. Invoice / Receipt

Basic billing and receipt records.

## 25. Personal Injury Extension

Use related tables:
- incident
- injury
- medical_provider
- medical_record
- insurer_claim
- police_record
- vehicle
- liability_assessment
- settlement

Do not overload the base matter table.

## 26. Filing Record

Tracks internal court filing operation.

Fields:
- matter_id
- court_proceeding_id
- filing_type
- submitted_at
- submitted_by
- fee_amount
- payment_reference
- receipt_document_id
- filing_reference
- status
- stamped_document_id
- notes

## 27. Service Record

Fields:
- matter_id
- document_id
- party_id
- service_method
- served_at
- served_by
- affidavit_document_id
- status
- notes

## 28. Settlement

Fields:
- matter_id
- offer_amount
- offer_date
- party
- status
- accepted_at
- settlement_amount
- settlement_terms
- related_documents

## 29. Audit / Activity Event

Immutable-style event:
- actor
- action
- entity_type
- entity_id
- matter_id
- timestamp
- metadata

It powers the matter timeline and management traceability.
