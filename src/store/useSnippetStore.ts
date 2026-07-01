import { create } from 'zustand';
import type { SupportedLanguage } from '@/types/message';

export interface Snippet {
  id: string;
  title: string;
  language: SupportedLanguage;
  code: string;
  fileName?: string;
  ownerId?: string;
  tags: string[];
  createdAt: number;
  fromChannel?: string;
}

interface SnippetStore {
  snippets: Snippet[];
  setSnippets: (snippets: Snippet[]) => void;
  addSnippet: (snippet: Snippet) => void;
  updateSnippet: (id: string, patch: Partial<Snippet>) => void;
  removeSnippet: (id: string) => void;
}

const LOCAL_INITIAL: Snippet[] = [
  {
    id: 's1',
    title: 'JWT 토큰 검증',
    language: 'javascript',
    fileName: 'jwt-validate.js',
    code: "function validateToken(token) {\n  if (!token) throw new Error('missing_token');\n  const parts = token.split('.');\n  if (parts.length !== 3) throw new Error('malformed');\n  const payload = JSON.parse(atob(parts[1]));\n  const nowSec = Math.floor(Date.now() / 1000);\n  if (payload.exp && payload.exp < nowSec) throw new Error('expired');\n  return payload;\n}",
    tags: ['auth', 'jwt'],
    createdAt: Date.now() - 86400000,
    fromChannel: 'general',
  },
  {
    id: 's2',
    title: 'Python 토큰 디코더',
    language: 'python',
    fileName: 'decode_token.py',
    code: 'import base64, json, time\n\ndef decode_token(token):\n    parts = token.split(".")\n    if len(parts) != 3:\n        raise ValueError("잘못된 토큰 형식")\n    padding = 4 - len(parts[1]) % 4\n    payload = json.loads(base64.b64decode(parts[1] + "=" * padding))\n    if payload.get("exp", 0) < int(time.time()):\n        raise ValueError("토큰이 만료되었습니다")\n    return payload',
    tags: ['python', 'auth'],
    createdAt: Date.now() - 72000000,
    fromChannel: 'general',
  },
];

export const useSnippetStore = create<SnippetStore>((set) => ({
  snippets: import.meta.env.VITE_API_MODE === 'http' ? [] : LOCAL_INITIAL,
  setSnippets: (snippets) => set({ snippets }),
  addSnippet: (snippet) => set((state) => ({ snippets: [snippet, ...state.snippets] })),
  updateSnippet: (id, patch) =>
    set((state) => ({
      snippets: state.snippets.map((snippet) => (snippet.id === id ? { ...snippet, ...patch } : snippet)),
    })),
  removeSnippet: (id) =>
    set((state) => ({ snippets: state.snippets.filter((snippet) => snippet.id !== id) })),
}));
