import { create } from 'zustand';
import type { User } from '@/types/auth';

interface AuthStore {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;

  setUser: (user: User) => void;
  clearUser: () => void;
  setLoading: (v: boolean) => void;
  setError: (msg: string | null) => void;
  clearError: () => void;
  setInitializing: (v: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: import.meta.env.VITE_API_MODE === 'http',
  error: null,

  setUser: (user) => set({ currentUser: user, isAuthenticated: true, error: null }),
  clearUser: () => set({ currentUser: null, isAuthenticated: false }),
  setLoading: (v) => set({ isLoading: v }),
  setError: (msg) => set({ error: msg }),
  clearError: () => set({ error: null }),
  setInitializing: (v) => set({ isInitializing: v }),
}));
