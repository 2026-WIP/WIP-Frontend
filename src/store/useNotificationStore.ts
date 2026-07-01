import { create } from 'zustand';
import type { AppNotification } from '@/services/notificationService';

interface NotificationState {
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  markRead: (ids: string[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  markRead: (ids) => {
    const idSet = new Set(ids);
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        idSet.has(notification.id) ? { ...notification, read: true } : notification,
      ),
    }));
  },
}));
