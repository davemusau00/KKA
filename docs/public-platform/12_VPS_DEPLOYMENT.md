# VPS deployment

The site should share the existing PostgreSQL, Redis, API, worker, Caddy and backup infrastructure. It is a separate static public frontend, not a second LawFirm OS.

Recommended domains:
- `kariukikagunda.co.ke` public site
- `os.kariukikagunda.com` internal OS
- `api.kariukikagunda.com` API

Caddy serves versioned static releases from `/srv/kka-site/releases/<release-id>` with `/srv/kka-site/current` as an atomic symlink. The worker can build a release after CMS publish or CI can build and upload an identified artifact.

Rollbacks switch the symlink to the previous verified release.
