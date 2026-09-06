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
  dueDate?: string | null;
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

export const tasksApi = {
  /** List tasks with optional filters */
  list: (params?: {
    matterId?: string;
    assignedToId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    page?: number;
    limit?: number;
  }) => apiClient.get<TasksListResponse>('/tasks', { params }),

  /** Get a single task */
  get: (id: string) => apiClient.get<BackendTask>(`/tasks/${id}`),

  /** Create a new task */
  create: (dto: CreateTaskDto) => apiClient.post<BackendTask>('/tasks', dto),

  /** Update task metadata */
  update: (id: string, dto: Partial<CreateTaskDto>) =>
    apiClient.patch<BackendTask>(`/tasks/${id}`, dto),

  /** Change task status (Kanban column move) */
  setStatus: (id: string, status: TaskStatus, notes?: string) =>
    apiClient.post<BackendTask>(`/tasks/${id}/status`, { status, notes }),

  /** Delete a task */
  remove: (id: string) => apiClient.delete<void>(`/tasks/${id}`),
};
