# Lawyer-friendly Website & Growth management UI

Status: implementation slice in progress. Structured settings, pages, content, forms, media, publishing, typed form snapshots, and live draft preview are implemented locally; authenticated browser acceptance remains to be run.

This plan refactors the internal Website & Growth workspace for lawyers and other non-technical firm users. The internal LawFirm OS visual language remains the management UI standard. The public-site reference is shown through the private preview iframe; public CSS and internal OS CSS remain separate.

## Outcomes

- No visible JSON, CSS, JavaScript, block codes, or raw asset IDs in Website & Growth.
- Settings, pages, content, forms, media, leads, and publishing use consistent responsive cards, editors, dialogs, alerts, and action bars.
- Editors can work at 360, 390, 430, 640, 768, 1024, 1280, 1440, and 1920 pixels without clipped content or horizontal overflow.
- Existing website database columns and publishing contracts remain compatible.
- Public preview shows unsaved structured changes while retaining noindex, no-store, origin checks, and private media protection.

## Implementation decisions

### Workspace layout

Use a centered, padded workspace with `min-w-0`, safe max width, and responsive overflow handling. Website cards use the existing LawFirm OS tokens. Tables collapse to cards on narrow screens. Editors use sticky headers and footers with a scrollable body, Escape-to-close, focus restoration, and full-width mobile drawers.

Statuses are presented as Draft, In review, Approved, and Scheduled. Published is controlled by the Publishing tab and is not an editable content status.

### Typed editor state

Add web-side models and serializers for:

- navigation rows;
- social links;
- SEO settings;
- footer settings;
- supported enquiry form fields;
- approved page-section content;
- media and record references.

The API continues storing compatible JSON values, but API schemas validate typed payloads and normalize legacy records. Unknown design properties, unsafe links, cross-firm media, and cross-firm records remain rejected.

### Settings

Settings becomes a collection of clear sections:

- Firm identity: firm name, tagline, phone, email, address.
- Navigation: add, remove, reorder, internal-route picker, external URL support, live link preview, duplicate and URL validation.
- Social links: platform picker, URL, add/remove/reorder, icon preview.
- Search appearance: default title, description, canonical URL, noindex toggle, and an image picker only when supported by the public renderer.
- Footer: editable footer statement and read-only explanation for service links and contact details.

The internal theme object is not exposed.

### Guided page sections

Page editing uses labelled sections rather than raw block types. Every section supports visibility, reorder, duplicate, remove, approved theme/layout options, section-specific fields, media pickers, record pickers, inline validation, and preview.

Supported sections and fields:

- Justice hero: eyebrow, title, description, CTA label/link, watch-video label/link, quote, values repeater, hero image.
- Standard hero: eyebrow, title, description, CTA label/link.
- Firm introduction: eyebrow, title, mobile title, description, bullet repeater, statement, selected professionals.
- Partner leadership: eyebrow, title, description, selected professionals, quote.
- Practice areas: eyebrow, title, description, all-or-selected practice areas.
- Professional team grid: eyebrow, title, selected professionals.
- Insights grid: eyebrow, title, selected insights, item limit.
- Media feature: eyebrow, title, description, featured insight/video.
- Team feature: eyebrow, title, description, selected professionals.
- Testimonials: eyebrow and title; records are edited in Content.
- Consultation: eyebrow, description, statement, image.
- Rich text: eyebrow, title, paragraph repeater.
- Image and text: image, alt text, eyebrow, title, paragraph repeater, CTA label/link.
- Quote: quote and attribution.
- FAQ: eyebrow, title, question/answer repeater.
- CTA: eyebrow, title, description, CTA label/link, show enquiry form toggle.
- Metrics: managed-content explanation; metric records are edited in Content.
- Spacer: Small, Medium, or Large.

Arbitrary content keys, CSS, JavaScript, fonts, absolute positioning, and raw block identifiers remain unavailable.

Page metadata uses title, description, generated page address, optional page-address editing, Draft/In review/Approved/Scheduled status, schedule time, search title, meta description, canonical URL, and noindex.

### Content

- Professionals: identity, biography, portrait, contact details, practice-area chips, credentials/memberships/education repeaters, featured/order/status.
- Practice areas: title, generated slug, summary, description, icon picker, services repeater, FAQ repeater, featured/order/status.
- Insights and video: article/video type, title, generated slug, excerpt, paragraph-based body, cover, author, practice-area chips, tag chips, video asset, duration, captions, SEO, review/schedule status.
- Testimonials: headline, quote, source, rating, featured/order/status.
- Trust metrics: value, label, approved icon, verification note/date, order/status.

### Enquiry form builder

The first version supports only the existing public lead contract:

- Full name, email, phone, area of interest, message, consent, and a permanently hidden honeypot.

Lawyers may edit visible labels, help text, placeholders, order, and contract-safe visibility/required state. Name, phone, message, and consent remain required. Email and area of interest remain optional. The honeypot is never shown.

Routing is shown as a truthful Website Lead Pipeline destination card. Unsupported destinations are not exposed.

The public form DTO carries safe field configuration and the public `LeadForm` renders the configured labels/order while submitting the existing validated lead payload.

### Live preview

The existing private preview token is reused. The management UI fetches the preview snapshot, overlays unsaved structured changes, and sends the merged snapshot through the existing origin-checked `postMessage` channel. Updates are debounced, private media continues to use the preview token, and the iframe remains noindex/no-store. Saved-draft preview remains the fallback.

### Permissions and publishing

- Editors save Draft and In review.
- Reviewers approve and schedule.
- Publishing remains an explicit Publishing-tab action.
- Disabled actions explain missing permissions or prerequisites.
- Optimistic save conflicts remain explicit and recoverable.
- Failed releases are visible while the current published release remains intact.

## API and compatibility work

- Add typed form-field schemas and legacy normalization.
- Include safe form configuration in public snapshots.
- Validate section content through the approved section registry.
- Preserve existing endpoint paths, firm scoping, media ownership checks, review permissions, version checks, and audit events.
- Do not add a database migration for this slice.

## Acceptance plan

Unit and API coverage will cover settings round trips, navigation/social/SEO validation, legacy form normalization, required-field protections, public form snapshots, section serialization, design-property rejection, firm-scoped references, permissions, and version conflicts.

Authenticated browser acceptance will verify every Website & Growth tab, absence of visible JSON controls, structured settings/content/form editing, persistence after reload, unsaved live preview updates, preview media/noindex/token behavior, permissions, conflicts, Escape/focus behavior, and all target viewport widths. Existing public menu, browser, renderer, publishing, recovery, and API integration checks will be rerun.

Local verification uses the isolated public environment only. No staging, provider delivery, or production result is implied.

## Verified in this slice

- `pnpm typecheck`
- `pnpm --filter @kka/web typecheck:tests`
- `pnpm --filter @kka/api test` (foundation and website schema coverage)
- `pnpm --filter @kka/public-site build`
- `pnpm --filter @kka/public-site build:ssr`
- `pnpm --filter @kka/web test test/website-growth.spec.ts` (authenticated cases are opt-in with `RUN_WEBSITE_GROWTH_ACCEPTANCE=1`)

The remaining acceptance work is authenticated UI/browser verification against the isolated local environment, including persistence, permission-restricted actions, live preview media, conflict handling, focus restoration, and the full viewport matrix.
