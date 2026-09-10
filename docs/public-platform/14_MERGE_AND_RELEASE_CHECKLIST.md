# Merge and release checklist

This ZIP is a complete public-platform implementation package, but it was generated outside a writable checkout of the full KKA repository. Before calling the integration production-complete:

- Copy `apps/site` and public packages into KKA.
- Merge root workspace scripts/dependencies without deleting current scripts.
- Merge Prisma models with the current schema; create a proper KKA migration.
- Add `PublicSiteModule` to the live API `AppModule`.
- Inject existing `IntakeService` into `PublicLeadsService.startIntake()` and implement the mapping.
- Add real permission guards/capabilities to admin controllers.
- Mount `PublicSiteWorkspace` in existing navigation/routing based on server permissions.
- Approved concept-derived partner, media and Lady Justice assets are included in `apps/site/public/assets`; replace only when higher-resolution original source exports are available.
- Build publish worker job and versioned static-release switch.
- Merge Caddy/Compose snippets.
- Run clean install, typecheck, build, blank migration, upgrade migration and all KKA predeployment tests.
- Add public route/DTO security tests.
- Run responsive screenshot inspection at all canonical widths.
- Test forms with rate limiting, spam controls and real mail notifications.
- Verify DNS/TLS, backups and rollback on staging before production.

The included reference screenshots are design references, not production image assets. Replace them before launch.
