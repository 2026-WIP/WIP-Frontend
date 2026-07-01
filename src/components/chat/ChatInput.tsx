import styled from 'styled-components';
import { useEffect, useRef, useState, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUIStore } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { messageService } from '@/services/messageService';
import { emitTypingStart, emitTypingStop } from '@/services/socketService';
import { normalizeLanguage, detectLanguage } from '@/utils/codeUtils';
import { isImeComposingEvent } from '@/utils/keyboardUtils';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import type { ChatMessage, CodeBlockData, SupportedLanguage } from '@/types/message';
import type { User } from '@/types/auth';

interface ChatInputProps {
  channelId: string;
}

const LANGUAGE_BY_FILE_EXT: Record<string, SupportedLanguage> = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python',
  java: 'java', sh: 'bash', html: 'html', htm: 'html', css: 'css', txt: 'plain',
};

function extractCodeBlocks(content: string): CodeBlockData[] {
  const blocks: CodeBlockData[] = [];
  const regex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[1].trim();
    const code = match[2];
    // 언어 태그가 없으면 코드 내용으로 자동 감지
    const language = tag ? normalizeLanguage(tag) : detectLanguage(code);
    blocks.push({ id: uuidv4(), language, code });
  }
  return blocks;
}

function inferLanguageFromFileName(fileName: string | undefined, fallback: SupportedLanguage = 'plain'): SupportedLanguage {
  if (!fileName?.trim()) return fallback;
  const ext = fileName.trim().split('.').pop()?.toLowerCase();
  if (!ext) return fallback;
  return LANGUAGE_BY_FILE_EXT[ext] ?? fallback;
}

function insertTextAtSelection(el: HTMLTextAreaElement, text: string) {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const value = el.value.slice(0, start) + text + el.value.slice(end);
  return { value, selectionStart: start + text.length, selectionEnd: start + text.length };
}

function insertAtCursor(el: HTMLTextAreaElement, before: string, after = '', placeholder = '') {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selected = el.value.slice(start, end) || placeholder;
  return el.value.slice(0, start) + before + selected + after + el.value.slice(end);
}

function cursorAfterInsert(el: HTMLTextAreaElement, before: string, placeholder = ''): [number, number] {
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const selectedLen = start !== end ? end - start : placeholder.length;
  return [start + before.length, start + before.length + selectedLen];
}

// ??? ?ㅽ??????????????????????????????????????????????????????????????????????

const Wrapper = styled.div`
  padding: 20px 24px;
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
`;

const PreviewPane = styled.div`
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 0.25rem 0.25rem 0 0;
  padding: 12px 16px;
  max-height: 260px;
  overflow-y: auto;
  font-size: 0.875rem;
  line-height: 1.6;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

const PreviewLabel = styled.div`
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 8px;
`;

const InputBox = styled.div<{ $quoted: boolean; $preview: boolean }>`
  background: var(--bg-surface);
  border: 1px solid ${p => p.$quoted ? 'var(--accent)' : 'var(--border)'};
  border-top: ${p => p.$preview ? 'none' : undefined};
  border-radius: ${p => p.$preview ? '0 0 0.25rem 0.25rem' : '0.25rem'};
  overflow: hidden;
  transition: border-color 150ms;

  &:focus-within {
    border-width: 2px;
    border-color: ${p => p.$quoted ? 'var(--accent)' : 'var(--text-primary)'};
    border-top: ${p => p.$preview ? 'none' : undefined};
  }
`;

const QuoteStrip = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 6px 12px;
  background: rgba(242,233,116,0.08);
  border-bottom: 1px solid rgba(242,233,116,0.3);
`;

const QuoteLabel = styled.span`
  font-family: var(--font-ui); font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted);
`;

const QuoteText = styled.span`
  font-family: var(--font-code); font-size: 0.75rem;
  flex: 1; color: var(--text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const QuoteDismiss = styled.button`
  background: none; border: none; cursor: pointer; color: var(--text-muted);
  display: flex; align-items: center; padding: 0;
  &:hover { color: var(--text-primary); }
`;

const MentionDropdown = styled.div`
  position: absolute; bottom: 100%; left: 0; right: 0; z-index: 100;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  max-height: 200px; overflow-y: auto;
`;

const MentionItem = styled.button<{ $active: boolean }>`
  width: 100%; display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; border: none; background: ${p => p.$active ? 'var(--bg-hover)' : 'transparent'};
  cursor: pointer; text-align: left;
  &:hover { background: var(--bg-hover); }
`;

const MentionAvatar = styled.div`
  width: 24px; height: 24px; border-radius: 50%; background: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-ui); font-size: 10px; font-weight: 700;
  color: var(--accent-text); flex-shrink: 0;
`;

const MentionName = styled.span`
  font-family: var(--font-ui); font-size: 0.8125rem; color: var(--text-primary); font-weight: 600;
`;

const InputWrap = styled.div`
  position: relative;
`;

const Textarea = styled.textarea`
  width: 100%; background: transparent; border: none; outline: none;
  resize: none; min-height: 80px; max-height: 320px;
  padding: 14px 16px;
  font-size: 0.9375rem; color: var(--text-primary);
  font-family: var(--font-body); line-height: 1.6;
  &::placeholder { color: var(--text-muted); opacity: 0.55; }
  &:disabled { opacity: 0.5; }
`;

const Toolbar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  border-top: 1px solid var(--border); padding: 6px 10px; background: var(--bg-app);
`;

const ToolbarLeft = styled.div`
  display: flex; align-items: center; gap: 2px;
`;

const MetaBar = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px 0; flex-wrap: wrap;
`;

const MetaLabel = styled.span`
  font-family: var(--font-ui); font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted);
`;

const MetaInput = styled.input`
  min-width: 180px; font-size: 0.8125rem; font-family: var(--font-ui);
  border: 1px solid var(--border); border-radius: 0.25rem; padding: 6px 10px;
  color: var(--text-primary); background: var(--bg-surface); outline: none;
  &:focus { border-color: var(--text-primary); }
`;

const ToolbarBtn = styled.button<{ $active?: boolean }>`
  padding: 6px 7px;
  background: ${p => p.$active ? 'var(--accent)' : 'none'};
  border: none; cursor: pointer; border-radius: 0.25rem;
  display: flex; align-items: center;
  color: ${p => p.$active ? 'var(--accent-text)' : 'var(--text-muted)'};
  &:hover { background: ${p => p.$active ? 'var(--accent)' : 'var(--bg-panel)'}; color: var(--text-primary); }
`;

const ToolbarDivider = styled.div`
  width: 1px; height: 18px; background: var(--border); margin: 0 4px;
`;

const SendButton = styled.button`
  background: var(--accent); color: var(--accent-text);
  padding: 7px 20px; border-radius: 0.25rem;
  font-size: 0.875rem; font-weight: 700; border: none; cursor: pointer;
  font-family: var(--font-ui);
  display: flex; align-items: center; gap: 6px;
  &:hover { filter: brightness(0.93); }
  &:active { transform: scale(0.97); }
  &:disabled { opacity: 0.4; cursor: not-allowed; transform: none; filter: none; }
`;

const Hint = styled.p`
  margin-top: 8px; font-size: 11px;
  color: var(--text-muted); font-family: var(--font-code);
  opacity: 0.72;
`;

// Component

export function ChatInput({ channelId }: ChatInputProps) {
  const [text, setText] = useState(() => useUIStore.getState().chatDrafts[channelId] ?? '');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [sendAsTask, setSendAsTask] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // @멘션 자동완성 상태
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionAnchor, setMentionAnchor] = useState(0); // @ 문자 위치
  const [mentionIndex, setMentionIndex] = useState(0);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);
  const isComposingRef = useRef(false);
  const allowLineBreakRef = useRef(false);

  const pendingQuote = useUIStore((state) => state.pendingQuote);
  const setPendingQuote = useUIStore((state) => state.setPendingQuote);
  const setChatDraft = useUIStore((state) => state.setChatDraft);
  const currentUser = useAuthStore((state) => state.currentUser);
  const channelName = useMessagesStore((state) => state.channels[channelId]?.name);

  useEffect(() => {
    if (pendingQuote) textareaRef.current?.focus();
  }, [pendingQuote]);

  // 채널 변경 시 워크스페이스 멤버 로드
  useEffect(() => {
    messageService.fetchWorkspaceMembers().then(setWorkspaceMembers).catch(() => {});
  }, [channelId]);

  // Mention filtering
  const filteredMembers = mentionActive && mentionQuery
    ? workspaceMembers.filter((m) =>
        m.nickname.toLowerCase().includes(mentionQuery.toLowerCase()) && m.id !== currentUser?.id
      ).slice(0, 8)
    : [];

  // 타이핑 이벤트 emit (debounced)
  const handleTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      emitTypingStart(channelId);
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      emitTypingStop(channelId);
    }, 2000);
  }, [channelId]);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      if (isTypingRef.current) emitTypingStop(channelId);
    };
  }, [channelId]);

  function handleTextChange(value: string) {
    const nextValue = value;
    console.log('[chat-input] typed:', nextValue);
    textRef.current = nextValue;
    setText(nextValue);
    setChatDraft(channelId, nextValue);
    handleTyping();

    // @멘션 감지
    const el = textareaRef.current;
    if (!el) return;
    const cursor = el.selectionStart;
    const before = nextValue.slice(0, cursor);
    const atIdx = before.lastIndexOf('@');
    if (atIdx >= 0 && (atIdx === 0 || /\s/.test(before[atIdx - 1]))) {
      const query = before.slice(atIdx + 1);
      if (!/\s/.test(query)) {
        setMentionAnchor(atIdx);
        setMentionQuery(query);
        setMentionActive(true);
        setMentionIndex(0);
        return;
      }
    }
    setMentionActive(false);
  }

  function insertMention(member: User) {
    const el = textareaRef.current;
    if (!el) return;
    const before = text.slice(0, mentionAnchor);
    const after = text.slice(el.selectionStart);
    const next = `${before}@${member.nickname} ${after}`;
    setText(next);
    setChatDraft(channelId, next);
    setMentionActive(false);
    const newCursor = mentionAnchor + member.nickname.length + 2;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newCursor, newCursor);
    });
  }

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    console.log('[chat-input] sent:', trimmed);
    setSending(true);
    if (isTypingRef.current) { emitTypingStop(channelId); isTypingRef.current = false; }

    const msg: Omit<ChatMessage, 'id' | 'createdAt'> = {
      channelId,
      authorId: currentUser?.id ?? 'anon',
      authorName: currentUser?.nickname ?? '익명',
      content: trimmed,
      codeBlocks: extractCodeBlocks(trimmed).map((block, index) => {
        const nextFileName = index === 0 ? fileName.trim() || undefined : undefined;
        return {
          ...block,
          fileName: nextFileName,
          language: inferLanguageFromFileName(index === 0 ? fileName : undefined, block.language),
        };
      }),
      quoteRef: pendingQuote ?? undefined,
      status: sendAsTask ? 'in-progress' : 'completed',
      kind: sendAsTask ? 'task' : 'chat',
    };

    const sentDraft = text;
    const sentQuote = pendingQuote;
    textRef.current = '';
    setText('');
    setChatDraft(channelId, '');
    setPendingQuote(null);
    setShowPreview(false);
    setSendError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());

    try {
      await messageService.sendMessage(msg);
    } catch (err) {
      if (!textRef.current.trim()) {
        textRef.current = sentDraft;
        setText(sentDraft);
        setChatDraft(channelId, sentDraft);
        setPendingQuote(sentQuote);
      }
      setSendError(err instanceof Error ? err.message : '메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    allowLineBreakRef.current = false;

    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const next = insertTextAtSelection(el, '\n');
      setText(next.value);
      setChatDraft(channelId, next.value);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(next.selectionStart, next.selectionEnd);
      });
      return;
    }

    if (event.key === 'Enter' && isComposingRef.current) {
      event.preventDefault();
      return;
    }

    // Mention dropdown navigation
    if (mentionActive && filteredMembers.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setMentionIndex((i) => (i + 1) % filteredMembers.length);
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setMentionIndex((i) => (i - 1 + filteredMembers.length) % filteredMembers.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        insertMention(filteredMembers[mentionIndex]);
        return;
      }
      if (event.key === 'Escape') {
        setMentionActive(false);
        return;
      }
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      const el = textareaRef.current;
      if (!el) return;
      const next = insertTextAtSelection(el, '\t');
      setText(next.value);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(next.selectionStart, next.selectionEnd);
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (isImeComposingEvent(event)) {
        return;
      }
      handleSend();
    }

    if (event.key === 'Escape') {
      setMentionActive(false);
    }
  }

  function handleBeforeInput(event: FormEvent<HTMLTextAreaElement>) {
    const inputType = (event.nativeEvent as InputEvent).inputType;
    if (inputType !== 'insertLineBreak') return;
    event.preventDefault();
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = textareaRef.current;
    if (!el) return;
    const newValue = insertAtCursor(el, before, after, placeholder);
    const [selectionStart, selectionEnd] = cursorAfterInsert(el, before, placeholder);
    setText(newValue);
    setChatDraft(channelId, newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(selectionStart, selectionEnd);
    });
  }

  function insertCodeBlock() {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = el.value.slice(start, end);
    const placeholder = '여기에 코드를 작성하세요';
    const snippet = selected ? `\`\`\`\n${selected}\n\`\`\`` : `\`\`\`\n${placeholder}\n\`\`\``;
    const newValue = el.value.slice(0, start) + snippet + el.value.slice(end);
    const codeStart = start + '```\n'.length;
    const codeEnd = codeStart + (selected || placeholder).length;
    setText(newValue);
    setChatDraft(channelId, newValue);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(codeStart, codeEnd);
    });
  }

  const channelLabel = channelName ?? channelId.replace(/^ch-/, '');
  const hasCode = text.includes('```');
  const previewBlocks = showPreview ? extractCodeBlocks(text) : [];

  return (
    <Wrapper>
      {showPreview && text.trim() && (
        <PreviewPane>
          <PreviewLabel>미리보기</PreviewLabel>
          <MarkdownRenderer content={text} codeBlocks={previewBlocks} />
        </PreviewPane>
      )}

      <InputBox $quoted={!!pendingQuote} $preview={showPreview && !!text.trim()}>
        {pendingQuote && (
          <QuoteStrip>
            <QuoteLabel>인용</QuoteLabel>
            <QuoteText>L{pendingQuote.lineNumber + 1}: {pendingQuote.lineContent.trim()}</QuoteText>
            <QuoteDismiss onClick={() => setPendingQuote(null)}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
            </QuoteDismiss>
          </QuoteStrip>
        )}

        <MetaBar>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MetaLabel>파일</MetaLabel>
            <MetaInput value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="main.js" />
          </div>
        </MetaBar>

        <InputWrap>
          {mentionActive && filteredMembers.length > 0 && (
            <MentionDropdown>
              {filteredMembers.map((member, idx) => (
                <MentionItem key={member.id} $active={idx === mentionIndex}
                  onMouseDown={(e) => { e.preventDefault(); insertMention(member); }}>
                  <MentionAvatar>{member.nickname.charAt(0).toUpperCase()}</MentionAvatar>
                  <MentionName>@{member.nickname}</MentionName>
                </MentionItem>
              ))}
            </MentionDropdown>
          )}

          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setMentionActive(false), 150)}
            placeholder={`#${channelLabel}에 메시지 보내기`}
            style={{ fieldSizing: 'content', tabSize: 2 } as React.CSSProperties}
          />
        </InputWrap>

        <Toolbar>
          <ToolbarLeft>
            <ToolbarBtn title="굵게" onClick={() => wrapSelection('**', '**', '굵은 텍스트')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_bold</span>
            </ToolbarBtn>
            <ToolbarBtn title="기울임" onClick={() => wrapSelection('_', '_', '기울임 텍스트')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_italic</span>
            </ToolbarBtn>
            <ToolbarBtn title="인라인 코드" onClick={() => wrapSelection('`', '`', 'code')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>data_object</span>
            </ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn $active={sendAsTask} title="업무로 등록" onClick={() => setSendAsTask((v) => !v)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {sendAsTask ? 'task_alt' : 'chat'}
              </span>
            </ToolbarBtn>
            <ToolbarDivider />
            <ToolbarBtn title="코드 블록 삽입" onClick={insertCodeBlock}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>code</span>
            </ToolbarBtn>
            {hasCode && (
              <ToolbarBtn $active={showPreview} title="미리보기 전환" onClick={() => setShowPreview((v) => !v)}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>preview</span>
              </ToolbarBtn>
            )}
            <ToolbarBtn title="파일 첨부" onClick={() => fileInputRef.current?.click()}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>attach_file</span>
            </ToolbarBtn>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => { if (e.target.files?.[0]) setFileName(e.target.files[0].name); }}
            />
          </ToolbarLeft>

          <SendButton onClick={handleSend} disabled={!text.trim() || sending}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
            보내기
          </SendButton>
        </Toolbar>
      </InputBox>

      {sendError && (
        <Hint style={{ color: 'var(--color-error, #e53e3e)', marginTop: '4px' }}>
          전송 실패: {sendError}
        </Hint>
      )}
      <Hint>Tab = 들여쓰기, Shift+Enter = 줄바꿈, Enter = 전송</Hint>
    </Wrapper>
  );
}
