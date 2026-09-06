import { apiClient } from './client';
import { HealthStatusResponse } from './types';

export const healthApi = {
  checkLive: () => apiClient.get<HealthStatusResponse>('/health/live'),
  checkReady: () => apiClient.get<HealthStatusResponse>('/health/ready'),
};
