# 37 - Full Product Configuration Catalogue

## 1. Purpose

This is the practical administrator-facing catalogue of settings the full product should eventually expose. It complements the settings engine in document 20, the stamp/signature specification in document 21 and the scope matrix in document 33.

The list is intentionally broad. Individual settings are implemented only when their underlying capability exists. A setting must never expose a switch for a feature that has no real backend behavior unless it is clearly marked as preview/demo and cannot be mistaken for operational.

## 2. Firm and organization

### Firm profile
- registered/display firm name;
- short name;
- trading name where applicable;
- tagline;
- legal entity;
- registration/reference fields;
- tax/VAT fields;
- website;
- main phone/email;
- postal/physical address;
- timezone;
- locale/date format;
- default currency;
- business hours;
- default language;
- emergency/after-hours contact;
- privacy/contact officer details if configured by the firm.

### Branch
- branch name/code;
- active state;
- physical/postal address;
- phone/email;
- manager/partner;
- working hours;
- holidays;
- default court station;
- default cost centre;
- default sender identity;
- default letterhead;
- branch seal;
- default petty cash account;
- branch-specific approval limits;
- rooms/resources;
- numbering prefix.

### Departments/teams
- name/code;
- branch association;
- manager;
- members;
- work queue;
- practice area;
- cost centre;
- notification channel;
- default calendars;
- escalation target.

## 3. Numbering and identifiers

Configurable sequences for:
- internal matter reference;
- client number;
- intake number;
- receipt number;
- fee note/invoice number;
- payment voucher;
- expense request;
- purchase requisition/order;
- asset ID;
- document reference;
- settlement statement;
- employee/staff number.

Sequence settings:
- prefix/suffix;
- year/month component;
- branch/practice code;
- zero padding;
- sequence reset policy;
- preview;
- collision protection;
- reserved ranges;
- legacy/manual number support;
- immutable generated-number policy.

## 4. Practice areas and matter types

- practice area name/code;
- active branches;
- practice lead;
- matter types;
- default workflow;
- default responsible team;
- intake form;
- conflict search profile;
- KYC profile;
- party roles;
- custom data collections;
- default document taxonomy;
- template pack;
- default deadlines;
- default task pack;
- billing/rate profile;
- portal visibility policy;
- close/reopen policy;
- archive/retention class;
- required supervisor role.

## 5. Workflow and automation

- workflow versions;
- stages;
- stage codes/colors/icons;
- descriptions/help;
- responsible roles/teams;
- assignment strategy;
- target duration/SLA;
- entry/exit gates;
- required fields;
- required documents/statuses;
- required tasks;
- checklist items;
- approval gates;
- notifications;
- auto-created tasks/deadlines/events;
- transition permissions;
- allowed next stages;
- skip/rollback/reopen policy;
- override reason requirement;
- portal milestone mapping;
- workflow migration rules;
- sandbox/test scenarios.

Automation rule settings:
- trigger;
- conditions;
- actions;
- delay/schedule;
- idempotency policy;
- retry policy;
- failure escalation;
- enabled/effective dates;
- execution limits;
- test mode;
- audit retention.

## 6. Custom fields and forms

### Custom fields
- key/label/help;
- type;
- validation;
- required rule;
- default;
- options;
- hierarchical dependency;
- conditional visibility;
- read/write permissions;
- search/index flag;
- reporting flag;
- merge-field flag;
- portal visibility;
- sensitivity;
- retention class.

### Forms
- form name/purpose;
- version;
- scope;
- sections/pages;
- field order;
- conditional branching;
- save/resume;
- attachments;
- submission permissions;
- approval after submission;
- notification after submission;
- PDF snapshot;
- portal/internal availability;
- publish/effective dates.

## 7. Users, roles and access

### User
- identity/contact;
- home/additional branches;
- primary/secondary roles;
- teams;
- job title;
- supervisor;
- admission/bar details;
- active dates;
- signature profile;
- default calendar;
- notification preferences;
- working hours;
- delegated authority;
- device/session state;
- portal/external identity if relevant.

### Role/permission policy
- module access;
- object read/create/update/delete;
- approve/post/sign/file/export;
- finance limits;
- matter restrictions;
- document confidentiality access;
- HR access;
- admin/config access;
- system operations access;
- audit access;
- data export access.

### Matter access
- default access model;
- team inheritance;
- named users;
- restricted matters;
- ethical wall groups;
- client conflict restriction;
- temporary access;
- access reason;
- review/expiry.

## 8. Approvals and delegation

- approval type;
- object/action;
- amount/risk threshold;
- branch/practice scope;
- approver role/user/team;
- number/order of approvals;
- substitute/delegate;
- SLA;
- escalation;
- self-approval rule;
- segregation-of-duties rule;
- expiry;
- reapproval after change;
- evidence/comment requirements.

## 9. Document platform

### Types/taxonomy
- document category/type;
- matter-type applicability;
- confidentiality default;
- retention class;
- required metadata;
- naming template;
- review route;
- signing route;
- portal eligibility;
- OCR/index behavior.

### Upload
- max file size;
- MIME allowlist;
- extension allowlist;
- malware scan;
- duplicate/checksum behavior;
- image compression policy;
- EXIF handling;
- filename normalization;
- quarantine behavior.

### Versions/review
- version numbering;
- check-in/out behavior;
- mandatory change summary;
- review roles;
- approval rules;
- reject/revise route;
- lock after signing/filing;
- superseded display;
- diff/compare support.

### Templates/document assembly
- template version;
- merge-field set;
- default letterhead;
- execution block;
- allowed marks;
- font/theme tokens;
- output format;
- required data validation;
- publication approval;
- effective dates.

## 10. Firm identity, stamps and signatures

### Brand assets
- logos;
- letterheads;
- footer blocks;
- monochrome variants;
- branch variants;
- print/PDF sizing;
- effective dates.

### Firm seal / operational stamp
- name/type;
- scope;
- asset version;
- transparent rendition;
- checksum;
- allowed document/matter types;
- allowed roles/users;
- automatic/manual use;
- approval requirement;
- placement presets;
- min/max scale;
- opacity range;
- rotation range;
- page rules;
- anchor;
- effective dates;
- retirement;
- usage audit.

### Signature profile
- signatory;
- professional display name;
- title/post-nominals;
- signature asset versions;
- default execution block;
- allowed document types;
- reauthentication requirement;
- delegation rules;
- cryptographic-signature provider mapping;
- active dates.

### Execution block
- heading text;
- signatory format;
- professional title line;
- signature anchor;
- firm-seal anchor;
- witness lines;
- date/place fields;
- typography;
- border/layout;
- multiple signatories;
- branch/template scope.

### Watermarks
- DRAFT;
- PRIVILEGED & CONFIDENTIAL;
- COPY;
- INTERNAL REVIEW;
- custom;
- opacity/angle/font;
- pages;
- document state that triggers it;
- removal state;
- preview.

## 11. Email and domains

### Domain
- domain;
- legal entity/branch;
- SPF/DKIM/DMARC status;
- MX status;
- verification date;
- catchall/bounce aliases;
- return path;
- default sender;
- allowed sender patterns.

### SMTP/outbound profile
- provider/type;
- host/port;
- TLS mode;
- auth type;
- username;
- write-only secret;
- From/Reply-To;
- rate limits;
- timeouts;
- retry;
- fallback;
- environment;
- enabled;
- test connection/test send.

### Inbound mailbox
- provider/type;
- mailbox;
- OAuth/IMAP connection;
- folders/labels;
- polling/push;
- initial sync window;
- shared/personal classification;
- auto-routing profile;
- attachment policy;
- quarantine;
- retention;
- last cursor/sync.

### Email templates
- subject/body;
- plain-text fallback;
- merge fields;
- conditional sections;
- sender identity;
- signature/disclaimer;
- attachments;
- language;
- approval;
- effective version.

## 12. WhatsApp and SMS

- provider account;
- credentials/webhook;
- business phone/sender ID;
- templates;
- template languages;
- consent requirement;
- opt-out;
- quiet hours;
- matter update triggers;
- court reminders;
- delivery/read tracking;
- retry/fallback;
- media limits;
- cost controls;
- staff approval for sensitive message classes.

## 13. Notifications

- event;
- conditions;
- recipients;
- channel priority;
- immediate/digest;
- reminder schedule;
- escalation;
- acknowledgement;
- quiet hours;
- mandatory-critical override;
- template;
- branch/practice scope;
- duplicate suppression.

## 14. Calendar and resources

- provider connections;
- sync direction;
- calendar mapping;
- court event types;
- internal/client event types;
- colors/icons;
- default duration;
- reminder profiles;
- court-date protection;
- drag/drop policy;
- working hours;
- holidays;
- travel buffer;
- virtual meeting provider;
- room/resource definitions;
- conflict rules;
- recurring-event policy.

## 15. Court operations

- court directory;
- stations/divisions;
- proceeding/case types;
- default station by branch/practice;
- filing package types;
- filing/service statuses;
- service methods;
- process-server directory;
- court outcome types;
- reminder rules;
- limitation warning profile;
- statutory/court deadline rule catalogue;
- e-filing portal deep links;
- integration status only if supported by a verified provider/API.

No setting may enable fabrication of a court seal, registry stamp, filing barcode or court receipt.

## 16. Finance and client money

### General finance
- base currency;
- fiscal/financial periods;
- period locks;
- chart of accounts;
- branches/cost centres;
- tax/VAT profiles;
- rounding;
- approval thresholds.

### Accounts
- bank/mobile/cash account;
- office vs client/trust classification;
- legal entity/branch;
- currency;
- bank metadata;
- reconciliation mode;
- statement import profile;
- active dates;
- permissions.

### Client money
- permitted receipt/payment types;
- required matter/client allocation;
- transfer approval;
- unallocated-funds queue;
- withdrawal rules;
- client ledger display;
- reconciliation frequency;
- dormant balance alerts;
- settlement distribution approvals;
- account statement/report profile.

### Billing/time
- rate cards;
- role/user/matter rates;
- effective dates;
- rounding increments;
- minimum entries;
- billing status;
- fee note template/sequence;
- payment terms;
- tax rules;
- write-off/discount approval.

### Expense/petty cash
- categories;
- receipt requirement;
- limits;
- advance/reimbursement policy;
- approval route;
- payment sources;
- petty-cash float/replenishment;
- reconciliation.

## 17. HR

- employment categories;
- departments/grades;
- leave types;
- accrual/entitlement;
- approval routes;
- public holidays;
- attendance policy if used;
- performance cycles;
- competency framework;
- training/CPD categories;
- onboarding/offboarding templates;
- restricted-record permissions;
- document retention.

## 18. Procurement and assets

- vendor categories;
- requisition categories;
- budget thresholds;
- quotation requirements;
- approval routes;
- purchase-order numbering;
- receiving policy;
- invoice matching;
- asset classes;
- depreciation metadata if finance requires it;
- custodianship;
- maintenance schedules;
- disposal approvals.

## 19. Knowledge and meetings

- knowledge taxonomy;
- practice tags;
- precedent review/approval;
- review intervals;
- owners/curators;
- citation/source fields;
- meeting types;
- minute templates;
- decision/action-item rules;
- confidentiality classes;
- publication/archive controls.

## 20. Client portal

- branding/domain;
- enabled matter types;
- invitation expiry;
- MFA/security;
- visible milestone mapping;
- document share categories;
- upload types/limits;
- message permissions;
- client instruction/approval templates;
- payment methods;
- receipt/statement visibility;
- consent/preferences;
- external collaborator profiles;
- inactivity/session policy.

## 21. Integrations

For every connection:
- provider;
- environment;
- scope;
- credential references;
- OAuth state/scopes;
- mapping profile;
- sync direction;
- schedule;
- rate limits;
- retry;
- webhook;
- last test;
- last success;
- last error;
- health status;
- owner;
- audit;
- disable/revoke.

## 22. Data, imports and retention

- import templates;
- mapping profiles;
- duplicate rules;
- dry-run policy;
- error thresholds;
- export permissions;
- retention classes;
- archive tiers;
- legal hold;
- destruction approvals;
- anonymization rules;
- data-quality rules;
- sensitive-field classifications;
- data-subject request workflow.

## 23. Security and authentication

- password policy;
- MFA policy;
- SSO/OIDC/SAML providers;
- user provisioning;
- session lifetime/idle timeout;
- concurrent sessions;
- trusted devices;
- IP/network policy;
- reauthentication triggers;
- high-risk action policy;
- API client policy;
- login throttling;
- account lock/recovery;
- security alerts;
- audit retention.

## 24. System operations

- app/build version;
- maintenance mode;
- database health;
- migration status;
- Redis health;
- queue concurrency;
- worker health;
- scheduled jobs;
- document storage usage/thresholds;
- OCR/indexer settings;
- email queue;
- webhook queue;
- backup schedule;
- backup target metadata;
- last backup;
- last restore test;
- log retention;
- diagnostics;
- feature flags;
- update channel if later supported.

## 25. Developer platform

- API clients/scopes;
- API key/token expiry;
- webhook endpoints/events;
- signing secrets;
- retries/replay;
- event catalogue;
- rate limits;
- sandbox/test endpoints;
- configuration package import/export;
- extension/plugin permissions where future plugin architecture is enabled.

## 26. Admin UX rule

Any settings page that handles secrets, money movement, signatures, access-control or workflow publishing must show:
- effective scope;
- current value/provenance;
- validation;
- change reason;
- impact preview;
- approval requirement;
- audit history;
- effective date;
- safe test action if relevant;
- explicit warning if changing the value affects existing records.
