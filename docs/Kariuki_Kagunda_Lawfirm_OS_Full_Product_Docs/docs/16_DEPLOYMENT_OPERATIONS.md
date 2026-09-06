# 16. Deployment and Operations
## VPS Production Runbook

## 1. Supported production shape

Primary deployment target:
- one Linux VPS,
- Docker Engine,
- Docker Compose,
- Caddy,
- React static bundle,
- NestJS API,
- NestJS worker,
- PostgreSQL,
- Redis,
- persistent private document volume.

Recommended operating system:
- Ubuntu 24.04 LTS or another currently supported conservative Linux distribution.

Avoid deploying the first production version to an unmanaged rolling-release OS.

## 2. Initial VPS sizing

Practical starting point for the firm:

### Minimum pilot
- 4 vCPU
- 8 GB RAM
- 160+ GB NVMe
- daily off-site backup

### Recommended production starting point
- 6 to 8 vCPU
- 16 GB RAM
- 250+ GB NVMe
- separate/expandable storage strategy for documents
- off-site backup

Storage requirements depend far more on uploaded scans/PDFs than database size.

Monitor first, scale from actual measurements.

## 3. Public network surface

Public:
- TCP 80
- TCP 443
- SSH, restricted by firewall/source where practical

Private/container network only:
- PostgreSQL 5432
- Redis 6379
- API internal port 3000

Do not publish database/cache ports.

## 4. DNS

Create DNS:
`lawos.example.com -> VPS public IP`

Caddy obtains TLS automatically once DNS points correctly and 80/443 are reachable.

## 5. Host layout

```text
/srv/kklaw/
  app/                 # deployment repository / compose
  data/
    postgres/
    redis/
    documents/
  backups/
  logs/
  env/
    production.env
```

Set ownership/permissions deliberately.

## 6. Containers

### caddy
Responsibilities:
- TLS
- static SPA
- reverse proxy
- websocket proxy
- compression

### api
Responsibilities:
- REST API
- auth
- Socket.IO
- business logic
- document authorization/streaming

### worker
Responsibilities:
- BullMQ consumers
- scheduled jobs
- integrations
- digests/reminders

### postgres
Durable system of record.

### redis
Sessions, queues and ephemeral coordination.

## 7. Docker image policy

- multi-stage builds
- run application as non-root where practical
- pin base-image major/minor
- no `latest` tag in production
- image tagged with Git commit SHA/release
- retain previous stable image for rollback

## 8. Deployment sequence

1. pull source/release
2. build immutable images
3. run tests
4. confirm backup state
5. put deployment lock
6. run Prisma migration deploy command once
7. start/update worker
8. start/update API
9. build/swap web assets
10. Caddy reload if config changed
11. health check
12. smoke test
13. release deployment lock

For breaking schema changes use expand/contract migrations.

## 9. Database migrations

Source controlled.

Rules:
- no manual production schema editing,
- no destructive reset command in production,
- migration must run against staging first,
- migration is an explicit deployment step.

## 10. PostgreSQL persistence

Bind mount:
`/srv/kklaw/data/postgres`

Recommended:
- current PostgreSQL 18 minor release,
- periodic VACUUM/ANALYZE defaults,
- sensible shared memory configuration after measuring workload,
- log slow queries.

Do not prematurely hand-tune dozens of PostgreSQL parameters.

## 11. Redis persistence

Bind mount:
`/srv/kklaw/data/redis`

Use AOF configuration for useful operational recovery.

Redis loss must not cause permanent business-data loss.

## 12. Document persistence

Bind mount:
`/srv/kklaw/data/documents`

Never:
- store legal files in `/tmp`,
- store only inside API container,
- expose directory directly through public Caddy file server.

API authorizes and streams.

## 13. Backup strategy

### Database
Preferred production-grade direction:
- pgBackRest,
- encrypted remote repository/S3-compatible destination,
- WAL archiving/PITR when the firm depends materially on the system.

At minimum during early pilot:
- scheduled `pg_dump` custom-format backup,
- encrypted off-site copy,
- retention.

### Documents
Use restic or equivalent:
- encrypted,
- incremental,
- remote destination,
- retention policy.

### Critical rule
Database and document backups must be restorable to a coordinated point.

## 14. Suggested retention baseline

Adjust later with the firm's legal/compliance policy.

Operational infrastructure baseline:
- 7 daily
- 4 weekly
- 12 monthly

This is a technical starting point, not the legal record-retention policy.

## 15. Restore test

At least monthly during early production:
- create isolated restore environment,
- restore database,
- restore sample document set,
- log in,
- open sample matters,
- verify document download,
- record result.

## 16. Health endpoints

API:
- `/api/v1/health/live`
- `/api/v1/health/ready`

Readiness checks:
- PostgreSQL reachable
- Redis reachable if required for normal operation

Do not make readiness depend on optional external Google/WhatsApp providers.

## 17. Docker healthchecks

Configure:
- api HTTP health
- postgres `pg_isready`
- redis `PING`
- worker heartbeat mechanism

Use restart policy:
`unless-stopped`

Avoid infinite rapid crash loops by observing health/restart logs.

## 18. Logs

Structured JSON application logs.

Include:
- request id
- user id where safe
- organization id
- route
- status
- duration
- job id
- integration provider

Never log:
- passwords
- session secrets
- OAuth refresh tokens
- entire confidential document contents

## 19. Monitoring

MVP:
- disk usage alert
- CPU/RAM
- container status
- application error rate
- job failures
- backup success/failure
- certificate state
- uptime check

Optional:
- self-host Uptime Kuma.

Later add Prometheus/Grafana/Loki when justified.

## 20. Disk safety

Uploaded documents can fill the VPS.

Required:
- storage usage metric,
- warning threshold,
- critical threshold,
- failed upload if safe minimum space breached,
- alert administrator.

## 21. Rollback

Application rollback:
- deploy previous image tag.

Database:
- prefer forward-fix migrations.
- destructive migration rollback requires explicit restoration plan.

Never automatically restore an old database merely because application deploy fails.

## 22. Staging

Maintain separate staging:
- separate database
- separate Redis
- separate document volume
- separate Google OAuth callback/domain if necessary.

Staging must never use production client documents.

## 23. Scaling

When CPU/API pressure:
- add API replicas.

When job pressure:
- add worker replicas/concurrency.

When PostgreSQL is bottleneck:
- tune indexes/query patterns first,
- then separate database host.

When files dominate disk:
- move StorageDriver to S3-compatible storage.

The domain code should not care where the storage driver physically stores objects.
