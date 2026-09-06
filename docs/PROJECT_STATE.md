# Project State

## Current Repository Reality - 2026-09-06

Product target: **full working enterprise law-firm OS**. The original MVP checklists below are retained as historical delivery-phase documentation and are no longer a statement that implementation has not started.

Current repository baseline:
- repository: `davemusau00/KKA`;
- branch: `main`;
- audited head: `932a49192e460f1d9ef7dc7dce4226cd2ef85f08`;
- repository contains a substantial React/Vite interactive prototype with matters, clients/intake, tasks, calendar, court operations, approvals, documents, communications, finance, reports, admin and integrations;
- authoritative persistence is still predominantly `localStorage`/seed state;
- current integrations are simulated;
- production backend, database, auth, durable document storage, real jobs, real offline sync, CI/testing and VPS implementation remain to be built/converged to the approved architecture.

Immediate P0 program:
1. monorepo + production infrastructure;
2. NestJS/Fastify API + PostgreSQL + Prisma + Redis/BullMQ;
3. real auth/session and server authorization;
4. configuration/settings service;
5. migrate matter spine from AppContext/localStorage;
6. private document storage/versioning;
7. truthful provider integrations;
8. ledger-grade finance/client-money model;
9. audit, tests, backups and restore proof;
10. remove/replace any realistic unverified seed identifiers from public source.

See `docs/22_CURRENT_REPOSITORY_AUDIT_AND_GAP_REGISTER.md` and `docs/35_CODEBASE_REFACTOR_TARGET_MAP.md`.

---

## Historical documentation baseline retained below

Status: Documentation baseline complete. Implementation not yet started.

## Confirmed business facts

- Firm: Kariuki Kagunda & Co. Advocates
- Two branches
- Personal injury is the main current practice focus
- Future practice areas must be supported
- Known role families: senior partners, administrator, technical role, paralegals; additional advocate, clerk, finance and reception-style roles should be supported
- Ordinary Gmail accounts are currently used
- Finance records currently come from a mixture of Excel, physical/manual records, M-Pesa statements and bank statements
- Client portal is desired later
- Internal operations are the first priority
- Existing physical file numbering convention is still to be confirmed

## MVP build state

- [ ] Application scaffold
- [ ] Authentication
- [ ] Organization / branches
- [ ] User profiles / roles
- [ ] Client intake
- [ ] Matters
- [ ] Matter workflows
- [ ] Assignments and handoffs
- [ ] Tasks and deadlines
- [ ] Calendar
- [ ] Documents
- [ ] Internal communication
- [ ] Finance
- [ ] Notifications
- [ ] Search
- [ ] Dashboards
- [ ] Offline/PWA
- [ ] Google integration
- [ ] WhatsApp integration
- [ ] Imports
- [ ] Deployment


## Infrastructure decision update — 2026-09-05

Accepted ADR-001:
- self-host on VPS
- React + Vite frontend
- NestJS/Fastify custom backend
- PostgreSQL 18
- Prisma 7.x
- Redis 8.2 Extended Support
- BullMQ worker
- Caddy
- Docker Compose
- private VPS document volume through storage adapter
- encrypted off-site backups
- no Supabase/BaaS
