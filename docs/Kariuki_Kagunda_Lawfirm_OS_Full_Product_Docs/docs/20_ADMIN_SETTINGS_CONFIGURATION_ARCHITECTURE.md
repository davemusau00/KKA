# 20 - Administration, Settings and Configuration Architecture

## 1. Purpose

Configuration is a first-class product surface. The full product must not require source-code changes for ordinary firm administration. Authorized administrators should be able to configure how the firm works while the platform preserves safe defaults, validation, auditability, version history and scope inheritance.

This document supersedes any narrow interpretation of "Settings" in the original MVP documents. It is additive: the original settings remain valid where compatible, but they should be migrated into the configuration platform described here.

## 2. Administration information architecture

```text
Administration
├── Firm & Organization
│   ├── Firm Profile
│   ├── Legal Entities
│   ├── Branches & Locations
│   ├── Departments, Teams & Cost Centres
│   ├── Office Hours, Holidays & Locales
│   ├── Numbering & Reference Schemes
│   └── Branding & Stationery
├── Practice Configuration
│   ├── Practice Areas
│   ├── Matter Types
│   ├── Party / Participant Types
│   ├── Court & Proceeding Types
│   ├── Custom Fields & Data Collections
│   ├── Intake Forms
│   └── Matter Views & Layouts
├── Workflows & Automation
│   ├── Workflow Templates
│   ├── Stage Library
│   ├── Transition Gates
│   ├── SLA / Deadline Rules
│   ├── Assignment Rules
│   ├── Approval Policies
│   ├── Automation Rules
│   └── Workflow Versions & Sandbox
├── Users, Teams & Access
│   ├── Staff Accounts
│   ├── Roles
│   ├── Permission Matrix
│   ├── Matter Access Policies
│   ├── Ethical Walls / Restricted Matters
│   ├── Delegation & Acting Roles
│   ├── Approval Limits
│   └── User Provisioning / Offboarding
├── Documents & Knowledge
│   ├── Document Types
│   ├── Folder / Filing Profiles
│   ├── Naming Rules
│   ├── Templates & Merge Fields
│   ├── Review / Signing Policies
│   ├── Firm Marks, Signatures & Stamps
│   ├── Watermarks
│   ├── OCR / Indexing
│   ├── Retention / Legal Holds
│   └── Precedents / Knowledge Taxonomy
├── Communications
│   ├── Domains & Sender Identities
│   ├── Outbound SMTP / Mail APIs
│   ├── Inbound Mailboxes / Mail Routing
│   ├── Shared Mailboxes
│   ├── Email Templates & Signatures
│   ├── WhatsApp
│   ├── SMS
│   ├── Notification Rules
│   └── Consent / Contact Preferences
├── Calendar & Scheduling
│   ├── Calendar Providers
│   ├── Court Event Types
│   ├── Firm Event Types
│   ├── Resources / Rooms
│   ├── Working Hours
│   ├── Reminders
│   └── Conflict Rules
├── Finance & Client Money
│   ├── Chart of Accounts
│   ├── Office / Client / Trust Accounts
│   ├── Petty Cash
│   ├── Cost Centres
│   ├── Expense Categories
│   ├── Tax / VAT
│   ├── Rate Cards / Timekeeping
│   ├── Fee Note / Receipt Numbering
│   ├── Approval Thresholds
│   ├── Settlement Distribution Rules
│   ├── M-Pesa / Bank Imports
│   └── Accounting Period Locks
├── HR & Internal Operations
│   ├── Employment Categories
│   ├── Leave Types
│   ├── Leave Policies
│   ├── Performance Cycles
│   ├── Training / CPD
│   ├── Procurement
│   ├── Vendors
│   └── Asset Classes
├── Client Portal
│   ├── Portal Branding
│   ├── Visibility Policies
│   ├── Document Share Rules
│   ├── Message / Update Rules
│   ├── Payment Methods
│   └── External User Security
├── Integrations
│   ├── Connection Registry
│   ├── OAuth Applications
│   ├── API Credentials / Secrets
│   ├── Webhooks
│   ├── Mapping Rules
│   ├── Sync Policies
│   └── Connection Health
├── Data & Records
│   ├── Imports / Exports
│   ├── Duplicate Management
│   ├── Data Quality Rules
│   ├── Retention
│   ├── Archiving
│   ├── Legal Holds
│   └── Data Subject Request Tools
├── Security & Authentication
│   ├── Password Policy
│   ├── MFA
│   ├── SSO / OIDC / SAML
│   ├── Session / Device Policy
│   ├── Network / IP Rules
│   ├── Reauthentication Rules
│   ├── API Access
│   └── Security Events
├── Developer Platform
│   ├── API Clients
│   ├── Webhook Subscriptions
│   ├── Custom Apps / Extensions
│   ├── Event Catalogue
│   ├── Feature Flags
│   └── Sandbox / Test Data
├── System Operations
│   ├── Service Health
│   ├── Storage
│   ├── Queues / Workers
│   ├── Scheduled Jobs
│   ├── Search / OCR Indexing
│   ├── Backups / Restore
│   ├── Logging / Diagnostics
│   ├── Email Queue / Dead Letter Queue
│   ├── Maintenance Mode
│   └── Version / Migrations
└── Audit & Change History
    ├── Settings Change Log
    ├── Security Audit
    ├── Integration Audit
    ├── Financial Configuration Audit
    └── Exportable Evidence Trail
```

## 3. Configuration scopes

Every configurable value must declare where it is allowed to exist. The core scopes are:

| Scope | Example |
|---|---|
| `SYSTEM` | storage backend, session infrastructure, global feature flag |
| `FIRM` | firm name, default timezone, default document watermark |
| `LEGAL_ENTITY` | tax registration, client account, invoice identity |
| `BRANCH` | address, default court station, branch seal, petty cash limit |
| `DEPARTMENT` | notification route, manager, cost centre |
| `PRACTICE_AREA` | PI default deadline profile, conveyancing document taxonomy |
| `MATTER_TYPE` | RTA workflow, required data collections, document templates |
| `WORKFLOW_TEMPLATE` | stage gates, assignment rules, SLA rules |
| `ROLE` | permission policy, approval capability |
| `TEAM` | work queue membership and routing |
| `USER` | signature profile, calendar preference, delegated authority |
| `CLIENT` | contact preference, portal visibility override |
| `MATTER` | restricted access, special workflow override, custom reminder |
| `DOCUMENT_TEMPLATE` | letterhead, seal placement, execution block |
| `INTEGRATION_CONNECTION` | provider-specific credentials and mapping |
| `PORTAL_PROFILE` | external experience and visibility policy |

Settings must not become an unstructured JSON dumping ground. Each setting has a registered definition.

## 4. Required configuration definition model

Conceptual schema:

```ts
interface SettingDefinition {
  key: string;
  category: string;
  label: string;
  description: string;
  valueType: 'string' | 'number' | 'boolean' | 'enum' | 'json' | 'secret' | 'asset' | 'duration';
  allowedScopes: SettingScope[];
  defaultValue?: unknown;
  validationSchemaId: string;
  mergeStrategy: 'replace' | 'merge_object' | 'append_unique' | 'deny_override';
  sensitivity: 'public' | 'internal' | 'confidential' | 'secret';
  requiresApproval: boolean;
  requiresReason: boolean;
  effectiveDatingSupported: boolean;
  restartRequired: boolean;
  featureDependencyKeys?: string[];
}
```

A separate `SettingValue` stores the scoped value, version, effective date, actor, approval and change reason. Secrets should be held in an encrypted secret store or encrypted database field and returned to the UI only as masked metadata.

## 5. Effective value and inheritance

The UI must explain why a value is active.

Example:

```text
Default Court Station
Effective value: Milimani Chief Magistrate's Court
Source: Nairobi Branch
Firm default: High Court of Kenya - Nairobi
Matter override: none
Effective since: 2026-08-01
Last changed by: Technical Administrator
```

Precedence should be deterministic. Recommended baseline:

```text
SYSTEM
  -> FIRM
    -> LEGAL_ENTITY
      -> BRANCH
        -> DEPARTMENT / PRACTICE_AREA
          -> MATTER_TYPE / WORKFLOW_TEMPLATE
            -> ROLE / TEAM / USER where applicable
              -> CLIENT / MATTER where explicitly permitted
```

Not every key may be overridden at every level. For example, a user must not override client-money control policy merely because user scope exists in the platform.

## 6. Settings lifecycle

Settings can be:
- draft;
- pending approval;
- scheduled;
- active;
- superseded;
- deprecated;
- archived.

High-impact settings must support change reason, impact preview, approval and effective date. Examples include client-money accounts, fee/tax policy, document signing policy, access policy, SSO configuration and workflow transition requirements.

## 7. Configuration versioning and rollback

For each change retain:
- previous value hash;
- new value hash;
- human-readable diff where safe;
- actor;
- approver if any;
- timestamp;
- source IP / device where appropriate;
- reason;
- affected scope;
- effective date;
- deployment/restart impact;
- related incident/change ticket if supplied.

Rollback must create a new version. Never silently delete history.

## 8. Admin UX standards

Every settings screen must have:
- search;
- category navigation;
- current effective value;
- source/inheritance indicator;
- validation;
- unsaved-change warning;
- test action where safe;
- audit/history drawer;
- permission guard;
- impact warning;
- save success/error state;
- secret masking;
- confirmation for destructive actions;
- no fake "connected" or "healthy" status.

A useful pattern is **Configuration Studio**: a searchable settings shell with scope selector at the top and a right-side inspector that shows inheritance, last change, impact and related dependencies.

## 9. Configuration packages

Support export/import of non-secret configuration packages for staging, backup and branch rollout. A package may contain workflows, forms, fields, templates, notification policies and UI views. Packages must never export decrypted secrets.

Configuration packages should be signed with a checksum and include:
- product version;
- schema version;
- dependency manifest;
- exported scope;
- creator;
- export time;
- dry-run validation result when importing.

## 10. Current repository gap

The current repository has useful `FirmSettingsConfig` and `ApiSettingsConfig` concepts, but they are browser state backed by `localStorage`, and `settingsData.ts` hard-codes realistic-looking firm/finance/security values. The full product requires:
- database-backed setting definitions and values;
- secret separation;
- scope inheritance;
- validation;
- version history;
- approval/effective dating;
- live backend capability checks;
- permission-aware settings UI;
- migration from existing seed values as demo data only.

Do not expand the current single `FirmSettingsConfig` interface indefinitely. Introduce typed configuration domains and backend-owned configuration services.
