import styled, { keyframes } from 'styled-components';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useState } from 'react';

// ─── Tokens ───────────────────────────────────────────────────────────────────
const DARK_BG   = '#0d0d0d';
const DARK_MID  = '#141414';
const DARK_CARD = '#1a1a1a';
const BORDER    = 'rgba(255,255,255,0.08)';
const YELLOW    = '#f2e974';
const TEXT      = '#f0f0f0';
const MUTED     = 'rgba(240,240,240,0.5)';

// ─── Keyframes ────────────────────────────────────────────────────────────────
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const scrollUp = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
`;

// ─── Layout ───────────────────────────────────────────────────────────────────
const Page = styled.div`
  background: ${DARK_BG};
  color: ${TEXT};
  font-family: 'Inter', sans-serif;
  -webkit-font-smoothing: antialiased;
  min-height: 100vh;
  overflow-x: hidden;
`;

// ─── NavBar ───────────────────────────────────────────────────────────────────
const NavBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 64px;
  background: rgba(13,13,13,0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid ${BORDER};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
`;

const NavLogo = styled.span`
  font-family: 'Geist', sans-serif;
  font-size: 1.125rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: ${TEXT};
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const NavSignIn = styled(Link)`
  padding: 7px 16px;
  font-family: 'Geist', sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${MUTED};
  text-decoration: none;
  border-radius: 0.25rem;
  transition: color 150ms;
  &:hover { color: ${TEXT}; }
`;

const NavSignUp = styled(Link)`
  padding: 7px 16px;
  font-family: 'Geist', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1c1c;
  background: ${YELLOW};
  text-decoration: none;
  border-radius: 0.25rem;
  transition: filter 150ms;
  &:hover { filter: brightness(0.93); }
`;

const NavGoApp = styled(Link)`
  padding: 7px 16px;
  font-family: 'Geist', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a1c1c;
  background: ${YELLOW};
  text-decoration: none;
  border-radius: 0.25rem;
  transition: filter 150ms;
  &:hover { filter: brightness(0.93); }
`;

// ─── Hero ─────────────────────────────────────────────────────────────────────
const HeroSection = styled.section`
  position: relative;
  min-height: 88vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px 60px;
  overflow: hidden;
`;

const HeroTitle = styled.h1`
  font-family: 'Geist', sans-serif;
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: ${TEXT};
  max-width: 800px;
  margin-bottom: 45px;
  animation: ${fadeUp} 0.5s 0.1s ease both;
`;

const HeroSub = styled.p`
  font-size: clamp(1rem, 2vw, 1.125rem);
  line-height: 1.7;
  color: ${MUTED};
  max-width: 520px;
  margin-bottom: 48px;
  animation: ${fadeUp} 0.5s 0.2s ease both;
`;

const HeroCTARow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 560px;
  animation: ${fadeUp} 0.5s 0.3s ease both;

  @media (min-width: 540px) {
    flex-direction: row;
  }
`;

const EmailInput = styled.input`
  flex: 1;
  height: 52px;
  padding: 0 20px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 0.25rem;
  color: ${TEXT};
  font-size: 0.9375rem;
  outline: none;
  width: 100%;
  transition: border-color 150ms, background 150ms;

  &::placeholder { color: rgba(240,240,240,0.35); }
  &:focus {
    border-color: rgba(242,233,116,0.6);
    background: rgba(255,255,255,0.1);
  }
`;

const CTABtn = styled.button`
  height: 52px;
  padding: 0 28px;
  background: ${YELLOW};
  color: #1a1c1c;
  font-family: 'Geist', sans-serif;
  font-size: 0.9375rem;
  font-weight: 700;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  white-space: nowrap;
  transition: filter 150ms, transform 100ms;

  &:hover  { filter: brightness(0.93); }
  &:active { transform: scale(0.97); }
`;

// ─── Code Window ─────────────────────────────────────────────────────────────
const WindowWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 64px auto 0;
  animation: ${fadeUp} 0.6s 0.4s ease both;
`;

/* subtle outer glow */
const WindowGlow = styled.div`
  position: absolute;
  inset: -1px;
  border-radius: 0.75rem;
  background: linear-gradient(180deg, rgba(242,233,116,0.15) 0%, transparent 60%);
  pointer-events: none;
`;

const Window = styled.div`
  position: relative;
  background: ${DARK_CARD};
  border: 1px solid ${BORDER};
  border-radius: 0.5rem;
  overflow: hidden;
`;

/* 상단 트래픽라이트 버튼 행 */
const WindowTitleBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px 8px;
  background: rgba(255,255,255,0.02);
`;

const Dot = styled.span<{ $c: string }>`
  width: 12px; height: 12px;
  border-radius: 50%;
  background: ${p => p.$c};
  flex-shrink: 0;
`;

/* 탭 행 — VS Code 스타일 */
const WindowBar = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0;
  border-bottom: 1px solid ${BORDER};
  background: rgba(0,0,0,0.25);
  overflow: hidden;
`;

const Tab = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 14px;
  font-family: 'Geist', monospace;
  font-size: 0.75rem;
  white-space: nowrap;
  cursor: default;
  border-right: 1px solid ${BORDER};
  position: relative;

  /* 활성 탭: 상단 강조선 + 밝은 배경 */
  background: ${p => p.$active ? DARK_CARD : 'transparent'};
  color: ${p => p.$active ? TEXT : 'rgba(240,240,240,0.35)'};

  ${p => p.$active && `
    &::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 1px;
      background: ${YELLOW};
    }
  `}
`;

const WindowBody = styled.div`
  display: flex;
  height: 352px;
  overflow: hidden;
`;

/* left: chat panel */
const ChatPanel = styled.div`
  width: 44%;
  border-right: 1px solid ${BORDER};
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-family: 'Inter', sans-serif;
  font-size: 0.8125rem;
  color: ${MUTED};
  overflow: hidden;
`;

const ChatLabel = styled.div`
  font-family: 'Geist', sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.2);
  padding-bottom: 12px;
  margin-bottom: 4px;
  border-bottom: 1px solid ${BORDER};
`;

const ChatRow = styled.div`
  display: flex;
  gap: 10px;
  padding: 10px 0;
`;

const ChatAvatar = styled.div<{ $color: string }>`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: ${p => p.$color};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Geist', sans-serif;
  font-size: 0.6875rem;
  font-weight: 700;
  color: #1a1c1c;
  margin-top: 1px;
`;

const ChatContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const ChatAuthor = styled.div`
  font-family: 'Geist', sans-serif;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${TEXT};
  margin-bottom: 3px;
  text-align: left;
  padding: 5px;
`;

const ChatText = styled.div`
  font-size: 0.8125rem;
  line-height: 1.55;
  color: rgba(240,240,240,0.75);
`;

const ChatBadge = styled.code`
  display: inline-block;
  padding: 1px 6px;
  background: rgba(242,233,116,0.12);
  border: 1px solid rgba(242,233,116,0.22);
  border-radius: 3px;
  font-size: 0.75rem;
  color: ${YELLOW};
  font-family: 'Geist', monospace;
`;

const ChatQuote = styled.div`
  margin-top: 6px;
  padding: 6px 10px;
  border-left: 2px solid rgba(242,233,116,0.4);
  background: rgba(242,233,116,0.05);
  border-radius: 0 3px 3px 0;
  font-family: 'Geist', monospace;
  font-size: 0.75rem;
  color: rgba(240,240,240,0.45);
`;

const ChatInput = styled.div`
  margin-top: auto;
  height: 34px;
  border: 1px solid ${BORDER};
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  padding: 0 12px;
  font-size: 0.8125rem;
  color: rgba(240,240,240,0.2);
  background: rgba(255,255,255,0.03);
`;

/* right: 줄번호(고정) + 코드(스크롤) 래퍼 */
const CodeArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
  font-family: 'Geist', monospace;
  font-size: 0.8125rem;
  line-height: 1.75;
`;

/* 줄번호 컬럼 — 스크롤 없이 고정 */
const LineNoCol = styled.div`
  flex-shrink: 0;
  width: 40px;
  padding: 0 8px 0 16px;
  text-align: right;
  color: rgba(240,240,240,0.2);
  user-select: none;
  overflow: hidden;
`;

const LineNoTrack = styled.div`
  animation: ${scrollUp} 18s linear infinite;
`;

const LineNoItem = styled.div`
  line-height: 1.75;
  text-align: right;
`;

/* 코드 컬럼 — 애니메이션으로 스크롤 */
const CodeScroller = styled.div`
  flex: 1;
  overflow: hidden;
`;

const CodeTrack = styled.div`
  animation: ${scrollUp} 18s linear infinite;
`;

const CodeLine = styled.div<{ $dim?: boolean; $add?: boolean; $del?: boolean }>`
  display: block;
  white-space: pre;
  text-align: left;
  padding: 0 16px 0 8px;
  background: ${p =>
    p.$add ? 'rgba(0,105,114,0.18)' :
    p.$del ? 'rgba(186,26,26,0.12)' :
    'transparent'};
  color: ${p =>
    p.$add ? '#7fd4df' :
    p.$del ? '#f28b82' :
    p.$dim ? 'rgba(240,240,240,0.25)' :
    'rgba(240,240,240,0.75)'};
`;

// ─── Tabs Section ─────────────────────────────────────────────────────────────
const TabsSection = styled.section`
  background: ${DARK_MID};
  border-top: 1px solid ${BORDER};
  border-bottom: 1px solid ${BORDER};
  padding: 80px 24px;
`;

const TabsInner = styled.div`
  max-width: 860px;
  margin: 0 auto;
`;

const TabsRow = styled.div`
  display: flex;
  gap: 4px;
  border: 1px solid ${BORDER};
  border-radius: 999px;
  padding: 4px;
  margin-bottom: 48px;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
`;

const TabPill = styled.button<{ $active?: boolean }>`
  padding: 8px 24px;
  font-family: 'Geist', sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background 150ms, color 150ms;
  background: ${p => p.$active ? YELLOW : 'transparent'};
  color: ${p => p.$active ? '#1a1c1c' : MUTED};

  &:hover { color: ${p => p.$active ? '#1a1c1c' : TEXT}; }
`;

const TabContent = styled.div`
  text-align: center;
`;

const TabTitle = styled.p`
  font-size: 1.0625rem;
  line-height: 1.6;
  color: ${MUTED};
  max-width: 560px;
  margin: 0 auto 48px;
`;

// mini bento inside tabs
const MiniBento = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  @media (min-width: 640px) { grid-template-columns: 1fr 1fr; }
`;

const MiniCard = styled.div<{ $accent?: boolean }>`
  background: ${p => p.$accent ? 'rgba(242,233,116,0.07)' : DARK_CARD};
  border: 1px solid ${p => p.$accent ? 'rgba(242,233,116,0.2)' : BORDER};
  border-radius: 0.5rem;
  padding: 24px;
  text-align: left;
  transition: border-color 150ms;
  &:hover { border-color: ${p => p.$accent ? 'rgba(242,233,116,0.45)' : 'rgba(255,255,255,0.18)'}; }
`;

const MiniIcon = styled.span<{ $accent?: boolean }>`
  font-size: 1.5rem;
  color: ${p => p.$accent ? YELLOW : 'rgba(240,240,240,0.4)'};
  display: block;
  margin-bottom: 12px;
`;

const MiniTitle = styled.h4`
  font-family: 'Geist', sans-serif;
  font-size: 0.9375rem;
  font-weight: 600;
  color: ${TEXT};
  margin-bottom: 6px;
`;

const MiniBody = styled.p`
  font-size: 0.8125rem;
  line-height: 1.6;
  color: ${MUTED};
`;

// ─── Bottom CTA ───────────────────────────────────────────────────────────────
const BottomCTA = styled.section`
  padding: 120px 24px;
  text-align: center;
`;

const BottomTitle = styled.h2`
  font-family: 'Geist', sans-serif;
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
  color: ${TEXT};
  margin-bottom: 30px;
`;

const BottomSub = styled.p`
  font-size: 1.0625rem;
  line-height: 1.65;
  color: ${MUTED};
  max-width: 420px;
  margin: 0 auto 48px;
`;

const BottomBtns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
`;

const BtnPrimary = styled(Link)`
  display: inline-block;
  padding: 14px 32px;
  background: ${YELLOW};
  color: #1a1c1c;
  font-family: 'Geist', sans-serif;
  font-size: 0.9375rem;
  font-weight: 700;
  border-radius: 0.25rem;
  text-decoration: none;
  transition: filter 150ms;
  &:hover { filter: brightness(0.93); }
`;

// ─── Data ─────────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'code',
    label: '코딩',
    desc: '코드와 대화를 한 화면에서. 맥락을 잃지 않고 빠르게 작성·검토·수정하세요.',
    cards: [
      { icon: 'compare_arrows', title: '실시간 Diff', body: '모든 변경사항을 비파괴 스트림으로 포착. 부담 없이 비교하고 롤백하세요.', accent: true },
      { icon: 'code_blocks', title: '구문 강조', body: 'Java, Python, JS 등 주요 언어 자동 감지 및 하이라이팅.', accent: false },
      { icon: 'format_quote', title: '라인 인용', body: '줄 번호 클릭으로 즉시 인용 삽입. 리뷰 속도가 달라집니다.', accent: false },
      { icon: 'ink_pen', title: '마크다운 렌더링', body: '설명과 코드를 마크다운으로 작성하면 채팅 안에서 바로 렌더링됩니다.', accent: false },
    ],
  },
  {
    id: 'collab',
    label: '협업',
    desc: '채널과 스레드로 코드 논의를 구조화하세요. 설계 결정의 맥락을 영구히 보존합니다.',
    cards: [
      { icon: 'tag', title: '채널', body: '프로젝트·기능 단위로 대화를 분리. 노이즈 없이 집중하세요.', accent: true },
      { icon: 'chat_bubble', title: '스레드', body: '메시지 단위 스레드로 토론을 깊게 파고들 수 있습니다.', accent: false },
      { icon: 'psychology', title: '컨텍스트 스레딩', body: '스니펫·파일·터미널 출력의 관계를 엔진이 자동으로 그룹화합니다.', accent: false },
      { icon: 'group', title: '워크스페이스', body: '팀 단위 워크스페이스로 온보딩부터 릴리스까지 한 곳에서.', accent: false },
    ],
  },
  {
    id: 'run',
    label: '실행',
    desc: '코드를 즉시 실행하고 결과를 채팅 안에서 확인하세요. 컨텍스트 스위칭 제로.',
    cards: [
      { icon: 'play_circle', title: '인라인 러너', body: '코드 블록 내 토글 하나로 모의 실행 결과를 바로 확인.', accent: true },
      { icon: 'bug_report', title: '에러 추적', body: '런타임 에러가 발생하면 해당 라인을 자동 하이라이트합니다.', accent: false },
      { icon: 'history', title: '실행 히스토리', body: '이전 실행 결과를 모두 보존. 언제든 비교·재현 가능.', accent: false },
      { icon: 'speed', title: '빠른 피드백', body: '저장 즉시 실행. 사고의 흐름을 끊지 않는 즉각적인 반응.', accent: false },
    ],
  },
];

// scrolling code lines — syntax-coloured JS diff (duplicated for seamless loop)
const CODE_LINES: { no: number; tokens: { t: string; c?: string }[]; add?: boolean; del?: boolean; dim?: boolean }[] = [
  { no: 1,  tokens: [{ t: 'function ', c: '#c792ea' }, { t: 'handleSubmit', c: '#82aaff' }, { t: '() {' }] },
  { no: 2,  tokens: [{ t: '        const ', c: '#c792ea' }, { t: 'errors', c: '#f0f0f0' }, { t: ' = ' }, { t: 'validate', c: '#82aaff' }, { t: '(form);' }] },
  { no: 3,  tokens: [{ t: '        if (errors.', c: '#f0f0f0' }, { t: 'length', c: '#f78c6c' }, { t: ' > ' }, { t: '0', c: '#f78c6c' }, { t: ') return;' }] },
  { no: 4,  tokens: [{ t: '' }], dim: true },
  { no: 5,  tokens: [{ t: '        await ', c: '#c792ea' }, { t: 'api', c: '#f0f0f0' }, { t: '.' }, { t: 'post', c: '#82aaff' }, { t: '(' }, { t: "'/submit'", c: '#c3e88d' }, { t: ', form);' }], del: true },
  { no: 5,  tokens: [{ t: '        await ', c: '#c792ea' }, { t: 'api', c: '#f0f0f0' }, { t: '.' }, { t: 'submitForm', c: '#82aaff' }, { t: '(form);' }], add: true },
  { no: 6,  tokens: [{ t: '        setStatus(' }, { t: "'ok'", c: '#c3e88d' }, { t: ');' }], add: true },
  { no: 7,  tokens: [{ t: '}' }] },
  { no: 8,  tokens: [{ t: '' }], dim: true },
  { no: 9,  tokens: [{ t: '// 유효성 검사', c: '#546e7a' }], dim: true },
  { no: 10, tokens: [{ t: 'function ', c: '#c792ea' }, { t: 'validate', c: '#82aaff' }, { t: '(data: ' }, { t: 'FormData', c: '#ffcb6b' }, { t: ') {' }] },
  { no: 11, tokens: [{ t: '        return ', c: '#c792ea' }, { t: 'schema', c: '#f0f0f0' }, { t: '.' }, { t: 'safeParse', c: '#82aaff' }, { t: '(data);' }] },
  { no: 12, tokens: [{ t: '}' }] },
  { no: 13, tokens: [{ t: '' }], dim: true },
  { no: 14, tokens: [{ t: 'export default ', c: '#c792ea' }, { t: 'handleSubmit', c: '#82aaff' }, { t: ';' }] },
  { no: 15, tokens: [{ t: '' }], dim: true },
  { no: 16, tokens: [{ t: '// 채널 메시지 전송', c: '#546e7a' }], dim: true },
  { no: 17, tokens: [{ t: 'async function ', c: '#c792ea' }, { t: 'sendMessage', c: '#82aaff' }, { t: '(' }, { t: 'ch', c: '#f0f0f0' }, { t: ': ' }, { t: 'Channel', c: '#ffcb6b' }, { t: ') {' }] },
  { no: 18, tokens: [{ t: '        const ', c: '#c792ea' }, { t: 'msg', c: '#f0f0f0' }, { t: ' = { content, ts: ' }, { t: 'Date', c: '#ffcb6b' }, { t: '.' }, { t: 'now', c: '#82aaff' }, { t: '() };' }] },
  { no: 19, tokens: [{ t: '        ch.', c: '#f0f0f0' }, { t: 'push', c: '#82aaff' }, { t: '(msg);' }], del: true },
  { no: 19, tokens: [{ t: '        await ', c: '#c792ea' }, { t: 'ch.', c: '#f0f0f0' }, { t: 'send', c: '#82aaff' }, { t: '(msg);' }], add: true },
  { no: 20, tokens: [{ t: '}' }] },
];

// ─── Component ────────────────────────────────────────────────────────────────
export function HomePage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [activeTab, setActiveTab] = useState('code');

  function handleSignUp() {
    if (isAuthenticated) { navigate('/app'); return; }
    navigate(email ? `/signup?email=${encodeURIComponent(email)}` : '/signup');
  }

  const tab = TABS.find(t => t.id === activeTab) ?? TABS[0];

  return (
    <Page>
      {/* ── Nav ── */}
      <NavBar>
        <NavLogo>WIP</NavLogo>
        <NavRight>
          {isAuthenticated ? (
            <NavGoApp to="/app">워크스페이스 열기</NavGoApp>
          ) : (
            <>
              <NavSignIn to="/login">로그인</NavSignIn>
              <NavSignUp to="/signup">회원가입</NavSignUp>
            </>
          )}
        </NavRight>
      </NavBar>

      {/* ── Hero ── */}
      <HeroSection>

        <HeroTitle>코드를 보면 결과가, <br />대화를 보면 이유가.</HeroTitle>

        <HeroSub>
          툴과 트렌드는 변해도, 코드의 흐름은 계속됩니다.<br />
          WIP에서 개발자, 아이디어, 코드가 하나로 만납니다.
        </HeroSub>

        <HeroCTARow>
          <EmailInput
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignUp()}
          />
          <CTABtn onClick={handleSignUp}>
            {isAuthenticated ? '워크스페이스 열기' : 'WIP 시작하기'}
          </CTABtn>
        </HeroCTARow>

        {/* Code window */}
        <WindowWrap>
          <WindowGlow />
          <Window>
            <WindowTitleBar>
              <Dot $c="#ff5f57" />
              <Dot $c="#febc2e" />
              <Dot $c="#28c840" />
            </WindowTitleBar>
            <WindowBar>
              <Tab>💬 #리팩토링-논의</Tab>
              <Tab $active>handleSubmit.ts</Tab>
            </WindowBar>
            <WindowBody>
              {/* Chat panel */}
              <ChatPanel>
                <ChatLabel>#리팩토링-논의</ChatLabel>

                <ChatRow>
                  <ChatAvatar $color={YELLOW}>J</ChatAvatar>
                  <ChatContent>
                    <ChatAuthor>jun</ChatAuthor>
                    <ChatText>
                      <ChatBadge>submitForm</ChatBadge>으로 분리했어요. 리뷰 부탁드려요!
                    </ChatText>
                  </ChatContent>
                </ChatRow>

                <ChatRow>
                  <ChatAvatar $color="#7fd4df">S</ChatAvatar>
                  <ChatContent>
                    <ChatAuthor>sori</ChatAuthor>
                    <ChatText>5번 라인 — 이게 훨씬 명확하네요 👍</ChatText>
                    <ChatQuote>- await api.post('/submit', form);</ChatQuote>
                  </ChatContent>
                </ChatRow>

                <ChatRow>
                  <ChatAvatar $color="#c792ea">M</ChatAvatar>
                  <ChatContent>
                    <ChatAuthor>miso</ChatAuthor>
                    <ChatText>
                      <ChatBadge>setStatus</ChatBadge> 추가도 좋아요. 에러 케이스도 처리해요?
                    </ChatText>
                  </ChatContent>
                </ChatRow>

                <ChatInput>메시지 입력…</ChatInput>
              </ChatPanel>

              {/* Scrolling code — 줄번호 고정 컬럼 + 코드 스크롤 컬럼 분리 */}
              <CodeArea>
                {/* 줄번호: 코드와 동일한 animation으로 동기화 */}
                <LineNoCol>
                  <LineNoTrack>
                    {[...CODE_LINES, ...CODE_LINES].map((l, i) => (
                      <LineNoItem key={i}>{l.no || ''}</LineNoItem>
                    ))}
                  </LineNoTrack>
                </LineNoCol>

                {/* 코드 본문 */}
                <CodeScroller>
                  <CodeTrack>
                    {[...CODE_LINES, ...CODE_LINES].map((l, i) => (
                      <CodeLine key={i} $dim={l.dim} $add={l.add} $del={l.del}>
                        <span style={{ userSelect: 'none', display: 'inline-block', width: '12px' }}>{l.add ? '+' : l.del ? '-' : ' '}</span>
                        {l.tokens.map((tk, j) => <span key={j} style={{ color: tk.c }}>{tk.t}</span>)}
                      </CodeLine>
                    ))}
                  </CodeTrack>
                </CodeScroller>
              </CodeArea>
            </WindowBody>
          </Window>
        </WindowWrap>
      </HeroSection>

      {/* ── Tabs Section ── */}
      <TabsSection>
        <TabsInner>
          <TabsRow>
            {TABS.map(t => (
              <TabPill key={t.id} $active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </TabPill>
            ))}
          </TabsRow>

          <TabContent>
            <TabTitle>{tab.desc}</TabTitle>
            <MiniBento>
              {tab.cards.map((c, i) => (
                <MiniCard key={i} $accent={c.accent}>
                  <MiniIcon $accent={c.accent} className="material-symbols-outlined">{c.icon}</MiniIcon>
                  <MiniTitle>{c.title}</MiniTitle>
                  <MiniBody>{c.body}</MiniBody>
                </MiniCard>
              ))}
            </MiniBento>
          </TabContent>
        </TabsInner>
      </TabsSection>

      {/* ── Bottom CTA ── */}
      <BottomCTA>
        <BottomTitle>WIP에 합류할<br />준비가 됐나요?</BottomTitle>
        <BottomSub>
          아이디어가 사라지기 전에 합류하세요.
        </BottomSub>
        <BottomBtns>
          <BtnPrimary to={isAuthenticated ? '/app' : '/signup'}>
            {isAuthenticated ? '워크스페이스 열기' : '지금 시작하기'}
          </BtnPrimary>
        </BottomBtns>
      </BottomCTA>
    </Page>
  );
}
