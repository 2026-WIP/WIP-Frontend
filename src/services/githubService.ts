import type { GitHubChangedFile, GitHubRepoInfo } from '@/types/github';

const API = 'https://api.github.com';

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export const githubService = {
  async validateToken(token: string): Promise<{ login: string; avatar_url: string }> {
    const res = await fetch(`${API}/user`, { headers: headers(token) });
    if (!res.ok) throw new Error('토큰이 유효하지 않거나 권한이 부족합니다.');
    return res.json() as Promise<{ login: string; avatar_url: string }>;
  },

  async getRepo(token: string, owner: string, repo: string): Promise<GitHubRepoInfo> {
    const res = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) });
    if (res.status === 404) throw new Error('레포지터리를 찾을 수 없습니다.');
    if (!res.ok) throw new Error('레포지터리 정보를 불러오지 못했습니다.');
    const data = await res.json() as {
      full_name: string; description: string | null; stargazers_count: number;
      default_branch: string; html_url: string; language: string | null;
    };
    return {
      fullName: data.full_name,
      description: data.description,
      starCount: data.stargazers_count,
      defaultBranch: data.default_branch,
      htmlUrl: data.html_url,
      language: data.language,
    };
  },

  async getRecentCommits(token: string, owner: string, repo: string, since?: string) {
    const params = new URLSearchParams({ per_page: '10' });
    if (since) params.set('since', since);
    const res = await fetch(`${API}/repos/${owner}/${repo}/commits?${params}`, { headers: headers(token) });
    if (!res.ok) return [];
    return res.json() as Promise<Array<{
      sha: string;
      html_url: string;
      commit: { message: string; author: { name: string; date: string } };
      author: { login: string; avatar_url: string } | null;
    }>>;
  },

  async getCommitFiles(token: string, owner: string, repo: string, sha: string): Promise<GitHubChangedFile[]> {
    const res = await fetch(`${API}/repos/${owner}/${repo}/commits/${sha}`, { headers: headers(token) });
    if (!res.ok) return [];
    const data = await res.json() as { files?: Array<{
      filename: string; status: GitHubChangedFile['status'];
      additions: number; deletions: number; sha: string;
    }> };
    return (data.files ?? []).map(f => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      sha: f.sha,
    }));
  },

  async getOpenPullRequests(token: string, owner: string, repo: string) {
    const res = await fetch(`${API}/repos/${owner}/${repo}/pulls?state=open&per_page=5`, { headers: headers(token) });
    if (!res.ok) return [];
    return res.json() as Promise<Array<{
      number: number; title: string; html_url: string;
      state: 'open' | 'closed'; created_at: string;
      user: { login: string; avatar_url: string };
      labels: Array<{ name: string }>;
      body: string | null;
    }>>;
  },

  async getOpenIssues(token: string, owner: string, repo: string) {
    const res = await fetch(`${API}/repos/${owner}/${repo}/issues?state=open&per_page=5`, { headers: headers(token) });
    if (!res.ok) return [];
    const data = await res.json() as Array<{
      number: number; title: string; html_url: string;
      state: 'open' | 'closed'; created_at: string;
      user: { login: string; avatar_url: string };
      labels: Array<{ name: string }>;
      body: string | null;
      pull_request?: unknown;
    }>;
    return data.filter(i => !i.pull_request);
  },

  async getFileContent(token: string, owner: string, repo: string, path: string, ref?: string): Promise<string> {
    const params = ref ? `?ref=${encodeURIComponent(ref)}` : '';
    const res = await fetch(`${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}${params}`, { headers: headers(token) });
    if (!res.ok) throw new Error('파일을 불러올 수 없습니다.');
    const data = await res.json() as { encoding: string; content: string };
    if (data.encoding === 'base64') {
      return atob(data.content.replace(/\n/g, ''));
    }
    return data.content;
  },
};
