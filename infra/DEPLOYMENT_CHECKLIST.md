# KKA Production Deployment Checklist

- [ ] DNS points the chosen domain to the VPS.
- [ ] Only SSH, 80 and 443 are publicly reachable; PostgreSQL/Redis have no public ports.
- [ ] `/srv/kklaw` directories created with `infra/scripts/bootstrap-vps.sh`.
- [ ] `.env` contains production-only secrets and is not committed.
- [ ] `POSTGRES_PASSWORD` and `APP_ENCRYPTION_KEY_BASE64` are long/random.
- [ ] `APP_DOMAIN`, `APP_URL` and `WEB_ORIGIN` use the final HTTPS domain.
- [ ] `SESSION_COOKIE_SECURE=true` in production.
- [ ] `pnpm install`, `prisma generate`, schema validation, typecheck and tests pass.
- [ ] A baseline Prisma migration exists and is committed before production deployment.
- [ ] `pnpm prisma:migrate:deploy` succeeds.
- [ ] Initial administrator was seeded with a strong one-time password and rotated after login.
- [ ] Caddy HTTPS certificate succeeds.
- [ ] `/api/v1/health/live` and `/api/v1/health/ready` are healthy.
- [ ] Database backup and document backup both succeed.
- [ ] A restore test has been performed on a disposable database/storage target.
- [ ] SMTP/S3/provider connections are marked HEALTHY only after a real test.
- [ ] Unimplemented providers remain `NOT_IMPLEMENTED` and are not presented to staff as connected.
