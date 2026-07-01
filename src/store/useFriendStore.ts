import { create } from 'zustand';
import type { User } from '@/types/auth';

export type FriendStatus = 'pending' | 'accepted' | 'declined';

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  status: FriendStatus;
  createdAt: number;
}

interface FriendStore {
  friends: User[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];

  setFriends: (friends: User[]) => void;
  addFriend: (user: User) => void;
  removeFriend: (userId: string) => void;

  setRequests: (received: FriendRequest[], sent: FriendRequest[]) => void;
  addSentRequest: (req: FriendRequest) => void;
  removeRequest: (requestId: string) => void;
}

export const useFriendStore = create<FriendStore>((set) => ({
  friends: [],
  receivedRequests: [],
  sentRequests: [],

  setFriends: (friends) => set({ friends }),
  addFriend: (user) => set((s) => ({ friends: [...s.friends.filter((f) => f.id !== user.id), user] })),
  removeFriend: (userId) => set((s) => ({ friends: s.friends.filter((f) => f.id !== userId) })),

  setRequests: (received, sent) => set({ receivedRequests: received, sentRequests: sent }),
  addSentRequest: (req) => set((s) => ({ sentRequests: [...s.sentRequests, req] })),
  removeRequest: (requestId) =>
    set((s) => ({
      receivedRequests: s.receivedRequests.filter((r) => r.id !== requestId),
      sentRequests: s.sentRequests.filter((r) => r.id !== requestId),
    })),
}));
