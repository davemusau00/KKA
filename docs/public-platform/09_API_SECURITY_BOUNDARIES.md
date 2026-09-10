# API and security boundaries

Public routes expose only explicit public DTOs. They must never serialize internal users, clients, matters, intakes, documents, finance or lead-management metadata.

Recommended prefixes:
- `/api/v1/public/site/*`
- `/api/v1/public/leads`
- `/api/v1/admin/public-site/*`

Public writes require strict schemas, rate limiting, spam/bot controls, request size limits, upload validation, consent capture and safe attribution handling. Admin routes use the existing OS auth, permissions, CSRF/origin controls and audit service.
