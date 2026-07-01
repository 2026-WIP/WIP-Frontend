import styled from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { useMessagesStore } from '@/store/useMessagesStore';
import { messageService } from '@/services/messageService';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '@/types/message';

interface MessageListProps {
  channelId: string;
}

const PAGE_SIZE = 30;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--density-list-padding);
  display: flex;
  flex-direction: column;
  gap: var(--density-list-gap);

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
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
  padding: 24px;
  text-align: center;
  font-family: var(--font-body);
`;

const EmptyIcon = styled.span`
  font-size: 32px;
  opacity: 0.4;
`;

const DateDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: var(--density-date-padding);
`;

const DateLine = styled.div`
  flex: 1;
  height: 1px;
  background: var(--border);
`;

const DateLabel = styled.span`
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
`;

const LoadState = styled.div`
  padding: 8px 0;
  text-align: center;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
`;

function formatDateLabel(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return '오늘';
  if (date.toDateString() === yesterday.toDateString()) return '어제';
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function getDateKey(ts: number): string {
  const date = new Date(ts);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getDateDividerIndices(messages: ChatMessage[]): Set<number> {
  const indices = new Set<number>();
  let lastKey = '';
  messages.forEach((message, index) => {
    const key = getDateKey(message.createdAt);
    if (key !== lastKey) {
      indices.add(index);
      lastKey = key;
    }
  });
  return indices;
}

export function MessageList({ channelId }: MessageListProps) {
  const messagesByChannel = useMessagesStore((state) => state.messagesByChannel);
  const messagesMap = useMessagesStore((state) => state.messages);
  const messages = (messagesByChannel[channelId] ?? []).map((id) => messagesMap[id]).filter(Boolean);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  // Start at 0 so first batch is always detected as "appended" on mount
  const prevLenRef = useRef(0);
  // Track whether initial scroll-to-bottom has happened for this channel instance
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    const list = listRef.current;
    if (!list || messages.length === 0) return;

    const appended = messages.length > prevLenRef.current;
    prevLenRef.current = messages.length;

    if (!appended) return;

    if (!initialScrollDoneRef.current) {
      // First load for this channel — jump to bottom instantly without animation
      initialScrollDoneRef.current = true;
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    } else if (list.scrollHeight - list.scrollTop - list.clientHeight < 96) {
      // Real-time new message and user is already near the bottom — smooth scroll
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  async function loadOlder() {
    if (loadingOlder || !hasOlder || messages.length === 0) return;
    setLoadingOlder(true);
    const topBefore = listRef.current?.scrollHeight ?? 0;
    try {
      const older = await messageService.fetchMessages(channelId, { before: messages[0].id, limit: PAGE_SIZE });
      if (older.length < PAGE_SIZE) setHasOlder(false);
      requestAnimationFrame(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight - topBefore;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  function handleScroll() {
    if ((listRef.current?.scrollTop ?? 0) < 64) {
      void loadOlder();
    }
  }

  if (messages.length === 0) {
    return (
      <Empty>
        <EmptyIcon className="material-symbols-outlined">chat_bubble_outline</EmptyIcon>
        아직 메시지가 없습니다. 지금 진행 중인 작업을 팀과 공유해보세요.
      </Empty>
    );
  }

  const dividerIndices = getDateDividerIndices(messages);

  return (
    <List ref={listRef} onScroll={handleScroll}>
      <LoadState>{loadingOlder ? '이전 메시지 불러오는 중...' : hasOlder ? '위로 스크롤해서 이전 메시지 보기' : '더 이상 메시지가 없습니다.'}</LoadState>
      {messages.map((message, index) => (
        <div key={message.id}>
          {dividerIndices.has(index) && (
            <DateDivider>
              <DateLine />
              <DateLabel>{formatDateLabel(message.createdAt)}</DateLabel>
              <DateLine />
            </DateDivider>
          )}
          <MessageBubble message={message} />
        </div>
      ))}
      <div ref={bottomRef} />
    </List>
  );
}
