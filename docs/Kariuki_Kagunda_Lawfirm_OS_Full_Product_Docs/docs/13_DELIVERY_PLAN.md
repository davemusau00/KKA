# 13. Delivery Plan

The sequence below is optimized for a coding agent or small product team.

## Phase 0: Foundation
Deliver:
- pnpm monorepo
- React + Vite web app
- NestJS + Fastify API
- NestJS/BullMQ worker
- PostgreSQL 18
- Prisma 7 schema/migrations
- Redis 8.2
- Docker Compose local stack
- Caddy production scaffold
- environment config
- design tokens
- app shell
- backend session authentication
- organization/branch seed
- error handling
- test harness

Exit criteria:
- user can sign in
- branch context loads
- responsive shell works

## Phase 1: Users, Roles and Branches
Deliver:
- user profiles
- role assignment
- branch membership
- admin user screen
- basic permission helper

Exit:
- admin can create/configure staff profile
- role affects navigation/action permission

## Phase 2: Clients and Intake
Deliver:
- client CRUD
- intake form
- intake status
- convert intake to matter/client
- client search

Exit:
- complete intake-to-client flow

## Phase 3: Matters
Deliver:
- create/activate matter
- reference generator
- matter workspace
- parties
- court proceeding basic record
- timeline

Exit:
- staff can open and manage a real matter

## Phase 4: Workflow and Assignments
Deliver:
- workflow templates
- stage instances
- matter stage board
- assignments
- handoffs
- template tasks

Exit:
- personal injury matter can move through configured stages

## Phase 5: Tasks and Deadlines
Deliver:
- task CRUD
- list/board
- blocked state
- deadlines
- overdue detection
- dashboard widgets

## Phase 6: Calendar
Deliver:
- day/week/month/agenda
- court events
- meetings
- event detail
- post-court outcome
- drag rules
- reminders

## Phase 7: Documents
Deliver:
- storage
- logical documents
- version upload
- PDF/image preview
- version history
- review/approval
- links to task/event

## Phase 8: Communications
Deliver:
- matter channel
- team/branch channels
- mentions
- task conversion
- notification center

## Phase 9: Finance
Deliver:
- expense
- expense request
- petty cash account
- basic financial account
- payment receipt
- matter finance
- CSV import

## Phase 10: Search and Management Reporting
Deliver:
- global search
- stalled matters
- workload
- branch dashboard
- matter stage analytics
- expense summaries

## Phase 11: Offline/PWA
Deliver:
- manifest/service worker
- app shell cache
- task/event/matter cache
- mutation queue
- sync center
- conflict UX

## Phase 12: Integrations
Deliver:
- Google OAuth
- Calendar sync
- notification email provider
- WhatsApp urgent reminder provider
- sync logs

## Phase 13: Polish
Deliver:
- accessibility fixes
- responsive refinements
- performance
- empty/error states
- audit pass
- seed demo
- deployment docs

## Phase 14: Pilot
Use one branch/team first if firm agrees.
Collect:
- missing fields
- workflow mismatches
- notification noise
- slow screens
- confusing language
- reporting gaps

Then iterate before full rollout.
