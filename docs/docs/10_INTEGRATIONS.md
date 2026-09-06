# 10. Integrations

## 1. Integration architecture

Use provider adapters.

Interfaces:
- CalendarProvider
- EmailProvider
- MessagingProvider
- FileImportProvider

Do not spread Google/Twilio/Meta-specific code throughout domain UI.

## 2. Google account integration

Firm currently uses ordinary Gmail accounts.

Support per-user OAuth connection.

Features:
- Google Calendar event push
- update/cancel sync
- optional import selected events
- Gmail outbound/inbound metadata later

Store:
- provider account id
- token metadata securely server-side
- sync status
- external event/message ids

## 3. Calendar sync strategy

The law-firm OS is authoritative for matter-linked legal events.

Direction:
- internal event -> Google event
- selected Google event -> optional imported internal event

Avoid uncontrolled two-way duplication.

Map:
- title
- start/end
- location
- description summary
- attendees when permitted
- internal deep link

Do not expose confidential matter detail in Google event title by default. Use configuration.

## 4. Gmail

MVP options:
- send notification/digest via provider
- allow user to connect Google for calendar

Later:
- link email thread to matter
- create task from email
- ingest attachments
- search connected mailbox

Avoid trying to build full email client in MVP.

## 5. WhatsApp

Use Meta WhatsApp Business Cloud API or a provider abstraction.

Initial uses:
- staff urgent reminders
- optional client reminders later

Message templates:
- court reminder
- task escalation
- appointment reminder
- payment/receipt confirmation where appropriate

Store delivery status.

Do not make WhatsApp the source of truth.

## 6. Email notifications

Provider can be:
- Resend,
- Postmark,
- SMTP,
- other.

Domain layer calls generic notification service.

## 7. Excel/CSV

Use a robust parser.
Support:
- clients
- matters
- expenses
- payments
- contacts

Always preview before commit.

## 8. Calendar export

Even without OAuth:
- ICS export for event
- ICS feed later if needed

## 9. Future integrations

Possible:
- accounting software
- M-Pesa API
- bank feeds
- Judiciary/e-filing if a usable official integration path exists
- Google Drive
- document signing
- SMS


## 10. Self-hosted integration boundary

All OAuth callbacks, provider secrets, webhook verification and outbound provider calls live in the NestJS backend.

The React frontend:
- begins connection flow,
- displays connection state,
- never receives provider client secrets,
- never talks directly to WhatsApp/email provider APIs.

Webhook endpoints:
- `/api/v1/webhooks/google/...` where applicable
- `/api/v1/webhooks/whatsapp`
- `/api/v1/webhooks/email`

Provider events should be normalized into internal integration events before business logic consumes them.
