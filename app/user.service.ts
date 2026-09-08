import apiClient from '@/lib/apiClient';

export interface User {
  id: string;
  name: string;
}

/**
 * UserService:
 * Frontend service layer for Ops Coordinators and mock authentication.
 */
export class UserService {
  async fetchOpsCoordinators(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/api/users');
    return response.data;
  }
}

export const userService = new UserService();
export const fetchOpsCoordinators = () => userService.fetchOpsCoordinators();
