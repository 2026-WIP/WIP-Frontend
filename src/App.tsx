import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';
import { SignupPage } from '@/pages/SignupPage';
import { FindPasswordPage } from '@/pages/FindPasswordPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { GitHubOAuthCallbackPage } from '@/pages/GitHubOAuthCallbackPage';
import { HomePage } from '@/pages/HomePage';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { applyDensity, applyFont, applyTheme, useUIStore } from '@/store/useUIStore';
import { useGitHubStore } from '@/store/useGitHubStore';

export default function App() {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const theme = useUIStore((s) => s.theme);
  const font = useUIStore((s) => s.font);
  const density = useUIStore((s) => s.density);
  const initializeGitHub = useGitHubStore((s) => s.initialize);

  useEffect(() => {
    authService.init();
  }, []);

  useEffect(() => {
    initializeGitHub().catch(() => {});
  }, [initializeGitHub]);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    applyFont(font);
  }, [font]);

  useEffect(() => {
    applyDensity(density);
  }, [density]);

  if (isInitializing) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg-app)',
        fontFamily: 'var(--font-ui)',
        color: 'var(--text-muted)',
        fontSize: '0.9375rem',
      }}>
        불러오는 중...
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/find-password" element={<FindPasswordPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />

        <Route
          path="/app/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/github-oauth-callback" element={<GitHubOAuthCallbackPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
