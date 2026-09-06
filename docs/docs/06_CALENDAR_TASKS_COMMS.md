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

## 16. Mobile Calendar Architecture & Temporal Command Centre

The calendar is not merely an appointment diary; it functions as a **Temporal Command Centre** tying court operations, matters, tasks, deadlines, documents, and notifications into an actionable workflow engine.

### 16.1 Mobile Hierarchy & Anti-Compression Principles
Desktop calendars attempt to present a 7-column grid. On mobile viewports (~360px - 450px), squeezing 7 columns creates unreadable vertical keyholes. 

Mature mobile calendar hierarchy:
1. **DEFAULT VIEW: Today / Agenda**: High-density vertical timeline showing upcoming appointments, appearances, and deadlines with immediate actionability.
2. **Horizontal Swipeable Date Strip**: 14-day interactive strip with day abbreviations, date numerals, and status indicator dots (amber for court, rose for deadlines, blue for meetings, conflict alerts). Tapping a date focuses the day agenda immediately.
3. **SECONDARY VIEW: 3-Day View**: Displays 3 wide, readable columns (minimum 110px width) rather than an impossible 7-column compression.
4. **SECONDARY VIEW: Day View**: Detailed hourly / chronological focus for complex court hearing days.
5. **OPTIONAL VIEW: Month Overview**: Used strictly for density scanning and date navigation. Day cells display category dots; tapping any date reveals that day's clean agenda cards underneath.

### 16.2 Event Card Information Hierarchy
Mobile cards expose:
`[TYPE BADGE + TIME] · [CONFLICT PILL]`
`TITLE (Bold)`
`⚖ MATTER REFERENCE & CLIENT NAME`
`📍 LOCATION / COURTROOM · 👤 ASSIGNED ADVOCATE`
`[RECORD OUTCOME] · [DETAILS / INSPECT]`

### 16.3 Context-Aware Event Bottom Sheet & Side Drawer
Tapping an event opens a sliding bottom sheet on mobile (with drag handle) or a sliding drawer on desktop:
- **Full Legal Context**: Associated matter reference, stage, court proceeding, and trial judge.
- **Legal Edit Policy Badge**: Displays `🔒 Locked Order`, `🛡️ Reason Required`, `Confirm`, or `Free`.
- **Required Documents Checklist**: Verifies presence of mandatory bundles (e.g., Plaint, Verifying Affidavit, Trial Bundle, Medical Report) with one-click direct file linking.
- **Recorded Directives & Rulings**: Displays previous outcomes, judge orders, and next court dates.
- **Audit Revision History**: Tracks every rescheduled date, mandatory reason, and legal source authority.

### 16.4 Legal Edit Policies (`CalendarEditPolicy`)
Legal events cannot all be equally modified or dragged:
- `free`: Internal team meetings, drafting blocks, administrative reminders.
- `confirm`: Client consultations, medical appointments (requires confirmation dialog).
- `reason_required`: Court hearings, mentions, rulings (requires formal reason e.g., adjourned by court, judge directions, witness absent).
- `locked`: Statutory limitation expiry dates (Cap 22) and court-ordered mandatory filing deadlines. Cannot be rescheduled without amended court direction or registry order.

### 16.5 Automated Court Outcome Propagation Pipeline
Recording a court outcome (`Attended`, `Adjourned`, `Concluded`) executes multi-object propagation:
1. Updates the hearing outcome directives and court status.
2. Automatically diarizes the next court appearance on the adjourned date.
3. If court directions include filing deadlines, creates an official `Deadline` record and calendar deadline event (`locked`).
4. Generates an internal advocate preparation task (due 3 days before the filing deadline) linked to the matter.
5. Dispatches notifications to assigned advocates and court clerks, with audit logs recorded.

