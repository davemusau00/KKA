# 24 - Email, Communications and Delivery Configuration

## 1. Purpose

Email should be a legal correspondence system, not merely a Send button. The platform must support outbound delivery, inbound capture, threading, matter association, shared mailboxes, templates, provider health and delivery evidence.

The firm currently uses ordinary Gmail accounts, so the design must support a practical starting point while allowing later Google Workspace, Microsoft 365 or standards-based SMTP/IMAP.

## 2. Provider abstraction

```text
OutboundMailProvider
├── SmtpOutboundProvider
├── GmailApiOutboundProvider
├── MicrosoftGraphOutboundProvider
└── TransactionalEmailProvider

InboundMailProvider
├── ImapInboundProvider
├── GmailApiInboundProvider
└── MicrosoftGraphInboundProvider
```

Business logic should create a `MailMessage`/`Communication` request. Provider adapters handle transport details.

## 3. Outbound SMTP settings

Connection profile fields:
- profile name;
- environment;
- host;
- port;
- encryption mode: STARTTLS, implicit TLS, none only in explicitly safe test environments;
- authentication type;
- username/client identity;
- secret/password stored server-side;
- connection timeout;
- send timeout;
- max connection pool;
- max messages per connection;
- rate limit;
- retry policy;
- from-domain restrictions;
- default From;
- default Reply-To;
- bounce/return-path policy;
- fallback provider;
- enabled status.

Test actions should be separate:
1. network/TLS connection;
2. authentication;
3. test send to chosen recipient;
4. optional deliverability verification.

A green network connection is not equivalent to guaranteed delivery.

## 4. Domain settings

For every sending domain track:
- domain;
- owner/legal entity;
- allowed sender addresses/patterns;
- SPF status;
- DKIM status;
- DMARC status;
- MX/inbound status;
- return-path/bounce domain;
- catchall alias;
- default notification local-part;
- verification timestamp;
- warning state.

The system may check DNS and show actionable status, but should not claim a domain is fully deliverable solely from a single DNS check.

## 5. Sender identities and signatures

A `SenderIdentity` can be scoped to firm, branch, department, team or user. Fields:
- display name;
- email;
- reply-to;
- provider connection;
- allowed users/roles;
- signature profile;
- confidentiality disclaimer;
- branch footer;
- branding profile;
- default template set.

## 6. Inbound mail

Support:
- shared inboxes;
- IMAP/OAuth mailbox connections;
- polling or push/watch where provider supports it;
- folder/label selection;
- read-only vs state-changing sync;
- initial sync window;
- attachment size limits;
- malware scanning;
- retry/dead-letter handling.

The system should preserve source headers including:
- `Message-ID`;
- `In-Reply-To`;
- `References`;
- From/To/Cc/Bcc where legally appropriate;
- date;
- provider thread id;
- raw-header hash or evidence metadata;
- delivery/source mailbox.

## 7. Matter routing

Inbound email may be associated through:
1. explicit matter reference in subject/body;
2. unique reply token/alias;
3. existing thread relation;
4. known client/party/advocate participants;
5. configured shared mailbox routing;
6. manual user assignment.

Automatic association should produce a confidence level. Ambiguous correspondence goes to a **Mail Triage Queue**, never silently attached to the wrong matter.

## 8. Shared mailbox workspace

Suggested screens:
- Unassigned;
- My Queue;
- Matter-linked;
- Awaiting Reply;
- Sent;
- Delivery Failures;
- Quarantine;
- Archived.

Actions:
- link to matter/client/intake;
- create task/deadline;
- save attachments to matter documents;
- assign owner;
- reply/forward;
- mark privileged/confidential;
- add internal note;
- convert to intake.

## 9. Templates

Templates should support:
- category;
- subject;
- body HTML/text;
- merge fields;
- conditional blocks;
- attachments/document templates;
- sender identity;
- language;
- practice/matter type scope;
- versioning;
- preview with test data;
- approval before publication.

Example merge fields:
`{{matter.internal_reference}}`, `{{client.display_name}}`, `{{court.next_date}}`, `{{stage.owner.full_name}}`, `{{branch.phone}}`.

## 10. Delivery record

Store separately from the message content:
- queued;
- provider accepted;
- sent;
- delivered where provider supplies evidence;
- bounced;
- complained;
- deferred;
- failed;
- opened/read only if law/policy allows and provider supports it.

Never display "delivered" merely because the API accepted the request.

## 11. WhatsApp

Configuration areas:
- business account / phone number connection;
- access token/secret;
- webhook verification;
- approved templates;
- template language;
- consent/contact preference;
- business hours;
- opt-out rules;
- delivery/read status;
- media/document constraints;
- matter association;
- client-visible vs internal note classification;
- reminder policies;
- failure/fallback behavior.

High-risk messages such as settlement authority or legal advice should have configurable review requirements and should always be captured to the matter communication history.

## 12. SMS

Support provider abstraction, sender IDs, templates, character/segment estimate, cost estimate, delivery receipts, consent/opt-out, retry/fallback and matter capture.

## 13. Notification routing

Internal notifications should be rule-driven:

```text
Event: court.date.changed
Conditions: matter priority = critical
Recipients: stage owner + supervisor + court clerk
Channels: in-app immediately, email immediately, SMS if event < 24h
Escalation: branch partner if unacknowledged after 60 minutes
Quiet-hours override: yes for critical legal deadline
```

User preferences can reduce normal channels, but must not defeat mandatory critical alerts where firm policy forbids it.

## 14. Audit and retention

Communications need:
- immutable send/receive metadata;
- actor;
- provider/message id;
- recipients;
- associated matter/client;
- attachments/checksums;
- template/version;
- delivery history;
- edits to internal notes;
- export capability.

## 15. Research grounding

Mature on-premise ERP email patterns support configurable outbound SMTP, inbound mail servers/aliases and company/domain settings. Official provider APIs also support dedicated mail/calendar integrations. The KKA design adopts these patterns while adding legal matter routing and evidence/audit requirements.

## 16. Current repository gap

The current integration UI does not include a real SMTP/inbound email administration surface and currently simulates provider success. Replace boolean connection flags with backend connection records and health checks.
