import { apiClient } from './client';

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
  managerUserId?: string | null;
  leavePolicyKey?: string | null;
  cpdsRequiredAnnual?: string | number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  createdAt: string;
  updatedAt: string;
  participants?: Array<{
    meetingId: string;
    userId: string;
    attendanceStatus?: string | null;
    user?: { id: string; fullName: string; email: string; jobTitle?: string | null };
  }>;
  decisions?: Array<{ id: string; text: string; ownerUserId?: string | null; createdAt: string }>;
  actions?: Array<{ id: string; taskId?: string | null; text: string; assigneeId?: string | null; dueAt?: string | null; createdAt: string }>;
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

  leave: (scope: 'self' | 'all' = 'self') => apiClient.get<LeaveRequestDto[]>('/operations/leave', { params: { scope } }),
  requestLeave: (input: { type: string; startsOn: string; endsOn: string; days: number; reason?: string }) =>
    apiClient.post<LeaveRequestDto>('/operations/leave', input),
  decideLeave: (id: string, decision: 'APPROVED' | 'REJECTED', reason?: string) =>
    apiClient.post<LeaveRequestDto>(`/operations/leave/${id}/decision`, { decision, reason }),
  cancelLeave: (id: string) => apiClient.post<LeaveRequestDto>(`/operations/leave/${id}/cancel`),

  vendors: () => apiClient.get<VendorDto[]>('/operations/vendors'),
  createVendor: (input: { name: string; kraPin?: string; contactName?: string; phone?: string; email?: string; address?: string }) =>
    apiClient.post<VendorDto>('/operations/vendors', input),

  requisitions: () => apiClient.get<PurchaseRequisitionDto[]>('/operations/purchase-requisitions'),
  createRequisition: (input: { branchId: string; vendorId?: string; description: string; amount: number }) =>
    apiClient.post<PurchaseRequisitionDto>('/operations/purchase-requisitions', input),
  decideRequisition: (id: string, decision: 'APPROVED' | 'REJECTED') =>
    apiClient.post<PurchaseRequisitionDto>(`/operations/purchase-requisitions/${id}/decision`, { decision }),

  orders: () => apiClient.get<PurchaseOrderDto[]>('/operations/purchase-orders'),
  createOrder: (requisitionId: string) => apiClient.post<PurchaseOrderDto>('/operations/purchase-orders', { requisitionId }),
  receiveOrder: (id: string, input?: { receivedAt?: string; partial?: boolean }) =>
    apiClient.post<PurchaseOrderDto>(`/operations/purchase-orders/${id}/receive`, input ?? {}),

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
  }) => apiClient.patch<MeetingDto>(`/operations/meetings/${id}`, input),
  addMeetingDecision: (id: string, input: { text: string; ownerUserId?: string }) =>
    apiClient.post(`/operations/meetings/${id}/decisions`, input),
  addMeetingAction: (id: string, input: { text: string; assigneeId?: string; dueAt?: string; createTask?: boolean }) =>
    apiClient.post(`/operations/meetings/${id}/actions`, input),
};
