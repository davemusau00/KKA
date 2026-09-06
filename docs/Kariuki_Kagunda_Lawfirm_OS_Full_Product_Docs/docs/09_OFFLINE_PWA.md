# 09. Offline-Capable PWA

## 1. Objective

The app must remain useful during unreliable connectivity without creating hidden data-loss risks.

Offline capability is selective, not universal.

## 2. Installability

PWA requirements:
- Vite-built SPA
- `vite-plugin-pwa`/Workbox service worker
- manifest
- app icons
- service worker
- standalone display
- offline fallback shell
- HTTPS in production

## 3. Cache layers

### Static shell cache
- JS/CSS
- icons
- core shell assets

### Query cache
Persist selected TanStack Query data.

### IndexedDB domain cache
Use Dexie/IndexedDB for:
- recently viewed matters
- my tasks
- upcoming events
- selected client summaries
- pending mutations
- drafts

## 4. Offline banner

Always show explicit state:
- Online
- Offline
- Syncing
- Sync error

A subtle but visible banner/chip is sufficient.

## 5. Mutation queue

Queue format:
- id
- entity_type
- operation
- payload
- created_at
- dependency_ids
- retry_count
- status
- last_error

Statuses:
- pending
- syncing
- synced
- failed
- conflict

## 6. Safe offline mutations

Allowed:
- create draft note
- create draft task
- update task status
- draft expense
- add local comment
- draft client update
- edit noncritical task description

Conditional:
- create matter draft, but official reference assigned on sync

Online required:
- final court filing record if uniqueness/confirmation required
- Google sync
- message sending through email/WhatsApp
- final financial reconciliation
- large file upload
- privileged approval if policy requires fresh server state

## 7. Conflict behavior

For stale mutable records:
- server returns conflict
- client shows server version vs local changes
- user chooses reload/merge where practical

Do not silently overwrite:
- official deadline
- financial amount
- matter stage
- document status
- assignment

## 8. Document caching

Do not automatically cache all matter files.

Cache only:
- metadata,
- intentionally opened file if size policy allows,
- preview thumbnails.

Provide "Available offline" later as explicit user action.

## 9. Background sync

Where supported:
- attempt queued mutation sync when connection returns.

Also run foreground sync:
- app open
- network restored
- manual "Retry sync"

## 10. Sync center

Provide a small page:
- pending actions
- failed actions
- conflicts
- last successful sync

Users must be able to retry.

## 11. Offline testing scenarios

- lose network while editing task
- complete task offline
- reconnect
- conflict with server edit
- create expense draft offline
- app reload offline
- cached matter opens
- uncached matter shows clear unavailable state


## 12. API support required for offline writes

Backend endpoints used by the mutation queue must support:
- client-generated UUIDs where safe,
- `Idempotency-Key`,
- revision/version checks for conflict-prone updates,
- deterministic duplicate handling,
- explicit conflict status.

The offline client must never depend on direct database access.
