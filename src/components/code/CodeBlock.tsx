import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { CodeBlockData, CodeBlockSavePatch, RunnerOutput } from '@/types/message';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { messageService } from '@/services/messageService';
import { runnerService } from '@/services/runnerService';
import { RunnerPanel } from './RunnerPanel';
import { useMessageContext } from '@/components/chat/MessageContext';
import { detectLanguage } from '@/utils/codeUtils';
import type { TerminalCwdKey } from '@/services/terminalService';

interface CodeBlockProps {
  block: CodeBlockData;
  onSaveBlock?: (patch: CodeBlockSavePatch) => void;
}

const Wrapper = styled.div`
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  overflow: hidden;
  margin: 4px 0;
`;

const Header = styled.div`
  background: #252525;
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const FileName = styled.span`
  font-size: 0.75rem;
  font-family: var(--font-code);
  color: rgba(255, 255, 255, 0.5);
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ActionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LangBadge = styled.span`
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 0.125rem;
`;

const RunBtn = styled.button`
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2px 8px;
  border-radius: 0.125rem;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: color 150ms, background 150ms;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.1);
  }
`;

const EditBtn = styled(RunBtn)`
  color: rgba(255, 255, 255, 0.7);
`;

const ProjectSelect = styled.select`
  height: 22px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.125rem;
  color: rgba(255, 255, 255, 0.72);
  font-family: var(--font-ui);
  font-size: 11px;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: rgba(242, 233, 116, 0.8);
  }

  option {
    background: #252525;
    color: #ffffff;
  }
`;

const CodeArea = styled.div`
  background: #1e1e1e;
  overflow: auto;
  height: 100%;
`;

const ContentRow = styled.div<{ $withSidePreview: boolean }>`
  display: flex;
  align-items: stretch;
  ${p => p.$withSidePreview
    ? 'height: 460px; overflow: hidden;'
    : 'min-height: 0;'
  }

  @media (max-width: 900px) {
    flex-direction: column;
    ${p => p.$withSidePreview && 'height: auto; overflow: visible;'}
  }
`;

const CodePane = styled.div`
  flex: 1;
  min-width: 0;
  background: #1e1e1e;
`;

const CodeBlockStyle = styled.div`
  position: relative;
  font-family: var(--font-code);
  font-size: 13px;

  & .react-syntax-highlighter-line-number {
    color: rgba(255, 255, 255, 0.2);
    user-select: none;
  }

  & .code-line {
    display: block;
    padding: 0 16px 0 8px;
    white-space: pre;
    line-height: 1.6;
    cursor: pointer;
  }

  & .code-line:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const ContextMenu = styled.div`
  position: fixed;
  z-index: 20;
  min-width: 140px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 4px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
`;

const ContextMenuButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: none;
  background: none;
  border-radius: 0.125rem;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--text-primary);
  text-align: left;

  &:hover {
    background: var(--bg-hover);
  }
`;

const EditOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(18, 18, 18, 0.42);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const EditDialog = styled.div`
  width: min(920px, 100%);
  max-height: 90vh;
  background: var(--bg-surface);
  border-radius: 0.5rem;
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const EditHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const EditTitle = styled.div`
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const EditBody = styled.div`
  padding: 16px;
  flex: 1;
  min-height: 0;
`;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 320px;
  max-height: 60vh;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 14px 16px;
  font-family: var(--font-code);
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-primary);
  background: var(--bg-surface);
  outline: none;
  white-space: pre;
  caret-color: var(--text-primary);

  &:focus {
    border-color: var(--text-primary);
  }
`;

const EditFooter = styled.div`
  padding: 12px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const EditButton = styled.button<{ $primary?: boolean }>`
  padding: 8px 14px;
  border-radius: 0.25rem;
  border: 1px solid ${p => (p.$primary ? 'var(--text-primary)' : 'var(--border)')};
  background: ${p => (p.$primary ? 'var(--text-primary)' : 'var(--bg-surface)')};
  color: ${p => (p.$primary ? 'var(--bg-surface)' : 'var(--text-primary)')};
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    filter: brightness(0.96);
  }
`;

function deriveFileName(block: CodeBlockData) {
  return block.fileName?.trim() ? block.fileName : 'None';
}

function inferLanguageFromFileName(fileName: string | undefined, fallback: CodeBlockData['language']) {
  if (!fileName?.trim()) return fallback;
  const ext = fileName.trim().split('.').pop()?.toLowerCase();
  const map: Record<string, CodeBlockData['language']> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    sh: 'bash',
    html: 'html',
    htm: 'html',
    css: 'css',
    txt: 'plain',
  };
  return ext ? (map[ext] ?? fallback) : fallback;
}

function getEffectiveLanguage(block: CodeBlockData) {
  const fileLanguage = inferLanguageFromFileName(block.fileName, block.language);
  return fileLanguage === 'plain' ? detectLanguage(block.code) : fileLanguage;
}

function getSyntaxLanguage(language: CodeBlockData['language']) {
  if (language === 'plain') return 'text';
  if (language === 'html') return 'markup';
  return language;
}

function isBrowserScript(code: string) {
  return /\b(document|window|localStorage|sessionStorage)\b|querySelector|getElementById|createElement|innerHTML|appendChild|addEventListener/.test(code);
}

function shouldShowPreview(block: CodeBlockData, language: CodeBlockData['language']) {
  if (language === 'html' || language === 'css') return true;
  if (language === 'javascript' || language === 'typescript') return isBrowserScript(block.code);
  return false;
}

function canRunInProject(language: CodeBlockData['language']) {
  return language === 'javascript' || language === 'typescript' || language === 'python' || language === 'java' || language === 'bash';
}

function buildEditReplyContent(
  fileName: string | undefined,
  language: CodeBlockData['language'],
  originalCode: string,
  modifiedCode: string
) {
  const heading = fileName?.trim() ? `**수정한 파일 :** ${fileName.trim()}` : '**코드 수정**';
  const label = language === 'plain' ? '' : language;

  return [
    heading,
    '',
    '**Before**',
    `\`\`\`${label}`,
    originalCode,
    '```',
    '',
    '**After**',
    `\`\`\`${label}`,
    modifiedCode,
    '```',
  ].join('\n');
}

export function CodeBlock({ block, onSaveBlock }: CodeBlockProps) {
  const { messageId } = useMessageContext();
  const runnerOpen = useUIStore((s) => s.runnerPanelOpen[block.id]);
  const toggleRunner = useUIStore((s) => s.toggleRunnerPanel);
  const setPendingQuote = useUIStore((s) => s.setPendingQuote);
  const currentUser = useAuthStore((s) => s.currentUser);
  const message = useMessagesStore((s) => (messageId ? s.messages[messageId] : undefined));
  const codeLines = block.code.split('\n');
  const effectiveLanguage = getEffectiveLanguage(block);
  const isPreview = shouldShowPreview(block, effectiveLanguage);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [editOpen, setEditOpen] = useState(false);
  const [draftCode, setDraftCode] = useState(block.code);
  const [draftFileName, setDraftFileName] = useState(block.fileName ?? '');
  const [runnerOutput, setRunnerOutput] = useState<RunnerOutput | null>(block.runnerOutput ?? null);
  const [runnerInput, setRunnerInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [projectCwdKey, setProjectCwdKey] = useState<TerminalCwdKey>('frontend');
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const hasAutoOpenedPreviewRef = useRef(false);
  const hasFocusedEditorRef = useRef(false);

  useEffect(() => {
    if (!editOpen) {
      hasFocusedEditorRef.current = false;
      return;
    }
    if (hasFocusedEditorRef.current) return;
    hasFocusedEditorRef.current = true;
    requestAnimationFrame(() => {
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(draftCode.length, draftCode.length);
    });
  }, [draftCode.length, editOpen]);

  useEffect(() => {
    if (!isPreview || runnerOpen || hasAutoOpenedPreviewRef.current) return;
    hasAutoOpenedPreviewRef.current = true;
    setRunnerOutput({ stdout: 'Preview ready', stderr: '', exitCode: 0, durationMs: 0 });
    toggleRunner(block.id);
  }, [block.id, isPreview, runnerOpen, toggleRunner]);

  useEffect(() => {
    function handleEscape(ev: KeyboardEvent) {
      if (ev.key === 'Escape') {
        setMenuOpen(false);
        setEditOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape as unknown as EventListener);
    return () => window.removeEventListener('keydown', handleEscape as unknown as EventListener);
  }, []);

  async function handleRunClick() {
    if (isRunning) return;
    if (!runnerOpen) {
      toggleRunner(block.id);
    }

    if (isPreview) {
      setRunnerOutput({ stdout: 'Preview ready', stderr: '', exitCode: 0, durationMs: 0 });
      return;
    }

    setIsRunning(true);
    try {
      const result = await runnerService.execute(effectiveLanguage, block.code, runnerInput);
      setRunnerOutput(result);
    } catch {
      setRunnerOutput({ stdout: '', stderr: '실행 중 오류가 발생했습니다.', exitCode: 1, durationMs: 0 });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleProjectRunClick() {
    if (isRunning || !canRunInProject(effectiveLanguage)) return;
    if (!runnerOpen) toggleRunner(block.id);
    setIsRunning(true);
    setRunnerOutput({
      stdout: `프로젝트 ${projectCwdKey} 컨텍스트에서 실행 중...\nimport와 프로젝트 패키지를 사용할 수 있습니다.`,
      stderr: '',
      exitCode: 0,
      durationMs: 0,
    });
    try {
      const result = await runnerService.executeProject(effectiveLanguage, block.code, block.fileName, projectCwdKey, runnerInput);
      setRunnerOutput(result);
    } catch (error) {
      setRunnerOutput({
        stdout: '',
        stderr: error instanceof Error ? error.message : '프로젝트 실행 중 오류가 발생했습니다.',
        exitCode: 1,
        durationMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }

  function openEditModal() {
    setDraftCode(block.code);
    setDraftFileName(block.fileName ?? '');
    setMenuOpen(false);
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (onSaveBlock) {
      onSaveBlock({ code: draftCode, fileName: draftFileName.trim() || undefined });
      setEditOpen(false);
      return;
    }

    if (!message || !messageId) return;

    const nextFileName = draftFileName.trim() || undefined;
    const replyLanguage = inferLanguageFromFileName(nextFileName, block.language);
    const replyContent = buildEditReplyContent(nextFileName, replyLanguage, block.code, draftCode);

    const reply = await messageService.sendMessage({
      channelId: message.channelId,
      authorId: currentUser?.id ?? 'anon',
      authorName: currentUser?.nickname ?? '익명',
      content: replyContent,
      codeBlocks: [{
        id: `${block.id}-reply-${Date.now()}`,
        code: draftCode,
        language: replyLanguage,
        fileName: nextFileName,
        originalCode: block.code,
        modifiedCode: draftCode,
      }],
      quoteRef: {
        messageId,
        lineNumber: 0,
        lineContent: block.code.split('\n')[0] ?? '',
      },
      status: message.status,
      kind: message.kind,
    });

    useUIStore.getState().setDiffPanelState(reply.id, 'hidden');
    setEditOpen(false);
  }

  function handleContextMenu(ev: React.MouseEvent) {
    if (!messageId && !onSaveBlock) return;
    ev.preventDefault();
    setMenuPosition({ x: ev.clientX, y: ev.clientY });
    setMenuOpen(true);
  }

  return (
    <Wrapper>
      <Header>
        <FileName>{deriveFileName(block)}</FileName>
        <HeaderRight>
          <ActionGroup>
            <LangBadge>{effectiveLanguage}</LangBadge>
            <RunBtn onClick={handleRunClick} disabled={isRunning}>
              {isRunning ? '실행 중...' : isPreview ? '프리뷰' : runnerOutput ? '재실행' : '실행'}
            </RunBtn>
            {canRunInProject(effectiveLanguage) && (
              <>
                <ProjectSelect
                  value={projectCwdKey}
                  title="프로젝트 실행 위치"
                  onChange={(event) => setProjectCwdKey(event.target.value as TerminalCwdKey)}
                  disabled={isRunning}
                >
                  <option value="frontend">FE</option>
                  <option value="backend">BE</option>
                  <option value="root">Root</option>
                </ProjectSelect>
                <RunBtn
                  onClick={handleProjectRunClick}
                  disabled={isRunning}
                  title="선택한 프로젝트 위치에서 임시 파일로 실행합니다. import와 패키지 참조가 가능합니다."
                >
                  프로젝트 실행
                </RunBtn>
              </>
            )}
            <EditBtn onClick={openEditModal}>수정</EditBtn>
          </ActionGroup>
        </HeaderRight>
      </Header>

      <ContentRow $withSidePreview={runnerOpen && isPreview}>
        <CodePane>
          <CodeArea onContextMenu={handleContextMenu} onClick={() => setMenuOpen(false)}>
            <CodeBlockStyle>
              {menuOpen && (messageId || onSaveBlock) && (
                <ContextMenu
                  style={{ left: menuPosition.x, top: menuPosition.y }}
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <ContextMenuButton onClick={openEditModal}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                    수정
                  </ContextMenuButton>
                </ContextMenu>
              )}
              <SyntaxHighlighter
                language={getSyntaxLanguage(effectiveLanguage)}
                style={vscDarkPlus}
                showLineNumbers
                showInlineLineNumbers
                wrapLines
                wrapLongLines={false}
                useInlineStyles
                lineProps={(lineNumber) => ({
                  className: 'code-line',
                  onClick: () => {
                    if (!messageId) return;
                    const index = Math.max(0, lineNumber - 1);
                    setPendingQuote({
                      messageId,
                      lineNumber: index,
                      lineContent: codeLines[index] ?? '',
                    });
                  },
                })}
                customStyle={{ margin: 0, background: 'transparent', padding: 0 }}
                lineNumberStyle={{
                  display: 'inline-block',
                  minWidth: '3em',
                  paddingRight: '1em',
                  textAlign: 'right',
                }}
              >
                {block.code}
              </SyntaxHighlighter>
            </CodeBlockStyle>
          </CodeArea>
        </CodePane>

        {runnerOpen && isPreview && (
          <RunnerPanel
            output={runnerOutput ?? undefined}
            isRunning={isRunning}
            onRerun={() => setRunnerOutput({ stdout: 'Preview ready', stderr: '', exitCode: 0, durationMs: 0 })}
            onClose={() => toggleRunner(block.id)}
            stdin={runnerInput}
            onStdinChange={setRunnerInput}
            previewCode={block.code}
            previewLanguage={effectiveLanguage}
            previewFileName={block.fileName}
            placement="side"
          />
        )}
      </ContentRow>

      {editOpen && (messageId || onSaveBlock) && (
        <EditOverlay onClick={() => setEditOpen(false)}>
          <EditDialog onClick={(ev) => ev.stopPropagation()}>
            <EditHeader>
              <EditTitle>코드 수정</EditTitle>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {block.language}
              </div>
            </EditHeader>
            <EditBody>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '6px' }}>
                  FILE NAME
                </div>
                <input
                  value={draftFileName}
                  onChange={(ev) => setDraftFileName(ev.target.value)}
                  placeholder="예: main.js"
                  style={{
                    width: '100%',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    color: 'var(--text-primary)',
                    borderRadius: '0.25rem',
                    padding: '10px 12px',
                    fontFamily: "var(--font-code)",
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <EditTextarea
                ref={editorRef}
                value={draftCode}
                onChange={(ev) => setDraftCode(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key !== 'Tab') return;
                  ev.preventDefault();
                  const el = ev.currentTarget;
                  const start = el.selectionStart;
                  const end = el.selectionEnd;
                  const indent = '  ';
                  if (start === end) {
                    const next = draftCode.slice(0, start) + indent + draftCode.slice(end);
                    setDraftCode(next);
                    requestAnimationFrame(() => el.setSelectionRange(start + indent.length, start + indent.length));
                  } else {
                    const lineStart = draftCode.lastIndexOf('\n', start - 1) + 1;
                    const lineEnd = draftCode.indexOf('\n', end - 1);
                    const block = draftCode.slice(lineStart, lineEnd === -1 ? draftCode.length : lineEnd);
                    const newLines = ev.shiftKey
                      ? block.split('\n').map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l))
                      : block.split('\n').map((l) => indent + l);
                    const newBlock = newLines.join('\n');
                    const endIdx = lineEnd === -1 ? draftCode.length : lineEnd;
                    setDraftCode(draftCode.slice(0, lineStart) + newBlock + draftCode.slice(endIdx));
                    const firstRemoved = ev.shiftKey && block.split('\n')[0].startsWith(indent) ? indent.length : 0;
                    requestAnimationFrame(() => el.setSelectionRange(
                      Math.max(lineStart, start - firstRemoved),
                      end + (newBlock.length - block.length),
                    ));
                  }
                }}
                spellCheck={false}
              />
            </EditBody>
            <EditFooter>
              <EditButton onClick={() => setEditOpen(false)}>취소</EditButton>
              <EditButton $primary onClick={handleSaveEdit}>저장</EditButton>
            </EditFooter>
          </EditDialog>
        </EditOverlay>
      )}

      {runnerOpen && !isPreview && (
        <RunnerPanel
          output={runnerOutput ?? undefined}
          isRunning={isRunning}
          onRerun={async (stdin = runnerInput) => {
            if (isPreview) {
              setRunnerOutput({ stdout: 'Preview ready', stderr: '', exitCode: 0, durationMs: 0 });
              return;
            }
            setIsRunning(true);
            try {
              const result = await runnerService.execute(effectiveLanguage, block.code, stdin);
              setRunnerOutput(result);
            } catch {
              setRunnerOutput({ stdout: '', stderr: '실행 중 오류가 발생했습니다.', exitCode: 1, durationMs: 0 });
            } finally {
              setIsRunning(false);
            }
          }}
          onClose={() => toggleRunner(block.id)}
          stdin={runnerInput}
          onStdinChange={setRunnerInput}
          previewCode={isPreview ? block.code : undefined}
          previewLanguage={effectiveLanguage}
          previewFileName={block.fileName}
        />
      )}
    </Wrapper>
  );
}
