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
  leadNumber: string;
  disposition: IntakeDisposition;
  practiceArea: string;
  incidentDate?: string | null;
  incidentLocation?: string | null;
  incidentSummary?: string | null;
  assignedToId?: string | null;
  conflictScore?: number | null;
  conflictNotes?: string | null;
  kycChecklist?: Record<string, boolean>;
  parties: IntakeParty[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateIntakeLeadDto {
  practiceArea: string;
  incidentDate?: string;
  incidentLocation?: string;
  incidentSummary?: string;
  assignedToId?: string;
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
  supervisingPartnerId: string;
  originatingBranchId: string;
  courtClerkId?: string;
  initialAction?: string;
}

export const intakeApi = {
  /** List intake leads by disposition */
  list: (params?: {
    disposition?: IntakeDisposition;
    assignedToId?: string;
    page?: number;
    limit?: number;
  }) => apiClient.get<{ data: BackendIntakeLead[]; total: number }>('/intake', { params }),

  /** Get full lead detail */
  get: (id: string) => apiClient.get<BackendIntakeLead>(`/intake/${id}`),

  /** Create a new intake lead */
  create: (dto: CreateIntakeLeadDto) =>
    apiClient.post<BackendIntakeLead>('/intake', dto),

  /** Update lead metadata */
  update: (id: string, dto: Partial<CreateIntakeLeadDto>) =>
    apiClient.patch<BackendIntakeLead>(`/intake/${id}`, dto),

  /** Add an associated party to a lead */
  addParty: (id: string, dto: CreateIntakePartyDto) =>
    apiClient.post<IntakeParty>(`/intake/${id}/parties`, dto),

  /** Run automated conflict search */
  runConflictSearch: (id: string) =>
    apiClient.post<ConflictSearchResult>(`/intake/${id}/conflict-search`),

  /** Record partner conflict clearance decision */
  clearConflict: (
    id: string,
    cleared: boolean,
    notes: string,
    elevationToken?: string,
  ) =>
    apiClient.post<BackendIntakeLead>(
      `/intake/${id}/conflict-clearance`,
      { cleared, notes },
      { elevationToken },
    ),

  /** Update KYC checklist items */
  updateKyc: (
    id: string,
    checklist: Record<string, boolean>,
    retainerSigned: boolean,
  ) =>
    apiClient.post<BackendIntakeLead>(`/intake/${id}/kyc`, {
      checklist,
      retainerSigned,
    }),

  /** Convert a cleared lead into a live Matter */
  convertToMatter: (id: string, dto: ConvertToMatterDto) =>
    apiClient.post<{ matterId: string; matterNumber: string }>(
      `/intake/${id}/convert`,
      dto,
    ),
};
