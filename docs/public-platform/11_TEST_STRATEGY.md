# Test strategy

## Front-end
Unit tests for primitives and form validation, interaction tests for menu/carousel/forms, visual regression at 360/390/768/1024/1440/1920, accessibility checks and route-level smoke tests.

## API
Public DTO denial tests, rate-limit tests, lead dedupe tests, lifecycle tests, admin permission tests and lead→intake integration tests.

## Publishing
Verify draft invisibility, scheduled activation, supersede behavior, rollback, sitemap generation and static-release switching.

## Failure tests
Missing image, long heading/name, API unavailable, duplicate lead, slow network, form timeout, failed publish job, stale CMS edit.
