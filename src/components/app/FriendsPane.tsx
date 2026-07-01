import styled from 'styled-components';
import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendStore, type FriendRequest } from '@/store/useFriendStore';
import { useDmStore } from '@/store/useDmStore';
import { useUIStore } from '@/store/useUIStore';
import { friendService } from '@/services/friendService';
import type { User } from '@/types/auth';

const YELLOW = 'var(--accent)';
const BORDER = 'var(--border)';
const TEXT = 'var(--text-primary)';
const MUTED = 'var(--text-muted)';

const Page = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--bg-app);
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 52px;
  padding: 0 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid ${BORDER};
  flex-shrink: 0;
`;

const TopTitle = styled.h2`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: ${TEXT};
`;

const TabBar = styled.div`
  display: flex;
  gap: 2px;
  padding: 0 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid ${BORDER};
  flex-shrink: 0;
`;

const Tab = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  border: none;
  border-bottom: 2px solid ${p => p.$active ? TEXT : 'transparent'};
  background: none;
  color: ${p => p.$active ? TEXT : MUTED};
  cursor: pointer;

  &:hover { color: ${TEXT}; }
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: ${YELLOW};
  color: var(--accent-text);
  font-size: 10px;
  font-weight: 700;
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: ${BORDER}; border-radius: 3px; }
`;

const SectionLabel = styled.div`
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${MUTED};
  margin-bottom: 10px;
  margin-top: 4px;
`;

const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 16px;
  color: ${MUTED};
  font-size: 0.875rem;
  font-family: var(--font-body);
  text-align: center;
`;

const ErrorBox = styled.div`
  margin-bottom: 12px;
  padding: 10px 12px;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 0.25rem;
  font-size: 0.8125rem;
`;

const UserCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-surface);
  border: 1px solid ${BORDER};
  border-radius: 0.25rem;
  margin-bottom: 6px;
  transition: border-color 120ms;

  &:hover { border-color: var(--border); }
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${YELLOW};
  border: 1px solid ${BORDER};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 14px;
  font-weight: 700;
  color: var(--accent-text);
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.div`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: ${TEXT};
  margin-bottom: 2px;
`;

const UserEmail = styled.div`
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: ${MUTED};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
  flex-shrink: 0;
`;

const Btn = styled.button<{ $variant?: 'primary' | 'danger' | 'outline' }>`
  padding: 6px 14px;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: filter 120ms, background 120ms;
  border: none;

  ${p => {
    if (p.$variant === 'danger') return `
      background: transparent;
      border: 1px solid var(--danger);
      color: var(--danger);
      &:hover { background: var(--danger-bg); }
    `;
    if (p.$variant === 'outline') return `
      background: transparent;
      border: 1px solid ${BORDER};
      color: ${TEXT};
      &:hover { background: var(--bg-hover); }
    `;
    return `
      background: ${YELLOW};
      color: var(--accent-text);
      &:hover { filter: brightness(0.93); }
    `;
  }}

  &:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
`;

const StatusPill = styled.span`
  padding: 4px 10px;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid ${BORDER};
  color: ${MUTED};
  background: var(--bg-app);
`;

const FriendBadge = styled.span`
  margin-left: 6px;
  padding: 3px 8px;
  font-family: var(--font-ui);
  font-size: 0.6875rem;
  font-weight: 700;
  border-radius: 999px;
  background: ${YELLOW};
  color: var(--accent-text);
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-surface);
  border: 1px solid ${BORDER};
  border-radius: 0.25rem;
  padding: 0 12px;
  margin-bottom: 16px;

  &:focus-within { border-width: 2px; border-color: ${TEXT}; padding: 0 11px; }
`;

const SearchInput = styled.input`
  flex: 1;
  height: 40px;
  border: none;
  outline: none;
  font-size: 0.875rem;
  font-family: var(--font-body);
  color: ${TEXT};
  background: transparent;

  &::placeholder { color: rgba(18,18,18,0.35); }
`;

type FriendTab = 'list' | 'requests' | 'search';

function getUserRelation(
  userId: string,
  target: User,
  friends: User[],
  sentRequests: FriendRequest[],
  receivedRequests: FriendRequest[],
): 'self' | 'friend' | 'sent' | 'received' | 'none' {
  if (target.id === userId) return 'self';
  if (friends.some((friend) => friend.id === target.id)) return 'friend';
  if (sentRequests.some((request) => request.toId === target.id)) return 'sent';
  if (receivedRequests.some((request) => request.fromId === target.id)) return 'received';
  return 'none';
}

function uniqueUsers(users: User[]) {
  return Array.from(new Map(users.map((user) => [user.id, user])).values());
}

export function FriendsPane() {
  const [activeTab, setActiveTab] = useState<FriendTab>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const [directoryUsers, setDirectoryUsers] = useState<User[]>([]);

  const currentUser = useAuthStore((state) => state.currentUser);
  const friends = useFriendStore((state) => state.friends);
  const receivedRequests = useFriendStore((state) => state.receivedRequests);
  const sentRequests = useFriendStore((state) => state.sentRequests);
  const dmUsers = useDmStore((state) => state.users);
  const setActiveDmUser = useUIStore((state) => state.setActiveDmUser);

  const incomingCount = receivedRequests.length;
  const allUsers = useMemo(
    () => uniqueUsers([...directoryUsers, ...dmUsers, ...friends]),
    [directoryUsers, dmUsers, friends],
  );

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const candidates = allUsers.filter((user) => user.id !== currentUser?.id);
    if (!query) return candidates;
    return candidates.filter(
      (user) => user.nickname.toLowerCase().includes(query) || user.email.toLowerCase().includes(query),
    );
  }, [allUsers, currentUser?.id, searchQuery]);

  useEffect(() => {
    friendService.fetchDirectory().then(setDirectoryUsers).catch(() => {});
  }, []);

  function busy(id: string, value: boolean) {
    setLoading((prev) => ({ ...prev, [id]: value }));
  }

  async function runAction(key: string, action: () => Promise<void>, message: string) {
    busy(key, true);
    setError('');
    try {
      await action();
      const users = await friendService.fetchDirectory().catch(() => directoryUsers);
      setDirectoryUsers(users);
    } catch {
      setError(message);
    } finally {
      busy(key, false);
    }
  }

  function handleSendRequest(toId: string) {
    void runAction(toId, () => friendService.sendRequest(toId).then(() => undefined), '친구 요청을 보내지 못했습니다.');
  }

  function handleAccept(request: FriendRequest) {
    const fromUser = allUsers.find((user) => user.id === request.fromId);
    if (!fromUser) {
      setError('요청을 보낸 사용자를 찾을 수 없습니다.');
      return;
    }
    void runAction(request.id, () => friendService.acceptRequest(request.id, fromUser), '친구 요청을 수락하지 못했습니다.');
  }

  function handleDecline(request: FriendRequest) {
    void runAction(request.id, () => friendService.declineRequest(request.id), '친구 요청을 거절하지 못했습니다.');
  }

  function handleCancel(request: FriendRequest) {
    void runAction(request.id, () => friendService.cancelRequest(request.id), '보낸 친구 요청을 취소하지 못했습니다.');
  }

  function handleRemoveFriend(friendId: string) {
    void runAction(friendId, () => friendService.removeFriend(friendId), '친구를 삭제하지 못했습니다.');
  }

  return (
    <Page>
      <TopBar>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: MUTED }}>group</span>
        <TopTitle>친구</TopTitle>
        {incomingCount > 0 && <Badge>{incomingCount}</Badge>}
      </TopBar>

      <TabBar>
        <Tab $active={activeTab === 'list'} onClick={() => setActiveTab('list')}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>people</span>
          친구 목록
          {friends.length > 0 && <Badge>{friends.length}</Badge>}
        </Tab>
        <Tab $active={activeTab === 'requests'} onClick={() => setActiveTab('requests')}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person_add</span>
          친구 요청
          {incomingCount > 0 && <Badge>{incomingCount}</Badge>}
        </Tab>
        <Tab $active={activeTab === 'search'} onClick={() => setActiveTab('search')}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>search</span>
          멤버 찾기
        </Tab>
      </TabBar>

      <Body>
        {error && <ErrorBox>{error}</ErrorBox>}

        {activeTab === 'list' && (
          <>
            {friends.length === 0 ? (
              <Empty>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.25 }}>group_off</span>
                아직 친구가 없습니다.
              </Empty>
            ) : (
              <>
                <SectionLabel>친구 {friends.length}명</SectionLabel>
                {friends.map((friend) => (
                  <UserCard key={friend.id}>
                    <Avatar>{friend.nickname.charAt(0).toUpperCase()}</Avatar>
                    <UserInfo>
                      <UserName>{friend.nickname} <FriendBadge>친구</FriendBadge></UserName>
                      <UserEmail>{friend.email}</UserEmail>
                    </UserInfo>
                    <Actions>
                      <Btn $variant="outline" onClick={() => setActiveDmUser(friend.id)}>DM</Btn>
                      <Btn $variant="danger" disabled={loading[friend.id]} onClick={() => handleRemoveFriend(friend.id)}>
                        삭제
                      </Btn>
                    </Actions>
                  </UserCard>
                ))}
              </>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          <>
            <SectionLabel>받은 요청 {receivedRequests.length}건</SectionLabel>
            {receivedRequests.length === 0 ? (
              <Empty style={{ paddingTop: 16, paddingBottom: 24 }}>받은 친구 요청이 없습니다.</Empty>
            ) : (
              receivedRequests.map((request) => {
                const sender = allUsers.find((user) => user.id === request.fromId);
                return (
                  <UserCard key={request.id}>
                    <Avatar>{request.fromName.charAt(0).toUpperCase()}</Avatar>
                    <UserInfo>
                      <UserName>{request.fromName}</UserName>
                      <UserEmail>{sender?.email ?? ''}</UserEmail>
                    </UserInfo>
                    <Actions>
                      <Btn disabled={loading[request.id]} onClick={() => handleAccept(request)}>수락</Btn>
                      <Btn $variant="outline" disabled={loading[request.id]} onClick={() => handleDecline(request)}>거절</Btn>
                    </Actions>
                  </UserCard>
                );
              })
            )}

            <SectionLabel style={{ marginTop: 20 }}>보낸 요청 {sentRequests.length}건</SectionLabel>
            {sentRequests.length === 0 ? (
              <Empty style={{ paddingTop: 16, paddingBottom: 0 }}>보낸 친구 요청이 없습니다.</Empty>
            ) : (
              sentRequests.map((request) => {
                const target = allUsers.find((user) => user.id === request.toId);
                return (
                  <UserCard key={request.id}>
                    <Avatar>{(target?.nickname ?? '?').charAt(0).toUpperCase()}</Avatar>
                    <UserInfo>
                      <UserName>{target?.nickname ?? request.toId}</UserName>
                      <UserEmail>{target?.email ?? ''}</UserEmail>
                    </UserInfo>
                    <Actions>
                      <StatusPill>수락 대기 중</StatusPill>
                      <Btn $variant="outline" disabled={loading[request.id]} onClick={() => handleCancel(request)}>취소</Btn>
                    </Actions>
                  </UserCard>
                );
              })
            )}
          </>
        )}

        {activeTab === 'search' && (
          <>
            <SearchBox>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: MUTED }}>search</span>
              <SearchInput
                placeholder="닉네임 또는 이메일로 검색"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                autoFocus
              />
              {searchQuery && (
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, display: 'flex', alignItems: 'center' }}
                  onClick={() => setSearchQuery('')}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </button>
              )}
            </SearchBox>

            {searchResults.length === 0 ? (
              <Empty>
                <span className="material-symbols-outlined" style={{ fontSize: '36px', opacity: 0.25 }}>person_search</span>
                {searchQuery ? '검색 결과가 없습니다.' : '표시할 멤버가 없습니다.'}
              </Empty>
            ) : (
              <>
                <SectionLabel>멤버 {searchResults.length}명</SectionLabel>
                {searchResults.map((user) => {
                  const relation = getUserRelation(
                    currentUser?.id ?? '',
                    user,
                    friends,
                    sentRequests,
                    receivedRequests,
                  );
                  const received = receivedRequests.find((request) => request.fromId === user.id);

                  return (
                    <UserCard key={user.id}>
                      <Avatar>{user.nickname.charAt(0).toUpperCase()}</Avatar>
                      <UserInfo>
                        <UserName>
                          {user.nickname}
                          {relation === 'friend' && <FriendBadge>친구</FriendBadge>}
                        </UserName>
                        <UserEmail>{user.email}</UserEmail>
                      </UserInfo>
                      <Actions>
                        {relation === 'friend' && (
                          <>
                            <Btn $variant="outline" onClick={() => setActiveDmUser(user.id)}>DM</Btn>
                            <Btn $variant="danger" disabled={loading[user.id]} onClick={() => handleRemoveFriend(user.id)}>친구 삭제</Btn>
                          </>
                        )}
                        {relation === 'sent' && <StatusPill>요청 전송됨</StatusPill>}
                        {relation === 'received' && received && (
                          <>
                            <Btn disabled={loading[received.id]} onClick={() => handleAccept(received)}>수락</Btn>
                            <Btn $variant="outline" disabled={loading[received.id]} onClick={() => handleDecline(received)}>거절</Btn>
                          </>
                        )}
                        {relation === 'none' && (
                          <Btn disabled={loading[user.id]} onClick={() => handleSendRequest(user.id)}>친구 요청</Btn>
                        )}
                      </Actions>
                    </UserCard>
                  );
                })}
              </>
            )}
          </>
        )}
      </Body>
    </Page>
  );
}
