import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useUIStore, type AppView } from '@/store/useUIStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDmStore } from '@/store/useDmStore';
import { useFriendStore } from '@/store/useFriendStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { messageService } from '@/services/messageService';
import { workspaceService } from '@/services/workspaceService';
import { joinChannel } from '@/services/socketService';
import { dmService } from '@/services/dmService';
import type { User } from '@/types/auth';

const YELLOW = 'var(--accent)';
const BORDER = 'var(--border)';
const TEXT = 'var(--text-primary)';
const MUTED = 'var(--text-muted)';

const Aside = styled.aside`
  display: none;
  height: 100%;
  flex-shrink: 0;

  @media (min-width: 768px) { display: flex; }
`;

const Rail = styled.div<{ $expanded: boolean }>`
  width: ${p => p.$expanded ? '196px' : '64px'};
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 10px 0;
  gap: 6px;
  border-right: 1px solid ${BORDER};
  background: var(--bg-panel);
  flex-shrink: 0;
  overflow: hidden;
  transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const RailBtn = styled.button<{ $active?: boolean }>`
  height: 48px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 10px;
  background: ${p => p.$active ? YELLOW : 'transparent'};
  color: ${p => p.$active ? 'var(--accent-text)' : MUTED};
  transition: background 120ms, color 120ms;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
  border-radius: 0 0.25rem 0.25rem 0;

  &:hover {
    background: ${p => p.$active ? YELLOW : 'var(--border)'};
    color: ${p => p.$active ? 'var(--accent-text)' : TEXT};
  }
`;

const RailIcon = styled.span`
  font-size: 26px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
`;

const RailLabel = styled.span<{ $visible: boolean }>`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 600;
  opacity: ${p => p.$visible ? 1 : 0};
  transform: translateX(${p => p.$visible ? '0' : '-6px'});
  transition: opacity 150ms 50ms, transform 150ms 50ms;
  pointer-events: none;
`;

const Badge = styled.span`
  position: absolute;
  top: 5px;
  right: 5px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--danger);
  border: 1.5px solid var(--bg-panel);
`;

const RailSpacer = styled.div`
  flex: 1;
`;

const RailDivider = styled.div`
  height: 1px;
  background: ${BORDER};
  margin: 4px 10px;
  flex-shrink: 0;
`;

const Panel = styled.div`
  width: 188px;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid ${BORDER};
  background: var(--bg-hover);
`;

const PanelHeader = styled.div`
  padding: 12px 14px 10px;
  border-bottom: 1px solid ${BORDER};
  flex-shrink: 0;
`;

const PanelTitle = styled.h2`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${TEXT};
  font-family: var(--font-ui);
`;

const PanelSub = styled.p`
  font-size: 0.6875rem;
  color: ${MUTED};
  font-family: var(--font-ui);
  margin-top: 1px;
`;

const Nav = styled.nav`
  flex: 1;
  overflow-y: auto;
  padding: 6px 6px 0;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 2px; }
`;

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px 4px;
`;

const SectionLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${MUTED};
  font-family: var(--font-ui);
`;

const AddBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${MUTED};
  border-radius: 0.125rem;
  transition: color 120ms, background 120ms;

  &:hover { color: ${TEXT}; background: ${BORDER}; }
`;

const ChannelBtn = styled.button<{ $active?: boolean; $unread?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  font-size: 0.8125rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  transition: background 120ms;
  background: ${p => p.$active ? 'var(--border)' : 'transparent'};
  color: ${p => p.$active ? TEXT : p.$unread ? TEXT : 'var(--text-secondary)'};
  font-weight: ${p => (p.$active || p.$unread) ? '600' : '400'};
  font-family: var(--font-ui);
  text-align: left;

  &:hover { background: ${p => p.$active ? 'var(--border)' : 'var(--bg-active)'}; }
`;

const UnreadDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--danger);
  flex-shrink: 0;
  margin-left: auto;
`;

const Hash = styled.span<{ $active?: boolean }>`
  font-weight: 700;
  font-size: 0.875rem;
  color: ${p => p.$active ? YELLOW : 'var(--border)'};
  flex-shrink: 0;
`;

const Footer = styled.div`
  display: none;
`;

const LogoutBtn = styled.button`
  display: none;
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

const Modal = styled.form`
  width: min(420px, calc(100vw - 32px));
  background: var(--bg-surface);
  border: 1px solid ${BORDER};
  border-radius: 0.25rem;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const ModalTitle = styled.h3`
  font-family: var(--font-ui);
  font-size: 1rem;
  font-weight: 700;
  color: ${TEXT};
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  color: ${TEXT};
`;

const Input = styled.input<{ $error?: boolean }>`
  height: 42px;
  border: 1px solid ${p => p.$error ? 'var(--danger)' : BORDER};
  border-radius: 0.25rem;
  padding: 0 12px;
  font-size: 0.875rem;
  color: ${TEXT};
  outline: none;

  &:focus { border-color: ${p => p.$error ? 'var(--danger)' : TEXT}; }
`;

const Textarea = styled.textarea`
  min-height: 78px;
  border: 1px solid ${BORDER};
  border-radius: 0.25rem;
  padding: 10px 12px;
  font-size: 0.875rem;
  color: ${TEXT};
  outline: none;
  resize: vertical;

  &:focus { border-color: ${TEXT}; }
`;

const ErrorText = styled.p`
  color: var(--danger);
  font-size: 0.75rem;
`;

const MemberPickList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 150px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid ${BORDER};
  border-radius: 0.25rem;
`;

const MemberPick = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 0.25rem;
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 0.8125rem;

  &:hover { background: var(--bg-hover); }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const SecondaryBtn = styled.button`
  padding: 8px 14px;
  border: 1px solid ${BORDER};
  background: var(--bg-surface);
  border-radius: 0.25rem;
  cursor: pointer;
`;

const PrimaryBtn = styled.button`
  padding: 8px 14px;
  border: none;
  background: ${YELLOW};
  color: var(--accent-text);
  border-radius: 0.25rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const RAIL_ITEMS: { view: AppView; icon: string; label: string }[] = [
  { view: 'home', icon: 'home', label: '홈' },
  { view: 'dm', icon: 'chat', label: 'DM' },
  { view: 'channel', icon: 'tag', label: '채널' },
  { view: 'friends', icon: 'group', label: '친구' },
  { view: 'snippets', icon: 'code', label: '스니펫' },
  { view: 'notifications', icon: 'notifications', label: '알림' },
  { view: 'search', icon: 'search', label: '검색' },
];

const VIEWS_WITH_PANEL: AppView[] = ['channel', 'dm'];

function normalizeChannelName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9가-힣_-]/g, '');
}

function parseMemberIds(value: string) {
  return value
    .split(/[\s,]+/)
    .map((id) => id.trim())
    .filter(Boolean);
}

export function Sidebar() {
  const channelMap = useMessagesStore((state) => state.channels);
  const channels = Object.values(channelMap);
  const activeView = useUIStore((state) => state.activeView);
  const activeChannelId = useUIStore((state) => state.activeChannelId);
  const activeDmUserId = useUIStore((state) => state.activeDmUserId);
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setActiveChannel = useUIStore((state) => state.setActiveChannel);
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();

  const [hovered, setHovered] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [selectedChannelMemberIds, setSelectedChannelMemberIds] = useState<string[]>([]);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  const receivedCount = useFriendStore((state) => state.receivedRequests.length);
  const unreadNotifications = useNotificationStore((state) => state.notifications.filter((notification) => !notification.read).length);
  const unreadChannelIds = useUIStore((state) => state.unreadChannelIds);
  const unreadDmKeys = useUIStore((state) => state.unreadDmKeys);
  const showPanel = VIEWS_WITH_PANEL.includes(activeView);

  useEffect(() => {
    if (!showChannelModal) return;
    messageService.fetchWorkspaceMembers().then(setWorkspaceMembers).catch(() => setWorkspaceMembers([]));
  }, [showChannelModal]);

  async function handleAddChannel(event: React.FormEvent) {
    event.preventDefault();
    const name = normalizeChannelName(newChannelName);
    if (!name) {
      setCreateError('채널 이름을 입력하세요.');
      return;
    }
    if (channels.some((channel) => channel.name === name)) {
      setCreateError('이미 같은 이름의 채널이 있습니다.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const channel = await messageService.createChannel(name, newChannelDesc.trim(), selectedChannelMemberIds);
      joinChannel(channel.id);
      setActiveChannel(channel.id);
      setShowChannelModal(false);
      setNewChannelName('');
      setNewChannelDesc('');
      setSelectedChannelMemberIds([]);
    } catch {
      setCreateError('채널을 만들지 못했습니다.');
    } finally {
      setCreating(false);
    }
  }

  function toggleChannelMember(userId: string) {
    setSelectedChannelMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  async function handleAddMember(event: React.FormEvent) {
    event.preventDefault();
    if (!memberEmail.trim()) {
      setMemberError('이메일을 입력하세요.');
      return;
    }
    setAddingMember(true);
    setMemberError('');
    try {
      await workspaceService.addMember(memberEmail.trim());
      if (showChannelModal) {
        messageService.fetchWorkspaceMembers().then(setWorkspaceMembers).catch(() => {});
      }
      setMemberEmail('');
      setShowMemberModal(false);
    } catch (error) {
      setMemberError(error instanceof Error ? error.message : '멤버를 추가하지 못했습니다.');
    } finally {
      setAddingMember(false);
    }
  }

  return (
    <Aside onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Rail $expanded={hovered}>
        {RAIL_ITEMS.map(({ view, icon, label }) => (
          <RailBtn key={view} $active={activeView === view} onClick={() => setActiveView(view)}>
            <RailIcon className="material-symbols-outlined">
              {icon}
              {view === 'notifications' && receivedCount + unreadNotifications > 0 && activeView !== 'notifications' && <Badge />}
              {view === 'friends' && receivedCount > 0 && activeView !== 'friends' && <Badge />}
              {view === 'channel' && unreadChannelIds.size > 0 && (activeView !== 'channel' || [...unreadChannelIds].some((id) => id !== activeChannelId)) && <Badge />}
              {view === 'dm' && unreadDmKeys.size > 0 && (activeView !== 'dm' || [...unreadDmKeys].some((key) => key !== activeDmUserId)) && <Badge />}
            </RailIcon>
            <RailLabel $visible={hovered}>{label}</RailLabel>
          </RailBtn>
        ))}

        <RailSpacer />
        <RailDivider />

        <RailBtn onClick={() => navigate('/app/settings')}>
          <RailIcon className="material-symbols-outlined">settings</RailIcon>
          <RailLabel $visible={hovered}>설정</RailLabel>
        </RailBtn>
      </Rail>

      {showPanel && (
        <Panel>
          <PanelHeader>
            <PanelTitle>{activeView === 'channel' ? '채널' : 'DM'}</PanelTitle>
            {activeView === 'channel' && <PanelSub>{currentUser?.nickname ?? '워크스페이스'}</PanelSub>}
          </PanelHeader>

          <Nav>
            {activeView === 'channel' && (
              <>
                <SectionRow>
                  <SectionLabel>워크스페이스</SectionLabel>
                  <AddBtn title="워크스페이스 멤버 추가" onClick={() => setShowMemberModal(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span>
                  </AddBtn>
                </SectionRow>

                <SectionRow>
                  <SectionLabel>채널</SectionLabel>
                  <AddBtn title="채널 추가" onClick={() => setShowChannelModal(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
                  </AddBtn>
                </SectionRow>

                {channels.map((channel) => {
                  const isUnread = unreadChannelIds.has(channel.id);
                  return (
                    <ChannelBtn
                      key={channel.id}
                      $active={channel.id === activeChannelId}
                      $unread={isUnread}
                      onClick={() => setActiveChannel(channel.id)}
                    >
                      <Hash $active={channel.id === activeChannelId}>#</Hash>
                      {channel.name}
                      {isUnread && <UnreadDot />}
                    </ChannelBtn>
                  );
                })}
              </>
            )}

            {activeView === 'dm' && <DmList />}
          </Nav>

          {import.meta.env.VITE_SHOW_SIDEBAR_LOGOUT === 'true' && <Footer>
            <LogoutBtn onClick={() => navigate('/app/settings')}>
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>logout</span>
              로그아웃
            </LogoutBtn>
          </Footer>}
        </Panel>
      )}

      {showChannelModal && (
        <Overlay onClick={(event) => event.target === event.currentTarget && setShowChannelModal(false)}>
          <Modal onSubmit={handleAddChannel}>
            <ModalTitle>채널 만들기</ModalTitle>
            <FieldGroup>
              <Label htmlFor="channel-name">채널 이름</Label>
              <Input
                id="channel-name"
                autoFocus
                value={newChannelName}
                onChange={(event) => {
                  setNewChannelName(event.target.value);
                  setCreateError('');
                }}
                placeholder="예: frontend"
                $error={!!createError}
              />
              {createError && <ErrorText>{createError}</ErrorText>}
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="channel-desc">설명</Label>
              <Textarea
                id="channel-desc"
                value={newChannelDesc}
                onChange={(event) => setNewChannelDesc(event.target.value)}
                placeholder="채널에서 다룰 작업을 적어주세요."
              />
            </FieldGroup>
            <FieldGroup>
              <Label>처음부터 추가할 멤버</Label>
              <MemberPickList>
                {workspaceMembers.length === 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '6px 8px' }}>
                    추가할 워크스페이스 멤버가 없습니다.
                  </span>
                )}
                {workspaceMembers.map((member) => (
                  <MemberPick key={member.id}>
                    <input
                      type="checkbox"
                      checked={selectedChannelMemberIds.includes(member.id)}
                      onChange={() => toggleChannelMember(member.id)}
                    />
                    <span>{member.nickname}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{member.email}</span>
                  </MemberPick>
                ))}
              </MemberPickList>
            </FieldGroup>
            <ModalActions>
              <SecondaryBtn type="button" onClick={() => setShowChannelModal(false)}>취소</SecondaryBtn>
              <PrimaryBtn type="submit" disabled={creating}>{creating ? '생성 중...' : '생성'}</PrimaryBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}

      {showMemberModal && (
        <Overlay onClick={(event) => event.target === event.currentTarget && setShowMemberModal(false)}>
          <Modal onSubmit={handleAddMember}>
            <ModalTitle>워크스페이스 멤버 추가</ModalTitle>
            <FieldGroup>
              <Label htmlFor="member-email">가입 이메일</Label>
              <Input
                id="member-email"
                type="email"
                autoFocus
                value={memberEmail}
                onChange={(event) => {
                  setMemberEmail(event.target.value);
                  setMemberError('');
                }}
                placeholder="member@example.com"
                $error={!!memberError}
              />
              {memberError && <ErrorText>{memberError}</ErrorText>}
            </FieldGroup>
            <ModalActions>
              <SecondaryBtn type="button" onClick={() => setShowMemberModal(false)}>취소</SecondaryBtn>
              <PrimaryBtn type="submit" disabled={addingMember}>{addingMember ? '추가 중...' : '추가'}</PrimaryBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </Aside>
  );
}

const DmUserBtn = styled.button<{ $active?: boolean; $unread?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  font-size: 0.8125rem;
  border-radius: 0.25rem;
  border: none;
  cursor: pointer;
  background: ${p => p.$active ? 'var(--border)' : 'transparent'};
  color: ${p => p.$active ? TEXT : p.$unread ? TEXT : 'var(--text-secondary)'};
  font-weight: ${p => (p.$active || p.$unread) ? '600' : '400'};
  font-family: var(--font-ui);
  text-align: left;
  transition: background 120ms;

  &:hover { background: var(--bg-active); }
`;

const DmAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${YELLOW};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  color: var(--accent-text);
  flex-shrink: 0;
`;

function DmList() {
  const activeDmUserId = useUIStore((state) => state.activeDmUserId);
  const setActiveDmUser = useUIStore((state) => state.setActiveDmUser);
  const unreadDmKeys = useUIStore((state) => state.unreadDmKeys);
  const users = useDmStore((state) => state.users);
  const groupConversations = useDmStore((state) => state.groupConversations);
  const friends = useFriendStore((state) => state.friends);
  const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [typedMemberIds, setTypedMemberIds] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupError, setGroupError] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);

  const friendUsers = friends.filter((friend) => users.some((user) => user.id === friend.id));
  const workspaceUsers = workspaceMembers;
  const selectableUsers = useMemo(() => {
    const byId = new Map<string, User>();
    for (const user of [...friendUsers, ...workspaceUsers, ...users]) byId.set(user.id, user);
    return [...byId.values()];
  }, [friendUsers, workspaceUsers, users]);
  const allSelectedIds = useMemo(
    () => [...new Set([...selectedIds, ...parseMemberIds(typedMemberIds)])],
    [selectedIds, typedMemberIds],
  );
  const knownSelectableIds = useMemo(() => new Set(selectableUsers.map((user) => user.id)), [selectableUsers]);
  const directOnlyIds = allSelectedIds.filter((id) => !selectedIds.includes(id));
  const unknownDirectIds = directOnlyIds.filter((id) => !knownSelectableIds.has(id));

  useEffect(() => {
    messageService.fetchWorkspaceMembers().then(setWorkspaceMembers).catch(() => setWorkspaceMembers([]));
  }, [users.length]);

  function toggleMember(userId: string) {
    setSelectedIds((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  }

  async function handleCreateGroup(event: React.FormEvent) {
    event.preventDefault();
    if (allSelectedIds.length < 1) {
      setGroupError('멤버를 선택하거나 아이디를 1개 이상 입력하세요.');
      return;
    }
    setCreatingGroup(true);
    setGroupError('');
    try {
      const conversation = await dmService.createGroupConversation(groupName.trim(), allSelectedIds);
      setActiveDmUser(`group:${conversation.id}`);
      setShowGroupModal(false);
      setGroupName('');
      setTypedMemberIds('');
      setSelectedIds([]);
    } catch (error) {
      setGroupError(error instanceof Error ? error.message : '단체 DM을 만들지 못했습니다.');
    } finally {
      setCreatingGroup(false);
    }
  }

  return (
    <>
      <SectionRow>
        <SectionLabel>단체 DM</SectionLabel>
        <AddBtn title="단체 DM 만들기" onClick={() => setShowGroupModal(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>group_add</span>
        </AddBtn>
      </SectionRow>
      {groupConversations.map((conversation) => {
        const key = `group:${conversation.id}`;
        const isUnread = unreadDmKeys.has(key);
        return (
          <DmUserBtn key={conversation.id} $active={activeDmUserId === key} $unread={isUnread} onClick={() => setActiveDmUser(key)}>
            <DmAvatar>
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>groups</span>
            </DmAvatar>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conversation.name}
            </span>
            {isUnread && <UnreadDot />}
          </DmUserBtn>
        );
      })}

      <SectionRow>
        <SectionLabel>친구</SectionLabel>
      </SectionRow>
      {friendUsers.length === 0 && (
        <div style={{ padding: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textAlign: 'center' }}>
          친구가 없습니다.
        </div>
      )}
      {friendUsers.map((user) => {
        const isUnread = unreadDmKeys.has(user.id);
        return (
          <DmUserBtn key={user.id} $active={activeDmUserId === user.id} $unread={isUnread} onClick={() => setActiveDmUser(user.id)}>
            <DmAvatar>{user.nickname.charAt(0).toUpperCase()}</DmAvatar>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nickname}
            </span>
            {isUnread
              ? <UnreadDot />
              : <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, flexShrink: 0 }}>친구</span>
            }
          </DmUserBtn>
        );
      })}

      <SectionRow>
        <SectionLabel>워크스페이스 멤버</SectionLabel>
      </SectionRow>
      {workspaceUsers.length === 0 && (
        <div style={{ padding: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-ui)', textAlign: 'center' }}>
          워크스페이스 멤버가 없습니다.
        </div>
      )}
      {workspaceUsers.map((user) => {
        const isUnread = unreadDmKeys.has(user.id);
        return (
          <DmUserBtn key={user.id} $active={activeDmUserId === user.id} $unread={isUnread} onClick={() => setActiveDmUser(user.id)}>
            <DmAvatar>{user.nickname.charAt(0).toUpperCase()}</DmAvatar>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.nickname}</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '10px', color: 'var(--text-muted)' }}>
                {user.email}
              </span>
            </span>
            {isUnread && <UnreadDot />}
          </DmUserBtn>
        );
      })}

      {showGroupModal && (
        <Overlay onClick={(event) => event.target === event.currentTarget && setShowGroupModal(false)}>
          <Modal onSubmit={handleCreateGroup}>
            <ModalTitle>단체 DM 만들기</ModalTitle>
            <FieldGroup>
              <Label htmlFor="group-dm-name">이름</Label>
              <Input
                id="group-dm-name"
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="예: 프로젝트 회의"
              />
            </FieldGroup>
            <FieldGroup>
              <Label>참여 멤버</Label>
              <MemberPickList>
                {selectableUsers.length === 0 && (
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', padding: '6px 8px' }}>
                    초대할 수 있는 멤버가 없습니다.
                  </span>
                )}
                {selectableUsers.map((user) => (
                  <MemberPick key={user.id}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(user.id)}
                      onChange={() => toggleMember(user.id)}
                    />
                    <span>{user.nickname}</span>
                    <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user.email}</span>
                  </MemberPick>
                ))}
              </MemberPickList>
              <Label htmlFor="group-dm-member-ids">아이디 직접 입력</Label>
              <Textarea
                id="group-dm-member-ids"
                value={typedMemberIds}
                onChange={(event) => {
                  setTypedMemberIds(event.target.value);
                  setGroupError('');
                }}
                placeholder="사용자 ID를 쉼표, 공백, 줄바꿈으로 구분해서 입력"
              />
              {allSelectedIds.length > 0 && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  총 {allSelectedIds.length}명 선택됨
                  {unknownDirectIds.length > 0 ? ` · 목록에 없는 ID ${unknownDirectIds.length}개는 생성 시 확인합니다.` : ''}
                </span>
              )}
              {groupError && <ErrorText>{groupError}</ErrorText>}
            </FieldGroup>
            <ModalActions>
              <SecondaryBtn type="button" onClick={() => setShowGroupModal(false)}>취소</SecondaryBtn>
              <PrimaryBtn type="submit" disabled={creatingGroup}>{creatingGroup ? '생성 중...' : '생성'}</PrimaryBtn>
            </ModalActions>
          </Modal>
        </Overlay>
      )}
    </>
  );
}
