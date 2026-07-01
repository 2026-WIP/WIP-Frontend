import { httpClient } from './adapters/httpClient';
import { useSnippetStore, type Snippet } from '@/store/useSnippetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { v4 as uuidv4 } from 'uuid';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

interface SnippetResponse  { snippet: Snippet; }
interface SnippetsResponse { snippets: Snippet[]; }

export const snippetService = {
  async fetchSnippets(): Promise<Snippet[]> {
    if (!isHttp) return useSnippetStore.getState().snippets;
    const response = await httpClient.get<SnippetsResponse>('/snippets');
    useSnippetStore.getState().setSnippets(response.snippets);
    return response.snippets;
  },

  async createSnippet(data: Omit<Snippet, 'id' | 'createdAt' | 'ownerId'>): Promise<Snippet> {
    if (!isHttp) {
      const ownerId = useAuthStore.getState().currentUser?.id;
      const snippet: Snippet = { ...data, id: uuidv4(), createdAt: Date.now(), ownerId };
      useSnippetStore.getState().addSnippet(snippet);
      return snippet;
    }
    const response = await httpClient.post<SnippetResponse>('/snippets', data);
    useSnippetStore.getState().addSnippet(response.snippet);
    return response.snippet;
  },

  async updateSnippet(id: string, patch: Partial<Snippet>): Promise<Snippet> {
    if (!isHttp) {
      useSnippetStore.getState().updateSnippet(id, patch);
      const found = useSnippetStore.getState().snippets.find((s) => s.id === id);
      return found as Snippet;
    }
    const response = await httpClient.put<SnippetResponse>(`/snippets/${encodeURIComponent(id)}`, patch);
    useSnippetStore.getState().updateSnippet(id, response.snippet);
    return response.snippet;
  },

  async deleteSnippet(id: string): Promise<void> {
    if (!isHttp) {
      useSnippetStore.getState().removeSnippet(id);
      return;
    }
    await httpClient.delete<void>(`/snippets/${encodeURIComponent(id)}`);
    useSnippetStore.getState().removeSnippet(id);
  },
};
