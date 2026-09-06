# 21 - Firm Marks, Signatures, Stamps and Execution Blocks

## 1. Purpose

The uploaded reference image demonstrates an execution block containing the phrases `Drawn, Signed & Delivered`, the name `Kariuki Kagunda, SC`, a professional title line and a boxed `OFFICIAL FIRM SEAL` treatment. The image is a design/reference asset, not proof of authorization, legal status or cryptographic signing capability.

Reference asset in this documentation package:

`docs/assets/reference/official-firm-stamp-execution-block-reference.png`

This feature family needs deeper controls than a simple "upload stamp" setting because application of a signature or firm mark to a legal document can carry serious operational consequences.

## 2. Never collapse these concepts

The system must distinguish:

| Concept | Meaning in product |
|---|---|
| Visual firm mark | Logo, firm seal artwork, office stamp artwork or other visual identifier |
| Operational stamp | RECEIVED, PAID, COPY, CONFIDENTIAL, FILED COPY, APPROVED, etc. |
| Scanned signature representation | Image of a person's signature, controlled visual asset |
| Execution block | Structured text + signature placeholder + name/title + firm seal placement |
| Electronic acknowledgement | User action recorded by the system, not necessarily a legal digital signature |
| Cryptographic digital signature | Signature produced using an approved digital-signature provider/certificate process |
| Court / registry seal | External authority mark. The system may store a received copy but must never fabricate one |

A PNG pasted into a PDF must never be described by the UI as a cryptographic digital signature.

## 3. Asset types

`FirmMarkAsset.type` should support at least:
- `firm_seal`;
- `branch_seal`;
- `logo`;
- `received_stamp`;
- `paid_stamp`;
- `approved_stamp`;
- `certified_copy_stamp`;
- `confidential_stamp`;
- `draft_stamp`;
- `copy_stamp`;
- `internal_review_stamp`;
- `custom_operational_mark`.

Separate `SignatureProfile` records should handle individual signature images and signing identity.

## 4. Firm mark configuration

Each mark requires:
- display name;
- asset type;
- firm/legal-entity owner;
- branch scope if applicable;
- description and intended use;
- source file;
- transparent-background rendition;
- checksum;
- dimensions and DPI metadata;
- allowed document types;
- allowed matter types/practice areas;
- permitted roles/users;
- whether it can be applied automatically;
- whether application requires approval;
- approval roles;
- allowed placement presets;
- minimum/maximum scale;
- minimum/maximum opacity;
- permitted rotation range;
- effective-from and effective-to dates;
- active/retired status;
- version history.

## 5. Visual placement presets

A placement preset should be a reusable record, not hard-coded CSS.

Examples:
- `execution_block_right`;
- `execution_block_below_signature`;
- `letter_footer_right`;
- `received_top_right`;
- `paid_top_left`;
- `certified_copy_below_certification_text`.

A preset may specify:
- page selection: first, last, all, explicit pages;
- anchor: page, text anchor, merge-field anchor, signature anchor;
- x/y offset in points or millimetres;
- width/height or scale;
- aspect-ratio lock;
- rotation;
- opacity;
- z-order;
- margin constraints;
- keep-inside-page validation;
- collision rule with other marks.

The preferred template approach is named anchors, for example:

```text
{{ADVOCATE_SIGNATURE}}
{{EXECUTION_BLOCK}}
{{FIRM_SEAL}}
{{CERTIFICATION_STAMP}}
```

The document-generation engine should resolve anchors and record actual placement coordinates after rendering.

## 6. Signature profiles

A user signature profile can contain:
- user;
- professional display name;
- qualifications/post-nominals;
- job title;
- LSK/admission number if the firm elects to display it;
- signature image versions;
- typed-signature alternative;
- default execution block;
- permitted templates/document types;
- valid-from/to;
- approval status;
- delegation policy;
- cryptographic signing provider identity when configured.

Signature image assets are confidential. Downloads of original signature PNG/SVG should be denied to ordinary users. The application should apply them server-side into an authorized new document rendition.

## 7. Execution block templates

The uploaded reference suggests a layout similar to:

```text
Drawn, Signed & Delivered:
{Name / professional designation}
{Role / Advocate of the High Court of Kenya}
                                    {Official Firm Seal}
```

Treat every text component as configurable. Do not hard-code the exact name, title or firm designation from the uploaded reference.

An `ExecutionBlockTemplate` should support:
- template name;
- firm/branch scope;
- document types;
- signer role requirements;
- heading text;
- signatory display format;
- role/title line;
- optional admission/LSK data;
- optional date/place line;
- signature anchor;
- seal anchor;
- witness/commissioner fields where appropriate;
- multiple signatories;
- typography tokens;
- border/background rules;
- responsive PDF layout constraints;
- versioning.

## 8. Application workflow

Suggested high-risk workflow:

```text
Document version created
  -> review complete
  -> signing requested
  -> signer authenticates / reauthenticates
  -> signer confirms document hash and intent
  -> optional partner approval
  -> server applies authorized signature/mark
  -> new immutable document version generated
  -> output checksum stored
  -> mark application record stored
  -> timeline/audit event written
  -> document status becomes signed/approved as policy allows
```

A visual mark should never mutate an existing document version in place.

## 9. Required audit record

`DocumentMarkApplication` should record:
- id;
- document id;
- input version id;
- output version id;
- mark asset id and version id;
- execution block template id/version if used;
- signer/user;
- authorizer/approver;
- appliedAt;
- reason/purpose;
- page numbers;
- actual rendered coordinates;
- opacity/rotation/scale;
- input checksum;
- output checksum;
- client IP/device metadata where policy allows;
- whether reauthentication was performed;
- whether cryptographic signing was used and provider transaction ID if applicable.

## 10. Delegation

Support time-bound delegation:
- delegator;
- delegate;
- allowed mark/signature actions;
- allowed matter types;
- allowed document types;
- start/end dates;
- reason;
- approval;
- revocation;
- usage history.

A delegate should never gain access to the original scanned signature image. They receive authorization to invoke a server-side signing action where policy permits.

## 11. Operational stamps

Operational marks need workflow meaning, not only graphics.

Examples:
- `RECEIVED`: requires received date/time, source, receiving user, channel and optionally original physical location;
- `PAID`: requires finance transaction/receipt reference;
- `APPROVED`: requires approval record;
- `CERTIFIED TRUE COPY`: requires certifying user, certification date and authority basis configured by the firm;
- `DRAFT`: may be automatically watermarked on generated drafts;
- `CONFIDENTIAL`: changes display classification but does not replace access-control policy.

The stamp should be rendered from the underlying event where possible, making the graphic a representation of structured data.

## 12. Court and registry marks

The platform can store images or PDFs received from courts/registries and classify them as filed/stamped copies. It must not create or imitate a court seal, filing barcode, registry stamp or official court receipt. A configured firm mark must not visually masquerade as an external authority mark.

## 13. Admin screen proposal

`Administration -> Documents & Knowledge -> Firm Identity, Signatures & Stamps`

Tabs:
- Firm Marks;
- User Signatures;
- Execution Blocks;
- Placement Presets;
- Watermarks;
- Delegations;
- Signing Providers;
- Usage Audit.

Each asset card should show thumbnail, scope, status, version, effective date, usage count and last user. The edit screen should have an interactive PDF preview with snap-to-anchor placement and a test-document sandbox.

## 14. Data model

Recommended entities:

```text
FirmMarkAsset
FirmMarkAssetVersion
SignatureProfile
SignatureAssetVersion
ExecutionBlockTemplate
ExecutionBlockTemplateVersion
DocumentPlacementPreset
DocumentMarkPolicy
DocumentMarkApplication
SignatureDelegation
SigningProviderConnection
SigningTransaction
```

## 15. Security requirements

- signature originals encrypted at rest;
- access through server only;
- no public URLs;
- separate permission for managing marks and applying marks;
- reauthentication for sensitive signing actions;
- rate limiting;
- immutable application audit;
- approval rules for high-risk documents;
- no browser-side permanent storage of signature images;
- no signature asset in seed/demo source code;
- mark deletion becomes retirement if already used;
- all versions referenced by historical documents remain preservable.

## 16. Repository gap

No current source-code result was found for a `stamp` feature. Existing document records support review/sign/file states and a `signatureHash`, but the prototype lacks the formal asset registry, placement engine, signing authorization and application audit described here. This should be implemented as part of the document platform rather than as a cosmetic settings upload.
