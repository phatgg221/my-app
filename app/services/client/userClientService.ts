import apiClient from '@/lib/apiClient';

export interface User {
  id: string;
  name: string;
  email?: string | null;
  avatar?: string | null;
  role?: string | null;
}

export interface GoogleAuthPayload {
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface SessionInfo {
  user: User | null;
  isGoogleConfigured: boolean;
}

/**
 * Frontend Client Service for Ops Coordinators / Google Users:
 * Abstracts authentication and user fetching away from AuthContext and UI components.
 */
export async function fetchOpsCoordinators(): Promise<User[]> {
  const response = await apiClient.get<User[]>('/api/users');
  return response.data;
}

export async function loginWithGoogle(payload: GoogleAuthPayload): Promise<User> {
  const response = await apiClient.post<User>('/api/auth/google', payload);
  return response.data;
}

export async function getMe(): Promise<SessionInfo> {
  const response = await apiClient.get<SessionInfo>('/api/auth/me');
  return response.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/api/auth/logout');
}
