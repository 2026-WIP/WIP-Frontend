export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'bash'
  | 'html'
  | 'css'
  | 'plain';

export interface RunnerOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  compiler?: string;
}

export interface CodeBlockData {
  id: string;
  code: string;
  language: SupportedLanguage;
  fileName?: string;
  runnerOutput?: RunnerOutput;
  originalCode?: string;
  modifiedCode?: string;
}

export interface CodeBlockSavePatch {
  code: string;
  fileName?: string;
}

export interface QuoteReference {
  messageId: string;
  lineNumber: number;
  lineContent: string;
}

export type ReactionMap = Record<string, string[]>;

export interface ChatMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  content: string;
  codeBlocks: CodeBlockData[];
  quoteRef?: QuoteReference;
  parentId?: string;
  threadCount?: number;
  reactions?: ReactionMap;
  createdAt: number;
  updatedAt?: number;
  status: 'in-progress' | 'completed';
  kind: 'chat' | 'task';
}
