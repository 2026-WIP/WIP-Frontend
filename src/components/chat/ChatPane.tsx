import styled, { keyframes } from 'styled-components';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/useUIStore';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ThreadPane } from './ThreadPane';
import { messageService } from '@/services/messageService';
import { joinChannel, leaveChannel } from '@/services/socketService';
import { unreadService } from '@/services/unreadService';
import type { User } from '@/types/auth';

const POLL_INTERVAL_MS = 5000;
const SHOULD_POLL = import.meta.env.VITE_API_MODE !== 'http';

// ─── 스타일 컴포넌트 ────────────────────────────────────────────────────────

const Pane = styled.div`
  display: flex; flex-direction: row; height: 100%; min-height: 0; overflow: hidden;
`;

const ChatColumn = styled.div`
  flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden;
`;

const HeaderRelative = styled.div`
  position: relative;
`;

const ChannelHeader = styled.div`
  height: 52px; border-bottom: 1px solid var(--border);
  padding: 0 20px; display: flex; align-items: center;
  justify-content: space-between; background: var(--bg-surface); flex-shrink: 0;
`;

const ChannelTitle = styled.div`
  display: flex; align-items: center; gap: 6px; min-width: 0;
`;

const ChannelHash = styled.span`
  color: var(--text-muted); font-weight: 700; font-size: 1rem; font-family: var(--font-ui);
`;

const ChannelName = styled.h3`
  font-size: 0.9375rem; font-weight: 700; font-family: var(--font-ui); color: var(--text-primary);
`;

const ChannelDesc = styled.span`
  font-size: 0.75rem; color: var(--text-muted); margin-left: 6px; padding-left: 8px;
  border-left: 1px solid var(--border);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
`;

const Actions = styled.div`
  display: flex; align-items: center; gap: 2px;
`;

const IconBtn = styled.button<{ $active?: boolean }>`
  display: flex; align-items: center; padding: 6px 7px; border: none;
  background: ${p => p.$active ? 'var(--accent)' : 'none'};
  border-radius: 0.25rem; cursor: pointer;
  color: ${p => p.$active ? 'var(--accent-text)' : 'var(--text-muted)'};
  transition: background 120ms, color 120ms;
  &:hover { background: ${p => p.$active ? 'var(--accent)' : 'var(--bg-hover)'}; color: var(--text-primary); }
`;

const Panel = styled.div`
  position: absolute; top: 52px; right: 0; width: 260px;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-top: none; border-radius: 0 0 0.25rem 0.25rem;
  z-index: 50; overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 10px 14px 8px; font-family: var(--font-ui); font-size: 10px;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
  color: var(--text-muted); border-bottom: 1px solid var(--border);
`;

const PanelBody = styled.div`
  padding: 12px 14px;
`;

const InfoText = styled.p`
  font-size: 0.8125rem; line-height: 1.5; color: var(--text-secondary);
`;

const MemberItem = styled.div`
  display: flex; align-items: center; gap: 10px; padding: 8px 14px;
  transition: background 100ms;
  &:hover { background: var(--bg-hover); }
`;

const MemberAvatar = styled.div`
  width: 28px; height: 28px; border-radius: 50%; background: var(--accent);
  border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;
  font-family: var(--font-ui); font-size: 11px; font-weight: 700;
  color: var(--accent-text); flex-shrink: 0;
`;

const MemberName = styled.span`
  font-size: 0.8125rem; color: var(--text-primary); font-family: var(--font-ui);
`;

const MemberAddBtn = styled.button`
  width: calc(100% - 28px); margin: 8px 14px 12px;
  padding: 7px 10px; border: 1px solid var(--border); border-radius: 0.25rem;
  background: var(--bg-surface); color: var(--text-primary); font-family: var(--font-ui);
  font-size: 0.75rem; font-weight: 700; cursor: pointer;
  &:hover { background: var(--bg-hover); }
`;

const MemberError = styled.p`
  padding: 0 14px 8px; color: var(--danger); font-size: 0.75rem;
`;

// 채널 설정 패널
const SettingsPanel = styled.div`
  position: absolute; top: 52px; right: 0; width: 200px;
  background: var(--bg-surface); border: 1px solid var(--border);
  border-top: none; border-radius: 0 0 0.25rem 0.25rem;
  z-index: 50; padding: 4px;
`;

const SettingsBtn = styled.button<{ $danger?: boolean }>`
  width: 100%; display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border: none; background: none;
  border-radius: 0.125rem; cursor: pointer;
  font-family: var(--font-ui); font-size: 0.8125rem;
  color: ${p => p.$danger ? 'var(--danger)' : 'var(--text-primary)'}; text-align: left;
  &:hover { background: ${p => p.$danger ? 'rgba(186,26,26,0.06)' : 'var(--bg-hover)'}; }
`;

// Channel edit dialog
const EditOverlay = styled.div`
  position: fixed; inset: 0; z-index: 200; background: rgba(18,18,18,0.42);
  display: flex; align-items: center; justify-content: center; padding: 24px;
`;

const EditDialog = styled.form`
  width: min(420px, 100%); background: var(--bg-surface);
  border: 1px solid var(--border); border-radius: 0.25rem; padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
`;

const DialogTitle = styled.h3`
  font-family: var(--font-ui); font-size: 1rem; font-weight: 700; color: var(--text-primary);
`;

const FieldGroup = styled.div`
  display: flex; flex-direction: column; gap: 6px;
`;

const DialogLabel = styled.label`
  font-family: var(--font-ui); font-size: 0.8125rem; font-weight: 600; color: var(--text-primary);
`;

const DialogInput = styled.input`
  height: 42px; border: 1px solid var(--border); border-radius: 0.25rem; padding: 0 12px;
  font-size: 0.875rem; color: var(--text-primary); outline: none;
  &:focus { border-color: var(--text-primary); }
`;

const DialogTextarea = styled.textarea`
  min-height: 70px; border: 1px solid var(--border); border-radius: 0.25rem;
  padding: 10px 12px; font-size: 0.875rem; color: var(--text-primary); outline: none; resize: vertical;
  &:focus { border-color: var(--text-primary); }
`;

const DialogError = styled.p`
  color: var(--danger); font-size: 0.75rem;
`;

const DialogActions = styled.div`
  display: flex; justify-content: flex-end; gap: 8px;
`;

const DialogSecondary = styled.button`
  padding: 8px 14px; border: 1px solid var(--border); background: var(--bg-surface);
  border-radius: 0.25rem; cursor: pointer; font-family: var(--font-ui); font-size: 0.875rem;
`;

const DialogPrimary = styled.button<{ $danger?: boolean }>`
  padding: 8px 14px; border: none;
  background: ${p => p.$danger ? 'var(--danger)' : 'var(--accent)'};
  color: ${p => p.$danger ? 'var(--bg-surface)' : 'var(--accent-text)'};
  border-radius: 0.25rem; font-weight: 700; cursor: pointer;
  font-family: var(--font-ui); font-size: 0.875rem;
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

// 타이핑 인디케이터
const dot = keyframes`
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
`;

const TypingBar = styled.div`
  padding: 4px 24px 6px;
  font-family: var(--font-ui); font-size: 0.75rem; color: var(--text-muted);
  display: flex; align-items: center; gap: 6px; min-height: 22px;
  background: var(--bg-surface);
`;

const Dots = styled.span`
  display: inline-flex; gap: 3px;
`;

const Dot = styled.span<{ $delay: number }>`
  width: 5px; height: 5px; border-radius: 50%; background: var(--text-muted);
  animation: ${dot} 1.2s ${p => p.$delay}s ease-in-out infinite;
`;

const Empty = styled.div`
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); font-size: 0.875rem; font-family: var(--font-body);
`;

// ─── 컴포넌트 ────────────────────────────────────────────────────────────

export function ChatPane() {
  const navigate = useNavigate();
  const activeChannelId = useUIStore((state) => state.activeChannelId);
  const activeThreadMessageId = useUIStore((state) => state.activeThreadMessageId);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setGlobalSearchQuery = useUIStore((state) => state.setGlobalSearchQuery);
  // 새 [] 를 반환하면 useSyncExternalStore가 항상 "변경됨"으로 인식해 무한 리렌더링 루프 발생
  // 저장된 reference(또는 undefined)를 반환하고, 빈 [] 는 컴포넌트 밖에서 처리
  const rawTypingUsers = useUIStore((state) => activeChannelId ? state.typingUsers[activeChannelId] : undefined);
  const typingUsers = rawTypingUsers ?? [];

  const channel = useMessagesStore((state) =>
    activeChannelId ? state.channels[activeChannelId] : null
  );
  const currentUser = useAuthStore((state) => state.currentUser);

  const [panel, setPanel] = useState<'members' | 'info' | 'settings' | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [memberError, setMemberError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 채널 설정 모달
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // 채널 삭제/나가기 확인 모달
  const [confirmAction, setConfirmAction] = useState<'delete' | 'leave' | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionBusy, setActionBusy] = useState(false);

  useEffect(() => {
    if (activeChannelId) {
      messageService.fetchMessages(activeChannelId, { limit: 30 }).catch(() => {});
      joinChannel(activeChannelId);
      // 채널 열면 읽음 처리 → 서버 DB 업데이트 + UI 빨간 점 제거
      unreadService.markChannelRead(activeChannelId).catch(() => {});
    }
    return () => {
      if (activeChannelId) leaveChannel(activeChannelId);
    };
  }, [activeChannelId]);

  useEffect(() => {
    if (!activeChannelId) return;
    messageService.fetchChannelMembers(activeChannelId).then(setMembers).catch(() => setMembers([]));
    messageService.fetchWorkspaceMembers().then(setWorkspaceMembers).catch(() => setWorkspaceMembers([]));
  }, [activeChannelId]);

  useEffect(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!activeChannelId || !SHOULD_POLL) return;
    pollingRef.current = setInterval(() => {
      messageService.fetchMessages(activeChannelId, { limit: 30 }).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeChannelId]);

  function openChannelSearch() {
    setGlobalSearchQuery(channel ? `#${channel.name} ` : '');
    setActiveView('search');
  }

  async function addMember(userId: string) {
    if (!activeChannelId) return;
    setMemberError('');
    try {
      await messageService.addChannelMember(activeChannelId, userId);
      setMembers(await messageService.fetchChannelMembers(activeChannelId));
      setWorkspaceMembers(await messageService.fetchWorkspaceMembers());
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : '멤버를 추가하지 못했습니다');
    }
  }

  function openEdit() {
    if (!channel) return;
    setEditName(channel.name);
    setEditDesc(channel.description ?? '');
    setEditError('');
    setEditOpen(true);
    setPanel(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!activeChannelId || !editName.trim()) { setEditError('채널 이름을 입력해주세요'); return; }
    setEditSaving(true); setEditError('');
    try {
      await messageService.updateChannel(activeChannelId, { name: editName.trim(), description: editDesc.trim() });
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setEditSaving(false);
    }
  }

  async function handleConfirmAction() {
    if (!activeChannelId || !confirmAction) return;
    setActionBusy(true); setActionError('');
    try {
      if (confirmAction === 'delete') {
        await messageService.deleteChannel(activeChannelId);
      } else {
        await messageService.leaveChannel(activeChannelId);
      }
      setConfirmAction(null);
      setActiveView('home');
      // 채널 목록 갱신
      messageService.fetchChannels().catch(() => {});
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '작업 실패');
    } finally {
      setActionBusy(false);
    }
  }

  const isOwner = channel?.ownerId ? channel.ownerId === currentUser?.id : true;

  // 타이핑 텍스트 생성
  let typingText = '';
  if (typingUsers.length === 1) typingText = `${typingUsers[0]}님이 입력 중`;
  else if (typingUsers.length === 2) typingText = `${typingUsers[0]}, ${typingUsers[1]}님이 입력 중`;
  else if (typingUsers.length > 2) typingText = `${typingUsers.length}명이 입력 중`;

  if (!activeChannelId || !channel) {
    return <Empty>채널을 선택하거나 작업 공간에 참여해주세요</Empty>;
  }

  return (
    <Pane>
      <ChatColumn>
        <HeaderRelative>
          <ChannelHeader>
            <ChannelTitle>
              <ChannelHash>#</ChannelHash>
              <ChannelName>{channel.name}</ChannelName>
              {channel.description && <ChannelDesc>{channel.description}</ChannelDesc>}
            </ChannelTitle>
            <Actions>
              <IconBtn title="멤버 목록" $active={panel === 'members'}
                onClick={() => setPanel((v) => v === 'members' ? null : 'members')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span>
              </IconBtn>
              <IconBtn title="채널 정보" $active={panel === 'info'}
                onClick={() => setPanel((v) => v === 'info' ? null : 'info')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
              </IconBtn>
              <IconBtn title="검색" onClick={openChannelSearch}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>search</span>
              </IconBtn>
              <IconBtn title="채널 설정" $active={panel === 'settings'}
                onClick={() => setPanel((v) => v === 'settings' ? null : 'settings')}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings</span>
              </IconBtn>
            </Actions>
          </ChannelHeader>

          {panel === 'members' && (
            <Panel>
              <PanelHeader>멤버 {members.length}명</PanelHeader>
              {members.map((member) => (
                <MemberItem key={member.id}>
                  <MemberAvatar>{member.nickname.charAt(0).toUpperCase()}</MemberAvatar>
                  <MemberName>{member.nickname}{member.id === currentUser?.id ? ' (나)' : ''}</MemberName>
                </MemberItem>
              ))}
              {workspaceMembers
                .filter((wm) => !members.some((m) => m.id === wm.id))
                .map((wm) => (
                  <MemberAddBtn key={wm.id} onClick={() => addMember(wm.id)}>
                    + {wm.nickname} 추가
                  </MemberAddBtn>
                ))}
              {memberError && <MemberError>{memberError}</MemberError>}
            </Panel>
          )}

          {panel === 'info' && (
            <Panel>
              <PanelHeader>채널 정보</PanelHeader>
              <PanelBody>
                <InfoText>
                  #{channel.name}<br />
                  {channel.description || '채널 설명이 아직 없습니다.'}
                </InfoText>
              </PanelBody>
            </Panel>
          )}

          {panel === 'settings' && (
            <SettingsPanel>
              {isOwner && (
                <SettingsBtn onClick={openEdit}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                  채널 이름/설명 설정
                </SettingsBtn>
              )}
              <SettingsBtn onClick={() => { navigate('/app/settings'); setPanel(null); }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>manage_accounts</span>
                설정으로 이동
              </SettingsBtn>
              {!isOwner && (
                <SettingsBtn $danger onClick={() => { setConfirmAction('leave'); setPanel(null); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>exit_to_app</span>
                  채널 나가기
                </SettingsBtn>
              )}
              {isOwner && (
                <SettingsBtn $danger onClick={() => { setConfirmAction('delete'); setPanel(null); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                  채널 삭제
                </SettingsBtn>
              )}
            </SettingsPanel>
          )}
        </HeaderRelative>

        <MessageList key={activeChannelId} channelId={activeChannelId} />

        {typingUsers.length > 0 && (
          <TypingBar>
            <Dots>
              <Dot $delay={0} />
              <Dot $delay={0.2} />
              <Dot $delay={0.4} />
            </Dots>
            {typingText}...
          </TypingBar>
        )}

        <ChatInput channelId={activeChannelId} />
      </ChatColumn>

      {activeThreadMessageId && <ThreadPane />}

      {/* 채널 설정 모달 */}
      {editOpen && (
        <EditOverlay onClick={(e) => e.target === e.currentTarget && setEditOpen(false)}>
          <EditDialog onSubmit={handleSaveEdit}>
            <DialogTitle>채널 설정</DialogTitle>
            <FieldGroup>
              <DialogLabel>채널 이름</DialogLabel>
              <DialogInput value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </FieldGroup>
            <FieldGroup>
              <DialogLabel>설명</DialogLabel>
              <DialogTextarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </FieldGroup>
            {editError && <DialogError>{editError}</DialogError>}
            <DialogActions>
              <DialogSecondary type="button" onClick={() => setEditOpen(false)}>취소</DialogSecondary>
              <DialogPrimary type="submit" disabled={editSaving}>{editSaving ? '저장 중...' : '저장'}</DialogPrimary>
            </DialogActions>
          </EditDialog>
        </EditOverlay>
      )}

      {/* 삭제/나가기 확인 모달 */}
      {confirmAction && (
        <EditOverlay onClick={(e) => e.target === e.currentTarget && setConfirmAction(null)}>
          <EditDialog as="div" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <DialogTitle>
              {confirmAction === 'delete' ? '채널 삭제' : '채널 나가기'}
            </DialogTitle>
            <InfoText>
              {confirmAction === 'delete'
                ? `#${channel.name} 채널과 모든 메시지가 영구 삭제됩니다. 계속하시겠습니까?`
                : `#${channel.name} 채널을 나가면 다시 참여하려면 초대받아야 합니다. 계속하시겠습니까?`}
            </InfoText>
            {actionError && <DialogError>{actionError}</DialogError>}
            <DialogActions>
              <DialogSecondary onClick={() => setConfirmAction(null)}>취소</DialogSecondary>
              <DialogPrimary $danger disabled={actionBusy} onClick={handleConfirmAction}>
                {actionBusy ? '처리 중...' : confirmAction === 'delete' ? '삭제' : '나가기'}
              </DialogPrimary>
            </DialogActions>
          </EditDialog>
        </EditOverlay>
      )}
    </Pane>
  );
}
