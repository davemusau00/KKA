import {
  IncidentEvidenceData,
  MedicalCaseData,
  LiabilityQuantumData,
  ClaimNegotiationData,
  PleadingsBundleData,
  CourtFilingPackage,
  ServiceQueueItem,
  PreTrialComplianceData,
  HearingBriefData,
  JudgmentAwardData,
  RecoveryExecutionData,
  SettlementDistributionData,
  MatterClosureAuditData,
} from '../types';

export const SEED_INCIDENT_EVIDENCE: Record<string, IncidentEvidenceData> = {
  'mat-001': {
    incident: {
      date: '2025-11-14',
      time: '07:45 AM',
      location: 'Thika Superhighway near Roysambu Stage, Kasarani Area, Nairobi',
      description:
        'Motor vehicle registration KDD 842X (Nissan Matatu) rammed into pedestrian John Kamau who was lawfully utilizing the pedestrian crossing. Driver was speeding and overlapping on the left service lane.',
      obNumber: 'OB 44/14/11/2025',
      policeStation: 'Kasarani Traffic Police Station',
      investigatingOfficer: 'IP George Omwenga (No. 238914)',
      officerPhone: '+254 722 554 433',
      roadConditions: 'Tarmac, dry, clear morning visibility, marked zebra crossing',
    },
    vehicles: [
      {
        id: 'veh-1',
        registrationNumber: 'KDD 842X',
        makeModel: 'Nissan Matatu (14-Seater)',
        ownerName: 'Swift Shuttle SACCO Limited',
        driverName: 'Erick Otieno Odhiambo',
        driverLicenseNo: 'DL-7849102-K',
        insuranceCompany: 'Directline Assurance Co. Ltd',
        policyNumber: 'DL/PSV/2025/0091823',
        ntsaSearchObtained: true,
        ntsaSearchRef: 'NTSA/MV/2025/94821',
        notes: 'NTSA records confirm Swift Shuttle SACCO as registered owner as of date of accident.',
      },
      {
        id: 'veh-2',
        registrationNumber: 'KCG 112M',
        makeModel: 'Toyota Probox (Third party witness vehicle)',
        ownerName: 'Peter Maina Gicheru',
        driverName: 'Peter Maina Gicheru',
        insuranceCompany: 'APA Insurance Ltd',
        policyNumber: 'APA/COMP/2025/4412',
        ntsaSearchObtained: true,
        ntsaSearchRef: 'NTSA/MV/2025/11029',
        notes: 'Witness vehicle driving behind matatu; dashcam footage obtained.',
      },
    ],
    witnesses: [
      {
        id: 'wit-1',
        name: 'Peter Maina Gicheru',
        contact: '+254 721 889 900',
        statementRequested: true,
        statementReceived: true,
        statementDate: '2025-11-20',
        keyObservations:
          'Witness confirms Matatu KDD 842X was recklessly overlapping on the pedestrian walkway when it struck the claimant.',
      },
      {
        id: 'wit-2',
        name: 'Constable Mary Nduta',
        contact: '+254 733 441 122',
        statementRequested: true,
        statementReceived: true,
        statementDate: '2025-11-22',
        keyObservations: 'First police officer on the scene; drew sketch map and impounded vehicle KDD 842X.',
      },
    ],
    exhibits: [
      {
        id: 'ex-1',
        title: 'Certified Police Abstract Kasarani Station',
        category: 'Police Abstract',
        dateObtained: '2025-11-18',
        obtainedBy: 'John Mwangi (Court Clerk)',
        notes: 'Blames driver of KDD 842X for careless and reckless driving.',
      },
      {
        id: 'ex-2',
        title: 'Scene Photographs & Skid Marks',
        category: 'Scene Photos',
        dateObtained: '2025-11-14',
        obtainedBy: 'Brian Ochieng (Paralegal)',
        notes: '12 high-resolution photos showing point of impact and pedestrian walkway.',
      },
      {
        id: 'ex-3',
        title: 'Vehicle Damage Photos at Kasarani Police Yard',
        category: 'Vehicle Photos',
        dateObtained: '2025-11-16',
        obtainedBy: 'John Mwangi',
        notes: 'Front bumper damage and shattered left windscreen.',
      },
    ],
  },
};

export const SEED_MEDICAL_CASES: Record<string, MedicalCaseData> = {
  'mat-001': {
    injuries: [
      {
        id: 'inj-1',
        description: 'Compound fracture of right distal tibia and fibula with bone fragmentation',
        severity: 'severe',
        bodyPart: 'Right Lower Limb',
        permanentEffects: 'Limb shortening of 1.5 cm, chronic pain, restricted dorsiflexion, altered gait',
      },
      {
        id: 'inj-2',
        description: 'Severe soft tissue blunt trauma to lumbar spine with disc protrusion at L4-L5',
        severity: 'moderate',
        bodyPart: 'Lumbar Spine',
        permanentEffects: 'Chronic low back pain aggravated by prolonged standing or bending',
      },
      {
        id: 'inj-3',
        description: 'Multiple deep lacerations over right forearm and forehead requiring surgical suturing',
        severity: 'moderate',
        bodyPart: 'Forehead & Right Arm',
        permanentEffects: 'Prominent keloid scars over right forearm and right temporal hairline',
      },
    ],
    medicalProviders: [
      {
        id: 'med-p1',
        facilityName: 'Kenyatta National Hospital',
        doctorName: 'Dr. Joseph K. Ndegwa (Orthopaedic Surgeon)',
        specialty: 'Orthopaedic & Trauma Surgery',
        contact: '+254 20 272 6300',
      },
      {
        id: 'med-p2',
        facilityName: 'Upper Hill Medical Chambers',
        doctorName: 'Dr. Ramesh Patel, FRCS',
        specialty: 'Consultant Orthopaedic Surgeon & Independent Medicolegal Examiner',
        contact: '+254 722 700 800',
      },
    ],
    treatmentEpisodes: [
      {
        id: 'ep-1',
        facilityName: 'Kenyatta National Hospital (Accident & Emergency)',
        admissionDate: '2025-11-14',
        dischargeDate: '2025-11-28',
        treatmentSummary:
          'Emergency open reduction and internal fixation (ORIF) with titanium interlocking nail. Wound debridement and 14 days IV antibiotics.',
        costAmount: 184500,
        receiptNumber: 'KNH/REC/2025/99812',
      },
      {
        id: 'ep-2',
        facilityName: 'Nairobi Spine & Orthopaedic Clinic',
        admissionDate: '2025-12-05',
        dischargeDate: '2026-01-30',
        treatmentSummary: '16 sessions of active physiotherapy, gait re-education and lumbar stabilization.',
        costAmount: 64000,
        receiptNumber: 'NSOC/PHY/2026/012',
      },
    ],
    p3Form: {
      issuedByDoctor: 'Dr. M. Wachira (Police Surgeon / Kasarani Sub-County)',
      policeStationRef: 'KAS/P3/2025/1102',
      dateExamined: '2025-11-25',
      degreeOfHarm: 'Grievous Harm',
      status: 'certified',
    },
    imagingAndRecords: [
      {
        id: 'img-1',
        title: 'Plain X-Ray Right Leg (AP & Lateral)',
        facility: 'Plaza Imaging Centre',
        reportDate: '2025-11-14',
        findings: 'Comminuted fracture right tibia-fibula mid-shaft with significant displacement.',
      },
      {
        id: 'img-2',
        title: 'MRI Lumbar Spine',
        facility: 'Nairobi Hospital Radiology',
        reportDate: '2025-12-10',
        findings: 'Posterolateral disc herniation at L4-L5 with mild nerve root compression.',
      },
    ],
    medicalReportRequests: [
      {
        id: 'mrr-1',
        doctorName: 'Dr. Ramesh Patel',
        specialty: 'Consultant Orthopaedic Surgeon',
        facility: 'Upper Hill Medical Chambers',
        requestedAt: '2026-01-10',
        feeAmount: 25000,
        status: 'reviewed',
        appointmentDate: '2026-01-20',
        permanentDisabilityPercent: 25,
        futureTreatmentEstimate: 350000,
        futureTreatmentNotes: 'Hardware removal surgery for tibial nail + arthroscopic ankle debridement in 18 months.',
        notes: 'Final medico-legal report signed, stamped and bundled for trial.',
      },
    ],
    permanentDisabilityOverallPercent: 25,
    futureTreatmentEstimateTotal: 350000,
    totalMedicalExpensesIncurred: 273500,
  },
};

export const SEED_LIABILITY_QUANTUM: Record<string, LiabilityQuantumData> = {
  'mat-001': {
    liability: {
      claimantPercent: 100,
      defendantPercent: 0,
      contributoryNegligenceAlleged: true,
      contributoryNotes:
        'Insurer alleged claimant did not look both ways; however, police abstract and eyewitness confirm claimant was on marked pedestrian zebra crossing.',
      supportingEvidence: [
        'Kasarani Traffic Police Abstract OB 44/14/11/2025 explicitly blaming driver of KDD 842X',
        'Signed eyewitness statement of Peter Maina Gicheru confirming vehicle was overlapping',
        'Dashcam recording corroborating pedestrian signal',
      ],
      weaknesses: [
        'Minor dispute on whether visibility was partly obstructed by stationary bus at the bus stop',
      ],
      advocateOpinion:
        'Strong prima facie case on 100% liability against defendant driver and SACCO under doctrine of vicarious liability. Res ipsa loquitur applies.',
    },
    damages: {
      generalDamages: 2500000,
      generalDamagesJustification:
        'Comparable precedent: Joyce Mutheu v. Directline Assurance (HCCC 241/2023) awarded KES 2,800,000 for 25% permanent disability tibial fracture with limb shortening.',
      specialDamages: [
        { id: 'sd-1', head: 'KNH Hospital Inpatient Bill', amount: 184500, receiptRef: 'KNH/REC/2025/99812', isEvidenced: true },
        { id: 'sd-2', head: 'Physiotherapy & Rehabilitation', amount: 64000, receiptRef: 'NSOC/PHY/2026/012', isEvidenced: true },
        { id: 'sd-3', head: 'Dr. Ramesh Patel Medicolegal Examination Fee', amount: 25000, receiptRef: 'UPH/REC/092', isEvidenced: true },
        { id: 'sd-4', head: 'Police Abstract & Investigation Fee', amount: 2500, receiptRef: 'POL/KAS/441', isEvidenced: true },
        { id: 'sd-5', head: 'Emergency Ambulance & Transport', amount: 12000, receiptRef: 'AMB/2025/110', isEvidenced: true },
        { id: 'sd-6', head: 'Damaged Mobile Phone & Clothing', amount: 35000, receiptRef: 'REC/PHONE/2025', isEvidenced: true },
      ],
      futureMedicalExpenses: 350000,
      futureMedicalJustification: 'Hardware removal and arthroscopic ankle debridement as quantified by Dr. Ramesh Patel.',
      lossOfEarnings: 300000,
      lossOfEarningsMonths: 6,
      monthlyEarningsBasis: 50000,
      lossOfEarningCapacity: 1200000,
      otherHeads: [
        { id: 'oh-1', title: 'Pain, Suffering & Loss of Amenities', amount: 450000, notes: 'Severe physical trauma and ongoing mobility limitation' },
      ],
      totalEstimatedClaimValue: 5123000,
    },
  },
};

export const SEED_CLAIM_NEGOTIATION: Record<string, ClaimNegotiationData> = {
  'mat-001': {
    insurer: {
      name: 'Directline Assurance Company Limited',
      policyNumber: 'DL/PSV/2025/0091823',
      claimReference: 'DIR/CL/2025/KDD842X',
      contactPerson: 'Dennis Kiprop (Senior Claims Officer)',
      contactPhone: '+254 20 334 0000 / +254 722 000 111',
      contactEmail: 'dennis.kiprop@directline.co.ke',
      demandSentDate: '2026-01-25',
      noticeSentDate: '2025-11-20',
      deliveryProofRef: 'EMS-COURIER-NRB-77491',
      responseDeadline: '2026-02-15',
      responseReceivedDate: '2026-02-10',
      status: 'negotiating',
    },
    negotiationLedger: [
      {
        id: 'neg-1',
        date: '2026-01-25',
        party: 'firm',
        counterOfferAmount: 4800000,
        status: 'sent',
        notes: 'Statutory demand letter enclosing certified police abstract, P3 and Dr. Patel report demanding KES 4.8M.',
      },
      {
        id: 'neg-2',
        date: '2026-02-10',
        party: 'insurer',
        offerAmount: 1850000,
        status: 'received',
        notes: 'Insurer initial without prejudice offer of KES 1,850,000 all-inclusive.',
      },
      {
        id: 'neg-3',
        date: '2026-02-18',
        party: 'firm',
        counterOfferAmount: 3600000,
        status: 'countered',
        notes: 'Firm rejected KES 1.85M as grossly undervalue; counter-demanded KES 3.6M with authority of client.',
      },
      {
        id: 'neg-4',
        date: '2026-03-01',
        party: 'insurer',
        offerAmount: 2650000,
        status: 'considering',
        notes: 'Insurer revised offer to KES 2,650,000 + disbursements KES 150,000. Under client review.',
      },
    ],
    settlementApproval: {
      recommendedAmount: 3200000,
      clientAuthorized: false,
      partnerApproved: false,
      dischargeVoucherSigned: false,
    },
  },
};

export const SEED_PLEADINGS_BUNDLES: Record<string, PleadingsBundleData> = {
  'mat-001': {
    id: 'pb-001',
    matterId: 'mat-001',
    plaintStatus: 'approved',
    verifyingAffidavitStatus: 'signed',
    witnessStatements: [
      { id: 'ws-1', witnessName: 'John Kamau (Plaintiff)', status: 'approved' },
      { id: 'ws-2', witnessName: 'Peter Maina Gicheru (Eyewitness)', status: 'approved' },
      { id: 'ws-3', witnessName: 'Dr. Ramesh Patel (Expert Doctor)', status: 'approved' },
    ],
    listOfWitnesses: true,
    listOfDocuments: true,
    supportingDocumentsAttached: true,
    bundleReviewStatus: 'ready_for_filing',
    reviewedByAdvocateId: 'usr-adv-1',
    approvedByPartnerId: 'usr-partner',
    clientSignedAt: '2026-02-28T14:30:00Z',
    readyForFilingPackage: true,
  },
};

export const SEED_COURT_FILING_PACKAGES: CourtFilingPackage[] = [
  {
    id: 'cfp-001',
    matterId: 'mat-001',
    matterRef: 'KKC/PI/2026/00427',
    courtStation: "Milimani Chief Magistrate's Commercial & Accident Court",
    division: 'Civil & Accident Division',
    caseType: 'Civil Suit (Personal Injury Motor Accident)',
    plaintiff: 'John Kamau Mwangi',
    defendants: ['Erick Otieno Odhiambo (Driver)', 'Swift Shuttle SACCO Limited (Owner)'],
    documents: [
      { title: 'Plaint', type: 'Pleading', isReady: true, isStamped: false },
      { title: 'Verifying Affidavit of John Kamau', type: 'Affidavit', isReady: true, isStamped: false },
      { title: 'Witness Statements (3 Bundled)', type: 'Evidence', isReady: true, isStamped: false },
      { title: 'List & Bundle of Documents (Police Abstract, Medical Reports, Receipts)', type: 'Bundle', isReady: true, isStamped: false },
      { title: 'Summons to Enter Appearance (For Issuance)', type: 'Summons', isReady: true, isStamped: false },
    ],
    courtAssessmentKes: 14750,
    feeRequisitionApproved: true,
    receiptUploaded: true,
    receiptNumber: 'CTS-REV-2026-88194',
    ctsReference: 'CTS/MIL/2026/49102',
    courtCaseNumber: 'MCCC E427/2026',
    stampedDocsUploaded: true,
    assignedClerkId: 'usr-clerk',
    status: 'stamped_filed',
    submittedAt: '2026-03-01T09:15:00Z',
    filedAt: '2026-03-01T11:40:00Z',
  },
  {
    id: 'cfp-002',
    matterId: 'mat-002',
    matterRef: 'KKC/PI/2026/00412',
    courtStation: 'Mombasa High Court Civil Division',
    division: 'Commercial & Admiralty',
    caseType: 'Commercial Contract & Specific Performance',
    plaintiff: 'East African Port Logistics Ltd',
    defendants: ['Horizon Shipping Lines Kenya Ltd'],
    documents: [
      { title: 'Plaint & Notice of Motion for Injunction', type: 'Pleading', isReady: true, isStamped: false },
      { title: 'Supporting Affidavit of Managing Director', type: 'Affidavit', isReady: true, isStamped: false },
      { title: 'List of Documents (Bill of Lading, Contract, Invoices)', type: 'Bundle', isReady: true, isStamped: false },
    ],
    courtAssessmentKes: 32500,
    feeRequisitionApproved: true,
    receiptUploaded: false,
    stampedDocsUploaded: false,
    assignedClerkId: 'usr-clerk',
    status: 'ready_to_file',
  },
];

export const SEED_SERVICE_QUEUE: ServiceQueueItem[] = [
  {
    id: 'sq-001',
    matterId: 'mat-001',
    matterRef: 'KKC/PI/2026/00427',
    documentTitle: 'Summons to Enter Appearance & Plaint (MCCC E427/2026)',
    partyToServe: 'Swift Shuttle SACCO Limited & Directline Assurance',
    partyAddress: 'Directline Towers, Harambee Avenue, Nairobi',
    processServerName: 'Harrison Mutiso (Licensed Process Server No. PS/291)',
    assignedDate: '2026-03-02',
    dueDate: '2026-03-12',
    attempts: [
      { attemptNo: 1, date: '2026-03-03', outcome: 'Served Company Secretary', notes: 'Received and stamped by Legal Dept, Directline Assurance.' },
    ],
    serviceDate: '2026-03-03',
    serviceMethod: 'Personal Service',
    affidavitOfServiceStatus: 'filed',
    status: 'filed',
  },
  {
    id: 'sq-002',
    matterId: 'mat-001',
    matterRef: 'KKC/PI/2026/00427',
    documentTitle: 'Summons to Enter Appearance (1st Defendant Driver)',
    partyToServe: 'Erick Otieno Odhiambo',
    partyAddress: 'Kasarani Stage / c/o Swift Shuttle SACCO Kasarani Office',
    processServerName: 'Harrison Mutiso',
    assignedDate: '2026-03-02',
    dueDate: '2026-03-15',
    attempts: [
      { attemptNo: 1, date: '2026-03-04', outcome: 'Driver on transit', notes: 'Left copy with Stage Manager who signed receipt acknowledgment.' },
    ],
    serviceDate: '2026-03-04',
    serviceMethod: 'Personal Service',
    affidavitOfServiceStatus: 'received',
    status: 'affidavit_received',
  },
];

export const SEED_PRE_TRIAL_COMPLIANCE: Record<string, PreTrialComplianceData> = {
  'mat-001': {
    matterId: 'mat-001',
    listOfWitnesses: true,
    witnessStatements: true,
    listOfDocuments: true,
    documentBundle: true,
    agreedIssues: true,
    preTrialQuestionnaire: true,
    expertDocuments: true,
    courtDirections: 'Parties directed to file and serve agreed issues and indexed trial bundle within 21 days.',
    complianceDeadline: '2026-04-10',
    isCompliant: true,
  },
};

export const SEED_HEARING_BRIEFS: Record<string, HearingBriefData> = {
  'mat-001': {
    matterId: 'mat-001',
    courtName: "Milimani Chief Magistrate's Court 4, Room 12",
    hearingDate: '2026-04-24',
    assignedAdvocateId: 'usr-adv-1',
    witnesses: [
      { name: 'John Kamau (Plaintiff)', role: 'Claimant', status: 'confirmed' },
      { name: 'Dr. Ramesh Patel', role: 'Medical Expert', status: 'confirmed' },
      { name: 'IP George Omwenga', role: 'Investigating Officer', status: 'subpoenaed' },
      { name: 'Peter Maina Gicheru', role: 'Eyewitness', status: 'confirmed' },
    ],
    documents: [
      { name: 'Indexed & Paginated Trial Bundle (3 Copies)', isReady: true },
      { name: 'Original Police Abstract & Sketch Map', isReady: true },
      { name: 'Original KNH & Specialist Medical Receipts', isReady: true },
      { name: 'Dr. Patel Medico-Legal Report', isReady: true },
    ],
    issues: {
      liability: 'Whether the defendants were 100% liable for causing the accident through negligent driving on the pedestrian walkway.',
      quantum: 'Whether the claimant is entitled to KES 2.5M general damages, KES 1.2M loss of earning capacity and KES 350K future surgery.',
    },
    opposingCounsel: 'Kimani & Wachira Advocates (Instructed by Directline Assurance)',
    currentSettlementOffer: 'KES 2,650,000 (rejected)',
    advocateNotes:
      'Focus cross-examination on driver failure to observe zebra crossing. Tender dashcam video through PW2 Peter Maina. Call Dr. Patel on 25% permanent disability.',
    isReadyForHearing: true,
  },
};

export const SEED_JUDGMENT_AWARDS: Record<string, JudgmentAwardData> = {
  'mat-001': {
    matterId: 'mat-001',
    judgmentDate: '2026-05-18',
    liabilityClaimantPercent: 100,
    liabilityDefendantPercent: 0,
    generalDamages: 2400000,
    specialDamages: 322500,
    futureMedical: 350000,
    costsAwarded: 285000,
    interestRatePercent: 12,
    interestFromDate: '2026-03-01',
    totalAward: 3357500,
    paymentDeadline: '2026-06-18',
    appealDeadline: '2026-06-18',
    appealRecommended: false,
    appealJustification: 'Judgment is highly favorable and well supported by medical evidence.',
    recoveryTriggered: true,
  },
};

export const SEED_RECOVERY_EXECUTION: Record<string, RecoveryExecutionData> = {
  'mat-001': {
    matterId: 'mat-001',
    decreeExtracted: true,
    certificateOfCosts: true,
    billOfCosts: true,
    billAmount: 350000,
    taxationComplete: true,
    taxedAmount: 285000,
    insurerDemandSent: true,
    demandSentDate: '2026-05-25',
    paymentPromiseReceived: true,
    paymentPromiseNotes: 'Directline Assurance legal dept confirmed settlement cheque processing in 14 days.',
    executionWarrantsIssued: false,
    garnisheeProceedings: false,
    auctioneerInstructed: false,
    paymentReceived: true,
    paymentReceivedAmount: 3357500,
    status: 'fully_recovered',
  },
};

export const SEED_SETTLEMENT_DISTRIBUTIONS: Record<string, SettlementDistributionData> = {
  'mat-001': {
    matterId: 'mat-001',
    grossSettlementAmount: 3357500,
    fundsReceivedDate: '2026-06-08',
    account: 'NCBA Client Trust Account (A/C: 1009823491)',
    outstandingDisbursements: [
      { id: 'd-1', head: 'Court Filing & Assessment Fees', amount: 14750, voucherRef: 'VOUCH-091' },
      { id: 'd-2', head: 'Process Server Fees (Mutiso)', amount: 6500, voucherRef: 'VOUCH-104' },
      { id: 'd-3', head: 'Dr. Ramesh Patel Medicolegal Fee', amount: 25000, voucherRef: 'VOUCH-112' },
      { id: 'd-4', head: 'Photocopying & Trial Bundle Binding', amount: 4500, voucherRef: 'VOUCH-145' },
    ],
    totalDisbursements: 50750,
    professionalFees: 450000,
    vatOnFees: 72000,
    otherDeductions: [
      { id: 'od-1', title: 'Withholding Tax / Bank Transfer Fee', amount: 2500 },
    ],
    netClientAmount: 2782250,
    settlementStatementProduced: true,
    clientApprovalStatus: 'approved',
    clientApprovedAt: '2026-06-10T11:00:00Z',
    paymentMethod: 'Bank Wire',
    paymentReference: 'NCBA-EFT-99401284',
    disbursedAt: '2026-06-11T14:30:00Z',
  },
};

export const SEED_CLOSURE_AUDITS: Record<string, MatterClosureAuditData> = {
  'mat-001': {
    matterId: 'mat-001',
    isJudgmentSettlementComplete: true,
    isClientFundsReconciled: true,
    isOutstandingExpensesResolved: true,
    isFinalPaymentMade: true,
    isClientInformedAndDischarged: true,
    areAllDocumentsFiled: true,
    physicalFileLocation: 'Nairobi Archive Room - Bay 3, Shelf B, Box PI-2026-042',
    closingNote: 'Matter successfully litigated to full decree, recovery executed via Directline Assurance, client distributed KES 2,782,250, discharge voucher executed, client fully satisfied.',
    supervisorApproved: true,
    approvedByUserId: 'usr-partner',
    approvedAt: '2026-06-12T16:00:00Z',
    archivedAt: '2026-06-12T16:30:00Z',
  },
};
