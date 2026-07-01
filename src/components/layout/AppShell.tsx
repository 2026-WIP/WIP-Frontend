import styled from 'styled-components';
import { useEffect, useRef } from 'react';
import { TopNavBar } from './TopNavBar';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useUIStore } from '@/store/useUIStore';
import { ChatPane } from '@/components/chat/ChatPane';
import { AppHomePane } from '@/components/app/AppHomePane';
import { DMPane } from '@/components/app/DMPane';
import { SnippetPane } from '@/components/app/SnippetPane';
import { NotificationsPane } from '@/components/app/NotificationsPane';
import { SearchPane } from '@/components/app/SearchPane';
import { messageService } from '@/services/messageService';
import { dmService } from '@/services/dmService';
import { friendService } from '@/services/friendService';
import { snippetService } from '@/services/snippetService';
import { notificationService } from '@/services/notificationService';
import { FriendsPane } from '@/components/app/FriendsPane';
import { useMessagesStore } from '@/store/useMessagesStore';
import { reconnectSocket, joinAllChannels } from '@/services/socketService';
import { unreadService } from '@/services/unreadService';
import { applyTheme } from '@/store/useUIStore';

const Shell = styled.div`
  background: var(--bg-app);
  color: var(--text-primary);
  overflow: hidden;
  height: 100vh;
  display: flex;
  flex-direction: column;
  transition: background-color 200ms, color 200ms;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  overflow: hidden;
  transition: background-color 200ms;
`;

export function AppShell() {
  const activeView      = useUIStore((s) => s.activeView);
  const activeChannelId = useUIStore((s) => s.activeChannelId);
  const setActiveChannel = useUIStore((s) => s.setActiveChannel);
  const setActiveView   = useUIStore((s) => s.setActiveView);
  const theme           = useUIStore((s) => s.theme);
  const setActiveThread = useUIStore((s) => s.setActiveThread);
  const channels        = useMessagesStore((s) => s.channels);
  const searchInputRef  = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    applyTheme(theme);

    if (theme !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, [theme]);

  useEffect(() => {
    reconnectSocket();
    // 채널 목록 로드 후 모든 채널 소켓 룸에 join → 어느 채널이든 message:new 수신 가능
    messageService.fetchChannels().then(() => joinAllChannels()).catch(() => {});
    dmService.fetchUsers().catch(() => {});
    dmService.fetchGroupConversations().catch(() => {});
    friendService.fetchFriends().catch(() => {});
    friendService.fetchRequests().catch(() => {});
    snippetService.fetchSnippets().catch(() => {});
    notificationService.fetch().catch(() => {});
    unreadService.fetchUnread().catch(() => {});
  }, []);

  // 채널 목록 로드 후 선택된 채널이 없으면 첫 번째 채널 자동 선택
  useEffect(() => {
    if (activeView !== 'channel') return;
    if (activeChannelId) return;
    const first = Object.values(channels)[0];
    if (first) setActiveChannel(first.id);
  }, [channels, activeChannelId, activeView, setActiveChannel]);

  // 전역 키보드 단축키
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ctrl+K / Cmd+K → 검색창 포커스
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setActiveView('search');
        // TopNavBar의 검색창에 포커스 (50ms 후 뷰 전환 완료)
        setTimeout(() => {
          const input = document.querySelector<HTMLInputElement>('[data-search-input]');
          input?.focus();
        }, 50);
      }

      // Esc → 스레드 패널 닫기
      if (e.key === 'Escape') {
        setActiveThread(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, setActiveThread]);

  function renderView() {
    switch (activeView) {
      case 'home':          return <AppHomePane />;
      case 'dm':            return <DMPane />;
      case 'channel':       return <ChatPane />;
      case 'snippets':      return <SnippetPane />;
      case 'notifications': return <NotificationsPane />;
      case 'search':        return <SearchPane />;
      case 'friends':       return <FriendsPane />;
      default:              return <AppHomePane />;
    }
  }

  return (
    <Shell>
      <TopNavBar searchInputRef={searchInputRef} />
      <Body>
        <Sidebar />
        <Main>
          {renderView()}
        </Main>
      </Body>
    </Shell>
  );
}
