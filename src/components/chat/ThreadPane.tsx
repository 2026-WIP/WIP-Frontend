import styled from 'styled-components';
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { messageService } from '@/services/messageService';
import { isImeComposingEvent } from '@/utils/keyboardUtils';
import { MessageBubble } from './MessageBubble';
import { MessageContext } from './MessageContext';

const Pane = styled.div`
  width: 360px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  height: 100%;
  overflow: hidden;
`;

const Header = styled.div`
  height: 52px;
  border-bottom: 1px solid var(--border);
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const Title = styled.h3`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CloseBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 6px;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 0.25rem;
  color: var(--text-muted);
  &:hover { background: var(--bg-hover); color: var(--text-primary); }
`;

const ParentSection = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid var(--bg-hover);
  background: var(--bg-app);
  flex-shrink: 0;
`;

const ParentLabel = styled.div`
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 6px;
`;

const ReplyList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const EmptyThread = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-body);
  text-align: center;
`;

const InputArea = styled.div`
  border-top: 1px solid var(--border);
  padding: 12px 16px;
  flex-shrink: 0;
`;

const Textarea = styled.textarea`
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 10px 14px;
  font-size: 0.875rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  resize: none;
  min-height: 72px;
  max-height: 200px;
  outline: none;
  line-height: 1.5;

  &:focus { border-width: 2px; border-color: var(--text-primary); padding: 9px 13px; }
  &::placeholder { color: rgba(18,18,18,0.35); }
`;

const SendRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;

const SendBtn = styled.button`
  padding: 7px 18px;
  background: var(--accent);
  color: var(--accent-text);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: filter 150ms;

  &:hover { filter: brightness(0.93); }
  &:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
`;

const ReplyCount = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);
  font-family: var(--font-ui);
  margin-left: 4px;
`;

export function ThreadPane() {
  const activeThreadMessageId = useUIStore((s) => s.activeThreadMessageId);
  const setActiveThread = useUIStore((s) => s.setActiveThread);
  const messagesMap = useMessagesStore((s) => s.messages);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextRef = useRef('');
  const isComposingRef = useRef(false);
  const allowLineBreakRef = useRef(false);

  const parentMessage = activeThreadMessageId ? messagesMap[activeThreadMessageId] : null;
  const threadMsgs = useMessagesStore((s) =>
    activeThreadMessageId ? s.getThreadMessages(activeThreadMessageId) : []
  );

  useEffect(() => {
    if (!activeThreadMessageId) return;
    messageService.fetchThreadMessages(activeThreadMessageId).catch(() => {});
  }, [activeThreadMessageId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMsgs.length]);

  async function handleSend() {
    const trimmed = replyText.trim();
    if (!trimmed || !activeThreadMessageId || !parentMessage || sending) return;
    console.log('[thread-input] sent:', trimmed);
    setSending(true);
    const sentText = replyText;
    replyTextRef.current = '';
    setReplyText('');
    requestAnimationFrame(() => textareaRef.current?.focus());
    try {
      await messageService.sendThreadMessage(activeThreadMessageId, {
        channelId: parentMessage.channelId,
        authorId: currentUser?.id ?? 'anon',
        authorName: currentUser?.nickname ?? '익명',
        content: trimmed,
        codeBlocks: [],
        status: 'completed',
        kind: 'chat',
      });
    } catch (error) {
      if (!replyTextRef.current.trim()) {
        replyTextRef.current = sentText;
        setReplyText(sentText);
      }
      throw error;
    } finally {
      setSending(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    allowLineBreakRef.current = false;

    if (event.key !== 'Enter') return;

    event.preventDefault();
    if (event.shiftKey) {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const nextValue = replyText.slice(0, start) + '\n' + replyText.slice(end);
      const nextCursor = start + 1;
      replyTextRef.current = nextValue;
      setReplyText(nextValue);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextCursor, nextCursor);
      });
      return;
    }
    if (isComposingRef.current || isImeComposingEvent(event)) {
      return;
    }

    void handleSend();
  }

  function handleBeforeInput(event: FormEvent<HTMLTextAreaElement>) {
    const inputType = (event.nativeEvent as InputEvent).inputType;
    if (inputType !== 'insertLineBreak') return;
    event.preventDefault();
  }

  if (!activeThreadMessageId || !parentMessage) return null;

  return (
    <Pane>
      <Header>
        <Title>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>forum</span>
          스레드
          {threadMsgs.length > 0 && <ReplyCount>답글 {threadMsgs.length}개</ReplyCount>}
        </Title>
        <CloseBtn onClick={() => setActiveThread(null)}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </CloseBtn>
      </Header>

      {/* 부모 메시지 미리보기 */}
      <ParentSection>
        <ParentLabel>원본 메시지</ParentLabel>
        <MessageContext.Provider value={{ messageId: parentMessage.id }}>
          <MessageBubble message={parentMessage} />
        </MessageContext.Provider>
      </ParentSection>

      {/* 스레드 답글 목록 */}
      <ReplyList>
        {threadMsgs.length === 0 ? (
          <EmptyThread>
            <span className="material-symbols-outlined" style={{ fontSize: '32px', opacity: 0.3 }}>forum</span>
            아직 답글이 없습니다.<br />
            <span style={{ fontSize: '0.8125rem' }}>첫 번째 답글을 남겨보세요.</span>
          </EmptyThread>
        ) : (
          threadMsgs.map((msg) => (
            <MessageContext.Provider key={msg.id} value={{ messageId: msg.id }}>
              <MessageBubble message={msg} />
            </MessageContext.Provider>
          ))
        )}
        <div ref={bottomRef} />
      </ReplyList>

      {/* 답글 입력 */}
      <InputArea>
        <Textarea
          ref={textareaRef}
          placeholder={`${parentMessage.authorName}에게 답글 쓰기...`}
          value={replyText}
          onChange={(e) => {
            const nextValue = e.target.value;
            console.log('[thread-input] typed:', nextValue);
            replyTextRef.current = nextValue;
            setReplyText(nextValue);
          }}
          onCompositionStart={() => { isComposingRef.current = true; }}
          onCompositionEnd={() => { isComposingRef.current = false; }}
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleKeyDown}
        />
        <SendRow>
          <SendBtn onClick={handleSend} disabled={!replyText.trim() || sending}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>send</span>
            {sending ? '전송 중...' : '답글'}
          </SendBtn>
        </SendRow>
      </InputArea>
    </Pane>
  );
}
