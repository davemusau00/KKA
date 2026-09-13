Phase 2: Adoption, Navigation & Operational Intelligence

I’d build it as two tightly related increments, while continuing to defer the broad acceptance/test pass until the functionality is in place.

Increment	Scope
A. User Adoption Layer	First-login onboarding, resource-detail routing, guided tour, extensive Help Center/manual
B. Operational Intelligence	Recurring meeting generation, calculated leave balances, finance-derived project spend
1. First-login onboarding

At the moment invite acceptance exists, but after that the user essentially falls straight into the application. There is no persisted onboarding lifecycle in the user schema, and the current Help Center progress is only localStorage.

I would introduce a proper server-backed UserOnboardingState, roughly:

userId
onboardingVersion
status
currentStepKey
completedSteps
startedAt
lastSeenAt
completedAt
tourCompletedAt
manualViewedAt
dismissedUntil

The flow becomes:

INVITE
  ↓
SET PASSWORD
  ↓
FIRST LOGIN
  ↓
WELCOME
  ↓
VERIFY PROFILE
  ↓
YOUR ROLE / BRANCH / DEPARTMENT
  ↓
YOUR PERMISSIONS
  ↓
CORE OS TOUR
  ↓
ROLE-SPECIFIC TOUR
  ↓
HELP CENTER / USER MANUAL
  ↓
READY FOR WORK

It should be role-aware. An advocate should get Matters, Tasks, Court, Documents and Clients prominently. Finance should get Finance, approvals and reconciliation. Administrators should see HR, operations and staff administration. Court clerks should get Court, Calendar, filing and service workflows.

I would not hard-block the whole OS indefinitely. The first-login wizard appears automatically, but a user can postpone it. The shell then shows a visible “Finish setup” progress indicator until onboarding is completed.

Completing onboarding becomes an audited server event, not a browser preference.

2. Resource-detail routing

This needs to happen very early because onboarding, notifications, search results, audit events and Help articles all benefit from being able to deep-link to actual records.

Right now the router only recognizes:

/matters/:matterId

All other domains still resolve to their workspace root.

I’d expand the routing contract to:

/clients/:clientId
/tasks/:taskId
/documents/:documentId

/court/proceedings/:proceedingId
/court/events/:eventId
/court/filings/:filingId
/court/service/:serviceRecordId

/matters/:matterId

and, where useful:

/operations/projects/:projectId
/operations/meetings/:meetingId
/knowledge/:knowledgeItemId

Each detail route should support:

✓ refresh/reload
✓ direct bookmark
✓ browser back/forward
✓ links from search
✓ notification links
✓ audit-event links
✓ permission-aware 404/403
✓ record deleted/archived states

I would keep the current lightweight router rather than introducing React Router simply for fashion. workspaceRoutes.ts is already a perfectly workable routing nucleus. We just need to make its resource model richer.

For example:

type WorkspaceRoute = {
  workspace: string;
  resourceType?: string;
  resourceId?: string;
  tab?: string;
};

Documents are particularly easy because DocumentStudio already has a real docId selection model internally.

Clients and Tasks need proper focused record panels rather than merely selecting cards from lists. The existing Clients screen, for example, has no URL-bound selected client record today.

3. Recurring meeting occurrence generation

The current model has:

recurrenceRule
recurrenceUntil

but those are still recurrence metadata, not generated future meetings. The current operations service saves those fields on the meeting record.

I would turn this into a real series engine.

Architecture:

MeetingSeries
     │
     ├── Meeting occurrence #1
     ├── Meeting occurrence #2
     ├── Meeting occurrence #3
     └── ...

The series stores:

RRULE
timezone
duration
start
end/until
organizer
project
matter
default participants
generatedThrough
status

Individual occurrences remain normal Meeting records, so minutes, attendance, decisions and actions remain independent.

Support initially:

DAILY
WEEKLY
MONTHLY

INTERVAL
BYDAY
COUNT
UNTIL

Example:

FREQ=WEEKLY;INTERVAL=1;BYDAY=MO;UNTIL=20261231

Generation should use a rolling horizon, probably 90 days ahead, instead of creating 700 records on day one.

A scheduled worker can extend the horizon automatically.

Critical invariant:

UNIQUE(seriesId, occurrenceStart)

That makes generation retry-safe.

Editing needs three explicit choices:

This occurrence
This and future occurrences
Entire series

No calendar sorcery where changing Tuesday accidentally rewrites six months of history.

4. Leave balance calculation

The codebase already has LeavePolicy and LeaveBalance, but balances are presently administered through explicit values such as openingDays, accruedDays, usedDays and adjustments. The repo itself currently notes that leave decisions do not yet calculate balances.

I would make used leave derived, never manually authoritative.

The calculation becomes:

AVAILABLE =
  OPENING CARRYOVER
+ ACCRUED ENTITLEMENT
+ AUDITED ADJUSTMENTS
- APPROVED LEAVE USED

And separately:

PENDING = submitted but not approved
PROJECTED AVAILABLE = AVAILABLE - PENDING

Policy should support:

Annual front-loaded
Monthly accrual
Prorated new employee
Carryover limit
Maximum negative balance
Allow/disallow negative leave
Employment start-date proration

Example UI:

Annual Leave 2026

Opening carryover       4.0
Accrued entitlement    15.0
Adjustments             1.0
Approved leave used    -6.0
──────────────────────────
Available              14.0

Pending requests        3.0
Projected available    11.0

On approval:

leave request
    ↓
validate projected balance
    ↓
approve
    ↓
balance recalculated
    ↓
audit event

On cancellation/rejection, availability automatically returns.

HR can make explicit adjustments, but cannot simply edit “used days” and rewrite history.

5. Finance-derived project spend

This has become especially timely because the latest code already contains manual ProjectSpend, and the most recent project work added a financeReference. But the spend record is still fundamentally manually entered.

I would split project money into three layers:

BUDGET
COMMITTED
ACTUAL

For example:

Project Budget            KES 500,000

Committed
Approved requisitions      90,000
Open purchase orders       35,000

Actual
Finance expenses          120,000
Other posted project cost  25,000

Unverified manual spend    10,000

Forecast total            280,000
Budget remaining          220,000

The important design change is explicit project linkage into Finance, rather than asking someone to type a finance reference.

I would add optional:

projectId → ExpenseRequest
projectId → PurchaseRequisition
projectId → PurchaseOrder / inherited from requisition

Then the project financial view is derived from authoritative finance/procurement records.

The project's endpoint should return something like:

{
  "budget": 500000,
  "committed": 125000,
  "actual": 145000,
  "manualUnverified": 10000,
  "forecast": 280000,
  "remaining": 220000
}

Manual project spend can remain for exceptional historical entries, but it should appear separately as unverified/manual, never silently mingle with ledger-derived expenditure.

That also means procurement receipt → finance expense can carry the project reference automatically.

6. Help Center, guided tour & extensive user manual

The current Help Center is a good seed, but it is currently eight short guides, six FAQs and local completion state.

I would turn it into a proper KKA OS User Manual.

Structure:

GETTING STARTED
  Welcome to KKA OS
  Your account
  Roles & permissions
  Branches and departments
  Navigation
  Search
  Notifications

CLIENTS & INTAKE
  Registering clients
  KYC
  Conflict checks
  Intakes
  Converting intake to matter
  Client portal

MATTERS
  Matter structure
  Assignments
  Workflow stages
  Handoffs
  Matter access
  Personal injury workflow

TASKS
  Creating tasks
  Dependencies
  Deadlines
  Assignments
  Completing work

COURT
  Proceedings
  Diary
  Filing
  Service
  Court outcomes
  Adjournments
  Deadlines

DOCUMENTS
  Uploading
  Versions
  Review
  Approval
  Signatures
  Marks/stamps
  Filing evidence
  Downloads

COMMUNICATIONS
  Channels
  Matter channels
  Direct messages
  Mentions
  Attachments
  Message → Task

FINANCE
  Expenses
  Fee notes
  Client money
  Receipts
  Clearing
  Reconciliation
  Transfers
  Settlement positions

PEOPLE & HR
  Employee profiles
  Leave
  Appraisals
  CPD
  Credentials
  Staff records

PROCUREMENT & ASSETS
  Vendors
  Requisitions
  Approvals
  Orders
  Goods receipts
  Assets
  Custody
  Repairs

PROJECTS & MEETINGS
  Projects
  Budgets
  Spend
  Milestones
  Recurring meetings
  Minutes
  Decisions
  Actions

KNOWLEDGE
REPORTS
ADMINISTRATION
WEBSITE MANAGEMENT
SECURITY
TROUBLESHOOTING
GLOSSARY

Every article should contain the same useful anatomy:

What this feature is
Who can use it
What you need first
Step-by-step procedure
What gets saved
What creates an audit event
Evidence requirements
Common mistakes
Related workflows
Deep links
Guided tours

The Help Center should offer:

Core OS Tour
Advocate Tour
Paralegal Tour
Court Clerk Tour
Finance Tour
Administrator Tour
Managing Partner Tour
Technical Administrator Tour

A real overlay would point to actual UI elements, with:

Next
Back
Skip
Open this workspace
Try it yourself
Restart tour

Tour progress should use the same server-side onboarding state, so moving to another browser does not magically erase training progress.

Build order

I would implement this in this exact sequence:

Resource-detail routing foundation
Onboarding persistence/API
First-login wizard + role-aware guided tour
Full Help Center/user manual
Calculated leave engine
Recurring meeting series + occurrence generation
Finance-derived project accounting
Wire notifications/search/help articles to deep links

That ordering prevents us from building the tour and manual around URLs that later change.

And yes, I’d keep broad automated acceptance deferred for now. We should still run Prisma validation, typecheck and build after each implementation batch so we do not stack structural breakage.