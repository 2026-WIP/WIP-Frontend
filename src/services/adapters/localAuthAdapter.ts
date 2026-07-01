import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/types/auth';

interface StoredUser {
  user: User;
  passwordHash: string;
}

const userStore = new Map<string, StoredUser>();

async function hashPassword(password: string): Promise<string> {
  const encoded = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

export const localAuthAdapter = {
  async login(email: string, password: string): Promise<User> {
    await delay();
    const entry = userStore.get(email.toLowerCase());
    if (!entry) throw new Error('No account found with that email.');
    const hash = await hashPassword(password);
    if (hash !== entry.passwordHash) throw new Error('Incorrect password.');
    return entry.user;
  },

  async signup(email: string, password: string, nickname: string): Promise<User> {
    await delay();
    const key = email.toLowerCase();
    if (userStore.has(key)) throw new Error('An account with this email already exists.');
    const hash = await hashPassword(password);
    const user: User = {
      id: uuidv4(),
      email: key,
      nickname,
      createdAt: Date.now(),
    };
    userStore.set(key, { user, passwordHash: hash });
    return user;
  },

  async findPassword(email: string): Promise<void> {
    void email;
    await delay();
    // Always succeeds — mock only, no real email sent
  },

  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    await delay();
    const key = email.toLowerCase();
    const entry = userStore.get(key);
    if (!entry) throw new Error('User not found.');
    const currentHash = await hashPassword(currentPassword);
    if (currentHash !== entry.passwordHash) throw new Error('Current password is incorrect.');
    entry.passwordHash = await hashPassword(newPassword);
  },

  async updateNickname(email: string, nickname: string): Promise<User> {
    await delay();
    const entry = userStore.get(email.toLowerCase());
    if (!entry) throw new Error('User not found.');
    entry.user = { ...entry.user, nickname };
    return entry.user;
  },

  async deactivateAccount(email: string): Promise<void> {
    await delay();
    // Keep record but session is cleared by the store
    const entry = userStore.get(email.toLowerCase());
    if (!entry) throw new Error('User not found.');
  },

  async deleteAccount(email: string, password: string): Promise<void> {
    await delay();
    const key = email.toLowerCase();
    const entry = userStore.get(key);
    if (!entry) throw new Error('User not found.');
    const hash = await hashPassword(password);
    if (hash !== entry.passwordHash) throw new Error('Incorrect password.');
    userStore.delete(key);
  },
};
