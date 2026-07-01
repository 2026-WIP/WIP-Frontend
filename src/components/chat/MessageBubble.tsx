import styled from 'styled-components';
import { useRef, useState } from 'react';
import type { ChatMessage, ReactionMap } from '@/types/message';
import { useAuthStore } from '@/store/useAuthStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useUIStore } from '@/store/useUIStore';
import { messageService } from '@/services/messageService';
import { MessageContext } from './MessageContext';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { DiffViewer } from '@/components/diff/DiffViewer';
import { formatTimestamp } from '@/utils/timeUtils';
import { removeLineBreaks } from '@/utils/messageTextUtils';

const ThreadBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 3px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: none;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;

  &:hover { border-color: var(--accent); color: var(--text-primary); }
`;

type MessageLayout = 'channel' | 'dm';
type DmGroupPosition = 'single' | 'top' | 'middle' | 'bottom';

function getDmBorderRadius(fromMe: boolean, groupPosition: DmGroupPosition) {
  if (fromMe) {
    switch (groupPosition) {
      case 'top':
      case 'single':
        return '0.75rem 0.75rem 0.125rem 0.75rem';
      case 'middle':
        return '0.75rem 0.125rem 0.125rem 0.75rem';
      case 'bottom':
        return '0.75rem 0.125rem 0.75rem 0.75rem';
    }
  }

  switch (groupPosition) {
    case 'top':
    case 'single':
      return '0.75rem 0.75rem 0.75rem 0.125rem';
    case 'middle':
      return '0.125rem 0.75rem 0.75rem 0.125rem';
    case 'bottom':
      return '0.125rem 0.75rem 0.75rem 0.75rem';
  }
}

const Bubble = styled.div<{ $layout: MessageLayout; $fromMe: boolean; $compact: boolean; $hasTimestamp: boolean }>`
  display: flex;
  gap: var(--density-bubble-gap);
  position: relative;
  padding: ${p => p.$layout === 'dm'
    ? (p.$compact ? 'var(--density-dm-compact-row-padding)' : 'var(--density-dm-row-padding)')
    : 'var(--density-bubble-padding)'};
  margin: ${p => p.$layout === 'dm' ? '0' : '0 -8px'};
  justify-content: ${p => p.$layout === 'dm' ? (p.$fromMe ? 'flex-end' : 'flex-start') : 'flex-start'};
  flex-direction: ${p => p.$layout === 'dm' && p.$fromMe ? 'row-reverse' : 'row'};
  width: 100%;
  margin-bottom: ${p => p.$layout === 'dm' && p.$hasTimestamp ? '8px' : '0'};

  &:hover .action-bar { opacity: 1; pointer-events: auto; }
  &[data-kind='chat'] .task-only { display: none; }
  &[data-kind='chat'] .action-bar > button:last-child { display: none; }
`;

const Avatar = styled.div<{ $layout: MessageLayout; $visible: boolean }>`
  width: var(--density-avatar-size);
  height: var(--density-avatar-size);
  border-radius: ${p => p.$layout === 'dm' ? '50%' : '0.25rem'};
  flex-shrink: 0;
  background: var(--accent);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-text);
  font-weight: 700;
  font-size: var(--density-avatar-font);
  font-family: var(--font-ui);
  margin-top: 2px;
  visibility: ${p => p.$visible ? 'visible' : 'hidden'};
`;

const Content = styled.div<{ $layout: MessageLayout; $fromMe: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${p => p.$layout === 'dm' ? 'var(--density-dm-content-gap)' : '6px'};
  min-width: 0;
  max-width: none;
  align-items: ${p => p.$layout === 'dm' ? (p.$fromMe ? 'flex-end' : 'flex-start') : 'stretch'};
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

const AuthorName = styled.span`
  font-weight: 700;
  font-size: 0.9375rem;
  color: var(--text-primary);
  font-family: var(--font-ui);
`;

const Timestamp = styled.span`
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const StatusBadge = styled.button<{ $completed: boolean }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 0.125rem;
  font-family: var(--font-ui);
  border: none;
  cursor: pointer;
  background: ${p => p.$completed ? 'var(--text-primary)' : 'var(--accent)'};
  color: ${p => p.$completed ? 'var(--bg-surface)' : 'var(--accent-text)'};

  &:hover { filter: brightness(0.88); }
  [data-kind='chat'] & { display: none; }
`;

const DiffToggle = styled.button`
  font-size: 0.75rem;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  background: none;
  padding: 2px 8px;
  border-radius: 0.125rem;
  cursor: pointer;
  font-family: var(--font-ui);

  &:hover { border-color: var(--text-primary); color: var(--text-primary); background: var(--bg-hover); }
`;

const QuoteCallout = styled.div`
  border-left: 2px solid var(--accent);
  padding: 6px 12px;
  background: var(--bg-panel);
  border-radius: 0 0.25rem 0.25rem 0;
`;

const QuoteMeta = styled.div`
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  font-weight: 700;
  margin-bottom: 4px;
  font-family: var(--font-ui);
`;

const QuoteText = styled.p`
  font-size: 0.8125rem;
  color: var(--text-secondary);
  background: var(--bg-surface);
  padding: 6px 10px;
  border-radius: 0.125rem;
  border: 1px solid var(--border);
  line-height: 1.5;
  font-family: var(--font-code);
`;

const DiffList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActionBar = styled.div`
  position: absolute;
  top: -16px;
  right: 8px;
  opacity: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 2px;
  transition: opacity 100ms;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
`;

const ActionBtn = styled.button`
  padding: 5px 6px;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 0.125rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  font-size: 13px;

  &:hover { background: var(--bg-hover); color: var(--text-primary); }
`;

const EmojiBtn = styled(ActionBtn)`
  font-size: 15px;
  line-height: 1;
`;

const Reactions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
`;

const ReactionChip = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid ${p => p.$active ? 'var(--accent)' : 'var(--border)'};
  background: ${p => p.$active ? 'rgba(242,233,116,0.15)' : 'var(--bg-surface)'};
  font-size: 13px;
  cursor: pointer;
  font-family: var(--font-ui);

  &:hover { border-color: var(--accent); background: rgba(242,233,116,0.1); }

  span { font-size: 11px; color: var(--text-secondary); font-weight: 600; }
`;

const EditWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
`;

const EditTextarea = styled.textarea`
  width: 100%;
  min-height: 60px;
  max-height: 240px;
  padding: 8px 12px;
  font-size: 0.9375rem;
  font-family: var(--font-body);
  line-height: 1.6;
  color: var(--text-primary);
  background: var(--bg-surface);
  border: 2px solid var(--text-primary);
  border-radius: 0.25rem;
  outline: none;
  resize: none;
  box-sizing: border-box;
  field-sizing: content;
`;

const EditRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
`;

const EditHint = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-code);
  margin-right: auto;
`;

const EditCancelBtn = styled.button`
  padding: 5px 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-family: var(--font-ui);
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;
  &:hover { background: var(--bg-hover); }
`;

const EditSaveBtn = styled.button`
  padding: 5px 12px;
  background: var(--accent);
  border: none;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-family: var(--font-ui);
  font-weight: 700;
  color: var(--accent-text);
  cursor: pointer;
  &:hover { filter: brightness(0.93); }
  &:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
`;

const MessageText = styled.div<{ $layout: MessageLayout; $fromMe: boolean; $groupPosition: DmGroupPosition }>`
  font-family: var(--font-body);
  font-size: ${p => p.$layout === 'dm' ? '0.875rem' : '1rem'};
  line-height: 1.5;
  color: ${p => p.$layout === 'dm' && p.$fromMe ? 'var(--bg-surface)' : 'var(--text-primary)'};
  background: ${p => p.$layout === 'dm'
    ? (p.$fromMe ? 'var(--text-primary)' : 'var(--bg-surface)')
    : 'transparent'};
  max-width: ${p => p.$layout === 'dm' ? '68%' : 'none'};
  border: ${p => p.$layout === 'dm' && !p.$fromMe ? '1px solid var(--border)' : 'none'};
  border-radius: ${p => p.$layout === 'dm' ? getDmBorderRadius(p.$fromMe, p.$groupPosition) : '0'};
  padding: ${p => p.$layout === 'dm' ? 'var(--density-dm-message-padding)' : '0'};
  overflow-wrap: anywhere;
  text-align: ${p => p.$layout === 'dm' && p.$fromMe ? 'right' : 'left'};
`;

const DmTimestamp = styled.span<{ $fromMe: boolean }>`
  font-size: 10px;
  color: var(--text-muted);
  align-self: ${p => p.$fromMe ? 'flex-end' : 'flex-start'};
  font-family: var(--font-ui);
`;

interface MessageBubbleProps {
  message: ChatMessage;
  actions?: boolean;
  layout?: MessageLayout;
  showTimestamp?: boolean;
  showAvatar?: boolean;
  groupPosition?: DmGroupPosition;
}

const QUICK_EMOJIS = ['👍', '💡', '✅', '🔥'];

function toggleReaction(reactions: ReactionMap | undefined, emoji: string, userId: string): ReactionMap {
  const next: ReactionMap = Object.fromEntries(
    Object.entries(reactions ?? {}).map(([key, users]) => [key, [...users]]),
  );
  const users = new Set(next[emoji] ?? []);
  if (users.has(userId)) users.delete(userId);
  else users.add(userId);
  if (users.size === 0) delete next[emoji];
  else next[emoji] = [...users];
  return next;
}

export function MessageBubble({
  message,
  actions = true,
  layout = 'channel',
  showTimestamp = true,
  showAvatar = true,
  groupPosition = 'single',
}: MessageBubbleProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const sourceMessage = useMessagesStore((state) =>
    message.quoteRef ? state.messages[message.quoteRef.messageId] : null
  );
  const updateMessage = useMessagesStore((state) => state.updateMessage);
  const diffPanelState = useUIStore((state) => state.diffPanelState[message.id] ?? 'hidden');
  const setDiffPanelState = useUIStore((state) => state.setDiffPanelState);
  const setPendingQuote = useUIStore((state) => state.setPendingQuote);
  const setActiveThread = useUIStore((state) => state.setActiveThread);
  const hasDiff = message.codeBlocks.some((block) => block.originalCode && block.modifiedCode);
  const isThreadMessage = !!message.parentId;
  const isTask = message.kind === 'task';
  const userId = currentUser?.id ?? 'anonymous';
  const isFromMe = message.authorId === currentUser?.id;

  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  function startEdit() {
    setEditText(message.content);
    setEditMode(true);
    requestAnimationFrame(() => {
      const el = editRef.current;
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
    });
  }

  function cancelEdit() {
    setEditMode(false);
    setEditText('');
  }

  async function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.content) { cancelEdit(); return; }
    setEditSaving(true);
    const prev = message.content;
    updateMessage(message.id, { content: trimmed });
    setEditMode(false);
    try {
      await messageService.updateMessage(message.id, { content: trimmed });
    } catch {
      updateMessage(message.id, { content: prev });
      setEditMode(true);
    } finally {
      setEditSaving(false);
    }
  }

  function toggleStatus() {
    if (!isTask) return;
    const newStatus = message.status === 'in-progress' ? 'completed' : 'in-progress';
    updateMessage(message.id, { status: newStatus });
    messageService.updateMessage(message.id, { status: newStatus }).catch(() => {
      updateMessage(message.id, { status: message.status });
    });
  }

  function handleReply() {
    setPendingQuote({
      messageId: message.id,
      lineNumber: 0,
      lineContent: message.content.split('\n')[0],
    });
  }

  function handleReaction(emoji: string) {
    const previous = message.reactions;
    const next = toggleReaction(previous, emoji, userId);
    updateMessage(message.id, { reactions: next });
    messageService.updateMessage(message.id, { reactions: next }).catch(() => {
      updateMessage(message.id, { reactions: previous });
    });
  }

  const visibleReactions = Object.entries(message.reactions ?? {}).filter(([, users]) => users.length > 0);

  return (
    <MessageContext.Provider value={{ messageId: message.id }}>
      <Bubble
        data-kind={message.kind}
        $layout={layout}
        $fromMe={isFromMe}
        $compact={layout === 'dm' && !showTimestamp}
        $hasTimestamp={layout === 'dm' && showTimestamp}
      >
        {actions && !editMode && (
          <ActionBar className="action-bar">
            {QUICK_EMOJIS.map((emoji) => (
              <EmojiBtn key={emoji} title={`${emoji} 반응`} onClick={() => handleReaction(emoji)}>
                {emoji}
              </EmojiBtn>
            ))}
            <ActionBtn title="답장" onClick={handleReply}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>reply</span>
            </ActionBtn>
            {!isThreadMessage && (
              <ActionBtn title="스레드 열기" onClick={() => setActiveThread(message.id)}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>forum</span>
              </ActionBtn>
            )}
            {isFromMe && layout === 'channel' && (
              <ActionBtn title="메시지 수정" onClick={startEdit}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
              </ActionBtn>
            )}
            <ActionBtn title="상태 전환" onClick={toggleStatus}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {message.status === 'completed' ? 'undo' : 'check_circle'}
              </span>
            </ActionBtn>
          </ActionBar>
        )}

        <Avatar $layout={layout} $visible={layout === 'channel' || showAvatar}>
          {message.authorName.charAt(0).toUpperCase()}
        </Avatar>

        <Content $layout={layout} $fromMe={isFromMe}>
          {layout === 'channel' && (
            <MetaRow>
              <AuthorName>{message.authorName}</AuthorName>
              <Timestamp>{formatTimestamp(message.createdAt)}</Timestamp>
              <StatusBadge $completed={message.status === 'completed'} onClick={toggleStatus} title="상태 전환">
                {message.status === 'completed' ? '완료' : '진행 중'}
              </StatusBadge>
              {hasDiff && (
                <DiffToggle onClick={() => setDiffPanelState(message.id, diffPanelState === 'hidden' ? 'inline' : 'hidden')}>
                  {diffPanelState === 'hidden' ? 'Diff ON' : 'Diff OFF'}
                </DiffToggle>
              )}
            </MetaRow>
          )}

          {message.quoteRef && (
            <QuoteCallout>
              <QuoteMeta>
                {sourceMessage ? sourceMessage.authorName : 'someone'} · L{message.quoteRef.lineNumber + 1}
              </QuoteMeta>
              <QuoteText>{message.quoteRef.lineContent.trim()}</QuoteText>
            </QuoteCallout>
          )}

          {editMode ? (
            <EditWrapper>
              <EditTextarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    void saveEdit();
                  }
                  if (e.key === 'Escape') cancelEdit();
                }}
              />
              <EditRow>
                <EditHint>Enter = 저장 · Shift+Enter = 줄바꿈 · Esc = 취소</EditHint>
                <EditCancelBtn onClick={cancelEdit}>취소</EditCancelBtn>
                <EditSaveBtn onClick={() => void saveEdit()} disabled={editSaving || !editText.trim()}>
                  {editSaving ? '저장 중...' : '저장'}
                </EditSaveBtn>
              </EditRow>
            </EditWrapper>
          ) : layout === 'dm' ? (
            <MessageText $layout={layout} $fromMe={isFromMe} $groupPosition={groupPosition}>
              {removeLineBreaks(message.content)}
            </MessageText>
          ) : (
            <MarkdownRenderer content={message.content} codeBlocks={message.codeBlocks} />
          )}
          {layout === 'dm' && showTimestamp && (
            <DmTimestamp $fromMe={isFromMe}>{formatTimestamp(message.createdAt)}</DmTimestamp>
          )}

          {hasDiff && diffPanelState !== 'hidden' && (
            <DiffList>
              {message.codeBlocks
                .filter((block) => block.originalCode && block.modifiedCode)
                .map((block) => (
                  <DiffViewer key={block.id} originalCode={block.originalCode!} modifiedCode={block.modifiedCode!} />
                ))}
            </DiffList>
          )}

          {!isThreadMessage && (message.threadCount ?? 0) > 0 && (
            <ThreadBtn onClick={() => setActiveThread(message.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>forum</span>
              답글 {message.threadCount}개
            </ThreadBtn>
          )}

          {actions && visibleReactions.length > 0 && (
            <Reactions>
              {visibleReactions.map(([emoji, users]) => (
                <ReactionChip
                  key={emoji}
                  $active={users.includes(userId)}
                  onClick={() => handleReaction(emoji)}
                >
                  {emoji} <span>{users.length}</span>
                </ReactionChip>
              ))}
            </Reactions>
          )}
        </Content>
      </Bubble>
    </MessageContext.Provider>
  );
}
