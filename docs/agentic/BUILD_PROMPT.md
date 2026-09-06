# Master Prompt for an Agentic Coding AI

You are the implementation agent for **Kariuki Kagunda & Co. Advocates OS**, a two-branch Kenyan law-firm operating system.

Your job is to build the application, not merely produce mockups.

Read `agentic/AGENTS.md` first. Then read the relevant documentation before each task.

## Approved technical architecture

Build against the following stack unless an ADR is explicitly approved:

- Frontend: React 19, Vite 8, TypeScript, TanStack Router/Query, Tailwind, shadcn/ui, Dexie, PWA service worker
- API: Node.js 24 LTS, NestJS, Fastify, REST/OpenAPI, Socket.IO
- Persistence: PostgreSQL 18, Prisma ORM 7.x
- Queues/cache/sessions: Redis 8.2 Extended Support, BullMQ
- Files: private VPS persistent volume through a storage adapter; S3 adapter prepared for future migration
- Reverse proxy/TLS/static hosting: Caddy
- Runtime packaging: Docker + Docker Compose
- Production target: Ubuntu 24.04 LTS-class VPS or an equivalently supported Linux distribution

Do not build on Supabase/Firebase/hosted BaaS.

## Product architecture

The central domain object is the **Matter**.

All of the following may link to a matter:
- client
- parties
- assignments
- workflow stage
- tasks
- deadlines
- court dates
- appointments
- documents
- document versions
- comments/messages
- expenses
- payments
- client-money transactions
- filing records
- service records
- medical records
- evidence
- settlements
- judgments
- audit/activity events

The UI must make these relationships navigable.

## Primary MVP objective

Create a reliable internal system staff can use every day for:
- opening and managing matters,
- tracking personal-injury workflows,
- assigning work by stage,
- scheduling court dates and appointments,
- managing tasks and deadlines,
- sharing internal matter communications,
- uploading and versioning documents,
- recording matter expenses and basic finance,
- receiving notifications,
- managing two branches and staff,
- monitoring workloads and stalled cases,
- working acceptably on phones and intermittent connectivity.

## Implementation priorities

Build in this sequence unless dependencies require adjustment:

1. Foundation, auth, organization, branches, users
2. Clients and intake
3. Matters and internal reference
4. Matter workspace and activity timeline
5. Workflow stages and assignments
6. Tasks and deadlines
7. Calendar and court events
8. Documents and versions
9. Internal communications
10. Expenses/petty cash/basic ledgers
11. Notifications
12. Search
13. Dashboards
14. Offline/PWA behavior
15. Google Calendar/Gmail integration
16. WhatsApp notifications
17. Import/export and migration tools
18. Polish, accessibility, performance

## Prohibited shortcuts

Do not:
- use static JSON as the permanent backend,
- store critical business data only in client state,
- create duplicate tables for the same concept,
- create fake upload buttons,
- hard-code case status in JSX,
- hide incomplete behavior behind optimistic UI without persistence,
- call a feature "integrated" unless the integration works,
- use uncontrolled global `any`,
- silently swallow errors,
- make the mobile experience an afterthought.

When a requirement is ambiguous, prefer a configurable implementation and record the decision in `PROJECT_STATE.md`.

## Full Product Build Extension - 2026-09-06

Continue from the current `davemusau00/KKA` prototype, but treat it as UX/domain reference, not production architecture.

Before implementing a feature, answer:
1. What is its authoritative server object/state?
2. What permissions protect read/write/approve/export?
3. What audit event is produced?
4. Which matter/client/branch does it relate to?
5. Which configuration scope controls it?
6. How does it behave offline, if supported?
7. Which background jobs/integrations does it invoke?
8. What happens on partial failure/retry?
9. Which tests prove legal/financial invariants?
10. Does any UI claim more capability than the backend actually implements?

The preferred workflow is production vertical slices, not additional isolated mock screens.
