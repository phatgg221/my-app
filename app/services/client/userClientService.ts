import apiClient from '@/lib/apiClient';

export interface User {
  id: string;
  name: string;
}

/**
 * Frontend Client Service for Ops Coordinators / Users:
 * Abstracts authentication and user fetching away from AuthContext and UI components.
 */
export async function fetchOpsCoordinators(): Promise<User[]> {
  const response = await apiClient.get<User[]>('/api/users');
  return response.data;
}
