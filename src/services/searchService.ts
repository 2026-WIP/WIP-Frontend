import { httpClient } from './adapters/httpClient';

export interface SearchResult {
  type: 'message' | 'code';
  messageId: string;
  channelId: string;
  channelName: string;
  authorName: string;
  snippet: string;
  codeLanguage?: string;
  fileName?: string;
  ts: number;
}

export const searchService = {
  async search(query: string, scope: 'all' | 'messages' | 'code'): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query, scope });
    const response = await httpClient.get<{ results: SearchResult[] }>(`/search?${params}`);
    return response.results;
  },
};
