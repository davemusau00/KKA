import { apiClient } from './client';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface BackendTask {
  id: string;
  firmId: string;
  matterId?: string | null;
  matterNumber?: string | null;
  matterTitle?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdById: string;
  dueAt?: string | null;
  officialDeadlineAt?: string | null;
  completedAt?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignedToId?: string;
  matterId?: string;
  dueDate?: string;
  tags?: string[];
}

export interface TasksListResponse {
  data: BackendTask[];
  total: number;
}

function normalizeTask(task: any): BackendTask {
  return {
    ...task,
    matterNumber: task.matterNumber ?? task.matter?.internalReference ?? null,
    matterTitle: task.matterTitle ?? task.matter?.title ?? null,
    assignedToId: task.assignedToId ?? task.assignedTo?.id ?? null,
    assignedToName: task.assignedToName ?? task.assignedTo?.fullName ?? null,
    dueAt: task.dueAt ?? null,
    officialDeadlineAt: task.officialDeadlineAt ?? null,
    tags: task.tags ?? [],
  };
}

export const tasksApi = {
  /** List tasks with optional filters */
  list: (params?: {
    matterId?: string;
    assignedToId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    page?: number;
    limit?: number;
  }) => apiClient.get<any>('/tasks', { params }).then((rows) => {
    const data = Array.isArray(rows) ? rows.map(normalizeTask) : (rows.data || []).map(normalizeTask);
    return { data, total: rows.total ?? data.length };
  }),

  /** Get a single task */
  get: (id: string) => apiClient.get<any>(`/tasks/${id}`).then(normalizeTask),

  /** Create a new task */
  create: (dto: CreateTaskDto) => apiClient.post<any>('/tasks', { ...dto, assignedToId: dto.assignedToId, dueAt: dto.dueDate ? new Date(dto.dueDate).toISOString() : undefined }).then(normalizeTask),

  /** Update task metadata */
  update: (id: string, dto: Partial<CreateTaskDto>) =>
    apiClient.patch<any>(`/tasks/${id}`, { ...dto, assignedToId: dto.assignedToId, dueAt: dto.dueDate ? new Date(dto.dueDate).toISOString() : undefined }).then(normalizeTask),

  /** Change task status (Kanban column move) */
  setStatus: (id: string, status: TaskStatus, notes?: string) =>
    apiClient.post<any>(`/tasks/${id}/status`, { status, blockedReason: notes }).then(normalizeTask),

  /** Delete a task */
  remove: (id: string) => apiClient.delete<any>(`/tasks/${id}`).then(normalizeTask),
};
