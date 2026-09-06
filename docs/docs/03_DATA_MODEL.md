# 03. Data Model Guidance

This document explains implementation decisions beyond `database/schema.sql`.

## 0. Persistence implementation

PostgreSQL 18 is the authoritative database.

Use **Prisma ORM 7.x** for:
- schema contract,
- standard CRUD queries,
- transactions,
- migration workflow,
- type generation.

Use checked-in SQL migrations/raw SQL when PostgreSQL-specific capabilities are more appropriate.

Do not use a hosted database abstraction.

`database/schema.sql` is the domain-reference schema. The implementation must convert it into the canonical Prisma schema and migration history.

## 1. PostgreSQL conventions

- UUID primary keys
- `timestamptz` everywhere for date/time
- `numeric(18,2)` for money
- currency code stored explicitly
- JSONB only for flexible metadata, never as a substitute for normal relational modeling
- soft archive state for operational/legal/financial records

## 2. Common columns

Most tables:
- id
- organization_id
- created_at
- updated_at
- created_by
- updated_by

Join/history tables may omit updated fields when append-only.

## 3. Search indexes

Index:
- matter internal_reference
- court case_number
- client display_name
- client phone
- client id_number
- document title
- task due_at/status
- calendar start_at
- matter current_stage/status
- expense matter/date/category

Use Postgres full-text indexes for:
- matter title/summary
- client names
- document metadata
- communication subject/summary

File-content indexing is a later enhancement.

## 4. Reference generation

Use a database function or server transaction for internal matter references.

Do not generate human references purely in the browser.

Until the firm's current numbering convention is confirmed:
- implement a configurable template,
- provide default format like `KKC/{PRACTICE}/{YYYY}/{SEQ}`,
- allow sequence scope by year and practice area.

Never change an activated matter reference automatically after creation.

## 5. Custom fields

Future practice areas require extension.

Recommended model:
- `custom_field_definitions`
- `custom_field_values`

Use only for genuinely variable metadata.

Do not put core fields such as `client_id` into custom fields.

## 6. Status strategy

Prefer database enums or check constraints for stable global states.

Prefer configuration tables for:
- practice-specific stages,
- document categories,
- expense categories,
- matter types.

## 7. Audit pattern

Create application audit events for business actions.

Database-level auditing can be added later for high-security needs.

Audit metadata example:

```json
{
  "from_stage": "drafting",
  "to_stage": "filing",
  "from_user": "...",
  "to_user": "...",
  "reason": "Pleadings approved"
}
```

## 8. Financial data

Never store money as float.

Use:
`numeric(18,2)` + currency code.

Separate:
- requested expense,
- actual expense,
- ledger transaction,
- document evidence.

## 9. Files

Database stores metadata and storage path, not file bytes.

Each new document version:
- upload file,
- compute/checksum if available,
- insert version,
- update document current_version_id.

Never overwrite prior storage object path for a legal version.

## 10. Offline identity

Client-generated UUIDs are allowed for offline-created draft objects where safe.

If a server-generated human reference is required, object remains:
`local_pending`
until sync assigns official reference.

## 11. Conflict resolution metadata

Synced mutable records should include:
- updated_at
- updated_by
- optional revision integer

Offline update uses optimistic concurrency:
- send base revision,
- server rejects if stale,
- client prompts user to refresh/merge.

Do not silently last-write-wins important legal data.


## 12. Connection management

Use the PostgreSQL connection pool provided by the application/Prisma stack.

Rules:
- no browser database access,
- no public PostgreSQL port,
- set sane connection limits,
- worker and API pool sizes configured separately,
- long reports should not starve interactive API traffic.

If workload later requires it, introduce PgBouncer as an infrastructure change. Do not add it before a measured need.

## 13. Database backup compatibility

Schema changes must preserve:
- standard PostgreSQL backup tooling,
- point-in-time recovery strategy when enabled,
- restore into a clean PostgreSQL 18 instance.

Every destructive migration requires:
- documented impact,
- backup confirmation,
- rollback or forward-repair plan.
