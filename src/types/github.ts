export type GitHubEventType = 'commit' | 'pr' | 'issue';

export interface GitHubChangedFile {
  filename: string;
  status: 'added' | 'modified' | 'removed' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  sha: string;
}

export interface GitHubNotification {
  id: string;
  type: GitHubEventType;
  title: string;
  body: string;
  htmlUrl: string;
  author: string;
  authorAvatar?: string;
  repo: string;
  ts: number;
  read: boolean;
  sha?: string;
  files?: GitHubChangedFile[];
  number?: number;
  state?: 'open' | 'closed' | 'merged';
  labels?: string[];
}

export interface GitHubRepoInfo {
  fullName: string;
  description: string | null;
  starCount: number;
  defaultBranch: string;
  htmlUrl: string;
  language: string | null;
}

export interface GitHubConnection {
  token: string;
  userLogin: string | null;
  repoFullName: string;
  repoInfo: GitHubRepoInfo | null;
  notifications: GitHubNotification[];
  seenIds: string[];
  updatedAt?: number;
}
