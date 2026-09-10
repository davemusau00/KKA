# Leads and LawFirm OS handoff

## Boundary
A website enquiry creates a `PublicLead`, not a Client or Matter.

## Stages
NEW → REVIEWING → CONTACTED → CONSULTATION_BOOKED → CONSULTED → QUALIFIED → INTAKE_STARTED → CONVERTED.
Terminal: DECLINED, DUPLICATE, NO_RESPONSE, CONFLICT, OUT_OF_SCOPE.

## Captured data
Identity/contact, practice interest, message, urgency, preferred channel, source, landing page, UTM/attribution, consent, assignment and activity timeline.

## Conversion
`PublicLeadsService.startIntake()` must call the **existing KKA `IntakeService.create()`** so existing numbering and audit behavior remain authoritative. From there the existing OS handles conflict search, KYC/authority/retainer, partner approval and conversion into Client/Matter.

Never bypass conflict/KYC gates from the public site.
