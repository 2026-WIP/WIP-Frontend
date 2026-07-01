import type { User } from '@/types/auth';
import { httpClient } from './httpClient';

interface UserResponse {
  user: User;
}

interface SessionResponse {
  user: User | null;
}

export const httpAuthAdapter = {
  async getSession(): Promise<User | null> {
    const response = await httpClient.get<SessionResponse>('/auth/session');
    return response.user;
  },

  async getMe(): Promise<User> {
    const response = await httpClient.get<UserResponse>('/auth/me');
    return response.user;
  },

  async logout(): Promise<void> {
    await httpClient.post<void>('/auth/logout');
  },

  async login(email: string, password: string): Promise<User> {
    const response = await httpClient.post<UserResponse>('/auth/login', { email: email.trim(), password });
    return response.user;
  },

  async signup(email: string, password: string, nickname: string): Promise<User> {
    const response = await httpClient.post<UserResponse>('/auth/signup', { email: email.trim(), password, nickname });
    return response.user;
  },

  async findPassword(email: string): Promise<void> {
    await httpClient.post<void>('/auth/find-password', { email });
  },

  async changePassword(email: string, current: string, next: string): Promise<void> {
    await httpClient.post<void>('/auth/change-password', { email, currentPassword: current, newPassword: next });
  },

  async updateNickname(email: string, nickname: string): Promise<User> {
    const response = await httpClient.put<UserResponse>('/auth/me', { email, nickname });
    return response.user;
  },

  async deactivateAccount(email: string): Promise<void> {
    await httpClient.post<void>('/auth/deactivate', { email });
  },

  async deleteAccount(email: string, password: string): Promise<void> {
    await httpClient.post<void>('/auth/delete', { email, password });
  },
};
