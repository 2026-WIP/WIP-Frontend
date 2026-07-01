import { httpClient } from './adapters/httpClient';
import { useUIStore } from '@/store/useUIStore';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

export const unreadService = {
  async fetchUnread(): Promise<void> {
    if (!isHttp) return;
    try {
      const { channelIds, dmKeys } = await httpClient.get<{ channelIds: string[]; dmKeys: string[] }>('/unread');
      const ui = useUIStore.getState();
      // 기존 unread 전부 초기화 후 서버 기준으로 재설정
      for (const id of ui.unreadChannelIds) ui.clearChannelUnread(id);
      for (const key of ui.unreadDmKeys) ui.clearDmUnread(key);
      for (const id of channelIds) ui.markChannelUnread(id);
      for (const key of dmKeys) ui.markDmUnread(key);
    } catch {
      // 네트워크 오류 무시 — 소켓 이벤트로 보완됨
    }
  },

  async markChannelRead(channelId: string): Promise<void> {
    if (!isHttp) return;
    useUIStore.getState().clearChannelUnread(channelId);
    try {
      await httpClient.post(`/channels/${encodeURIComponent(channelId)}/read`, {});
    } catch {
      // 실패해도 UI는 이미 업데이트됨
    }
  },

  async markDmRead(conversationKey: string): Promise<void> {
    if (!isHttp) return;
    useUIStore.getState().clearDmUnread(conversationKey);
    try {
      await httpClient.post('/dm/read', { conversationKey });
    } catch {
      // 실패해도 UI는 이미 업데이트됨
    }
  },
};
