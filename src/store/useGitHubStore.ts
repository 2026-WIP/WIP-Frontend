import { create } from 'zustand';
import { githubService } from '@/services/githubService';
import { httpClient } from '@/services/adapters/httpClient';
import type { GitHubConnection, GitHubNotification, GitHubRepoInfo } from '@/types/github';

const TOKEN_KEY = 'wip_github_token';
const REPO_KEY = 'wip_github_repo';
const SEEN_KEY = 'wip_github_seen';
const NOTIFICATIONS_KEY = 'wip_github_notifications';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

function load(key: string) {
  const cookieValue = readCookie(key);
  if (cookieValue) return cookieValue;
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}

function save(key: string, value: string) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch { /* ignore */ }
  writeCookie(key, value);
}

function readCookie(name: string) {
  try {
    const prefix = `${encodeURIComponent(name)}=`;
    const match = document.cookie.split('; ').find((part) => part.startsWith(prefix));
    return match ? decodeURIComponent(match.slice(prefix.length)) : '';
  } catch {
    return '';
  }
}

function writeCookie(name: string, value: string) {
  try {
    const encodedName = encodeURIComponent(name);
    if (!value) {
      document.cookie = `${encodedName}=; path=/; max-age=0; SameSite=Lax`;
      return;
    }
    document.cookie = `${encodedName}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  } catch { /* ignore */ }
}

function loadSeenIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]') as string[]); }
  catch { return new Set(); }
}

function saveSeenIds(ids: Set<string>) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
}

function loadNotifications(): GitHubNotification[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? '[]') as GitHubNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: GitHubNotification[]) {
  try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications)); } catch { /* ignore */ }
}

async function fetchRemoteConnection() {
  try {
    const response = await httpClient.get<{ connection: GitHubConnection | null }>('/github/connection');
    return response.connection;
  } catch {
    return null;
  }
}

async function saveRemoteConnection(connection: GitHubConnection) {
  try { await httpClient.put('/github/connection', connection); } catch { /* ignore */ }
}

async function deleteRemoteConnection() {
  try { await httpClient.delete('/github/connection'); } catch { /* ignore */ }
}

function currentConnection(state: GitHubState): GitHubConnection | null {
  if (!state.token) return null;
  return {
    token: state.token,
    userLogin: state.userLogin,
    repoFullName: state.repoFullName,
    repoInfo: state.repoInfo,
    notifications: state.notifications,
    seenIds: [...state.seenIds],
  };
}

function persistConnection(state: GitHubState) {
  const connection = currentConnection(state);
  if (connection) void saveRemoteConnection(connection);
}

const initialNotifications = loadNotifications();
const initialSeenIds = new Set([...loadSeenIds(), ...initialNotifications.map((notification) => notification.id)]);

// OAuth popup 열기 — 결과 구분을 위해 이유 포함 반환
function openOAuthPopup(): { popup: Window; url: string } | { popup: null; reason: string } {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
  if (!clientId) return { popup: null, reason: 'no_client_id' };
  const redirect = `${window.location.origin}/github-oauth-callback`;
  const params = new URLSearchParams({ client_id: clientId, scope: 'repo read:user', redirect_uri: redirect });
  const url = `https://github.com/login/oauth/authorize?${params}`;
  const popup = window.open(url, 'github-oauth', 'width=620,height=720,scrollbars=yes,resizable=yes');
  if (!popup) return { popup: null, reason: 'blocked' };
  return { popup, url };
}

interface GitHubState {
  token: string;
  repoFullName: string;
  connected: boolean;
  // 'idle' | 'oauth-pending' | 'repo-pending' | 'connecting'
  step: 'idle' | 'oauth-pending' | 'repo-pending' | 'connecting';
  error: string | null;
  userLogin: string | null;
  repoInfo: GitHubRepoInfo | null;
  notifications: GitHubNotification[];
  seenIds: Set<string>;

  startOAuth: () => void;
  handleOAuthToken: (token: string) => Promise<void>;
  connectRepo: (repo: string) => Promise<void>;
  disconnect: () => void;
  poll: () => Promise<void>;
  markRead: (id: string) => void;
  markAllRead: () => void;
  initialize: () => Promise<void>;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;
let popupMessageHandler: ((e: MessageEvent) => void) | null = null;

function stopPolling() {
  if (pollTimer !== null) { clearInterval(pollTimer); pollTimer = null; }
}

function startPolling(poll: () => Promise<void>) {
  stopPolling();
  pollTimer = setInterval(() => { void poll(); }, 60_000);
}

export const useGitHubStore = create<GitHubState>((set, get) => ({
  token: load(TOKEN_KEY),
  repoFullName: load(REPO_KEY),
  connected: false,
  step: 'idle',
  error: null,
  userLogin: null,
  repoInfo: null,
  notifications: initialNotifications,
  seenIds: initialSeenIds,

  startOAuth() {
    // Client ID 확인
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID as string;
    if (!clientId) {
      set({ step: 'idle', error: 'VITE_GITHUB_CLIENT_ID가 설정되지 않았습니다. 프론트엔드 .env를 확인하고 dev 서버를 재시작하세요.' });
      return;
    }

    set({ step: 'oauth-pending', error: null });

    if (popupMessageHandler) window.removeEventListener('message', popupMessageHandler);

    const result = openOAuthPopup();
    if (!result.popup) {
      const reason = (result as { popup: null; reason: string }).reason;
      set({
        step: 'idle',
        error: reason === 'no_client_id'
          ? 'VITE_GITHUB_CLIENT_ID가 설정되지 않았습니다.'
          : '팝업이 차단되었습니다. 브라우저 주소창 옆의 팝업 차단 아이콘을 클릭해 허용해주세요.',
      });
      return;
    }
    const popup = result.popup;

    // localStorage fallback: 팝업이 postMessage 대신 localStorage를 썼을 때
    const storageHandler = (e: StorageEvent) => {
      if (e.key !== 'wip_github_oauth_token' || !e.newValue) return;
      window.removeEventListener('storage', storageHandler);
      localStorage.removeItem('wip_github_oauth_token');
      void get().handleOAuthToken(e.newValue);
    };
    window.addEventListener('storage', storageHandler);

    popupMessageHandler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'github-oauth-success') {
        window.removeEventListener('message', popupMessageHandler!);
        window.removeEventListener('storage', storageHandler);
        popupMessageHandler = null;
        void get().handleOAuthToken(e.data.access_token as string);
      } else if (e.data?.type === 'github-oauth-error') {
        window.removeEventListener('message', popupMessageHandler!);
        window.removeEventListener('storage', storageHandler);
        popupMessageHandler = null;
        const msg = String(e.data.error ?? '');
        set({
          step: 'idle',
          error: msg === 'access_denied' || msg === '인증이 취소되었습니다.'
            ? '인증이 취소되었습니다.'
            : `GitHub 인증에 실패했습니다: ${msg}`,
        });
      }
    };
    window.addEventListener('message', popupMessageHandler);

    // 팝업이 닫혔는데 메시지가 없으면 취소로 간주
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('storage', storageHandler);
        if (get().step === 'oauth-pending') {
          window.removeEventListener('message', popupMessageHandler!);
          popupMessageHandler = null;
          set({ step: 'idle', error: '인증이 취소되었습니다. 다시 시도해주세요.' });
        }
      }
    }, 500);
  },

  async handleOAuthToken(token) {
    set({ step: 'oauth-pending', error: null });
    try {
      const user = await githubService.validateToken(token);
      save(TOKEN_KEY, token);
      set({ token, userLogin: user.login, step: 'repo-pending', error: null });
      persistConnection(get());
    } catch (e) {
      set({ step: 'idle', error: e instanceof Error ? e.message : '토큰 검증에 실패했습니다.' });
    }
  },

  async connectRepo(repoFullName) {
    const { token } = get();
    set({ step: 'connecting', error: null });
    try {
      const [owner, repo] = repoFullName.split('/');
      if (!owner || !repo) throw new Error('레포지터리 형식이 올바르지 않습니다. (예: owner/repo)');
      const repoInfo = await githubService.getRepo(token, owner, repo);
      save(REPO_KEY, repoFullName);
      set({ repoFullName, repoInfo, connected: true, step: 'idle', error: null });
      persistConnection(get());
      await get().poll();
      startPolling(get().poll);
    } catch (e) {
      set({ step: 'repo-pending', error: e instanceof Error ? e.message : '레포지터리 연결에 실패했습니다.' });
    }
  },

  disconnect() {
    stopPolling();
    save(TOKEN_KEY, '');
    save(REPO_KEY, '');
    void deleteRemoteConnection();
    set({
      connected: false, token: '', repoFullName: '',
      userLogin: null, repoInfo: null, notifications: [],
      step: 'idle', error: null,
    });
    saveNotifications([]);
  },

  async poll() {
    const { token, repoFullName, seenIds } = get();
    if (!token || !repoFullName) return;
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) return;

    const newNotifs: GitHubNotification[] = [];

    const commits = await githubService.getRecentCommits(token, owner, repo);
    for (const c of commits) {
      const id = `commit-${c.sha}`;
      if (seenIds.has(id)) continue;
      const files = await githubService.getCommitFiles(token, owner, repo, c.sha);
      newNotifs.push({
        id, type: 'commit',
        title: c.commit.message.split('\n')[0],
        body: c.commit.message,
        htmlUrl: c.html_url,
        author: c.author?.login ?? c.commit.author.name,
        repo: repoFullName,
        ts: new Date(c.commit.author.date).getTime(),
        read: false, sha: c.sha, files,
      });
    }

    const prs = await githubService.getOpenPullRequests(token, owner, repo);
    for (const pr of prs) {
      const id = `pr-${pr.number}`;
      if (seenIds.has(id)) continue;
      newNotifs.push({
        id, type: 'pr',
        title: pr.title, body: pr.body ?? '',
        htmlUrl: pr.html_url, author: pr.user.login,
        repo: repoFullName,
        ts: new Date(pr.created_at).getTime(),
        read: false, number: pr.number,
        state: pr.state as 'open' | 'closed',
        labels: pr.labels.map(l => l.name),
      });
    }

    const issues = await githubService.getOpenIssues(token, owner, repo);
    for (const issue of issues) {
      const id = `issue-${issue.number}`;
      if (seenIds.has(id)) continue;
      newNotifs.push({
        id, type: 'issue',
        title: issue.title, body: issue.body ?? '',
        htmlUrl: issue.html_url, author: issue.user.login,
        repo: repoFullName,
        ts: new Date(issue.created_at).getTime(),
        read: false, number: issue.number,
        state: issue.state as 'open' | 'closed',
        labels: issue.labels.map(l => l.name),
      });
    }

    if (newNotifs.length === 0) return;
    const newSeenIds = new Set([...seenIds, ...newNotifs.map(n => n.id)]);
    saveSeenIds(newSeenIds);
    set(s => ({
      notifications: [...newNotifs, ...s.notifications]
        .filter((notification, index, list) => list.findIndex((item) => item.id === notification.id) === index)
        .sort((a, b) => b.ts - a.ts),
      seenIds: newSeenIds,
    }));
    saveNotifications(get().notifications);
    persistConnection(get());
  },

  markRead(id) {
    set(s => ({ notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    saveNotifications(get().notifications);
    persistConnection(get());
  },

  markAllRead() {
    set(s => ({ notifications: s.notifications.map(n => ({ ...n, read: true })) }));
    saveNotifications(get().notifications);
    persistConnection(get());
  },

  async initialize() {
    const remote = await fetchRemoteConnection();
    if (remote?.token) {
      save(TOKEN_KEY, remote.token);
      save(REPO_KEY, remote.repoFullName);
      const nextSeenIds = new Set(remote.seenIds);
      saveSeenIds(nextSeenIds);
      saveNotifications(remote.notifications);
      set({
        token: remote.token,
        repoFullName: remote.repoFullName,
        userLogin: remote.userLogin,
        repoInfo: remote.repoInfo,
        notifications: remote.notifications,
        seenIds: nextSeenIds,
        connected: Boolean(remote.repoFullName && remote.repoInfo),
      });
    }

    const { token, repoFullName } = get();
    if (!token) return;
    save(TOKEN_KEY, token);
    if (repoFullName) save(REPO_KEY, repoFullName);
    saveSeenIds(get().seenIds);

    try {
      const user = await githubService.validateToken(token);
      if (!repoFullName) {
        set({ userLogin: user.login, step: 'repo-pending', error: null });
        return;
      }

      const [owner, repo] = repoFullName.split('/');
      if (!owner || !repo) {
        set({ userLogin: user.login, step: 'repo-pending', error: null });
        return;
      }

      const repoInfo = await githubService.getRepo(token, owner, repo);
      set({ userLogin: user.login, repoInfo, connected: true, step: 'idle', error: null });
      await get().poll();
      startPolling(get().poll);
    } catch {
      stopPolling();
      save(TOKEN_KEY, '');
      set({ token: '', connected: false, userLogin: null, repoInfo: null, step: 'idle' });
    }
  },
}));
