import type { SupportedLanguage } from '@/types/message';

const LANG_MAP: Record<string, SupportedLanguage> = {
  js: 'javascript',
  jsx: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  typescript: 'typescript',
  py: 'python',
  python: 'python',
  java: 'java',
  sh: 'bash',
  bash: 'bash',
  shell: 'bash',
  html: 'html',
  htm: 'html',
  css: 'css',
};

export function normalizeLanguage(raw: string): SupportedLanguage {
  return LANG_MAP[raw.toLowerCase()] ?? 'plain';
}

// 언어 태그 없는 코드 블록에 대해 코드 내용으로 언어 추측
export function detectLanguage(code: string): SupportedLanguage {
  if (/<\/?(html|head|body|div|section|main|button|input|script|style)\b/i.test(code)) return 'html';
  if (/^\s*[\w.#:[\]-]+\s*\{[\s\S]*?:[\s\S]*?\}/m.test(code)) return 'css';
  if (/\bpublic\s+class\b|\bSystem\.out\.print|\bString\[\]\s+args/.test(code)) return 'java';
  if (/\bdef\s+\w+\s*\(|^\s*print\s*\(|^\s*import\s+\w|^\s*from\s+\w+\s+import/m.test(code)) return 'python';
  if (/\bconst\s|\blet\s|\bvar\s|\bconsole\.log\b|=>\s*\{/.test(code)) return 'javascript';
  if (/:\s*(string|number|boolean|void)\b|\binterface\s+\w|\btype\s+\w+\s*=/.test(code)) return 'typescript';
  if (/^#!/.test(code) || /\becho\s|\b\$\(\(|\bfi\b|\bthen\b/.test(code)) return 'bash';
  return 'plain';
}
