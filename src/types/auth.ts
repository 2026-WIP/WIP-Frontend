export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  githubUsername?: string;
  createdAt: number;
}

export interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
