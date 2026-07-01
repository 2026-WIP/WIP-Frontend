import { localAuthAdapter } from './adapters/localAuthAdapter';
import { httpAuthAdapter } from './adapters/httpAuthAdapter';
import { useAuthStore } from '@/store/useAuthStore';

const isHttp = import.meta.env.VITE_API_MODE === 'http';
const adapter = isHttp ? httpAuthAdapter : localAuthAdapter;

export const authService = {
  async init() {
    if (!isHttp) {
      useAuthStore.getState().setInitializing(false);
      return;
    }
    const { setUser, clearUser, setInitializing } = useAuthStore.getState();
    try {
      const user = await httpAuthAdapter.getSession();
      if (user) setUser(user);
    } catch {
      clearUser();
      // No valid session — user remains logged out
    } finally {
      setInitializing(false);
    }
  },

  async login(email: string, password: string) {
    const { setUser, setLoading, setError } = useAuthStore.getState();
    setLoading(true);
    setError(null);
    try {
      const user = await adapter.login(email, password);
      setUser(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },

  async signup(email: string, password: string, nickname: string) {
    const { setUser, setLoading, setError } = useAuthStore.getState();
    setLoading(true);
    setError(null);
    try {
      const user = await adapter.signup(email, password, nickname);
      setUser(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign up failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },

  logout() {
    if (isHttp) {
      httpAuthAdapter.logout().catch(() => {});
    }
    useAuthStore.getState().clearUser();
  },

  async findPassword(email: string) {
    const { setLoading, setError } = useAuthStore.getState();
    setLoading(true);
    setError(null);
    try {
      await adapter.findPassword(email);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },

  async changePassword(currentPassword: string, newPassword: string) {
    const { currentUser, setLoading, setError } = useAuthStore.getState();
    if (!currentUser) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      await adapter.changePassword(currentUser.email, currentPassword, newPassword);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Password change failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },

  async updateNickname(nickname: string) {
    const { currentUser, setUser, setLoading, setError } = useAuthStore.getState();
    if (!currentUser) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      const updated = await adapter.updateNickname(currentUser.email, nickname);
      setUser(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },

  async deactivateAccount() {
    const { currentUser, clearUser, setLoading, setError } = useAuthStore.getState();
    if (!currentUser) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      await adapter.deactivateAccount(currentUser.email);
      clearUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deactivation failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },

  async deleteAccount(password: string) {
    const { currentUser, clearUser, setLoading, setError } = useAuthStore.getState();
    if (!currentUser) throw new Error('Not authenticated');
    setLoading(true);
    setError(null);
    try {
      await adapter.deleteAccount(currentUser.email, password);
      clearUser();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deletion failed');
      throw e;
    } finally {
      setLoading(false);
    }
  },
};
