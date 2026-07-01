export interface PendingQuote {
  messageId: string;
  lineNumber: number;
  lineContent: string;
}

export type DiffPanelState = 'hidden' | 'inline' | 'expanded';

export type RunnerPanelState = Record<string, boolean>;
