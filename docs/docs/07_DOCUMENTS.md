# 07. Document and File Management

## 1. Objectives

Replace scattered local files and ambiguous "final" filenames with:
- central matter-linked storage,
- version history,
- preview,
- approval states,
- links from tasks/calendar,
- searchable metadata.

## 2. Logical document vs version

Example:

Document:
`Plaint`

Versions:
1. Plaint v1 draft
2. Plaint v2
3. Plaint v3 approved
4. Plaint signed
5. Plaint filed

UI displays one logical document with version history.

## 3. Storage path convention

Do not expose user filenames as the only storage key.

Suggested:
`organization/{orgId}/matters/{matterId}/documents/{documentId}/versions/{versionId}/{sanitizedFilename}`

## 4. Upload flow

1. choose file
2. choose or create logical document
3. select type/category
4. select matter
5. add note/status
6. upload
7. create version record
8. update current version
9. create activity event

## 5. Drag-and-drop

Desktop:
- drag files onto matter Documents area.

Mobile:
- file picker
- camera capture for receipts/evidence where permitted

## 6. Preview

MVP:
- PDF
- images
- plain text
- browser-supported media where reasonable

Office files:
- show metadata + download/open externally
- later add server-side conversion if desired

Do not pretend to render DOCX if it is not actually supported.

## 7. Version rules

- version numbers monotonic
- previous versions immutable in normal UI
- uploaded version notes optional
- filed/signed version cannot be replaced in place

## 8. Document status

Suggested:
- draft
- review
- approved
- signed
- filed
- served
- superseded
- archived

Status changes may require permission.

## 9. Document links

A document can link to:
- matter
- task
- calendar event
- filing record
- service record
- expense
- communication

Use join table where multiple links are required.

## 10. Document checklist

Workflow stage can define required document types.

Example:
Filing stage requires:
- approved plaint
- signed verifying affidavit
- witness statement
- list of documents

UI shows:
- complete
- missing
- under review

## 11. Review flow

MVP:
- submit for review
- reviewer notified
- approve
- request changes
- comment

Avoid building full collaborative word processing.

## 12. Search

Search metadata by:
- title
- type
- matter ref
- filename
- uploader
- status

Later:
- OCR
- full content indexing
- semantic search

## 13. Offline

Cache:
- metadata
- intentionally opened small previews where feasible

Do not automatically cache every confidential file.

Offline upload:
- small files may queue later
- MVP may require online state for large upload
- UI must make this explicit
