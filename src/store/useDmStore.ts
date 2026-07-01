import { create } from 'zustand';
import type { User } from '@/types/auth';

export interface DmMessage {
  id: string;
  fromId: string;
  fromName: string;
  toId?: string;
  conversationId?: string;
  text: string;
  createdAt: number;
}

export interface DmConversation {
  id: string;
  name: string;
  memberIds: string[];
  memberNames: string[];
  createdAt: number;
}

interface DmStore {
  users: User[];
  groupConversations: DmConversation[];
  conversations: Record<string, DmMessage[]>;
  setUsers: (users: User[]) => void;
  setGroupConversations: (conversations: DmConversation[]) => void;
  addGroupConversation: (conversation: DmConversation) => void;
  setMessages: (conversationKey: string, messages: DmMessage[]) => void;
  addMessage: (conversationKey: string, message: DmMessage) => void;
}

export const useDmStore = create<DmStore>((set) => ({
  users: [],
  groupConversations: [],
  conversations: {},

  setUsers: (users) => set({ users }),
  setGroupConversations: (groupConversations) => set({ groupConversations }),
  addGroupConversation: (conversation) =>
    set((state) => ({
      groupConversations: [
        conversation,
        ...state.groupConversations.filter((existing) => existing.id !== conversation.id),
      ],
    })),

  setMessages: (conversationKey, messages) =>
    set((state) => ({
      conversations: { ...state.conversations, [conversationKey]: messages },
    })),

  addMessage: (conversationKey, message) =>
    set((state) => {
      const messages = state.conversations[conversationKey] ?? [];
      if (messages.some((existing) => existing.id === message.id)) return state;
      return {
        conversations: {
          ...state.conversations,
          [conversationKey]: [...messages, message],
        },
      };
    }),
}));
