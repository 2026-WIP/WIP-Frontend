import type { ChatMessage } from '@/types/message';
import { useMessagesStore } from '@/store/useMessagesStore';
import { httpClient } from './httpClient';

interface MessageResponse {
  message: ChatMessage;
}

interface MessagesResponse {
  messages: ChatMessage[];
}

export const httpMessageAdapter = {
  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const response = await httpClient.post<MessageResponse>('/messages', msg);
    useMessagesStore.getState().addMessage(response.message);
    return response.message;
  },

  async fetchMessages(channelId: string, options?: { before?: string; limit?: number }): Promise<ChatMessage[]> {
    const params = new URLSearchParams();
    if (options?.before) params.set('before', options.before);
    if (options?.limit) params.set('limit', String(options.limit));
    const query = params.toString();
    const response = await httpClient.get<MessagesResponse>(
      `/channels/${encodeURIComponent(channelId)}/messages${query ? `?${query}` : ''}`,
    );
    for (const message of response.messages) {
      useMessagesStore.getState().addMessage(message);
    }
    return response.messages;
  },

  async updateMessage(id: string, patch: Partial<ChatMessage>): Promise<ChatMessage> {
    const response = await httpClient.put<MessageResponse>(`/messages/${encodeURIComponent(id)}`, patch);
    useMessagesStore.getState().updateMessage(id, response.message);
    return response.message;
  },
};
