import styled from 'styled-components';
import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useDmStore } from '@/store/useDmStore';
import { dmService } from '@/services/dmService';
import { unreadService } from '@/services/unreadService';
import { isImeComposingEvent } from '@/utils/keyboardUtils';
import { removeLineBreaks } from '@/utils/messageTextUtils';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { formatTimestamp } from '@/utils/timeUtils';
import type { ChatMessage } from '@/types/message';

const Pane = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
`;

const Empty = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-body);
`;

const ConvArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  height: 52px;
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface);
  flex-shrink: 0;
`;

const HeaderAvatar = styled.div`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--accent);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 12px;
  font-weight: 700;
  color: var(--accent-text);
`;

const HeaderName = styled.span`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const MessageArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 0 4px 20px;
  display: flex;
  flex-direction: column;
  gap: var(--density-dm-list-gap);
  background: var(--bg-app);

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const InputRow = styled.div`
  padding: 6px 12px 8px;
  border-top: 1px solid var(--border);
  display: flex;
  gap: 8px;
  background: var(--bg-surface);
  flex-shrink: 0;
`;

const DmInput = styled.textarea`
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 6px 10px;
  font-size: 0.875rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-surface);
  outline: none;
  resize: none;
  min-height: 32px;
  max-height: 84px;
  line-height: 1.5;

  &:focus { border-width: 2px; border-color: var(--text-primary); padding: 5px 9px; }
  &::placeholder { color: var(--text-muted); }
`;

const SendBtn = styled.button`
  padding: 6px 14px;
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

type DmMessageItem = ReturnType<typeof useDmStore.getState>['conversations'][string][number];

function toChatMessage(message: DmMessageItem, channelId: string): ChatMessage {
  return {
    id: message.id,
    channelId,
    authorId: message.fromId,
    authorName: message.fromName,
    content: removeLineBreaks(message.text),
    codeBlocks: [],
    createdAt: message.createdAt,
    status: 'completed',
    kind: 'chat',
  };
}

export function DMPane() {
  const activeDmUserId = useUIStore((state) => state.activeDmUserId);
  const users = useDmStore((state) => state.users);
  const groupConversations = useDmStore((state) => state.groupConversations);
  const conversations = useDmStore((state) => state.conversations);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputTextRef = useRef('');
  const [sending, setSending] = useState(false);
  const isComposingRef = useRef(false);

  const activeGroup = activeDmUserId?.startsWith('group:')
    ? groupConversations.find((group) => `group:${group.id}` === activeDmUserId)
    : undefined;
  const activeUser = users.find((user) => user.id === activeDmUserId);
  const activeTitle = activeGroup?.name ?? activeUser?.nickname ?? '';
  const activeSub = activeGroup ? `${activeGroup.memberNames.length}명 참여` : activeUser?.email;
  const messages = activeDmUserId ? (conversations[activeDmUserId] ?? []) : [];

  useEffect(() => {
    if (activeDmUserId) {
      dmService.fetchMessages(activeDmUserId).catch(() => {});
      // DM 열면 읽음 처리 → 서버 DB 업데이트 + UI 빨간 점 제거
      unreadService.markDmRead(activeDmUserId).catch(() => {});
    }
  }, [activeDmUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeDmUserId]);

  async function handleSend() {
    const trimmed = removeLineBreaks(inputText).trim();
    if (!trimmed || !activeDmUserId || sending) return;
    setSending(true);
    const sentText = inputText;
    inputTextRef.current = '';
    setInputText('');
    requestAnimationFrame(() => inputRef.current?.focus());
    try {
      await dmService.sendMessage(activeDmUserId, trimmed);
    } catch (error) {
      if (!inputTextRef.current.trim()) {
        inputTextRef.current = sentText;
        setInputText(sentText);
      }
      throw error;
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && event.shiftKey) {
      event.preventDefault();
      return;
    }
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (isComposingRef.current || isImeComposingEvent(event)) return;
    void handleSend();
  }

  function handleBeforeInput(event: FormEvent<HTMLTextAreaElement>) {
    const inputType = (event.nativeEvent as InputEvent).inputType;
    if (inputType === 'insertLineBreak') event.preventDefault();
  }

  if (!activeDmUserId || (!activeUser && !activeGroup)) {
    return (
      <Pane>
        <Empty>
          <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.3 }}>chat</span>
          왼쪽 사이드바에서 대화를 선택하세요.
        </Empty>
      </Pane>
    );
  }

  return (
    <Pane>
      <ConvArea>
        <Header>
          <HeaderAvatar>
            {activeGroup ? <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>groups</span> : activeTitle.charAt(0).toUpperCase()}
          </HeaderAvatar>
          <HeaderName>{activeTitle}</HeaderName>
          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}>
            {activeSub}
          </span>
        </Header>

        <MessageArea>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', fontFamily: 'var(--font-body)', marginTop: '40px' }}>
              {activeGroup ? '단체 DM을 시작해보세요.' : `${activeTitle}님과 대화를 시작해보세요.`}
            </div>
          )}
          {messages.map((msg, index) => {
            const previousMessage = messages[index - 1];
            const nextMessage = messages[index + 1];
            const previousSameTime = !!previousMessage && formatTimestamp(previousMessage.createdAt) === formatTimestamp(msg.createdAt);
            const nextSameTime = !!nextMessage && formatTimestamp(msg.createdAt) === formatTimestamp(nextMessage.createdAt);
            const showTimestamp = !nextSameTime;
            const showAvatar = !previousSameTime;
            const groupPosition =
              !previousSameTime && !nextSameTime ? 'single' :
              !previousSameTime ? 'top' :
              !nextSameTime ? 'bottom' :
              'middle';
            return (
              <MessageBubble
                key={msg.id}
                message={toChatMessage(msg, `dm-${activeDmUserId}`)}
                actions={false}
                layout="dm"
                showTimestamp={showTimestamp}
                showAvatar={showAvatar}
                groupPosition={groupPosition}
              />
            );
          })}
          <div ref={bottomRef} />
        </MessageArea>

        <InputRow>
          <DmInput
            ref={inputRef}
            value={inputText}
            onChange={(event) => {
              const nextValue = removeLineBreaks(event.target.value);
              inputTextRef.current = nextValue;
              setInputText(nextValue);
            }}
            placeholder={`${activeTitle}에 메시지 보내기`}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={() => { isComposingRef.current = false; }}
            onBeforeInput={handleBeforeInput}
            onKeyDown={handleKeyDown}
          />
          <SendBtn onClick={handleSend} disabled={!inputText.trim() || sending}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>send</span>
            보내기
          </SendBtn>
        </InputRow>
      </ConvArea>
    </Pane>
  );
}
