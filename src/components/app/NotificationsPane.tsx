import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendStore } from '@/store/useFriendStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useGitHubStore } from '@/store/useGitHubStore';
import { githubService } from '@/services/githubService';
import { notificationService } from '@/services/notificationService';
import { formatTimestamp } from '@/utils/timeUtils';
import type { GitHubChangedFile, GitHubNotification } from '@/types/github';

type NotifType = 'mention' | 'reply' | 'status' | 'friend' | 'dm' | 'workspace'
  | 'github-commit' | 'github-pr' | 'github-issue';

interface Notification {
  id: string;
  type: NotifType;
  actor: string;
  channelId?: string;
  preview: string;
  ts: number;
  read?: boolean;
  githubData?: GitHubNotification;
}

const isHttp = import.meta.env.VITE_API_MODE === 'http';

const ICON_MAP: Record<NotifType, string> = {
  mention: 'alternate_email',
  reply: 'reply',
  status: 'check_circle',
  friend: 'person_add',
  dm: 'chat',
  workspace: 'group_add',
  'github-commit': 'commit',
  'github-pr': 'merge',
  'github-issue': 'bug_report',
};

const COLOR_MAP: Record<NotifType, string> = {
  mention: 'var(--accent)',
  reply: 'var(--border)',
  status: 'var(--border)',
  friend: 'var(--accent)',
  dm: 'var(--border)',
  workspace: 'var(--accent)',
  'github-commit': 'var(--border)',
  'github-pr': 'var(--border)',
  'github-issue': 'var(--border)',
};

const READ_STORAGE_KEY = 'wip-notification-read-ids';

const Page = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--bg-app);

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const TopBar = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const TopTitle = styled.h2`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid ${p => p.$active ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$active ? 'var(--text-primary)' : 'transparent'};
  color: ${p => p.$active ? 'var(--bg-surface)' : 'var(--text-muted)'};
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
`;

const MarkAllBtn = styled.button`
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  background: none;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
  cursor: pointer;

  &:hover { background: var(--bg-hover); color: var(--text-primary); }
`;

const List = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 24px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-body);
  text-align: center;
`;

const NotifCard = styled.button<{ $read: boolean }>`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: ${p => p.$read ? 'var(--bg-surface)' : 'rgba(242,233,116,0.06)'};
  border: 1px solid ${p => p.$read ? 'var(--border)' : 'rgba(242,233,116,0.35)'};
  border-radius: 0.25rem;
  cursor: pointer;
  text-align: left;

  &:hover { background: var(--bg-hover); }
`;

const NotifIconWrap = styled.div<{ $color: string }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${p => p.$color};
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const NotifBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotifMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
`;

const NotifActor = styled.span`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const NotifChannel = styled.span`
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const NotifTime = styled.span`
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-left: auto;
  flex-shrink: 0;
`;

const NotifPreview = styled.p`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  border: 1.5px solid var(--border);
  flex-shrink: 0;
  margin-top: 4px;
`;

const FileChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
`;

const FileChip = styled.button<{ $status: GitHubChangedFile['status'] }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 0.125rem;
  border: 1px solid var(--border);
  background: var(--bg-app);
  font-family: var(--font-code);
  font-size: 0.6875rem;
  cursor: pointer;
  color: ${p =>
    p.$status === 'added' ? 'var(--success)' :
    p.$status === 'removed' ? 'var(--danger)' :
    'var(--text-secondary)'};

  &:hover { border-color: var(--text-muted); background: var(--bg-hover); }
`;

const LabelChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
`;

const LabelChip = styled.span`
  padding: 1px 7px;
  border-radius: 999px;
  border: 1px solid var(--border);
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  color: var(--text-muted);
`;

const ShaTag = styled.span`
  font-family: var(--font-code);
  font-size: 0.6875rem;
  color: var(--text-muted);
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 0.125rem;
  padding: 1px 5px;
`;

// Code preview modal
const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const ModalBox = styled.div`
  width: 100%;
  max-width: 860px;
  max-height: 80vh;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
`;

const ModalTitle = styled.span`
  font-family: var(--font-code);
  font-size: 0.8125rem;
  color: var(--text-primary);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ModalCloseBtn = styled.button`
  padding: 4px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;

  &:hover { color: var(--text-primary); }
`;

const CodeScroll = styled.div`
  flex: 1;
  overflow: auto;

  &::-webkit-scrollbar { width: 6px; height: 6px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const CodePre = styled.pre`
  margin: 0;
  padding: 20px;
  font-family: var(--font-code);
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre;
  tab-size: 2;
`;

type Filter = 'all' | 'unread';

function loadReadIds() {
  try {
    return new Set<string>(JSON.parse(localStorage.getItem(READ_STORAGE_KEY) ?? '[]'));
  } catch {
    return new Set<string>();
  }
}

interface FilePreview {
  path: string;
  sha: string;
  repoFullName: string;
}

function CodePreviewModal({ file, onClose }: { file: FilePreview; onClose: () => void }) {
  const token = useGitHubStore(s => s.token);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const [owner, repo] = file.repoFullName.split('/');
    setLoading(true);
    githubService.getFileContent(token, owner, repo, file.path, file.sha)
      .then(c => { setContent(c); setLoading(false); })
      .catch(e => { setError(e instanceof Error ? e.message : '오류'); setLoading(false); });
  }, [token, file]);

  return (
    <ModalOverlay onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <ModalBox>
        <ModalHeader>
          <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0 }}>description</span>
          <ModalTitle>{file.path}</ModalTitle>
          <ModalCloseBtn onClick={onClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
          </ModalCloseBtn>
        </ModalHeader>
        <CodeScroll>
          {loading && (
            <CodePre style={{ color: 'var(--text-muted)' }}>불러오는 중...</CodePre>
          )}
          {error && (
            <CodePre style={{ color: 'var(--danger)' }}>{error}</CodePre>
          )}
          {!loading && !error && content !== null && (
            <CodePre>{content}</CodePre>
          )}
        </CodeScroll>
      </ModalBox>
    </ModalOverlay>
  );
}

export function NotificationsPane() {
  const [filter, setFilter] = useState<Filter>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => loadReadIds());
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

  const setActiveChannel = useUIStore((state) => state.setActiveChannel);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const channelsMap = useMessagesStore((state) => state.channels);
  const messagesMap = useMessagesStore((state) => state.messages);
  const currentUser = useAuthStore((state) => state.currentUser);
  const receivedRequests = useFriendStore((state) => state.receivedRequests);
  const remoteNotifs = useNotificationStore((state) => state.notifications);
  const githubNotifs = useGitHubStore(s => s.notifications);
  const markGitHubRead = useGitHubStore(s => s.markRead);
  const markAllGitHubRead = useGitHubStore(s => s.markAllRead);

  useEffect(() => {
    localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...readIds]));
  }, [readIds]);

  useEffect(() => {
    if (!isHttp) return;
    notificationService.fetch().catch(() => {});
  }, []);

  const rawNotifs = useMemo<Notification[]>(() => {
    const githubMapped: Notification[] = githubNotifs.map(g => ({
      id: g.id,
      type: `github-${g.type}` as NotifType,
      actor: g.author,
      preview: g.title,
      ts: g.ts,
      read: g.read,
      githubData: g,
    }));

    if (isHttp) return [...githubMapped, ...remoteNotifs].sort((a, b) => b.ts - a.ts);
    if (!currentUser) return [...githubMapped].sort((a, b) => b.ts - a.ts);

    const result: Notification[] = [];

    for (const request of receivedRequests) {
      result.push({
        id: `friend-${request.id}`,
        type: 'friend',
        actor: request.fromName,
        preview: '친구 요청을 보냈습니다.',
        ts: request.createdAt,
      });
    }

    for (const msg of Object.values(messagesMap)) {
      if (msg.authorId === currentUser.id) continue;
      const preview = msg.content.replace(/```[\s\S]*?```/g, '[code]').slice(0, 100);

      if (msg.content.includes(`@${currentUser.nickname}`)) {
        result.push({
          id: `mention-${msg.id}`,
          type: 'mention',
          actor: msg.authorName,
          channelId: msg.channelId,
          preview,
          ts: msg.createdAt,
        });
      }

      if (msg.quoteRef) {
        const quoted = messagesMap[msg.quoteRef.messageId];
        if (quoted && quoted.authorId === currentUser.id) {
          result.push({
            id: `reply-${msg.id}`,
            type: 'reply',
            actor: msg.authorName,
            channelId: msg.channelId,
            preview,
            ts: msg.createdAt,
          });
        }
      }

      if (msg.kind === 'task' && msg.status === 'completed') {
        result.push({
          id: `status-${msg.id}`,
          type: 'status',
          actor: msg.authorName,
          channelId: msg.channelId,
          preview: '작업이 완료 상태로 변경되었습니다.',
          ts: msg.createdAt,
        });
      }
    }

    return [...githubMapped, ...result].sort((a, b) => b.ts - a.ts);
  }, [currentUser, messagesMap, receivedRequests, remoteNotifs, githubNotifs]);

  const notifs = rawNotifs.map((notif) => ({
    ...notif,
    read: notif.type.startsWith('github-')
      ? Boolean(notif.read)
      : (isHttp ? Boolean(notif.read) : readIds.has(notif.id)),
  }));
  const unreadCount = notifs.filter((notif) => !notif.read).length;
  const visible = filter === 'unread' ? notifs.filter((notif) => !notif.read) : notifs;

  function markRead(notif: Notification) {
    if (notif.type.startsWith('github-')) {
      markGitHubRead(notif.id);
    } else {
      setReadIds((prev) => new Set([...prev, notif.id]));
      if (isHttp) notificationService.markRead([notif.id]).catch(() => {});
    }
  }

  function markAllRead() {
    const regularIds = rawNotifs.filter(n => !n.type.startsWith('github-')).map(n => n.id);
    setReadIds(new Set(regularIds));
    markAllGitHubRead();
    if (isHttp) notificationService.markRead(regularIds).catch(() => {});
  }

  function handleClick(notif: Notification) {
    markRead(notif);
    if (notif.type === 'friend') {
      setActiveView('friends');
      return;
    }
    if (notif.type.startsWith('github-') && notif.githubData?.htmlUrl) {
      window.open(notif.githubData.htmlUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (notif.channelId) setActiveChannel(notif.channelId);
  }

  function handleFileClick(e: React.MouseEvent, file: GitHubChangedFile, repoFullName: string, sha: string) {
    e.stopPropagation();
    if (file.status === 'removed') return;
    setFilePreview({ path: file.filename, sha, repoFullName });
  }

  function getIconColor(type: NotifType) {
    if (type === 'mention' || type === 'friend' || type === 'workspace') return 'var(--accent-text)';
    return 'var(--text-secondary)';
  }

  return (
    <>
      <Page>
        <TopBar>
          <TopTitle>
            알림
            {unreadCount > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '18px', height: '18px', borderRadius: '50%',
                background: 'var(--accent)', color: 'var(--accent-text)',
                fontSize: '10px', fontWeight: 700, marginLeft: '6px',
              }}>{unreadCount}</span>
            )}
          </TopTitle>
          <TopActions>
            <FilterBtn $active={filter === 'all'} onClick={() => setFilter('all')}>전체</FilterBtn>
            <FilterBtn $active={filter === 'unread'} onClick={() => setFilter('unread')}>
              안 읽음 {unreadCount > 0 && `(${unreadCount})`}
            </FilterBtn>
            {unreadCount > 0 && <MarkAllBtn onClick={markAllRead}>모두 읽음</MarkAllBtn>}
          </TopActions>
        </TopBar>

        <List>
          {visible.length === 0 ? (
            <EmptyState>
              <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.25 }}>notifications_off</span>
              {filter === 'unread' ? '안 읽은 알림이 없습니다.' : '알림이 없습니다.'}
            </EmptyState>
          ) : (
            visible.map((notif) => (
              <NotifCard key={notif.id} $read={notif.read} onClick={() => handleClick(notif)}>
                <NotifIconWrap $color={COLOR_MAP[notif.type]}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: getIconColor(notif.type) }}>
                    {ICON_MAP[notif.type]}
                  </span>
                </NotifIconWrap>

                <NotifBody>
                  <NotifMeta>
                    <NotifActor>{notif.actor}</NotifActor>
                    {notif.channelId && (
                      <NotifChannel>#{channelsMap[notif.channelId]?.name ?? notif.channelId}</NotifChannel>
                    )}
                    {notif.type.startsWith('github-') && notif.githubData && (
                      <NotifChannel>{notif.githubData.repo}</NotifChannel>
                    )}
                    <NotifTime>{formatTimestamp(notif.ts)}</NotifTime>
                  </NotifMeta>

                  <NotifPreview>{notif.preview}</NotifPreview>

                  {notif.type === 'github-commit' && notif.githubData?.sha && (
                    <div style={{ marginTop: 4 }}>
                      <ShaTag>{notif.githubData.sha.slice(0, 7)}</ShaTag>
                    </div>
                  )}

                  {notif.type === 'github-commit' && notif.githubData?.files && notif.githubData.files.length > 0 && (
                    <FileChips>
                      {notif.githubData.files.slice(0, 6).map(f => (
                        <FileChip
                          key={f.filename}
                          $status={f.status}
                          onClick={e => handleFileClick(e, f, notif.githubData!.repo, notif.githubData!.sha!)}
                          title={f.status === 'removed' ? f.filename : `${f.filename} 미리보기`}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>
                            {f.status === 'added' ? 'add' : f.status === 'removed' ? 'remove' : 'edit'}
                          </span>
                          {f.filename.split('/').pop()}
                        </FileChip>
                      ))}
                      {notif.githubData.files.length > 6 && (
                        <ShaTag>+{notif.githubData.files.length - 6}</ShaTag>
                      )}
                    </FileChips>
                  )}

                  {(notif.type === 'github-pr' || notif.type === 'github-issue') && notif.githubData?.labels && notif.githubData.labels.length > 0 && (
                    <LabelChips>
                      {notif.githubData.labels.slice(0, 4).map(label => (
                        <LabelChip key={label}>{label}</LabelChip>
                      ))}
                    </LabelChips>
                  )}

                  {(notif.type === 'github-pr' || notif.type === 'github-issue') && notif.githubData?.number !== undefined && (
                    <div style={{ marginTop: 4 }}>
                      <ShaTag>#{notif.githubData.number}</ShaTag>
                    </div>
                  )}
                </NotifBody>

                {!notif.read && <UnreadDot />}
              </NotifCard>
            ))
          )}
        </List>
      </Page>

      {filePreview && (
        <CodePreviewModal file={filePreview} onClose={() => setFilePreview(null)} />
      )}
    </>
  );
}
