# VPS Deployment Checklist

## Before server provisioning
- [ ] Production domain selected
- [ ] VPS provider selected
- [ ] Off-site backup destination selected
- [ ] SSH access keys prepared

## Server
- [ ] Supported Linux installed
- [ ] System packages updated
- [ ] Firewall enabled
- [ ] SSH hardened sufficiently for pilot
- [ ] Docker Engine installed
- [ ] Docker Compose plugin installed
- [ ] `/srv/kklaw` directories created
- [ ] Correct filesystem permissions applied

## DNS/TLS
- [ ] Domain A/AAAA points to server
- [ ] Ports 80/443 reachable
- [ ] Caddy certificate issued
- [ ] HTTPS redirect verified

## Data
- [ ] PostgreSQL persistent directory mounted
- [ ] Redis persistent directory mounted
- [ ] Document persistent directory mounted
- [ ] Database not publicly reachable
- [ ] Redis not publicly reachable

## Application
- [ ] `.env.production` created outside Git
- [ ] app images pinned
- [ ] migrations applied
- [ ] seed/admin bootstrap complete
- [ ] health endpoint passes
- [ ] login works
- [ ] file upload works
- [ ] file download authorization works
- [ ] worker consumes test job
- [ ] WebSocket connects
- [ ] PWA installs
- [ ] offline task queue smoke-tested

## Backups
- [ ] database backup configured
- [ ] document backup configured
- [ ] off-site copy confirmed
- [ ] backup failure alert exists
- [ ] restore procedure tested at least once

## Integrations
- [ ] Google redirect domain configured
- [ ] Email provider configured
- [ ] WhatsApp webhook configured when enabled
- [ ] failed integration jobs visible

## Go-live
- [ ] one pilot team identified
- [ ] sample matter validated
- [ ] upcoming court dates migrated
- [ ] open tasks migrated
- [ ] critical documents available
- [ ] rollback image/tag recorded
