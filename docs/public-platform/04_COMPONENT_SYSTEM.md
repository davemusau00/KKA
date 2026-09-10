# Shared public component system

## Foundations
`@kka/site-tokens`: color, spacing, type, radius, shadow, motion, grid.

## Primitives
Container, Section, Heading, Eyebrow, Button/ActionLink, Surface, SiteImage, Field, IconButton, Divider, Quote.

## Compositions
SiteHeader, MobileMenu, PartnerCard, PracticeAreaCard, Metric, PublicationCard, VideoCard, TestimonialCard, ConsultationForm, SiteFooter.

## Sections
HeroJustice, FirmIntro, PartnerLeadership, TrustMetrics, PracticeAreas, MediaInsights, TeamPreview, Testimonials, ConsultationCTA.

## Pages
Home, About, Practice Areas Index, Practice Area Detail, Team, Partner Profile, Insights, Publication Detail, Contact.

## Component requirements
Every component documents purpose, anatomy, variants, states, responsive behavior, accessibility, content limits and failure behavior. Cards must tolerate long headings, missing images and translated/edited content without collapsing.

## CMS relationship
CMS controls data and approved variants. CMS does not allow arbitrary CSS, JS, fonts, colors or absolute positioning.
