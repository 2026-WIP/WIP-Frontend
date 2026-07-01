import { httpClient } from './adapters/httpClient';
import { useNotificationStore } from '@/store/useNotificationStore';

export interface AppNotification {
  id: string;
  type: 'mention' | 'reply' | 'status' | 'friend' | 'dm' | 'workspace';
  actor: string;
  channelId?: string;
  preview: string;
  ts: number;
  read: boolean;
}

export const notificationService = {
  async fetch(): Promise<AppNotification[]> {
    const response = await httpClient.get<{ notifications: AppNotification[] }>('/notifications');
    useNotificationStore.getState().setNotifications(response.notifications);
    return response.notifications;
  },

  async markRead(ids: string[]): Promise<void> {
    await httpClient.post<void>('/notifications/read', { ids });
    useNotificationStore.getState().markRead(ids);
  },
};
