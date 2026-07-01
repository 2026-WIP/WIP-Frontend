import { httpClient } from './adapters/httpClient';
import { useDmStore, type DmConversation, type DmMessage } from '@/store/useDmStore';
import type { User } from '@/types/auth';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

export const dmService = {
  async fetchUsers(): Promise<User[]> {
    if (!isHttp) return [];
    const response = await httpClient.get<{ contacts: User[] }>('/dm/contacts');
    useDmStore.getState().setUsers(response.contacts);
    return response.contacts;
  },

  async fetchGroupConversations(): Promise<DmConversation[]> {
    if (!isHttp) return [];
    const response = await httpClient.get<{ conversations: DmConversation[] }>('/dm/conversations');
    useDmStore.getState().setGroupConversations(response.conversations);
    return response.conversations;
  },

  async createGroupConversation(name: string, memberIds: string[]): Promise<DmConversation> {
    const response = await httpClient.post<{ conversation: DmConversation }>('/dm/conversations', { name, memberIds });
    useDmStore.getState().addGroupConversation(response.conversation);
    return response.conversation;
  },

  async fetchMessages(userId: string): Promise<DmMessage[]> {
    if (!isHttp) return [];
    if (userId.startsWith('group:')) {
      const conversationId = userId.slice('group:'.length);
      const response = await httpClient.get<{ messages: DmMessage[] }>(
        `/dm/conversations/${encodeURIComponent(conversationId)}/messages`,
      );
      useDmStore.getState().setMessages(userId, response.messages);
      return response.messages;
    }
    const response = await httpClient.get<{ messages: DmMessage[] }>(
      `/dm/${encodeURIComponent(userId)}/messages`,
    );
    useDmStore.getState().setMessages(userId, response.messages);
    return response.messages;
  },

  async sendMessage(userId: string, text: string): Promise<DmMessage> {
    if (userId.startsWith('group:')) {
      const conversationId = userId.slice('group:'.length);
      const response = await httpClient.post<{ message: DmMessage }>(
        `/dm/conversations/${encodeURIComponent(conversationId)}/messages`,
        { text },
      );
      useDmStore.getState().addMessage(userId, response.message);
      return response.message;
    }
    const response = await httpClient.post<{ message: DmMessage }>(
      `/dm/${encodeURIComponent(userId)}/messages`,
      { text },
    );
    useDmStore.getState().addMessage(userId, response.message);
    return response.message;
  },
};
