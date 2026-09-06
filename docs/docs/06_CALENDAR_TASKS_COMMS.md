# 06. Calendar, Tasks, Deadlines and Internal Communications

## 1. Unified planning model

Calendar, tasks and communications are linked but not identical.

- Calendar = when something happens.
- Deadline = when something must legally/business-wise be completed.
- Task = work required.
- Communication = message/update/call/email.

They may reference each other.

## 2. Calendar event creation

Required:
- title
- event type
- start
- end or duration
- assignee/organizer

Optional:
- matter
- court proceeding
- location
- remote meeting link
- notes
- linked documents
- reminder schedule

For court event:
- matter required
- court/proceeding strongly expected
- event outcome captured afterwards

## 3. Court event lifecycle

Statuses:
- scheduled
- attended
- adjourned
- completed
- cancelled

Post-event capture:
- attendance
- outcome
- orders/directions
- next date
- documents required
- new tasks
- expense quick-add
- note

## 4. Deadline distinction

A deadline object has:
- official due date,
- source,
- risk level.

A preparation task can have an earlier internal target.

If task date changes, official deadline remains unchanged.

## 5. Task creation

Required:
- title
- assignee
- status
- due date optional but encouraged

Matter-linked tasks should inherit:
- matter reference display
- branch context
- stage context where available

## 6. Task dependencies

MVP supports:
- blocked by task
- blocks task

Do not build a full project graph engine yet.

## 7. Recurring tasks

Support simple recurrence:
- daily
- weekly
- monthly
- custom RRULE if library supports it safely

Use for:
- cash reconciliation
- branch review
- file review
- weekly management meeting

## 8. Internal channels

Channel types:
- firm
- branch
- team
- matter

Matter channel automatically follows matter membership by default.

## 9. Message features

MVP:
- text
- mentions
- replies/thread
- attachments
- emoji reaction optional
- pin
- convert to task
- link matter/task/document/event

Not MVP:
- voice rooms
- video chat
- complicated presence
- Slack-equivalent app ecosystem

## 10. Convert message to task

Action:
"Create task"

Prefill:
- message text as description
- matter context
- link back to message
- assigner = current user

User selects:
- title
- assignee
- due date
- priority

## 11. Notification center

Categories:
- assignment
- deadline
- court event
- task mention
- document review
- expense approval
- system/integration

Each notification:
- read/unread
- action URL
- entity context
- created timestamp

## 12. Notification policy

Default:
- in-app for most
- email for important
- WhatsApp for selected urgent classes

Allow user preference, except mandatory critical classes configured by admin.

## 13. Reminder examples

Court event:
- 7 days
- 1 day
- 2 hours

Critical deadline:
- 30 days
- 14 days
- 7 days
- 3 days
- 1 day
- overdue escalation

Task:
- user configurable
- due soon
- overdue

## 14. Daily digest

Optional daily email:
- today's court
- tasks due
- overdue
- approvals waiting
- matters stalled

## 15. Meeting scheduling

Internal meeting:
- select attendees
- see conflicts from internal calendar
- optionally sync to Google
- attach agenda
- link to internal project or matter
- attach meeting notes after

Future:
- free/busy Google lookup where permitted.
