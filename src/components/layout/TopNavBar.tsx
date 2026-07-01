import styled from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState, type RefObject } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useFriendStore } from '@/store/useFriendStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { resolveTheme, useUIStore, type ThemeMode } from '@/store/useUIStore';
import { terminalService, type TerminalCwdKey } from '@/services/terminalService';

interface TopNavBarProps {
  searchInputRef?: RefObject<HTMLInputElement | null>;
}

const YELLOW = 'var(--accent)';
const TEXT = 'var(--text-primary)';
const BORDER = 'var(--border)';
const MUTED = 'var(--text-muted)';

const Header = styled.header`
  position: sticky; top: 0; z-index: 100; width: 100%; height: 64px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border, ${BORDER});
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; flex-shrink: 0;
  transition: background-color 200ms, border-color 200ms;
`;

const NavLogo = styled(Link)`
  font-family: var(--font-ui); font-size: 1.125rem; font-weight: 900;
  letter-spacing: -0.02em; color: var(--text-primary, ${TEXT}); flex-shrink: 0;
  text-decoration: none;
`;

const NavCenter = styled.div`
  flex: 1; display: flex; justify-content: center; padding: 0 32px;
`;

const SearchBox = styled.div`
  display: flex; align-items: center;
  background: var(--bg-panel, #f3f3f3);
  border: 1px solid var(--border, ${BORDER});
  border-radius: 0.25rem; padding: 6px 12px; gap: 8px;
  width: 100%; max-width: 480px;
  transition: border-color 150ms, background 150ms;

  &:focus-within {
    border: 2px solid var(--border-focus, ${TEXT});
    background: var(--bg-surface);
    padding: 5px 11px;
  }
`;

const SearchInput = styled.input`
  background: transparent; border: none; outline: none;
  font-size: 0.875rem; width: 100%;
  color: var(--text-primary, ${TEXT}); font-family: var(--font-body);
  &::placeholder { color: var(--text-muted, ${MUTED}); }
`;

const NavRight = styled.div`
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
`;

const IconButton = styled.button<{ $active?: boolean }>`
  position: relative; padding: 8px;
  background: ${p => p.$active ? 'var(--bg-hover)' : 'none'};
  border: none; cursor: pointer; border-radius: 0.25rem;
  transition: background 150ms; color: ${p => p.$active ? 'var(--text-primary)' : 'var(--text-muted)'};
  display: flex; align-items: center;
  &:hover { background: var(--bg-hover); color: var(--text-primary); }
`;

const NotifBadge = styled.span`
  position: absolute; top: 5px; right: 5px;
  min-width: 8px; height: 8px; border-radius: 999px;
  background: var(--danger); border: 1.5px solid var(--bg-surface);
`;

const AvatarButton = styled.button`
  width: 32px; height: 32px; border-radius: 50%;
  background: ${YELLOW}; border: none; display: flex; align-items: center;
  justify-content: center; font-size: 0.875rem; font-weight: 700;
  color: var(--accent-text); font-family: var(--font-ui); cursor: pointer;
  transition: filter 150ms;
  &:hover { filter: brightness(0.93); }
`;

const DropdownWrap = styled.div`
  position: relative;
`;

const ThemeDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 168px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 4px;
  z-index: 320;
  box-shadow: 0 8px 24px rgba(0,0,0,0.14);
`;

const ThemeOptionBtn = styled.button<{ $active?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: ${p => p.$active ? 'var(--bg-hover)' : 'transparent'};
  border: none;
  border-radius: 0.125rem;
  color: var(--text-primary);
  cursor: pointer;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  text-align: left;

  &:hover {
    background: var(--bg-hover);
  }
`;

const TerminalDropdown = styled.div`
  position: absolute; top: calc(100% + 8px); right: 0; width: 560px;
  background: #1e1e1e; border: 1px solid #3a3a3a; border-radius: 0.25rem;
  overflow: hidden; z-index: 300; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
`;

const TerminalTitleBar = styled.div`
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; background: #2d2d2d; border-bottom: 1px solid #3a3a3a;
`;

const TerminalTitle = styled.span`
  font-family: var(--font-code); font-size: 0.75rem; color: #9e9e9e;
`;

const TerminalCloseBtn = styled.button`
  background: none; border: none; cursor: pointer; color: #9e9e9e;
  display: flex; align-items: center; padding: 2px; border-radius: 0.125rem;
  &:hover { color: #ffffff; }
`;

const TerminalOutput = styled.div`
  height: 220px; overflow-y: auto; padding: 10px 14px;
  font-family: var(--font-code); font-size: 0.8125rem; line-height: 1.6; color: #d4d4d4;
  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 2px; }
`;

const TerminalToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: #252525;
  border-bottom: 1px solid #3a3a3a;
  flex-wrap: wrap;
`;

const TerminalToolBtn = styled.button<{ $active?: boolean }>`
  border: 1px solid ${p => p.$active ? '#f2e974' : '#3a3a3a'};
  background: ${p => p.$active ? 'rgba(242, 233, 116, 0.14)' : '#1e1e1e'};
  color: ${p => p.$active ? '#f2e974' : '#d4d4d4'};
  border-radius: 0.125rem;
  padding: 4px 8px;
  font-family: var(--font-code);
  font-size: 0.75rem;
  cursor: pointer;

  &:hover { border-color: #f2e974; color: #f2e974; }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

const TerminalLine = styled.div<{ $type?: 'cmd' | 'out' | 'err' | 'info' }>`
  color: ${p =>
    p.$type === 'cmd' ? '#f2e974' :
    p.$type === 'err' ? '#f28b74' :
    p.$type === 'info' ? '#7ec8e3' :
    '#d4d4d4'};
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const TerminalInputRow = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; border-top: 1px solid #3a3a3a; background: #1e1e1e;
`;

const TerminalPrompt = styled.span`
  font-family: var(--font-code); font-size: 0.8125rem; color: #f2e974; flex-shrink: 0;
`;

const TerminalInputField = styled.input`
  flex: 1; background: transparent; border: none; outline: none;
  font-family: var(--font-code); font-size: 0.8125rem; color: #d4d4d4; caret-color: #f2e974;
`;

const KbdHint = styled.span`
  font-family: var(--font-code); font-size: 10px; color: var(--text-muted, rgba(18,18,18,0.4));
  padding: 2px 5px; border: 1px solid var(--border, #e2e2e2);
  border-radius: 0.125rem; margin-left: 4px;
`;

interface TerminalEntry {
  type: 'cmd' | 'out' | 'err' | 'info';
  text: string;
}

const TERMINAL_TARGETS: { key: TerminalCwdKey; label: string; hint: string }[] = [
  { key: 'root', label: 'Root', hint: '전체 구조 확인' },
  { key: 'frontend', label: 'Frontend', hint: 'Vite/React 작업' },
  { key: 'backend', label: 'Backend', hint: 'API/DB 작업' },
];

const QUICK_COMMANDS: { label: string; command: string; cwdKey: TerminalCwdKey }[] = [
  { label: 'Git 상태', command: 'git status --short', cwdKey: 'root' },
  { label: 'FE 빌드', command: 'npm run build', cwdKey: 'frontend' },
  { label: 'BE 빌드', command: 'npm run build', cwdKey: 'backend' },
  { label: '폴더 보기', command: 'dir', cwdKey: 'root' },
];

export function TopNavBar({ searchInputRef }: TopNavBarProps) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const navigate = useNavigate();
  const setActiveView = useUIStore((state) => state.setActiveView);
  const setGlobalSearchQuery = useUIStore((state) => state.setGlobalSearchQuery);
  const setTheme = useUIStore((state) => state.setTheme);
  const theme = useUIStore((state) => state.theme);
  const socketConnected = useUIStore((state) => state.socketConnected);
  const receivedRequests = useFriendStore((state) => state.receivedRequests);
  const unreadNotifications = useNotificationStore((state) => state.notifications.filter((n) => !n.read).length);

  const [searchVal, setSearchVal] = useState('');
  const [termOpen, setTermOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [termInput, setTermInput] = useState('');
  const [termRunning, setTermRunning] = useState(false);
  const [termCwdKey, setTermCwdKey] = useState<TerminalCwdKey>('frontend');
  const [termLog, setTermLog] = useState<TerminalEntry[]>([
    { type: 'info', text: '프로젝트 작업 터미널입니다. 실행 위치를 고른 뒤 빌드, 상태 확인, 파일 확인 같은 짧은 명령을 실행하세요.' },
  ]);
  const termOutputRef = useRef<HTMLDivElement>(null);
  const termInputRef = useRef<HTMLInputElement>(null);
  const localSearchRef = useRef<HTMLInputElement>(null);
  const actualSearchRef = searchInputRef ?? localSearchRef;
  const resolvedTheme = resolveTheme(theme);
  const themeOptions: { id: ThemeMode; label: string; icon: string }[] = [
    { id: 'light', label: '라이트 모드', icon: 'light_mode' },
    { id: 'dark', label: '다크 모드', icon: 'dark_mode' },
    { id: 'system', label: '시스템 모드', icon: 'computer' },
  ];

  useEffect(() => {
    if (termOpen) termInputRef.current?.focus();
  }, [termOpen]);

  useEffect(() => {
    if (termOutputRef.current) {
      termOutputRef.current.scrollTop = termOutputRef.current.scrollHeight;
    }
  }, [termLog]);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const query = searchVal.trim();
    if (!query) return;
    setGlobalSearchQuery(query);
    setActiveView('search');
  }

  async function runTerminalInput(input: string, cwdKey = termCwdKey) {
    if (!input || termRunning) return;
    if (input.toLowerCase() === 'clear') {
      setTermLog([{ type: 'info', text: '프로젝트 터미널' }]);
      setTermInput('');
      return;
    }

    setTermInput('');
    setTermRunning(true);
    setTermLog((prev) => [...prev, { type: 'cmd', text: `[${cwdKey}] $ ${input}` }, { type: 'info', text: '실행 중...' }]);
    try {
      const result = await terminalService.execute(input, cwdKey);
      const entries: TerminalEntry[] = [];
      if (result.stdout.trim()) entries.push({ type: 'out', text: result.stdout.trimEnd() });
      if (result.stderr.trim()) entries.push({ type: 'err', text: result.stderr.trimEnd() });
      entries.push({ type: result.exitCode === 0 ? 'info' : 'err', text: `exit ${result.exitCode} · ${result.durationMs}ms · ${result.cwdKey}: ${result.cwd}` });
      setTermLog((prev) => [...prev.slice(0, -1), ...entries]);
    } catch (error) {
      setTermLog((prev) => [
        ...prev.slice(0, -1),
        {
          type: 'err',
          text: error instanceof Error && error.message.includes('404')
            ? '터미널 API를 찾지 못했습니다. 백엔드 서버를 재시작하면 새 기능이 반영됩니다.'
            : error instanceof Error ? error.message : '명령 실행에 실패했습니다.',
        },
      ]);
    } finally {
      setTermRunning(false);
      requestAnimationFrame(() => termInputRef.current?.focus());
    }
  }

  async function handleTermSubmit(event: React.FormEvent) {
    event.preventDefault();
    await runTerminalInput(termInput.trim());
  }

  return (
    <Header>
      <NavLogo to="/app" onClick={() => setActiveView('home')}>WIP</NavLogo>

      <NavCenter>
        <form onSubmit={handleSearch} style={{ width: '100%', maxWidth: '480px' }}>
          <SearchBox>
            <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)', fontSize: '18px' }}>search</span>
            <SearchInput
              ref={actualSearchRef}
              data-search-input
              placeholder="워크스페이스 검색..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            {searchVal && (
              <button type="button" onClick={() => setSearchVal('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
              </button>
            )}
            <KbdHint>⌘K</KbdHint>
          </SearchBox>
        </form>
      </NavCenter>

      <NavRight>
        <DropdownWrap>
          <IconButton
            $active={themeOpen}
            onClick={() => setThemeOpen((v) => !v)}
            title={`테마: ${theme === 'system' ? `시스템 (${resolvedTheme})` : theme}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {theme === 'system' ? 'computer' : resolvedTheme === 'dark' ? 'dark_mode' : 'light_mode'}
            </span>
          </IconButton>

          {themeOpen && (
            <ThemeDropdown>
              {themeOptions.map((option) => (
                <ThemeOptionBtn
                  key={option.id}
                  $active={theme === option.id}
                  onClick={() => {
                    setTheme(option.id);
                    setThemeOpen(false);
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>{option.icon}</span>
                  {option.label}
                </ThemeOptionBtn>
              ))}
            </ThemeDropdown>
          )}
        </DropdownWrap>
        <IconButton onClick={() => setActiveView('notifications')} title="알림">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
          {receivedRequests.length + unreadNotifications > 0 && <NotifBadge />}
        </IconButton>

        <DropdownWrap>
          <IconButton $active={termOpen} onClick={() => setTermOpen((v) => !v)} title="터미널">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>terminal</span>
          </IconButton>

          {termOpen && (
            <TerminalDropdown>
              <TerminalTitleBar>
                <TerminalTitle>프로젝트 터미널 - {termCwdKey}</TerminalTitle>
                <TerminalCloseBtn onClick={() => setTermOpen(false)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                </TerminalCloseBtn>
              </TerminalTitleBar>
              <TerminalToolbar>
                {TERMINAL_TARGETS.map((target) => (
                  <TerminalToolBtn
                    key={target.key}
                    type="button"
                    $active={termCwdKey === target.key}
                    title={target.hint}
                    onClick={() => setTermCwdKey(target.key)}
                    disabled={termRunning}
                  >
                    {target.label}
                  </TerminalToolBtn>
                ))}
                <span style={{ width: 1, height: 18, background: '#3a3a3a', margin: '0 2px' }} />
                {QUICK_COMMANDS.map((item) => (
                  <TerminalToolBtn
                    key={`${item.cwdKey}:${item.command}`}
                    type="button"
                    title={`${item.cwdKey}에서 ${item.command}`}
                    onClick={() => {
                      setTermCwdKey(item.cwdKey);
                      void runTerminalInput(item.command, item.cwdKey);
                    }}
                    disabled={termRunning}
                  >
                    {item.label}
                  </TerminalToolBtn>
                ))}
              </TerminalToolbar>
              <TerminalOutput ref={termOutputRef}>
                {termLog.map((entry, i) => (
                  <TerminalLine key={i} $type={entry.type}>{entry.text}</TerminalLine>
                ))}
              </TerminalOutput>
              <form onSubmit={handleTermSubmit}>
                <TerminalInputRow>
                  <TerminalPrompt>$</TerminalPrompt>
                  <TerminalInputField
                    ref={termInputRef}
                    value={termInput}
                    onChange={(e) => setTermInput(e.target.value)}
                    placeholder={termRunning ? '명령 실행 중...' : `${termCwdKey}에서 실행할 명령 입력`}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </TerminalInputRow>
              </form>
            </TerminalDropdown>
          )}
        </DropdownWrap>

        {import.meta.env.VITE_API_MODE === 'http' && !socketConnected && (
          <IconButton
            title="WebSocket 연결 끊김 — 자동 재연결 중..."
            style={{ color: 'var(--danger)', cursor: 'default' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>wifi_off</span>
          </IconButton>
        )}

        {currentUser && (
          <AvatarButton onClick={() => navigate('/app/settings')} title={`${currentUser.nickname} 프로필 설정`}>
            {currentUser.nickname.charAt(0).toUpperCase()}
          </AvatarButton>
        )}
      </NavRight>
    </Header>
  );
}
