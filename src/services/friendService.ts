import { httpClient } from './adapters/httpClient';
import { useFriendStore, type FriendRequest } from '@/store/useFriendStore';
import type { User } from '@/types/auth';
import { dmService } from './dmService';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

export const friendService = {
  async fetchDirectory(): Promise<User[]> {
    if (!isHttp) return [];
    const response = await httpClient.get<{ users: User[] }>('/users');
    return response.users;
  },

  async fetchFriends(): Promise<User[]> {
    if (!isHttp) return [];
    const response = await httpClient.get<{ friends: User[] }>('/friends');
    useFriendStore.getState().setFriends(response.friends);
    return response.friends;
  },

  async fetchRequests(): Promise<{ received: FriendRequest[]; sent: FriendRequest[] }> {
    if (!isHttp) return { received: [], sent: [] };
    const response = await httpClient.get<{ received: FriendRequest[]; sent: FriendRequest[] }>('/friends/requests');
    useFriendStore.getState().setRequests(response.received, response.sent);
    return response;
  },

  async sendRequest(toId: string): Promise<FriendRequest> {
    const response = await httpClient.post<{ request: FriendRequest }>('/friends/request', { toId });
    useFriendStore.getState().addSentRequest(response.request);
    return response.request;
  },

  async acceptRequest(requestId: string, fromUser: User): Promise<void> {
    await httpClient.post<void>(`/friends/accept/${encodeURIComponent(requestId)}`);
    useFriendStore.getState().removeRequest(requestId);
    useFriendStore.getState().addFriend(fromUser);
    await dmService.fetchUsers();
  },

  async declineRequest(requestId: string): Promise<void> {
    await httpClient.post<void>(`/friends/decline/${encodeURIComponent(requestId)}`);
    useFriendStore.getState().removeRequest(requestId);
  },

  async cancelRequest(requestId: string): Promise<void> {
    await httpClient.post<void>(`/friends/cancel/${encodeURIComponent(requestId)}`);
    useFriendStore.getState().removeRequest(requestId);
  },

  async removeFriend(friendId: string): Promise<void> {
    await httpClient.delete<void>(`/friends/${encodeURIComponent(friendId)}`);
    useFriendStore.getState().removeFriend(friendId);
    await dmService.fetchUsers();
  },
};
