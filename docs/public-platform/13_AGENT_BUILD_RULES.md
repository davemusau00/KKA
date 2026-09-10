# Agentic coding rules

1. Never import internal OS UI components into `apps/site`.
2. Never expose Prisma entities directly from public controllers; map to public DTOs.
3. Never create Client/Matter directly from a public lead.
4. Preserve existing IntakeService numbering/conflict/KYC semantics.
5. Use CMS records for content; avoid realistic hard-coded business values outside fixtures.
6. Every mutation must have validation and explicit success/error states.
7. Every page must work at 360/390/768/1024/1440.
8. Maintain reduced-motion and keyboard accessibility.
9. No source-code changes should be required for ordinary page/media/team/practice-area publishing.
10. A rendered screen is not workflow completion. Add tests that prove persistence and authorization.
