# CMS and publishing

## Editing surface
The CMS lives inside the LawFirm OS and therefore uses the **internal OS UI system**. Public-site preview is an iframe pointing to `apps/site` so public CSS and OS CSS never collide.

## Structured blocks
HeroJustice, FirmIntroduction, PartnerLeadership, Metrics, PracticeAreas, MediaFeature, TeamFeature, Testimonials, Consultation, Quote, RichText, ImageFeature.

## Editors may control
Copy, links, media, SEO, publish state, selected variant, section visibility, approved theme/alignment options.

## Editors may not control
Arbitrary fonts/colors/pixels, custom JavaScript, custom CSS or free-form absolute positioning.

## Lifecycle
Draft → Review → Approved/Scheduled → Published → Superseded → Archived.

Publishing creates an immutable page version and should enqueue site rendering, sitemap/RSS regeneration and cache invalidation. Rollback creates a new published version rather than deleting history.
