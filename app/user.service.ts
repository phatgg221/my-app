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
 * UserService:
 * Frontend service layer for Ops Coordinators and Google OAuth authentication.
 */
export class UserService {
  async fetchOpsCoordinators(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  }

  async loginWithGoogle(payload: GoogleAuthPayload): Promise<User> {
    const response = await apiClient.post<User>('/api/auth/google', payload);
    return response.data;
  }

  async getMe(): Promise<SessionInfo> {
    const response = await apiClient.get<SessionInfo>('/api/auth/me');
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/api/auth/logout');
  }
}

export const userService = new UserService();
export const fetchOpsCoordinators = () => userService.fetchOpsCoordinators();
export const loginWithGoogle = (payload: GoogleAuthPayload) => userService.loginWithGoogle(payload);
export const getMe = () => userService.getMe();
export const logout = () => userService.logout();
