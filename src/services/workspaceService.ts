import { httpClient } from './adapters/httpClient';
import { dmService } from './dmService';
import { messageService } from './messageService';
import type { User } from '@/types/auth';

export const workspaceService = {
  async addMember(email: string): Promise<User> {
    const response = await httpClient.post<{ member: User }>('/workspace/members', { email });
    await Promise.allSettled([
      dmService.fetchUsers(),
      messageService.fetchWorkspaceMembers(),
    ]);
    return response.member;
  },
};
