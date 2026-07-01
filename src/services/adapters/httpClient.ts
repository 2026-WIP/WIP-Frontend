import { useAuthStore } from '@/store/useAuthStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

interface RequestOptions extends RequestInit {
  json?: unknown;
  _isRetry?: boolean; // 무한루프 방지
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { _isRetry, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers);
  if (fetchOptions.json !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...fetchOptions,
    credentials: 'include',
    headers,
    body: fetchOptions.json !== undefined ? JSON.stringify(fetchOptions.json) : fetchOptions.body,
  });

  // 401 → 리프레시 토큰으로 재시도 (무한루프 방지)
  if (response.status === 401 && !_isRetry && path !== '/auth/refresh' && path !== '/auth/login') {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        // 새 액세스 토큰 발급 성공 → 원래 요청 재시도
        return request<T>(path, { ...options, _isRetry: true });
      }
    } catch {
      // 리프레시 실패 → 아래 에러 처리로 진행
    }
    useAuthStore.getState().clearUser();
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof payload === 'object' && payload && 'error' in payload
      ? String(payload.error)
      : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export const httpClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, json?: unknown) => request<T>(path, { method: 'POST', json }),
  put: <T>(path: string, json?: unknown) => request<T>(path, { method: 'PUT', json }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
