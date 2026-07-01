import { create } from 'zustand';
import type { PendingQuote, DiffPanelState } from '@/types/ui';
import { MOCK_CHANNELS } from '@/constants/mockData';

const initialChannelId = import.meta.env.VITE_API_MODE === 'http' ? null : (MOCK_CHANNELS[0]?.id ?? null);

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';
export type FontMode = 'geist' | 'inter' | 'mono';
export type DensityMode = 'compact' | 'default' | 'spacious';

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function resolveTheme(theme: ThemeMode): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

export function applyTheme(theme: ThemeMode) {
  const resolved = resolveTheme(theme);
  document.documentElement.setAttribute('data-theme', resolved);
  document.documentElement.setAttribute('data-theme-mode', theme);
  document.documentElement.style.colorScheme = resolved;
}

export function applyFont(font: FontMode) {
  document.documentElement.setAttribute('data-font', font);
}

export function applyDensity(density: DensityMode) {
  document.documentElement.setAttribute('data-density', density);
}

function loadTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem('wip_theme');
    if (saved === 'dark' || saved === 'light' || saved === 'system') return saved;
  } catch { /* ignore */ }
  return 'light';
}

function saveTheme(t: ThemeMode) {
  try { localStorage.setItem('wip_theme', t); } catch { /* ignore */ }
}

function loadFont(): FontMode {
  try {
    const saved = localStorage.getItem('wip_font');
    if (saved === 'geist' || saved === 'inter' || saved === 'mono') return saved;
  } catch { /* ignore */ }
  return 'geist';
}

function saveFont(font: FontMode) {
  try { localStorage.setItem('wip_font', font); } catch { /* ignore */ }
}

function loadDensity(): DensityMode {
  try {
    const saved = localStorage.getItem('wip_density');
    if (saved === 'compact' || saved === 'default' || saved === 'spacious') return saved;
  } catch { /* ignore */ }
  return 'compact';
}

function saveDensity(density: DensityMode) {
  try { localStorage.setItem('wip_density', density); } catch { /* ignore */ }
}

export type AppView = 'home' | 'dm' | 'channel' | 'snippets' | 'notifications' | 'search' | 'friends';

interface UIStore {
  activeView: AppView;
  activeChannelId: string | null;
  activeDmUserId: string | null;
  activeThreadMessageId: string | null;
  pendingQuote: PendingQuote | null;
  chatDrafts: Record<string, string>;
  runnerPanelOpen: Record<string, boolean>;
  diffPanelState: Record<string, DiffPanelState>;
  globalSearchQuery: string;
  theme: ThemeMode;
  font: FontMode;
  density: DensityMode;
  // channelId -> list of nicknames currently typing
  typingUsers: Record<string, string[]>;
  // Set of userIds currently online
  onlineUserIds: Set<string>;
  // snippet deep-link: navigates SnippetPane to this id and opens edit mode
  activeSnippetId: string | null;
  // WebSocket 연결 상태
  socketConnected: boolean;
  // 읽지 않은 채널/DM 추적
  unreadChannelIds: Set<string>;
  unreadDmKeys: Set<string>;

  setActiveView: (view: AppView) => void;
  setActiveChannel: (id: string) => void;
  setActiveDmUser: (userId: string) => void;
  markChannelUnread: (id: string) => void;
  clearChannelUnread: (id: string) => void;
  markDmUnread: (key: string) => void;
  clearDmUnread: (key: string) => void;
  setActiveThread: (messageId: string | null) => void;
  setPendingQuote: (q: PendingQuote | null) => void;
  setChatDraft: (channelId: string, text: string) => void;
  toggleRunnerPanel: (codeBlockId: string) => void;
  setDiffPanelState: (messageId: string, state: DiffPanelState) => void;
  setGlobalSearchQuery: (q: string) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setFont: (font: FontMode) => void;
  setDensity: (density: DensityMode) => void;
  setTyping: (channelId: string, nickname: string, typing: boolean) => void;
  setOnline: (userId: string, online: boolean) => void;
  setActiveSnippet: (id: string | null) => void;
  setSocketConnected: (v: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeView: 'home',
  activeChannelId: initialChannelId,
  activeDmUserId: null,
  activeThreadMessageId: null,
  pendingQuote: null,
  chatDrafts: {},
  runnerPanelOpen: {},
  diffPanelState: {},
  globalSearchQuery: '',
  theme: loadTheme(),
  font: loadFont(),
  density: loadDensity(),
  typingUsers: {},
  onlineUserIds: new Set(),
  activeSnippetId: null,
  socketConnected: false,
  unreadChannelIds: new Set<string>(),
  unreadDmKeys: new Set<string>(),

  setActiveView: (view) => set({ activeView: view }),
  setActiveChannel: (id) => set((state) => {
    const next = new Set(state.unreadChannelIds);
    next.delete(id);
    return { activeChannelId: id, activeView: 'channel', activeThreadMessageId: null, unreadChannelIds: next };
  }),
  setActiveDmUser: (userId) => set((state) => {
    const next = new Set(state.unreadDmKeys);
    next.delete(userId);
    return { activeDmUserId: userId, activeView: 'dm', unreadDmKeys: next };
  }),
  markChannelUnread: (id) => set((state) => {
    const next = new Set(state.unreadChannelIds);
    next.add(id);
    return { unreadChannelIds: next };
  }),
  clearChannelUnread: (id) => set((state) => {
    const next = new Set(state.unreadChannelIds);
    next.delete(id);
    return { unreadChannelIds: next };
  }),
  markDmUnread: (key) => set((state) => {
    const next = new Set(state.unreadDmKeys);
    next.add(key);
    return { unreadDmKeys: next };
  }),
  clearDmUnread: (key) => set((state) => {
    const next = new Set(state.unreadDmKeys);
    next.delete(key);
    return { unreadDmKeys: next };
  }),
  setActiveThread: (messageId) => set({ activeThreadMessageId: messageId }),
  setPendingQuote: (q) => set({ pendingQuote: q }),
  setChatDraft: (channelId, text) => set((state) => ({ chatDrafts: { ...state.chatDrafts, [channelId]: text } })),
  toggleRunnerPanel: (codeBlockId) =>
    set((state) => ({
      runnerPanelOpen: {
        ...state.runnerPanelOpen,
        [codeBlockId]: !state.runnerPanelOpen[codeBlockId],
      },
    })),
  setDiffPanelState: (messageId, diffState) =>
    set((state) => ({
      diffPanelState: { ...state.diffPanelState, [messageId]: diffState },
    })),
  setGlobalSearchQuery: (q) => set({ globalSearchQuery: q }),
  setTheme: (theme) => {
    saveTheme(theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () =>
    set((state) => {
      const next: ThemeMode =
        state.theme === 'light' ? 'dark' :
        state.theme === 'dark' ? 'system' :
        'light';
      saveTheme(next);
      applyTheme(next);
      return { theme: next };
    }),
  setFont: (font) => {
    saveFont(font);
    applyFont(font);
    set({ font });
  },
  setDensity: (density) => {
    saveDensity(density);
    applyDensity(density);
    set({ density });
  },
  setTyping: (channelId, nickname, typing) =>
    set((state) => {
      const current = state.typingUsers[channelId] ?? [];
      const updated = typing
        ? current.includes(nickname) ? current : [...current, nickname]
        : current.filter((n) => n !== nickname);
      return { typingUsers: { ...state.typingUsers, [channelId]: updated } };
    }),
  setOnline: (userId, online) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      if (online) next.add(userId);
      else next.delete(userId);
      return { onlineUserIds: next };
    }),
  setActiveSnippet: (id) => set({ activeSnippetId: id }),
  setSocketConnected: (v) => set({ socketConnected: v }),
}));
