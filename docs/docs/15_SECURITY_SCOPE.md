# 15. MVP Security Scope and Deferred Hardening

The project has explicitly prioritized getting a full working internal MVP built before deep security/compliance work.

This does **not** mean security should be ignored entirely.

## Minimum security required in MVP

1. Backend-owned authentication
2. Argon2id password hashing
3. HttpOnly secure server-side session cookie
4. Organization scoping
5. Role/assignment authorization
6. Private file storage outside the public web root
7. Server-side secrets only
8. PostgreSQL and Redis not publicly exposed
9. Basic audit/activity events
10. Secure OAuth token storage server-side
11. Off-site backups
12. HTTPS through Caddy

## Can be deferred

- advanced device management
- SSO
- mandatory MFA
- fine-grained legal ethical walls
- full data retention engine
- advanced DLP
- download watermarking
- immutable WORM storage
- SIEM
- penetration testing program
- formal ISO controls
- full compliance reporting
- advanced encryption-key management
- sophisticated anomaly detection
- zero-trust network architecture

## Important RBAC baseline

Even in MVP:
- Technical Admin should not automatically get blanket document visibility.
- Finance should not require medical document access.
- Branch access should be scoped.
- Matter access should respect assignment or leadership permissions.

## Permission key examples

- matter.read
- matter.create
- matter.update
- matter.assign
- matter.close
- document.read
- document.upload
- document.approve
- finance.expense.create
- finance.expense.approve
- finance.client_money.read
- calendar.manage
- admin.users.manage
- reports.firm.read

Use role -> permissions mapping.

## Future hardening backlog

When product is operational, run a separate security/compliance phase covering:
- Kenyan data protection requirements
- legal professional confidentiality
- backup/restore testing
- penetration testing
- MFA
- retention policies
- incident response
- security event monitoring
