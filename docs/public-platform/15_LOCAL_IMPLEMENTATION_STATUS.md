# Local public-platform implementation

The approved plan covers the public renderer, governed CMS, immutable static publishing, media, lead handoff, local deployment rehearsal and acceptance evidence. Production and staging are excluded.

## Acceptance register

| Area | Required evidence | Status |
| --- | --- | --- |
| Shared presentation boundary | Import check; public/OS builds | In progress |
| Reference fidelity | Desktop/mobile screenshots and inspected responsive states | Pending |
| CMS and preview | Edit, review, isolated preview, conflict detection | Pending |
| Publishing | Frozen snapshot, HTML artifacts, atomic activation, rollback | In progress |
| Media | Variants, private drafts, retained release references | Pending |
| Leads | Validation, receipt, retries, ownership, calendar, qualified intake | Pending |
| Local rehearsal | Real database/Redis, local release server, recovery | Pending |
| Launch readiness | Approved original assets and verified business claims | Future launch gate |

Existing website migration history is preserved. Manifest JSON can hold complete release snapshots without rewriting applied migrations. Reference-derived assets remain development assets. No provider delivery, staging or production success is implied by local checks.
