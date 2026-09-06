# 28 - Client Portal and External Collaboration

## 1. Goal

The client portal is part of the full-product target. It should provide controlled, understandable access to approved matter information without exposing the internal legal workspace.

## 2. External identity

Support:
- client portal user linked to client/representative;
- invitation lifecycle;
- verified email/phone;
- MFA policy;
- session/device management;
- account recovery;
- expiry/revocation;
- representation/guardian authority records;
- organization client contacts;
- external counsel/expert collaborator profiles separately from client users.

## 3. Visibility model

Never expose internal matter objects by default. Every portal-visible object should be explicitly governed by a `PortalVisibilityPolicy` and/or `ShareGrant`.

Possible policy levels:
- hidden;
- milestone-only;
- summary;
- shared to named users;
- downloadable;
- upload-request only.

## 4. Portal screens

- Home / My Matters;
- Matter Summary;
- Milestones / Status;
- Upcoming Dates;
- Messages;
- Requests for Information;
- Shared Documents;
- Upload Documents;
- Instructions / Approvals;
- Fees / Payments / Receipts where enabled;
- Settlement Statement;
- Profile / Contact Preferences;
- Security / Devices.

## 5. Client updates

Internal users should generate structured client updates from events, for example:
- court date set/change;
- matter filed;
- service completed;
- hearing conducted;
- judgment delivered;
- settlement offer received;
- payment received;
- documents required.

Updates can require supervisor approval depending on template/risk.

## 6. Instructions and authority

Support auditable client decisions such as:
- approve settlement amount/range;
- confirm instructions to file/withdraw;
- approve factual statement;
- acknowledge advice/risks;
- confirm bank/payment details through secure workflow.

The record should capture exact text/version, user, timestamp, authentication state and any document signed/acknowledged.

## 7. External document exchange

Uploads need:
- malware scan;
- size/type validation;
- quarantine until accepted if policy requires;
- client-provided classification;
- matter association;
- checksum;
- uploader/time;
- review status;
- eventual conversion into normal document record.

## 8. Payment information

If payments are enabled:
- display firm-approved payment instructions;
- never expose arbitrary account edits to ordinary users;
- use server-side payment provider integration;
- link receipts to finance ledger only after provider confirmation/reconciliation;
- avoid equating payment initiation with cleared funds.

## 9. External experts/counsel

Controlled collaboration may allow named experts/counsel to see specific documents/tasks without becoming normal firm users. Use share grants, expiry and matter-level restrictions.

## 10. Audit

Record portal login/security events, viewed/downloaded documents, uploads, messages, instructions, approvals, payment events and revoked access.

## 11. Current repository note

The current `ClientPortalView` is a prototype. Any current text claiming active encryption/token security must be presented as design/demo language until the backend identity, authorization, storage and audit capabilities exist.
