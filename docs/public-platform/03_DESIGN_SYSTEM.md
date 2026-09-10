# Public design system

## Separation rule
`apps/site` imports only public design packages. Internal OS components, global CSS and themes are prohibited dependencies.

## Color
- Navy 950 `#061623`
- Navy 900 `#0A2031`
- Gold 500 `#CDA05C`
- Gold 400 `#DCB875`
- Ivory 50 `#FBF8F2`
- Ivory 100 `#F4EFE6`
- Ink 900 `#141B25`
- Ink 600 `#5A626E`

Recommended distribution: 55% ivory/white, 30% navy, 10% imagery/sculpture, 5% gold.

## Typography
Display: Cormorant Garamond. Body/UI: Manrope. Use `clamp()` for display scale. Editorial line breaks may be content metadata for hero-level headings.

## Layout
12-column desktop, 8-column tablet, 4-column mobile thinking, implemented with CSS Grid and content-aware breakpoints rather than rigid bootstrap widths. Main max width 1440px; article reading width ~760px.

## Radius/shadows
Moderate radii, fine borders, broad low-opacity shadows. No bubbly SaaS cards, no neon glows.

## Legal imagery
Treat Lady Justice/scales as an asset family: hero sculpture, outline watermark, gold illustration, editorial crop. Avoid repeating the same statue in every section.
