# Responsive and interaction specification

## Validation widths
360, 390, 430, 640, 768, 1024, 1280, 1440 and 1920px.

## Fluidity
Use `clamp()` for typography/spacing, Grid/Flex for layout and container queries for cards. Reduce ornament before reducing identity. Important imagery should not simply disappear at mobile sizes.

## Hero
Desktop: copy + sculpture + editorial quote. Tablet: reduced sculpture and simplified ornament. Mobile: hero remains cinematic; statue/art occupies upper visual area, copy/actions stack, values row can collapse.

## Services
5 → 3 → 2 → 1 columns. On phone, cards become compact horizontal rows.

## Motion
- fast 140ms
- standard 220ms
- slow 420ms
- hero 700ms
- easing `cubic-bezier(.22,.61,.36,1)`

Use motion for reveal, directional arrows, shallow depth and structural transitions. Never use scroll hijacking, perpetual floating, particle effects or noisy spring physics.

Honor `prefers-reduced-motion`.
