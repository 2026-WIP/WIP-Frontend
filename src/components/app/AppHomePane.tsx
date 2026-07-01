import styled from 'styled-components';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useUIStore, type AppView } from '@/store/useUIStore';
import { useDmStore } from '@/store/useDmStore';
import { useSnippetStore } from '@/store/useSnippetStore';
import { formatTimestamp } from '@/utils/timeUtils';

import { splitLeadingEditLabel } from '@/utils/textUtils';
type QuickType = 'channel' | 'dm' | 'snippets' | 'notifications' | 'search';

interface QuickItem {
  type: QuickType;
  id: string;
  label: string;
  icon: string;
  sub?: string;
}

const Page = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 40px 48px;
  background: var(--bg-app);
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const Greeting = styled.h1`
  font-family: var(--font-ui);
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
  margin-bottom: 6px;
`;

const Sub = styled.p`
  font-size: 1rem;
  color: var(--text-muted);
  font-family: var(--font-body);
  margin-bottom: 40px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  flex: 1;
  align-content: start;
`;

const Card = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 24px 28px;
`;

const CardTitle = styled.h2`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const EmptyText = styled.p`
  font-size: 0.9375rem;
  color: var(--text-muted);
  font-family: var(--font-body);
`;

const ActivityItem = styled.button`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--bg-hover);
  transition: background 100ms;
  border-radius: 0.25rem;

  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-app); }
`;

const ActivityAvatar = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 0.25rem;
  background: var(--accent);
  border: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-text);
`;

const ActivityBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ActivityMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
`;

const ActivityAuthor = styled.span`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const ActivityChannel = styled.span`
  font-family: var(--font-ui);
  font-size: 0.875rem;
  color: var(--text-muted);
`;

const ActivityTime = styled.span`
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-left: auto;
  flex-shrink: 0;3
`;

const ActivityText = styled.p`
  font-size: 0.9375rem;
  color: var(--text-secondary);
  font-family: var(--font-body);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const StatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
`;

const StatBox = styled.div<{ $accent?: boolean }>`
  background: ${p => p.$accent ? 'rgba(242,233,116,0.12)' : 'var(--bg-app)'};
  border: 1px solid ${p => p.$accent ? 'rgba(242,233,116,0.4)' : 'var(--border)'};
  border-radius: 0.25rem;
  padding: 18px 20px;
`;

const StatNum = styled.div`
  font-family: var(--font-ui);
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.03em;
  line-height: 1;
`;

const StatLabel = styled.div`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 5px;
`;

const WipItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--bg-hover);

  &:last-child { border-bottom: none; }
`;

const WipChannel = styled.span`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--text-muted);
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 72px;
`;

const WipText = styled.span`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

const StatusBadge = styled.span<{ $completed: boolean }>`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  border-radius: 0.125rem;
  font-family: var(--font-ui);
  background: ${p => p.$completed ? 'var(--text-primary)' : 'var(--accent)'};
  color: ${p => p.$completed ? 'var(--bg-surface)' : 'var(--accent-text)'};
  flex-shrink: 0;
`;

const QuickRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const QuickBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: 500;
  text-align: left;
  width: 100%;
  min-width: 0;
  transition: background 120ms, border-color 120ms;

  &:hover { background: var(--accent); border-color: rgba(242,233,116,0.6); }
`;

const QuickSub = styled.span`
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-left: auto;
  font-weight: 400;
  flex-shrink: 0;
`;

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 0.125rem;
  transition: color 120ms, background 120ms;

  &:hover { color: var(--text-primary); background: var(--border); }
`;

const SnippetQuickItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--bg-hover);
  border-radius: 0.25rem;
  transition: background 100ms;

  &:last-child { border-bottom: none; }
  &:hover { background: var(--bg-app); }
`;

const SnippetLangChip = styled.span`
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 6px;
  border-radius: 0.125rem;
  background: var(--bg-active);
  color: var(--text-muted);
  flex-shrink: 0;
`;

const EditBadge = styled.span`
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 0.125rem;
  border: 1px solid var(--border);
  color: var(--text-muted);
  flex-shrink: 0;
  transition: background 120ms, color 120ms, border-color 120ms;

  ${SnippetQuickItem}:hover & {
    background: var(--text-primary);
    color: var(--bg-surface);
    border-color: var(--text-primary);
  }
`;

const RemoveQuickBtn = styled(IconBtn)`
  color: transparent;
  flex-shrink: 0;

  ${QuickBtn}:hover & { color: var(--text-muted); }
  &:hover { color: var(--danger) !important; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 500;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Modal = styled.div`
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  width: 480px;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
`;

const ModalTitle = styled.h3`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const ModalBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
`;

const ModalFooter = styled.div`
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
`;

const SecondaryBtn = styled.button`
  padding: 7px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover { background: var(--bg-hover); }
`;

const PrimaryBtn = styled.button`
  padding: 7px 16px;
  background: var(--accent);
  border: none;
  border-radius: 0.25rem;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--accent-text);
  cursor: pointer;

  &:hover { filter: brightness(0.93); }
  &:disabled { opacity: 0.45; cursor: not-allowed; filter: none; }
`;

const CategoryTabs = styled.div`
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const CategoryTab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid ${p => p.$active ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$active ? 'var(--text-primary)' : 'transparent'};
  color: ${p => p.$active ? 'var(--bg-surface)' : 'var(--text-muted)'};
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
`;

const PickList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const PickItem = styled.button<{ $selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 0.25rem;
  border: 1px solid ${p => p.$selected ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$selected ? 'var(--bg-app)' : 'transparent'};
  font-family: var(--font-ui);
  font-size: 0.875rem;
  color: var(--text-primary);
  font-weight: ${p => p.$selected ? '600' : '400'};
  cursor: pointer;
  text-align: left;

  &:hover { border-color: var(--text-muted); background: var(--bg-app); }
`;

const PickCheck = styled.span<{ $checked: boolean }>`
  margin-left: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${p => p.$checked ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$checked ? 'var(--text-primary)' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;


const SearchKeywordInput = styled.input`
  width: 100%;
  font-size: 0.875rem;
  font-family: var(--font-body);
  background: var(--bg-surface);
  border: 2px solid var(--text-primary);
  border-radius: 0.25rem;
  padding: 8px 12px;
  color: var(--text-primary);
  outline: none;
  margin-top: 4px;
`;

const InfoText = styled.p`
  font-size: 0.8125rem;
  color: var(--text-muted);
  font-family: var(--font-body);
  margin-bottom: 12px;
`;

const CATEGORIES: { type: QuickType; label: string; icon: string }[] = [
  { type: 'channel', label: '채널', icon: 'tag' },
  { type: 'dm', label: 'DM', icon: 'chat' },
  { type: 'snippets', label: '스니펫', icon: 'code' },
  { type: 'notifications', label: '알림', icon: 'notifications' },
  { type: 'search', label: '검색', icon: 'search' },
];

function getGreeting(name: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `좋은 아침이에요, ${name}`;
  if (hour < 18) return `안녕하세요, ${name}`;
  return `오늘도 고생했어요, ${name}`;
}

interface AddQuickModalProps {
  channels: Record<string, { id: string; name: string; description?: string }>;
  existingItems: QuickItem[];
  onAdd: (item: QuickItem) => void;
  onClose: () => void;
}

function AddQuickModal({ channels, existingItems, onAdd, onClose }: AddQuickModalProps) {
  const [category, setCategory] = useState<QuickType>('channel');
  const [selectedId, setSelectedId] = useState('');
  const [keyword, setKeyword] = useState('');
  const channelList = Object.values(channels);
  const dmUsers   = useDmStore((s) => s.users);
  const snippets  = useSnippetStore((s) => s.snippets);

  function isAlreadyAdded(type: QuickType, id: string) {
    return existingItems.some((item) => item.type === type && item.id === id);
  }

  function buildItem(): QuickItem | null {
    if (category === 'channel') {
      const channel = channels[selectedId];
      return channel ? { type: 'channel', id: channel.id, label: channel.name, icon: 'tag', sub: `#${channel.name}` } : null;
    }
    if (category === 'dm') {
      const user = dmUsers.find((u) => u.id === selectedId);
      return user ? { type: 'dm', id: user.id, label: user.nickname, icon: 'chat' } : null;
    }
    if (category === 'snippets') {
      const snippet = snippets.find((s) => s.id === selectedId);
      return snippet ? { type: 'snippets', id: snippet.id, label: snippet.title, icon: 'code', sub: snippet.language } : null;
    }
    if (category === 'notifications') {
      return { type: 'notifications', id: 'notifications', label: '알림', icon: 'notifications' };
    }
    const trimmed = keyword.trim();
    return trimmed ? { type: 'search', id: `search:${trimmed}`, label: `"${trimmed}"`, icon: 'search', sub: trimmed } : null;
  }

  const canConfirm = (() => {
    if (category === 'notifications') return !isAlreadyAdded('notifications', 'notifications');
    if (category === 'search') return keyword.trim().length > 0;
    return selectedId.length > 0 && !isAlreadyAdded(category, selectedId);
  })();

  function handleConfirm() {
    const item = buildItem();
    if (!item) return;
    onAdd(item);
    onClose();
  }

  function handleCategoryChange(type: QuickType) {
    setCategory(type);
    setSelectedId('');
    setKeyword('');
  }

  return (
    <Overlay onClick={(event) => event.target === event.currentTarget && onClose()}>
      <Modal>
        <ModalHeader>
          <ModalTitle>빠른 링크 추가</ModalTitle>
          <IconBtn onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </IconBtn>
        </ModalHeader>

        <ModalBody>
          <CategoryTabs>
            {CATEGORIES.map((item) => (
              <CategoryTab key={item.type} $active={category === item.type} onClick={() => handleCategoryChange(item.type)}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{item.icon}</span>
                {item.label}
              </CategoryTab>
            ))}
          </CategoryTabs>

          {category === 'channel' && (
            <>
              <InfoText>자주 여는 채널을 빠른 링크로 고정하세요.</InfoText>
              <PickList>
                {channelList.length === 0 && <EmptyText>아직 채널이 없습니다.</EmptyText>}
                {channelList.map((channel) => {
                  const added = isAlreadyAdded('channel', channel.id);
                  return (
                    <PickItem
                      key={channel.id}
                      $selected={selectedId === channel.id}
                      onClick={() => !added && setSelectedId(channel.id)}
                      disabled={added}
                      style={{ opacity: added ? 0.45 : 1 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>tag</span>
                      <span>{channel.name}</span>
                      <PickCheck $checked={selectedId === channel.id}>
                        {selectedId === channel.id && <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#fff' }}>check</span>}
                      </PickCheck>
                    </PickItem>
                  );
                })}
              </PickList>
            </>
          )}

          {category === 'dm' && (
            <>
              <InfoText>대상을 DM 바로가기로 고정하세요.</InfoText>
              <PickList>
                {dmUsers.length === 0 && <EmptyText>워크스페이스에 다른 멤버가 없습니다.</EmptyText>}
                {dmUsers.map((user) => {
                  const added = isAlreadyAdded('dm', user.id);
                  return (
                    <PickItem
                      key={user.id}
                      $selected={selectedId === user.id}
                      onClick={() => !added && setSelectedId(user.id)}
                      disabled={added}
                      style={{ opacity: added ? 0.45 : 1 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>person</span>
                      <span>{user.nickname}</span>
                      <PickCheck $checked={selectedId === user.id}>
                        {selectedId === user.id && <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#fff' }}>check</span>}
                      </PickCheck>
                    </PickItem>
                  );
                })}
              </PickList>
            </>
          )}

          {category === 'snippets' && (
            <>
              <InfoText>목록에서 바로 열 스니펫을 선택하세요.</InfoText>
              <PickList>
                {snippets.length === 0 && <EmptyText>저장된 스니펫이 없습니다.</EmptyText>}
                {snippets.map((snippet) => {
                  const added = isAlreadyAdded('snippets', snippet.id);
                  return (
                    <PickItem
                      key={snippet.id}
                      $selected={selectedId === snippet.id}
                      onClick={() => !added && setSelectedId(snippet.id)}
                      disabled={added}
                      style={{ opacity: added ? 0.45 : 1 }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>code</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snippet.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{snippet.language}</span>
                      <PickCheck $checked={selectedId === snippet.id}>
                        {selectedId === snippet.id && <span className="material-symbols-outlined" style={{ fontSize: '12px', color: '#fff' }}>check</span>}
                      </PickCheck>
                    </PickItem>
                  );
                })}
              </PickList>
            </>
          )}

          {category === 'notifications' && (
            <>
              <InfoText>알림 화면 바로가기를 추가합니다.</InfoText>
              <PickList>
                <PickItem $selected onClick={() => {}} disabled={isAlreadyAdded('notifications', 'notifications')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)' }}>notifications</span>
                  <span>알림</span>
                </PickItem>
              </PickList>
            </>
          )}

          {category === 'search' && (
            <>
              <InfoText>검색어를 빠른 링크로 저장합니다.</InfoText>
              <SearchKeywordInput
                autoFocus
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="검색어"
                onKeyDown={(event) => event.key === 'Enter' && canConfirm && handleConfirm()}
              />
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <SecondaryBtn onClick={onClose}>취소</SecondaryBtn>
          <PrimaryBtn onClick={handleConfirm} disabled={!canConfirm}>추가</PrimaryBtn>
        </ModalFooter>
      </Modal>
    </Overlay>
  );
}

export function AppHomePane() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const messagesMap = useMessagesStore((state) => state.messages);
  const channels = useMessagesStore((state) => state.channels);
  const setActiveChannel = useUIStore((state) => state.setActiveChannel);
  const setActiveDmUser = useUIStore((state) => state.setActiveDmUser);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setActiveSnippet = useUIStore((state) => state.setActiveSnippet);

  const allSnippets = useSnippetStore((s) => s.snippets);
  const isHttp = import.meta.env.VITE_API_MODE === 'http';
  const mySnippets = isHttp
    ? allSnippets
    : allSnippets.filter((s) => !!currentUser && s.ownerId === currentUser.id);
  const [showModal, setShowModal] = useState(false);
  const [quickItems, setQuickItems] = useState<QuickItem[]>([]);

  function handleQuickNav(item: QuickItem) {
    if (item.type === 'channel') setActiveChannel(item.id);
    else if (item.type === 'dm') setActiveDmUser(item.id);
    else if (item.type === 'search') setActiveView('search');
    else setActiveView(item.type as AppView);
  }

  const allMessages = Object.values(messagesMap).filter((message) => !!channels[message.channelId]);
  const recent = [...allMessages].sort((a, b) => b.createdAt - a.createdAt).slice(0, 20);
  const taskMessages = allMessages.filter((message) => message.kind === 'task');
  const inProgress = taskMessages.filter((message) => message.status === 'in-progress');
  const completed = taskMessages.filter((message) => message.status === 'completed');
  const channelCount = Object.keys(channels).length;

  function renderActivityText(content: string) {
    const { label, rest } = splitLeadingEditLabel(content);
    if (!label) return rest;
    return `${label}${rest ? ` ${rest}` : ''}`;
  }

  return (
    <Page>
      <Greeting>{getGreeting(currentUser?.nickname ?? '개발자')}</Greeting>
      <Sub>아직 움직이고 있는 코드 논의를 이어가세요.</Sub>

      <Grid>
        <Card>
          <CardTitle>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>history</span>
            최근 활동
          </CardTitle>
          {recent.length === 0 ? (
            <EmptyText>아직 메시지가 없습니다.</EmptyText>
          ) : (
            recent.map((message) => (
              <ActivityItem key={message.id} onClick={() => setActiveChannel(message.channelId)}>
                <ActivityAvatar>{message.authorName.charAt(0)}</ActivityAvatar>
                <ActivityBody>
                  <ActivityMeta>
                    <ActivityAuthor>{message.authorName}</ActivityAuthor>
                    <ActivityChannel>#{channels[message.channelId]?.name ?? message.channelId}</ActivityChannel>
                    <ActivityTime>{formatTimestamp(message.createdAt)}</ActivityTime>
                  </ActivityMeta>
                  <ActivityText>{renderActivityText(message.content)}</ActivityText>
                </ActivityBody>
              </ActivityItem>
            ))
          )}
        </Card>

        <Card>
          <CardTitle>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>bar_chart</span>
            워크스페이스 현황
          </CardTitle>
          <StatGrid>
            <StatBox $accent>
              <StatNum>{inProgress.length}</StatNum>
              <StatLabel>진행 중</StatLabel>
            </StatBox>
            <StatBox>
              <StatNum>{completed.length}</StatNum>
              <StatLabel>완료</StatLabel>
            </StatBox>
            <StatBox>
              <StatNum>{allMessages.length}</StatNum>
              <StatLabel>전체 메시지</StatLabel>
            </StatBox>
            <StatBox>
              <StatNum>{channelCount}</StatNum>
              <StatLabel>채널</StatLabel>
            </StatBox>
          </StatGrid>
        </Card>

        <Card>
          <CardTitle>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>pending</span>
            진행 중인 작업
          </CardTitle>
          {inProgress.length === 0 ? (
            <EmptyText>진행 중인 작업이 없습니다.</EmptyText>
          ) : (
            inProgress.slice(0, 5).map((message) => (
              <WipItem key={message.id}>
                <WipChannel>#{channels[message.channelId]?.name ?? ''}</WipChannel>
                <WipText>{splitLeadingEditLabel(message.content.split('\n')[0]).rest}</WipText>
                <StatusBadge $completed={false}>진행 중</StatusBadge>
              </WipItem>
            ))
          )}
        </Card>

        <Card>
          <CardTitle>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>bolt</span>
            빠른 링크
            <IconBtn onClick={() => setShowModal(true)} title="빠른 링크 추가" style={{ marginLeft: 'auto' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>add</span>
            </IconBtn>
          </CardTitle>
          <QuickRow>
            {quickItems.length === 0 && <EmptyText>추가 버튼으로 채널, DM, 스니펫, 알림, 검색을 고정하세요.</EmptyText>}
            {quickItems.map((item, index) => (
              <QuickBtn key={`${item.type}-${item.id}-${index}`} onClick={() => handleQuickNav(item)}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                  {item.label}
                </span>
                {item.sub && item.type !== 'channel' && <QuickSub>{item.sub}</QuickSub>}
                <RemoveQuickBtn
                  onClick={(event) => {
                    event.stopPropagation();
                    setQuickItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                  }}
                  title="제거"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                </RemoveQuickBtn>
              </QuickBtn>
            ))}
          </QuickRow>
        </Card>
        <Card style={{ gridColumn: '1 / -1' }}>
          <CardTitle>
            <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>code_blocks</span>
            나의 스니펫
            <IconBtn
              onClick={() => setActiveView('snippets')}
              title="모두 보기"
              style={{ marginLeft: 'auto' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>open_in_new</span>
            </IconBtn>
          </CardTitle>
          {mySnippets.length === 0 ? (
            <EmptyText>저장된 스니펫이 없습니다. 스니펫 탭에서 추가하세요.</EmptyText>
          ) : (
            mySnippets.slice(0, 5).map((s) => (
              <SnippetQuickItem
                key={s.id}
                onClick={() => {
                  setActiveSnippet(s.id);
                  setActiveView('snippets');
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: '15px', color: 'var(--text-muted)', flexShrink: 0 }}
                >
                  code
                </span>
                <WipText>{s.title}</WipText>
                {s.fileName && <WipChannel>{s.fileName}</WipChannel>}
                <SnippetLangChip>{s.language}</SnippetLangChip>
                <EditBadge>수정</EditBadge>
              </SnippetQuickItem>
            ))
          )}
        </Card>
      </Grid>

      {showModal && (
        <AddQuickModal
          channels={channels}
          existingItems={quickItems}
          onAdd={(item) => setQuickItems((prev) => [...prev, item])}
          onClose={() => setShowModal(false)}
        />
      )}
    </Page>
  );
}
