import { apiClient } from './client';

export type IntakeDisposition =
  | 'NEW'
  | 'IN_REVIEW'
  | 'CONFLICT_CHECK_PENDING'
  | 'CONFLICT_CLEARED'
  | 'KYC_PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type PartyRole =
  | 'CLAIMANT'
  | 'DEFENDANT'
  | 'INSURER'
  | 'WITNESS'
  | 'NEXT_OF_KIN'
  | 'OTHER';

export interface IntakeParty {
  id: string;
  role: PartyRole;
  name: string;
  phone?: string | null;
  email?: string | null;
  idNumber?: string | null;
  insurerName?: string | null;
  policyNumber?: string | null;
  vehicleReg?: string | null;
  notes?: string | null;
}

export interface BackendIntakeLead {
  id: string;
  firmId: string;
  intakeNumber: string;
  disposition: IntakeDisposition;
  practiceArea: string;
  incidentDate?: string | null;
  incidentLocation?: string | null;
  briefDescription?: string | null;
  assignedToId?: string | null;
  nationalId?: string | null;
  matterType?: string | null;
  convertedMatterId?: string | null;
  parties: IntakeParty[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntakeLeadDto {
  clientName: string; phone: string; email?: string; practiceArea: string;
  incidentDate?: string; incidentLocation?: string; briefDescription: string; source?: string; assignedOwnerId?: string;
}

export interface CreateIntakePartyDto {
  role: PartyRole;
  name: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  insurerName?: string;
  policyNumber?: string;
  vehicleReg?: string;
  notes?: string;
}

export interface ConflictSearchResult {
  hasConflict: boolean;
  conflictScore: number;
  matches: {
    matterId: string;
    matterNumber: string;
    title: string;
    matchedOn: string;
    similarity: number;
  }[];
}

export interface ConvertToMatterDto {
  supervisingUserId: string;
  originatingBranchId: string;
  responsibleBranchId: string;
  legalEntityId?: string;
  workflowVersionId?: string;
  stageOwnerId?: string;
  courtClerkId?: string;
  financeContactId?: string;
  initialAction?: string;
}

function normalizeIntake(raw: any): BackendIntakeLead {
  const latestConflict = raw.conflictChecks?.[0];
  const latestKyc = raw.kycRecords?.[0];
  return {
    ...raw,
    intakeNumber: raw.intakeNumber ?? raw.leadNumber,
    briefDescription: raw.briefDescription ?? raw.incidentSummary ?? '',
    parties: (raw.parties ?? []).map((party: any) => ({
      ...party,
      idNumber: party.idNumber ?? party.idOrRegNumber ?? null,
      insurerName: party.insurerName ?? party.insuranceCompany ?? null,
      policyNumber: party.policyNumber ?? party.policyOrClaimNumber ?? null,
    })),
    conflictCheck: latestConflict,
    kycRecord: latestKyc,
  };
}

export const intakeApi = {
  /** List intake leads by disposition */
  list: (params?: {
    disposition?: IntakeDisposition;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<any>('/intake', { params }).then((rows) => {
    const data = (Array.isArray(rows) ? rows : rows.data ?? []).map(normalizeIntake);
    return { data, total: rows.total ?? data.length };
  }),

  /** Get full lead detail */
  get: (id: string) => apiClient.get<any>(`/intake/${id}`).then(normalizeIntake),

  /** Create a new intake lead */
  create: (dto: CreateIntakeLeadDto) =>
    apiClient.post<any>('/intake', dto).then(normalizeIntake),

  /** Update lead metadata */
  update: (id: string, dto: Partial<CreateIntakeLeadDto>) =>
    apiClient.patch<any>(`/intake/${id}`, dto).then(normalizeIntake),

  /** Add an associated party to a lead */
  addParty: (id: string, dto: CreateIntakePartyDto) =>
    apiClient.post<IntakeParty>(`/intake/${id}/parties`, dto),

  /** Run automated conflict search */
  runConflictSearch: (id: string) =>
    apiClient.post<any>(`/intake/${id}/conflict-search`).then((check) => ({
      hasConflict: check.status !== 'CLEAR',
      conflictScore: check.status === 'CLEAR' ? 0 : 1,
      matches: (check.matchesFound ?? []).map((match: any) => ({
        matterId: match.matterId ?? match.matchedEntityId ?? '',
        matterNumber: match.matterRef ?? '',
        title: match.display ?? match.partyName ?? '',
        matchedOn: match.matchType ?? 'unknown',
        similarity: match.severity === 'HIGH' ? 1 : 0.5,
      })),
    })),

  /** Record partner conflict clearance decision */
  clearConflict: (
    id: string,
    cleared: boolean,
    notes: string,
    elevationToken?: string,
  ) =>
    apiClient.post<BackendIntakeLead>(
      `/intake/${id}/conflict-clearance`,
      { notes: cleared ? notes : `Clearance refused: ${notes}` },
      { elevationToken },
    ),

  /** Update KYC checklist items */
  updateKyc: (
    id: string,
    checklist: Record<string, boolean>,
    retainerSigned: boolean,
  ) =>
    apiClient.post<any>(`/intake/${id}/kyc`, {
      idDocumentType: checklist.idDocumentType ? 'NATIONAL_ID' : 'UNKNOWN',
      idNumber: checklist.idNumber ? String(checklist.idNumber) : 'PENDING',
      idVerified: Boolean(checklist.idVerified),
      warrantToActSigned: Boolean(checklist.warrantToActSigned),
      retainerAgreementSigned: retainerSigned || Boolean(checklist.retainerAgreementSigned),
      termsAccepted: Boolean(checklist.termsAccepted),
      partnerApproval: checklist.partnerApproval ? 'APPROVED' : 'PENDING',
    }),

  /** Convert a cleared lead into a live Matter */
  convertToMatter: (id: string, dto: ConvertToMatterDto) =>
    apiClient.post<any>(
      `/intake/${id}/convert`,
      dto,
    ).then((matter) => ({
      matterId: matter.id ?? matter.matterId,
      matterNumber: matter.internalReference ?? matter.matterNumber,
    })),
};
