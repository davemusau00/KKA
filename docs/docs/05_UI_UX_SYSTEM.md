# 05. UI / UX System

## 1. Product feel

The application should feel:
- calm,
- dense but not cluttered,
- professional,
- fast,
- modern,
- information-rich,
- designed for frequent daily use.

Avoid:
- oversized marketing-style cards,
- decorative gradients everywhere,
- dashboard gimmicks,
- tiny legal-software typography,
- excessive modal dialogs.

## 2. Responsive breakpoints

Design mobile-first.

Suggested:
- small: < 640
- medium: 640-1024
- large: > 1024

Do not rely on breakpoint values as business logic.

## 3. App shell

Desktop:
- persistent left navigation
- top command/search bar
- contextual right utility area only where useful

Mobile:
- bottom navigation for top-level destinations
- hamburger/drawer for secondary modules
- sticky context header

Suggested bottom tabs:
- Home
- Matters
- Tasks
- Calendar
- More

## 4. Home dashboard

Personalized.

Sections:
- Today
- Upcoming court
- My overdue tasks
- Waiting on me
- Recently opened matters
- Notifications
- Quick create

Management dashboard toggles:
- firm
- branch
- team
- personal

## 5. Quick create

Global `+` menu:
- New Matter
- New Client
- Task
- Court Date
- Meeting
- Upload Document
- Expense
- Note

When opened from inside a matter, prefill matter context.

## 6. Matter workspace

Desktop:
- matter header
- compact key facts
- tab navigation

Tabs:
- Overview
- Workflow
- Tasks
- Calendar
- Documents
- Communications
- Parties
- Court
- Medical/Evidence
- Finance
- Timeline

Mobile:
- Overview first
- tabs become horizontally scrollable or section selector
- quick action FAB/menu

Matter header displays:
- internal reference
- matter title/client
- current stage
- responsible branch
- lead/supervisor
- next court date
- next deadline
- status

## 7. Overview page

Use compact sections:
- next actions
- workflow stage
- assigned team
- key dates
- missing documents
- latest activity
- financial snapshot

## 8. Lists and tables

Desktop:
- dense sortable tables
- column selection where useful

Mobile:
- card/list representation
- do not shrink table into unreadable columns

Every list:
- search
- filters
- sort
- pagination/infinite load
- empty state

## 9. Calendar UX

Views:
- day
- week
- month
- agenda/list

Filters:
- me
- team
- branch
- event type
- matter
- court

Drag:
- ordinary appointments/tasks may reschedule
- legal deadlines show warning and preserve official deadline
- court dates require confirmation before changing

## 10. Task UX

Views:
- My Work
- Board
- List
- Calendar
- Team workload

Fast actions:
- complete
- reassign
- change due date
- mark blocked
- add comment

## 11. Document UX

Split-pane desktop:
- list/tree left
- preview right

Mobile:
- list -> detail -> preview

Version history must be easy to find.

## 12. Finance UX

Never overload with accounting jargon in daily expense flow.

Fast expense:
- amount
- category
- matter
- payer/source
- receipt photo
- submit

Advanced details behind "More".

## 13. Global search / command palette

Keyboard shortcut on desktop.

Search:
- matters
- clients
- court case numbers
- tasks
- documents
- contacts
- events

Recent search history local only.

## 14. Visual system

Use semantic tokens:
- background
- foreground
- muted
- border
- primary
- success
- warning
- danger
- info

Do not encode meaning by color alone.

## 15. Typography

Use a highly legible modern sans-serif.
Recommended UI size:
- body 14-16px
- dense tables 13-14px
- never below 12px for operational text

## 16. Accessibility baseline

- keyboard navigable
- visible focus
- semantic labels
- minimum touch targets
- color contrast
- screen reader labels for icons
- confirmation for destructive actions
