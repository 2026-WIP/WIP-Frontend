import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function GitHubOAuthCallbackPage() {
  const [params] = useSearchParams();
  const calledRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = params.get('code');
    const error = params.get('error');

    if (error || !code) {
      const msg = error === 'access_denied' ? '인증이 취소되었습니다.' : (error ?? '코드가 없습니다.');
      if (window.opener) {
        window.opener.postMessage({ type: 'github-oauth-error', error: msg }, window.location.origin);
        window.close();
      } else {
        setErrorMsg(msg);
      }
      return;
    }

    // 백엔드에서 code → access_token 교환
    fetch('/api/github/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(body.error ?? `서버 오류 (${res.status})`);
        }
        return res.json() as Promise<{ access_token: string }>;
      })
      .then(({ access_token }) => {
        if (window.opener) {
          window.opener.postMessage({ type: 'github-oauth-success', access_token }, window.location.origin);
          window.close();
        } else {
          // 팝업이 아닌 경우: localStorage를 통해 전달 후 이동
          localStorage.setItem('wip_github_oauth_token', access_token);
          window.location.replace('/app/settings');
        }
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : '알 수 없는 오류';
        if (window.opener) {
          window.opener.postMessage({ type: 'github-oauth-error', error: msg }, window.location.origin);
          window.close();
        } else {
          setErrorMsg(msg);
        }
      });
  }, []);

  if (errorMsg) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-app)',
        fontFamily: 'var(--font-ui)', flexDirection: 'column', gap: '16px', padding: '24px',
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--danger)' }}>error</span>
        <p style={{ color: 'var(--danger)', fontSize: '0.9375rem', textAlign: 'center' }}>{errorMsg}</p>
        <button
          onClick={() => window.close()}
          style={{
            padding: '8px 20px', background: 'var(--accent)', border: 'none',
            borderRadius: '0.25rem', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 700,
          }}
        >
          닫기
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-app)',
      fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', fontSize: '0.9375rem',
      flexDirection: 'column', gap: '12px',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.4 }}>pending</span>
      GitHub 인증 처리 중...
    </div>
  );
}
