import { apiClient } from './client';
import type { CalculatedLeaveRequest, CalculatedLeavePolicyInput, LeavePreview, LeavePreviewInput, LeavePosition } from '@contracts';

export type LeaveStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type PurchaseStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
export type AssetStatus = 'IN_STOCK' | 'ASSIGNED' | 'REPAIR' | 'RETIRED' | 'LOST';

export interface EmployeeProfileDto {
  id: string;
  userId: string;
  employeeNumber: string;
  employmentType: string;
  startDate: string;
  endDate?: string | null;
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'OFFBOARDED';
  probationEndsAt?: string | null;
  offboardedAt?: string | null;
  offboardingReason?: string | null;
  managerUserId?: string | null;
  leavePolicyKey?: string | null;
  cpdsRequiredAnnual?: string | number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HrLifecycleItemDto {
  id: string; userId: string; lifecycle: 'ONBOARDING' | 'OFFBOARDING'; key: string; title: string;
  dueAt?: string | null; status: 'PENDING' | 'COMPLETED'; completedAt?: string | null; completedById?: string | null; notes?: string | null;
}
export interface EmployeeAppraisalDto {
  id: string; userId: string; reviewerUserId: string; periodStartsAt: string; periodEndsAt: string;
  status: 'DRAFT' | 'FINALIZED' | 'ACKNOWLEDGED'; rating?: string | number | null; summary?: string | null; developmentPlan?: string | null;
}
export interface CpdRecordDto { id: string; userId: string; title: string; provider?: string | null; occurredOn: string; hours: string | number; notes?: string | null; }
export interface AdvocateCredentialDto { id: string; userId: string; admissionNumber: string; admissionDate?: string | null; practicingCertificateNo?: string | null; certificateExpiresAt?: string | null; status: string; notes?: string | null; }
export interface LeavePolicyDto { id: string; key: string; name: string; annualEntitlementDays: string | number; carryoverLimitDays?: string | number | null; active: boolean; }
export interface LeaveBalanceDto { id: string; userId: string; policyKey: string; year: number; openingDays: string | number; adjustmentDays: string | number; notes?: string | null; }
export interface HrRestrictedNoteDto { id: string; userId: string; category: string; body: string; visibleToUserIds: string[]; createdAt: string; }
export interface StaffDocumentDto { id: string; userId: string; category: string; title: string; storageState: 'MANUAL'; externalReference?: string | null; expiresAt?: string | null; notes?: string | null; createdAt: string; }
export interface EmployeeHrRecordsDto {
  profile: EmployeeProfileDto | null; lifecycle: HrLifecycleItemDto[]; appraisals: EmployeeAppraisalDto[]; cpd: CpdRecordDto[];
  credentials: AdvocateCredentialDto[]; balances: LeaveBalanceDto[]; notes: HrRestrictedNoteDto[]; documents: StaffDocumentDto[];
}
export interface AuditedMutation<T> { auditRef: string; item?: T; appraisal?: T; cpd?: T; credential?: T; policy?: T; balance?: T; note?: T; document?: T; profile?: T; }

export interface EmployeeRowDto {
  id: string;
  fullName: string;
  email: string;
  jobTitle?: string | null;
  status: string;
  homeBranchId?: string | null;
  employeeProfile?: EmployeeProfileDto | null;
}

export interface LeaveRequestDto {
  id: string;
  userId: string;
  policyKey?: string | null;
  revision: number;
  type: string;
  startsOn: string;
  endsOn: string;
  days: string | number;
  reason?: string | null;
  status: LeaveStatus;
  approverId?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: { id: string; fullName: string; email: string; jobTitle?: string | null };
  approver?: { id: string; fullName: string } | null;
}

export interface VendorDto {
  id: string;
  firmId: string;
  name: string;
  kraPin?: string | null;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  active: boolean;
  createdAt: string;
}

export interface PurchaseCategoryDto { id: string; firmId: string; key: string; name: string; approvalThreshold?: string | number | null; financeAccountCode?: string | null; active: boolean; }
export interface VendorDocumentDto { id: string; vendorId: string; category: string; title: string; externalReference?: string | null; expiresAt?: string | null; storageState: 'MANUAL'; }
export interface VendorQuoteDto { id: string; requisitionId: string; vendorId: string; reference: string; amount: string | number; currency: string; validUntil?: string | null; notes?: string | null; }
export interface AssetMaintenanceDto { id: string; assetId: string; vendorId?: string | null; type: string; description: string; cost?: string | number | null; status: string; externalReference?: string | null; notes?: string | null; }

export interface PurchaseRequisitionDto {
  id: string;
  firmId: string;
  branchId: string;
  vendorId?: string | null;
  requisitionNo: string;
  requestedById: string;
  description: string;
  amount: string | number;
  status: PurchaseStatus;
  approvedById?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  vendor?: VendorDto | null;
}

export interface PurchaseOrderDto {
  id: string;
  firmId: string;
  branchId: string;
  vendorId: string;
  orderNo: string;
  requisitionId?: string | null;
  description: string;
  amount: string | number;
  status: PurchaseStatus;
  orderedAt?: string | null;
  receivedAt?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  vendor?: VendorDto;
}

export interface PurchaseReceiptDto {
  id: string;
  purchaseOrderId: string;
  deliveryReference: string;
  receivedAt: string;
  partial: boolean;
  notes?: string | null;
  purchaseOrder: PurchaseOrderDto;
  asset?: AssetDto | null;
  expense?: { id: string; expenseNumber: string; status: string; amount: string | number } | null;
}

export interface AssetAssignmentDto {
  id: string;
  assetId: string;
  userId: string;
  assignedAt: string;
  returnedAt?: string | null;
  conditionOnIssue?: string | null;
  conditionOnReturn?: string | null;
  user?: { id: string; fullName: string; email: string; jobTitle?: string | null };
}

export interface AssetDto {
  id: string;
  firmId: string;
  branchId?: string | null;
  assetTag: string;
  category: string;
  name: string;
  serialNumber?: string | null;
  purchaseDate?: string | null;
  purchaseCost?: string | number | null;
  status: AssetStatus;
  warrantyEndsAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: AssetAssignmentDto[];
}

export interface ProjectMemberDto {
  projectId: string;
  userId: string;
  role?: string | null;
  user?: { id: string; fullName: string; email: string; jobTitle?: string | null };
}

export interface InternalProjectDto {
  id: string;
  firmId: string;
  branchId?: string | null;
  name: string;
  description?: string | null;
  status: string;
  ownerUserId: string;
  startDate?: string | null;
  dueDate?: string | null;
  budget?: string | number | null;
  createdAt: string;
  updatedAt: string;
  members?: ProjectMemberDto[];
  milestones?: Array<{ id: string; title: string; dueAt?: string | null; status: string; ownerUserId?: string | null }>;
  spend?: Array<{ id: string; description: string; amount: string | number; occurredAt: string; source: string; financeReference?: string | null }>;
}

export interface MeetingDto {
  id: string;
  firmId: string;
  projectId?: string | null;
  matterId?: string | null;
  title: string;
  startsAt: string;
  endsAt?: string | null;
  location?: string | null;
  agenda?: unknown;
  minutes?: unknown;
  status: string;
  organizerId: string;
  recurrenceRule?: string | null;
  recurrenceUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  participants?: Array<{
    meetingId: string;
    userId: string;
    attendanceStatus?: string | null;
    user?: { id: string; fullName: string; email: string; jobTitle?: string | null };
  }>;
  decisions?: Array<{ id: string; text: string; ownerUserId?: string | null; createdAt: string }>;
  actions?: Array<{ id: string; taskId?: string | null; text: string; assigneeId?: string | null; dueAt?: string | null; status: string; completedAt?: string | null; createdAt: string }>;
}

export const operationsApi = {
  employees: () => apiClient.get<EmployeeRowDto[]>('/operations/hr/employees'),
  upsertEmployee: (userId: string, input: {
    employeeNumber?: string;
    employmentType: string;
    startDate: string;
    endDate?: string | null;
    managerUserId?: string | null;
    leavePolicyKey?: string | null;
    cpdsRequiredAnnual?: number | null;
    notes?: string | null;
  }) => apiClient.patch<EmployeeRowDto>(`/operations/hr/employees/${userId}`, input),
  employeeRecords: (userId: string) => apiClient.get<EmployeeHrRecordsDto>(`/operations/hr/employees/${userId}/records`),
  saveLifecycleItem: (userId: string, input: { lifecycle: 'ONBOARDING' | 'OFFBOARDING'; key: string; title: string; dueAt?: string | null; notes?: string | null }) =>
    apiClient.post<AuditedMutation<HrLifecycleItemDto>>(`/operations/hr/employees/${userId}/lifecycle`, input),
  completeLifecycleItem: (id: string, completed: boolean) => apiClient.post<AuditedMutation<HrLifecycleItemDto>>(`/operations/hr/lifecycle/${id}/completion`, { completed }),
  recordAppraisal: (userId: string, input: { reviewerUserId?: string; periodStartsAt: string; periodEndsAt: string; status?: 'DRAFT' | 'FINALIZED' | 'ACKNOWLEDGED'; rating?: number | null; summary?: string | null; developmentPlan?: string | null }) =>
    apiClient.post<AuditedMutation<EmployeeAppraisalDto>>(`/operations/hr/employees/${userId}/appraisals`, input),
  recordCpd: (userId: string, input: { title: string; provider?: string | null; occurredOn: string; hours: number; notes?: string | null }) =>
    apiClient.post<AuditedMutation<CpdRecordDto>>(`/operations/hr/employees/${userId}/cpd`, input),
  saveAdvocateCredential: (userId: string, input: { admissionNumber: string; admissionDate?: string | null; practicingCertificateNo?: string | null; certificateExpiresAt?: string | null; status?: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'RETIRED'; notes?: string | null }) =>
    apiClient.post<AuditedMutation<AdvocateCredentialDto>>(`/operations/hr/employees/${userId}/advocate-credentials`, input),
  leavePolicies: () => apiClient.get<LeavePolicyDto[]>('/operations/hr/leave-policies'),
  saveLeavePolicy: (input: CalculatedLeavePolicyInput) =>
    apiClient.post<AuditedMutation<LeavePolicyDto>>('/operations/hr/leave-policies', input),
  saveLeaveBalance: (userId: string, input: { policyKey: string; year: number; openingDays?: number; adjustmentDays?: number; notes: string }) =>
    apiClient.post<AuditedMutation<LeaveBalanceDto>>(`/operations/hr/employees/${userId}/leave-balances`, input),
  addHrNote: (userId: string, input: { category: string; body: string; visibleToUserIds?: string[] }) =>
    apiClient.post<AuditedMutation<HrRestrictedNoteDto>>(`/operations/hr/employees/${userId}/restricted-notes`, input),
  recordStaffDocument: (userId: string, input: { category: string; title: string; externalReference?: string | null; expiresAt?: string | null; notes?: string | null }) =>
    apiClient.post<AuditedMutation<StaffDocumentDto>>(`/operations/hr/employees/${userId}/staff-documents`, input),
  offboardEmployee: (userId: string, input: { offboardedAt: string; reason?: string }) =>
    apiClient.post<AuditedMutation<EmployeeProfileDto>>(`/operations/hr/employees/${userId}/offboard`, input),

  leave: (scope: 'self' | 'all' = 'self') => apiClient.get<LeaveRequestDto[]>('/operations/leave', { params: { scope } }),
  employeeLeavePolicies: () => apiClient.get<LeavePolicyDto[]>('/operations/leave/policies'),
  calculatedLeaveBalance: (userId: string, policyKey: string, year: number) => apiClient.get<LeavePosition>('/operations/leave/balance', { params: { userId, policyKey, year } }),
  previewLeave: (input: LeavePreviewInput) => apiClient.post<LeavePreview>('/operations/leave/preview', input),
  requestLeave: (input: CalculatedLeaveRequest) =>
    apiClient.post<LeaveRequestDto>('/operations/leave', input),
  decideLeave: (id: string, decision: 'APPROVED' | 'REJECTED', revision: number, reason?: string) =>
    apiClient.post<LeaveRequestDto>(`/operations/leave/${id}/decision`, { decision, revision, reason }),
  cancelLeave: (id: string, revision: number) => apiClient.post<LeaveRequestDto>(`/operations/leave/${id}/cancel`, { revision }),
  reconcileLeavePolicy: (id: string, input: { policyKey: string; revision: number; reason: string }) => apiClient.post<LeaveRequestDto>(`/operations/leave/${id}/reconcile-policy`, input),

  vendors: () => apiClient.get<VendorDto[]>('/operations/vendors'),
  createVendor: (input: { name: string; kraPin?: string; contactName?: string; phone?: string; email?: string; address?: string }) =>
    apiClient.post<VendorDto>('/operations/vendors', input),
  recordVendorDocument: (id: string, input: { category: string; title: string; externalReference?: string; expiresAt?: string }) => apiClient.post<VendorDocumentDto>(`/operations/vendors/${id}/documents`, input),
  purchaseCategories: () => apiClient.get<PurchaseCategoryDto[]>('/operations/purchase-categories'),
  savePurchaseCategory: (input: { key: string; name: string; approvalThreshold?: number; financeAccountCode?: string; active?: boolean }) => apiClient.post<PurchaseCategoryDto>('/operations/purchase-categories', input),

  requisitions: () => apiClient.get<PurchaseRequisitionDto[]>('/operations/purchase-requisitions'),
  createRequisition: (input: { branchId: string; vendorId?: string; categoryId?: string; description: string; amount: number; idempotencyKey: string }) =>
    apiClient.post<PurchaseRequisitionDto>('/operations/purchase-requisitions', input),
  decideRequisition: (id: string, decision: 'APPROVED' | 'REJECTED') =>
    apiClient.post<PurchaseRequisitionDto>(`/operations/purchase-requisitions/${id}/decision`, { decision }),
  recordVendorQuote: (id: string, input: { vendorId: string; reference: string; amount: number; currency?: string; validUntil?: string; notes?: string }) => apiClient.post<VendorQuoteDto>(`/operations/purchase-requisitions/${id}/quotes`, input),

  orders: () => apiClient.get<PurchaseOrderDto[]>('/operations/purchase-orders'),
  receipts: () => apiClient.get<PurchaseReceiptDto[]>('/operations/purchase-receipts'),
  createOrder: (requisitionId: string) => apiClient.post<PurchaseOrderDto>('/operations/purchase-orders', { requisitionId }),
  receiveOrder: (id: string, input: { deliveryReference: string; idempotencyKey: string; receivedAt?: string; partial?: boolean; notes?: string }) =>
    apiClient.post<{ order: PurchaseOrderDto; receipt: { id: string; deliveryReference: string; receivedAt: string; partial: boolean }; auditRef: string }>(`/operations/purchase-orders/${id}/receive`, input),
  createAssetFromReceipt: (id: string, input: { assetTag?: string; category: string; name: string; serialNumber?: string; notes?: string }) => apiClient.post(`/operations/purchase-receipts/${id}/assets`, input),
  createExpenseFromReceipt: (id: string, input: { category: string; description?: string; paymentSource: string }) => apiClient.post(`/operations/purchase-receipts/${id}/expenses`, input),

  assets: () => apiClient.get<AssetDto[]>('/operations/assets'),
  createAsset: (input: {
    branchId?: string;
    assetTag?: string;
    category: string;
    name: string;
    serialNumber?: string;
    purchaseDate?: string;
    purchaseCost?: number;
    warrantyEndsAt?: string;
    notes?: string;
  }) => apiClient.post<AssetDto>('/operations/assets', input),
  assignAsset: (id: string, input: { userId: string; conditionOnIssue?: string }) =>
    apiClient.post<AssetDto>(`/operations/assets/${id}/assign`, input),
  returnAsset: (id: string, input?: { conditionOnReturn?: string }) =>
    apiClient.post<AssetDto>(`/operations/assets/${id}/return`, input ?? {}),
  updateAssetStatus: (id: string, status: AssetStatus, notes?: string) =>
    apiClient.patch<AssetDto>(`/operations/assets/${id}/status`, { status, notes }),
  recordAssetMaintenance: (id: string, input: { vendorId?: string; type: string; description: string; cost?: number; externalReference?: string; notes?: string }) => apiClient.post<AssetMaintenanceDto>(`/operations/assets/${id}/maintenance`, input),
  completeAssetMaintenance: (id: string, notes?: string) => apiClient.post<AssetMaintenanceDto>(`/operations/asset-maintenance/${id}/complete`, { notes }),

  projects: () => apiClient.get<InternalProjectDto[]>('/operations/projects'),
  createProject: (input: {
    branchId?: string;
    name: string;
    description?: string;
    ownerUserId?: string;
    startDate?: string;
    dueDate?: string;
    budget?: number;
    memberUserIds?: string[];
  }) => apiClient.post<InternalProjectDto>('/operations/projects', input),
  setProjectStatus: (id: string, status: 'PLANNED' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED') => apiClient.post(`/operations/projects/${id}/status`, { status }),
  linkProjectMatter: (id: string, matterId: string) => apiClient.post(`/operations/projects/${id}/matters`, { matterId }),
  linkProjectDocument: (id: string, documentId: string) => apiClient.post(`/operations/projects/${id}/documents`, { documentId }),
  addProjectMilestone: (id: string, input: { title: string; description?: string; dueAt?: string; ownerUserId?: string }) => apiClient.post(`/operations/projects/${id}/milestones`, input),
  completeProjectMilestone: (id: string) => apiClient.post(`/operations/project-milestones/${id}/complete`),
  recordProjectSpend: (id: string, input: { description: string; amount: number; occurredAt: string; financeReference?: string }) => apiClient.post(`/operations/projects/${id}/spend`, input),

  meetings: (params?: { from?: string; to?: string; projectId?: string; matterId?: string }) =>
    apiClient.get<MeetingDto[]>('/operations/meetings', { params }),
  createMeeting: (input: {
    projectId?: string;
    matterId?: string;
    title: string;
    startsAt: string;
    endsAt?: string;
    location?: string;
    agenda?: unknown;
    participantUserIds?: string[];
    recurrenceRule?: string;
    recurrenceUntil?: string;
  }) => apiClient.post<MeetingDto>('/operations/meetings', input),
  updateMeeting: (id: string, input: {
    title?: string;
    startsAt?: string;
    endsAt?: string | null;
    location?: string | null;
    agenda?: unknown;
    minutes?: unknown;
    status?: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    participantUserIds?: string[];
    recurrenceRule?: string | null;
    recurrenceUntil?: string | null;
  }) => apiClient.patch<MeetingDto>(`/operations/meetings/${id}`, input),
  addMeetingDecision: (id: string, input: { text: string; ownerUserId?: string }) =>
    apiClient.post(`/operations/meetings/${id}/decisions`, input),
  addMeetingAction: (id: string, input: { text: string; assigneeId?: string; dueAt?: string; createTask?: boolean }) =>
    apiClient.post(`/operations/meetings/${id}/actions`, input),
  setMeetingAttendance: (meetingId: string, userId: string, attendanceStatus: 'PRESENT' | 'ABSENT' | 'APOLOGY' | 'LATE') => apiClient.post(`/operations/meetings/${meetingId}/attendance/${userId}`, { attendanceStatus }),
  completeMeetingAction: (id: string) => apiClient.post(`/operations/meeting-actions/${id}/complete`),
};
