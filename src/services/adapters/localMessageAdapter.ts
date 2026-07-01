import type { ChatMessage } from '@/types/message';
import { useMessagesStore } from '@/store/useMessagesStore';
import { v4 as uuidv4 } from 'uuid';

export const localMessageAdapter = {
  async sendMessage(msg: Omit<ChatMessage, 'id' | 'createdAt'>): Promise<ChatMessage> {
    const full: ChatMessage = { ...msg, id: uuidv4(), createdAt: Date.now() };
    useMessagesStore.getState().addMessage(full);
    return full;
  },

  async fetchMessages(channelId: string, options?: { before?: string; limit?: number }): Promise<ChatMessage[]> {
    const messages = useMessagesStore.getState().getChannelMessages(channelId);
    const limit = options?.limit ?? messages.length;
    const beforeIndex = options?.before ? messages.findIndex((message) => message.id === options.before) : messages.length;
    const end = beforeIndex >= 0 ? beforeIndex : messages.length;
    return messages.slice(Math.max(0, end - limit), end);
  },

  async updateMessage(id: string, patch: Partial<ChatMessage>): Promise<ChatMessage> {
    useMessagesStore.getState().updateMessage(id, patch);
    return useMessagesStore.getState().messages[id];
  },
};
