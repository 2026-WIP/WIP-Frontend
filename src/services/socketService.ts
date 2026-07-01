import { io, type Socket } from 'socket.io-client';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { useDmStore, type DmMessage } from '@/store/useDmStore';
import { dmService } from './dmService';
import { messageService } from './messageService';
import { notificationService } from './notificationService';
import { friendService } from './friendService';
import { unreadService } from './unreadService';
import type { ChatMessage } from '@/types/message';

const isHttp = import.meta.env.VITE_API_MODE === 'http';
const apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api';
const socketUrl = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;

let socket: Socket | null = null;

// 현재 채널 ID를 추적해 소켓 재연결 시 자동으로 룸을 다시 join
let activeChannelId: string | null = null;

function joinAllChannelRooms(s: Socket) {
  const channels = useMessagesStore.getState().channels;
  for (const channelId of Object.keys(channels)) {
    s.emit('channel:join', channelId);
  }
}

function attachHandlers(s: Socket) {
  s.on('connect', () => {
    useUIStore.getState().setSocketConnected(true);
    // 재연결 시 모든 채널 룸 join + 서버 기준 unread 재동기화
    joinAllChannelRooms(s);
    if (activeChannelId) {
      messageService.fetchMessages(activeChannelId, { limit: 30 }).catch(() => {});
    }
    notificationService.fetch().catch(() => {});
    unreadService.fetchUnread().catch(() => {});
  });

  s.on('connect_error', () => {
    useUIStore.getState().setSocketConnected(false);
  });

  s.on('disconnect', () => {
    useUIStore.getState().setSocketConnected(false);
  });

  s.on('message:new', (message: ChatMessage) => {
    useMessagesStore.getState().addMessage(message);
    // unread 상태는 서버에서 오는 unread:channel 이벤트로만 처리
  });

  s.on('message:update', (message: ChatMessage) => {
    useMessagesStore.getState().updateMessage(message.id, message);
  });

  s.on('thread:new', ({ parentId, message }: { parentId: string; message: ChatMessage }) => {
    useMessagesStore.getState().addThreadMessage(parentId, message);
  });

  s.on('dm:new', (message: DmMessage) => {
    const currentUserId = useAuthStore.getState().currentUser?.id;
    if (!currentUserId) return;
    const conversationKey = message.conversationId
      ? `group:${message.conversationId}`
      : (message.fromId === currentUserId ? message.toId : message.fromId);
    if (conversationKey) {
      useDmStore.getState().addMessage(conversationKey, message);
      // unread 상태는 서버에서 오는 unread:dm 이벤트로만 처리
    }
    notificationService.fetch().catch(() => {});
  });

  // 서버가 내 user 룸으로 직접 보내는 unread 알림 — 채널 룸 join 여부와 무관하게 수신
  s.on('unread:channel', ({ channelId }: { channelId: string }) => {
    const ui = useUIStore.getState();
    const isViewing = ui.activeView === 'channel' && ui.activeChannelId === channelId;
    if (!isViewing) ui.markChannelUnread(channelId);
  });

  s.on('unread:dm', ({ conversationKey }: { conversationKey: string }) => {
    const ui = useUIStore.getState();
    const isViewing = ui.activeView === 'dm' && ui.activeDmUserId === conversationKey;
    if (!isViewing) ui.markDmUnread(conversationKey);
  });

  s.on('dm:contacts:update', () => { dmService.fetchUsers().catch(() => {}); });
  s.on('dm:conversations:update', () => { dmService.fetchGroupConversations().catch(() => {}); });
  s.on('friend:requests:update', () => { friendService.fetchRequests().catch(() => {}); });
  s.on('friend:list:update', () => {
    friendService.fetchFriends().catch(() => {});
    friendService.fetchRequests().catch(() => {});
    dmService.fetchUsers().catch(() => {});
    dmService.fetchGroupConversations().catch(() => {});
  });
  s.on('channel:list:update', () => {
    messageService.fetchChannels().then(() => joinAllChannelRooms(s)).catch(() => {});
  });
  s.on('notification:update', () => { notificationService.fetch().catch(() => {}); });

  s.on('typing:update', ({ channelId, userId, typing }: { channelId: string; userId: string; typing: boolean }) => {
    const user = useDmStore.getState().users.find((u) => u.id === userId);
    const nickname = user?.nickname ?? userId;
    useUIStore.getState().setTyping(channelId, nickname, typing);
  });

  s.on('presence:update', ({ userId, online }: { userId: string; online: boolean }) => {
    useUIStore.getState().setOnline(userId, online);
  });
}

export function getSocket(): Socket | null {
  if (!isHttp) return null;
  if (!socket) {
    socket = io(socketUrl || window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
    attachHandlers(socket);
  }
  return socket;
}

/** AppShell 마운트(로그인 완료) 시 소켓을 새로 연결 — 이전 세션의 죽은 소켓을 교체 */
export function reconnectSocket() {
  if (!isHttp) return;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  getSocket();
}

export function joinChannel(channelId: string) {
  activeChannelId = channelId;
  getSocket()?.emit('channel:join', channelId);
}

export function joinAllChannels() {
  const s = getSocket();
  if (s) joinAllChannelRooms(s);
}

export function leaveChannel(channelId: string) {
  if (activeChannelId === channelId) activeChannelId = null;
  getSocket()?.emit('channel:leave', channelId);
}

export function emitTypingStart(channelId: string) {
  getSocket()?.emit('typing:start', channelId);
}

export function emitTypingStop(channelId: string) {
  getSocket()?.emit('typing:stop', channelId);
}
