import { apiClient } from './client';

export type CalendarEventType = 'COURT' | 'CLIENT_MEETING' | 'INTERNAL_MEETING' | 'MEDICAL' | 'FILING' | 'DEADLINE' | 'TASK_BLOCK' | 'OTHER';
export type CalendarEditPolicy = 'FREE' | 'CONFIRM' | 'REASON_REQUIRED' | 'APPROVAL_REQUIRED' | 'LOCKED';

export interface CalendarEventDto {
  matterId?: string;
  courtProceedingId?: string;
  taskId?: string;
  deadlineId?: string;
  title: string;
  eventType: CalendarEventType;
  startAt: string;
  endAt: string;
  timezone?: string;
  allDay?: boolean;
  location?: string;
  virtualMeetingUrl?: string;
  assignedUserId: string;
  participantUserIds?: string[];
  sourceType?: string;
  editPolicy?: CalendarEditPolicy;
  notes?: string;
}

export const calendarApi = {
  list: (params?: { from?: string; to?: string; userId?: string; matterId?: string }) =>
    apiClient.get<any[]>('/calendar/events', { params }),
  create: (dto: CalendarEventDto) => apiClient.post<any>('/calendar/events', dto),
  reschedule: (id: string, input: { startAt: string; endAt: string; reason?: string; source?: string; supportingDocumentId?: string }) =>
    apiClient.post<any>(`/calendar/events/${id}/reschedule`, input),
  outcome: (id: string, input: { outcome: string; status: string; nextDate?: string; directions?: string }) =>
    apiClient.post<any>(`/calendar/events/${id}/court-outcome`, input),
  linkDocument: (id: string, documentId: string, requirementKey?: string) =>
    apiClient.post<any>(`/calendar/events/${id}/documents`, { documentId, requirementKey }),
};
