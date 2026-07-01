import { httpClient } from './adapters/httpClient';
import type { RunnerOutput } from '@/types/message';
import type { TerminalCwdKey } from './terminalService';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

export const runnerService = {
  async execute(language: string, code: string, stdin = ''): Promise<RunnerOutput> {
    if (!isHttp) {
      // 로컬 모드: 간단한 JS 시뮬레이션 (실제 실행은 백엔드 전용)
      const durationMs = Math.floor(Math.random() * 120) + 20;
      return { stdout: `[${language}] 로컬 모드 — 실제 실행하려면 백엔드를 시작하세요.`, stderr: '', exitCode: 0, durationMs };
    }
    return httpClient.post<RunnerOutput>('/runner/execute', { language, code, stdin });
  },

  async executeProject(language: string, code: string, fileName: string | undefined, cwdKey: TerminalCwdKey, stdin = ''): Promise<RunnerOutput> {
    if (!isHttp) {
      return { stdout: '', stderr: '프로젝트 실행은 HTTP 백엔드가 필요합니다.', exitCode: 1, durationMs: 0 };
    }
    return httpClient.post<RunnerOutput>('/runner/project', { language, code, fileName, cwdKey, stdin });
  },
};
