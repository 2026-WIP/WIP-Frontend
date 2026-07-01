import { create } from 'zustand';
import type { ChatMessage } from '@/types/message';
import type { Channel } from '@/types/channel';
import { MOCK_CHANNELS, MOCK_MESSAGES } from '@/constants/mockData';

function buildInitialState() {
  if (import.meta.env.VITE_API_MODE === 'http') {
    return {
      channels: {} as Record<string, Channel>,
      messages: {} as Record<string, ChatMessage>,
      messagesByChannel: {} as Record<string, string[]>,
    };
  }

  const channels: Record<string, Channel> = {};
  const messages: Record<string, ChatMessage> = {};
  const messagesByChannel: Record<string, string[]> = {};

  for (const ch of MOCK_CHANNELS) {
    channels[ch.id] = ch;
    messagesByChannel[ch.id] = [];
  }
  for (const msg of MOCK_MESSAGES) {
    messages[msg.id] = msg;
    if (!messagesByChannel[msg.channelId]) {
      messagesByChannel[msg.channelId] = [];
    }
    messagesByChannel[msg.channelId].push(msg.id);
  }
  return { channels, messages, messagesByChannel };
}

interface MessagesStore {
  channels: Record<string, Channel>;
  messages: Record<string, ChatMessage>;
  messagesByChannel: Record<string, string[]>;
  threadMessages: Record<string, string[]>; // parentMessageId → [messageId]

  addMessage: (msg: ChatMessage) => void;
  addChannel: (ch: Channel) => void;
  setChannels: (channels: Channel[]) => void;
  removeChannel: (channelId: string) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  getChannelMessages: (channelId: string) => ChatMessage[];
  addThreadMessage: (parentId: string, msg: ChatMessage) => void;
  getThreadMessages: (parentId: string) => ChatMessage[];
}

export const useMessagesStore = create<MessagesStore>((set, get) => ({
  ...buildInitialState(),
  threadMessages: {},

  addMessage: (msg) =>
    set((state) => {
      const existingIds = state.messagesByChannel[msg.channelId] ?? [];
      const ids = existingIds.includes(msg.id) ? existingIds : [...existingIds, msg.id];
      const nextMessages = { ...state.messages, [msg.id]: msg };
      return {
        messages: nextMessages,
        messagesByChannel: {
          ...state.messagesByChannel,
          [msg.channelId]: ids.sort((a, b) => (nextMessages[a]?.createdAt ?? 0) - (nextMessages[b]?.createdAt ?? 0)),
        },
      };
    }),

  addChannel: (ch) =>
    set((state) => ({
      channels: { ...state.channels, [ch.id]: ch },
      messagesByChannel: { ...state.messagesByChannel, [ch.id]: state.messagesByChannel[ch.id] ?? [] },
    })),

  setChannels: (nextChannels) =>
    set((state) => {
      const channels: Record<string, Channel> = {};
      const keepChannelIds = new Set(nextChannels.map((channel) => channel.id));
      const messagesByChannel: Record<string, string[]> = {};
      const messages: Record<string, ChatMessage> = {};
      const threadMessages: Record<string, string[]> = {};

      for (const channel of nextChannels) {
        channels[channel.id] = channel;
        messagesByChannel[channel.id] = state.messagesByChannel[channel.id] ?? [];
        for (const messageId of messagesByChannel[channel.id]) {
          const message = state.messages[messageId];
          if (message && keepChannelIds.has(message.channelId)) messages[messageId] = message;
        }
      }

      for (const [parentId, ids] of Object.entries(state.threadMessages)) {
        const parent = messages[parentId];
        if (!parent) continue;
        const keptIds = ids.filter((id) => {
          const message = state.messages[id];
          if (!message || !keepChannelIds.has(message.channelId)) return false;
          messages[id] = message;
          return true;
        });
        if (keptIds.length > 0) threadMessages[parentId] = keptIds;
      }

      return { channels, messages, messagesByChannel, threadMessages };
    }),

  removeChannel: (channelId) =>
    set((state) => {
      const channels = { ...state.channels };
      delete channels[channelId];
      const removedMessageIds = new Set(state.messagesByChannel[channelId] ?? []);
      const messagesByChannel = { ...state.messagesByChannel };
      delete messagesByChannel[channelId];
      const messages = { ...state.messages };
      for (const messageId of removedMessageIds) {
        delete messages[messageId];
      }
      const threadMessages = Object.fromEntries(
        Object.entries(state.threadMessages)
          .filter(([parentId]) => !removedMessageIds.has(parentId))
          .map(([parentId, ids]) => [parentId, ids.filter((id) => !removedMessageIds.has(id))]),
      );
      return { channels, messages, messagesByChannel, threadMessages };
    }),

  updateMessage: (id, patch) =>
    set((state) => ({
      messages: { ...state.messages, [id]: { ...state.messages[id], ...patch } },
    })),

  getChannelMessages: (channelId) => {
    const { messages, messagesByChannel } = get();
    return (messagesByChannel[channelId] ?? []).map((id) => messages[id]).filter(Boolean);
  },

  addThreadMessage: (parentId, msg) =>
    set((state) => {
      const existingIds = state.threadMessages[parentId] ?? [];
      const isNew = !existingIds.includes(msg.id);
      const parent = state.messages[parentId];
      const updatedMessages: Record<string, ChatMessage> = {
        ...state.messages,
        [msg.id]: msg,
        ...(parent && isNew ? { [parentId]: { ...parent, threadCount: (parent.threadCount ?? 0) + 1 } } : {}),
      };
      return {
        messages: updatedMessages,
        threadMessages: {
          ...state.threadMessages,
          [parentId]: isNew ? [...existingIds, msg.id] : existingIds,
        },
      };
    }),

  getThreadMessages: (parentId) => {
    const { messages, threadMessages } = get();
    return (threadMessages[parentId] ?? []).map((id) => messages[id]).filter(Boolean);
  },
}));
