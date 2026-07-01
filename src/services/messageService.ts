import { localMessageAdapter } from './adapters/localMessageAdapter';
import { httpMessageAdapter } from './adapters/httpMessageAdapter';
import { httpClient } from './adapters/httpClient';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDmStore } from '@/store/useDmStore';
import type { ChatMessage } from '@/types/message';
import type { Channel } from '@/types/channel';
import type { User } from '@/types/auth';
import { v4 as uuidv4 } from 'uuid';

const isHttp = import.meta.env.VITE_API_MODE === 'http';
const adapter = isHttp ? httpMessageAdapter : localMessageAdapter;

export const messageService = {
  sendMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => adapter.sendMessage(msg),
  fetchMessages: (channelId: string, options?: { before?: string; limit?: number }) => adapter.fetchMessages(channelId, options),
  updateMessage: (id: string, patch: Partial<ChatMessage>) => adapter.updateMessage(id, patch),

  async fetchChannels(): Promise<Channel[]> {
    if (!isHttp) {
      return Object.values(useMessagesStore.getState().channels);
    }
    const response = await httpClient.get<{ channels: Channel[] }>('/channels');
    useMessagesStore.getState().setChannels(response.channels);
    return response.channels;
  },

  async fetchChannelMembers(channelId: string): Promise<User[]> {
    if (!isHttp) {
      const currentUser = useAuthStore.getState().currentUser;
      return [
        ...(currentUser ? [currentUser] : []),
        ...useDmStore.getState().users,
      ];
    }
    const response = await httpClient.get<{ members: User[] }>(
      `/channels/${encodeURIComponent(channelId)}/members`,
    );
    return response.members;
  },

  async fetchWorkspaceMembers(): Promise<User[]> {
    if (!isHttp) return useDmStore.getState().users;
    const response = await httpClient.get<{ members: User[] }>('/workspace/members');
    return response.members;
  },

  async addChannelMember(channelId: string, userId: string): Promise<User> {
    const response = await httpClient.post<{ member: User }>(
      `/channels/${encodeURIComponent(channelId)}/members`,
      { userId },
    );
    return response.member;
  },

  async fetchThreadMessages(parentMessageId: string): Promise<ChatMessage[]> {
    if (!isHttp) return useMessagesStore.getState().getThreadMessages(parentMessageId);
    const response = await httpClient.get<{ messages: ChatMessage[] }>(
      `/messages/${encodeURIComponent(parentMessageId)}/thread`,
    );
    for (const msg of response.messages) {
      useMessagesStore.getState().addThreadMessage(parentMessageId, msg);
    }
    return response.messages;
  },

  async sendThreadMessage(
    parentMessageId: string,
    msg: Omit<ChatMessage, 'id' | 'createdAt' | 'parentId'>,
  ): Promise<ChatMessage> {
    if (!isHttp) {
      const { v4: uv } = await import('uuid');
      const created: ChatMessage = { ...msg, id: uv(), parentId: parentMessageId, createdAt: Date.now() };
      useMessagesStore.getState().addThreadMessage(parentMessageId, created);
      return created;
    }
    const response = await httpClient.post<{ message: ChatMessage }>(
      `/messages/${encodeURIComponent(parentMessageId)}/thread`,
      { ...msg, channelId: msg.channelId },
    );
    useMessagesStore.getState().addThreadMessage(parentMessageId, response.message);
    return response.message;
  },

  async createChannel(name: string, description = '', memberIds: string[] = []): Promise<Channel> {
    if (!isHttp) {
      const channel: Channel = {
        id: `ch-${uuidv4().slice(0, 8)}`,
        name,
        description,
        createdAt: Date.now(),
        memberIds: [],
      };
      useMessagesStore.getState().addChannel(channel);
      return channel;
    }
    const response = await httpClient.post<{ channel: Channel }>('/channels', { name, description, memberIds });
    useMessagesStore.getState().addChannel(response.channel);
    return response.channel;
  },

  async updateChannel(channelId: string, patch: { name?: string; description?: string }): Promise<Channel> {
    const response = await httpClient.put<{ channel: Channel }>(
      `/channels/${encodeURIComponent(channelId)}`,
      patch,
    );
    useMessagesStore.getState().addChannel(response.channel);
    return response.channel;
  },

  async deleteChannel(channelId: string): Promise<void> {
    await httpClient.delete(`/channels/${encodeURIComponent(channelId)}`);
    useMessagesStore.getState().removeChannel(channelId);
  },

  async leaveChannel(channelId: string): Promise<void> {
    await httpClient.post(`/channels/${encodeURIComponent(channelId)}/leave`, {});
    useMessagesStore.getState().removeChannel(channelId);
  },
};
