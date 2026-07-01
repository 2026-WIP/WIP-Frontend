import { httpClient } from './adapters/httpClient';

export interface TerminalResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
  cwdKey: TerminalCwdKey;
  durationMs: number;
}

export type TerminalCwdKey = 'root' | 'frontend' | 'backend';

export const terminalService = {
  execute(command: string, cwdKey: TerminalCwdKey): Promise<TerminalResult> {
    return httpClient.post<TerminalResult>('/terminal/execute', { command, cwdKey });
  },
};
