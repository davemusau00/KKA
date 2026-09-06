# 32 - Research Grounding and Source Register

## 1. Purpose

This register distinguishes legal/operational grounding from product-design inference. It is not legal advice and does not substitute for counsel validating the current law, rules, court practice or firm policy before the product enforces a deadline or financial rule.

## 2. Kenyan legal and court sources

### Civil Procedure Rules
`https://new.kenyalaw.org/akn/ke/act/ln/2010/151/eng%402022-12-31`

Used to ground the concept that filing, summons/service and pleadings have procedural requirements that should be modeled as workflow events and document states rather than a single status checkbox.

### Electronic Case Management Practice Directions, 2020
`https://kenyalaw.org/kl/index.php?id=10211`

Used to ground electronic case filing/management support.

### Judiciary e-Filing support
`https://judiciary.go.ke/e-filing-support/`

### Judiciary E-Filing User Guide
`https://judiciary.go.ke/download/e-filing-user-guide-online-court-services-2023/`

### Limitation of Actions Act
`https://new.kenyalaw.org/akn/ke/act/1968/21`

Used to ground the need for a limitation/deadline engine. Precise deadlines must be validated against current law and facts rather than inferred from a generic matter type alone.

### Work Injury Benefits Act
`https://new.kenyalaw.org/akn/ke/act/2007/13/eng%402007-11-09`

Used for the WIBA/workplace-injury domain pack concept. Always verify current consolidated version before codifying rules.

### Advocates (Accounts) Rules
`https://new.kenyalaw.org/akn/ke/act/ln/1966/137/eng%402022-12-31`

Used to ground client-money separation, per-client records and accounting-record retention. The current Kenya Law version states that accounting books required under rule 13 must be preserved at least six years.

### Advocates (Accountant's Certificate) Rules
`https://new.kenyalaw.org/akn/ke/act/ln/1968/80/eng%402022-12-31`

Used to inform audit-ready financial recordkeeping.

### LSK legal-sector AML/CFT/CPF Guidelines
`https://lsk.or.ke/wp-content/uploads/2026/01/The-Legal-Sector-Guidelines-on-AML-CFT-CPF.pdf`

Used to inform future KYC/CDD/source-of-funds and client-account risk controls where applicable.

### Employment Act
`https://new.kenyalaw.org/akn/ke/act/2007/11/eng%402024-04-26`

Used to ground employee-record capability.

### Office of the Data Protection Commissioner
`https://www.odpc.go.ke/data-protection-laws-kenya/`
`https://www.odpc.go.ke/faqs/`

Used to ground privacy, sensitive-data and data-governance requirements.

## 3. Mature legal practice-management patterns

### Actionstep - Matter Types
`https://support.actionstep.com/hc/en-us/articles/50482523994259-About-Matter-Types`

Pattern adopted: matter type as reusable package containing workflow, data, participants, documents and settings.

### Actionstep - Workflows
`https://support.actionstep.com/hc/en-us/articles/50717814455571-About-Actionstep-Workflows-Admin`

Pattern adopted: workflow steps, completion requirements and triggered actions.

### Actionstep - Custom matter data
`https://support.actionstep.com/hc/en-us/articles/50717824279699-About-Custom-Matter-Data-and-Data-Collections`

Pattern adopted: matter-type-specific custom data collections, permissions and merge fields.

### Actionstep - Creating data collections
`https://support.actionstep.com/hc/en-us/articles/50717842422419-Creating-a-Data-Collection-for-a-Matter-Admin`

Pattern adopted: single-row and multi-row custom data collections.

## 4. Mature ERP email/configuration patterns

### Odoo email communication
`https://www.odoo.com/documentation/18.0/applications/general/email_communication.html`

### Odoo outbound mail servers
`https://www.odoo.com/documentation/18.0/applications/general/email_communication/email_servers_outbound.html`

### Odoo inbound mail servers
`https://www.odoo.com/documentation/18.0/applications/general/email_communication/email_servers_inbound.html`

### Odoo mail-domain configuration
`https://www.odoo.com/documentation/18.0/applications/general/email_communication/email_domain.html`

Patterns adopted: configurable outbound SMTP, inbound mailboxes/aliases, test connection, domain/identity management, and SPF/DKIM/DMARC awareness for custom domains.

## 5. Technology references

- Google Calendar API: `https://developers.google.com/workspace/calendar/api/guides/create-events`
- PostgreSQL versioning/support: `https://www.postgresql.org/support/versioning/`
- Redis version management: `https://redis.io/docs/latest/operate/oss_and_stack/install/version-mgmt/`
- Caddy automatic HTTPS: `https://caddyserver.com/docs/automatic-https`
- Docker Compose production: `https://docs.docker.com/compose/how-tos/production/`
- Node release policy: `https://nodejs.org/en/about/previous-releases`
- Vite 8 announcement: `https://vite.dev/blog/announcing-vite8`

## 6. Important uncertainty register

- The precise current statutory insurer-notice interval under the Insurance (Motor Vehicles Third Party Risks) regime should not be hard-coded from mixed case-language until the current consolidated statute/amendments are checked.
- The existence, scope and availability of any Kenya Judiciary programmatic CTS/e-filing API must be verified before implementing a live connector. The current prototype's "CTS API connected" text is not evidence of an official API.
- Firm bank/tax/registration/contact values in current seed data are unverified.
- Exact branch-two identity/location and physical file-numbering convention require firm confirmation.
- Document retention beyond explicit legal minima requires approved firm policy.
- The uploaded firm seal/execution-block image is a visual reference, not proof of authority or an approved final template.
