# 33 - Settings Scope and Precedence Matrix

## 1. Goal

The settings engine must answer two questions reliably:
1. where can this value be configured?
2. which value is effective for this user/action/matter right now?

## 2. Scope matrix

Legend: `D` default/primary, `O` allowed override, `R` read/derived only, `-` not permitted.

| Configuration family | System | Firm | Entity | Branch | Practice | Matter Type | Workflow | Role/Team | User | Client | Matter | Integration |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Firm display identity | - | D | O | O | - | - | - | - | - | - | - | - |
| Branch address/contact | - | - | - | D | - | - | - | - | - | - | - | - |
| Timezone/locale | D | O | O | O | - | - | - | - | O | - | - | - |
| Matter numbering | - | D | O | O | O | O | - | - | - | - | - | - |
| Workflow definition | - | - | - | - | O | D | D | - | - | - | O* | - |
| Deadline policy | - | D | O | O | O | O | O | - | - | - | O* | - |
| Document retention | D | O | O | O | O | O | - | - | - | - | O* | - |
| Document mark policy | - | D | O | O | O | O | O | O | O | - | O* | - |
| User signature | - | - | - | - | - | - | - | O | D | - | - | - |
| Email sender identity | - | D | O | O | - | - | - | O | O | - | - | O |
| Notification policy | D | O | O | O | O | O | O | O | O** | O | O | - |
| Client-money policy | D | D | O | O | - | - | - | R | - | - | R | O |
| Expense approval limit | - | D | O | O | O | - | - | O | O*** | - | - | - |
| Authentication policy | D | O | - | - | - | - | - | O | O** | - | - | O |
| Portal visibility | - | D | O | O | O | O | O | - | - | O | O | - |
| Integration credentials | D | O | O | O | - | - | - | - | - | - | - | D |
| Feature flags | D | O | - | O | O | - | - | O | O | - | - | - |

`O*` only where policy permits exceptional matter-specific override and reason/approval is recorded.  
`O**` user may generally make settings stricter or choose normal-channel preferences but not defeat mandatory controls.  
`O***` bounded by role/firm maximum and cannot self-grant authority beyond policy.

## 3. Resolution algorithm

Conceptual process:

```text
1. Load SettingDefinition.
2. Identify request context: system, firm, entity, branch, practice, matter type,
   workflow version, role/team/user, client, matter, integration.
3. Load active SettingValues whose scopes are allowed.
4. Discard values outside effective date/time.
5. Apply explicit precedence graph for this setting.
6. Apply merge strategy.
7. Validate final value.
8. Return value + provenance chain.
```

The API should be able to return both value and provenance for admins.

## 4. Deny overrides

Some settings are intentionally non-overridable downstream:
- audit logging minimum;
- legal/accounting retention minimum;
- mandatory client-money controls;
- encryption/storage safety controls;
- firm-wide disabled feature;
- maximum approval authority;
- mandatory reauthentication for sensitive actions.

## 5. Conflict handling

If two scopes have equal precedence, configuration is invalid unless the setting definition has a deterministic tie-breaker. Avoid "last write wins" for policy configuration.

## 6. Time/effective date

Resolution is time-aware. This matters for:
- rates/taxes;
- firm/branch identity changes;
- document templates;
- signatures/marks;
- workflow versions;
- approval limits;
- provider credentials.

Historical reports/documents should resolve to the version effective at the transaction/document time when required for audit.
