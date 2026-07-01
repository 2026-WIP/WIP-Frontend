k# Settings Font Workflow

## Goal

Settings 페이지의 화면 탭에서 선택한 폰트가 앱 전체에 적용되고, 새로고침 후에도 유지되도록 구현한다. 테마와 동일하게 선택만으로는 적용하지 않고, `변경사항 저장` 버튼을 눌렀을 때 적용한다.

## Current State

- `SettingsPage`에는 `geist`, `inter`, `mono` 폰트 선택 UI가 있다.
- `settingsService`는 `font: 'geist' | 'inter' | 'mono'` 값을 저장한다.
- `theme.ts`에는 `fonts.geist`, `fonts.inter`, `fonts.mono` 토큰이 있다.
- `GlobalStyle`의 `body`, `h1`, `h2`, `h3`는 아직 고정 `font-family`를 사용한다.
- 많은 styled-components가 `font-family: 'Geist'`, `font-family: 'Inter'`, `monospace`를 직접 지정한다.

## Implementation Flow

### 1. Font Token Contract

- `GlobalStyle`에 폰트 CSS 변수를 정의한다.
- 최소 변수:
  - `--font-body`
  - `--font-heading`
  - `--font-ui`
  - `--font-code`
- 기본값:
  - `geist`: UI/heading은 Geist, body는 Inter 또는 Geist 중 최종 결정
  - `inter`: UI/body는 Inter, heading은 Inter 또는 Geist 중 최종 결정
  - `mono`: UI/body/heading은 monospace 계열, code는 monospace 유지

### 2. Font Mode Application

- `useUIStore`에 `font`, `setFont`, `applyFont`를 추가한다.
- `applyFont(font)`는 `document.documentElement`에 아래 속성을 설정한다.
  - `data-font="geist|inter|mono"`
- `GlobalStyle`에서 `[data-font='geist']`, `[data-font='inter']`, `[data-font='mono']` 별 CSS 변수를 정의한다.

### 3. Initial Bootstrap

- 앱 시작 전 `main.tsx`에서 저장된 폰트를 즉시 DOM에 적용한다.
- 테마처럼 빠른 초기 렌더링용 캐시 키를 둘 수 있다.
  - 권장 키: `wip_font`
- `settingsService.get()`의 기본값은 `wip_font` 캐시를 우선 참고한다.

### 4. Settings Page Save Flow

- `AppearanceTab`에서 폰트 선택은 로컬 state만 변경한다.
- `변경사항 저장` 클릭 시:
  - `settingsService.update({ theme, font, density })`
  - `useUIStore.setTheme(theme)`
  - `useUIStore.setFont(font)`
  - 성공 메시지 표시
- 저장 실패 시 실제 전역 폰트는 변경하지 않는다.

### 5. Styled-Components Refactor

- 앱 전역 UI에서 직접 폰트명을 쓰는 부분을 CSS 변수로 교체한다.
- 권장 매핑:
  - 일반 본문: `font-family: var(--font-body);`
  - 제목/버튼/라벨/네비게이션: `font-family: var(--font-ui);`
  - 큰 제목: `font-family: var(--font-heading);`
  - 코드/터미널/라인 번호: `font-family: var(--font-code);`
- 우선 적용 대상:
  - `SettingsPage`
  - `TopNavBar`
  - `Sidebar`
  - `ChatPane`
  - `ChatInput`
  - `MessageBubble`
  - `MessageList`
  - `ThreadPane`
  - `MarkdownRenderer`
  - 공용 `Button`, `Input`, `Chip`

### 6. Code UI Policy

- 코드 블록, 터미널, diff, runner 출력은 가독성을 위해 `--font-code`를 우선 사용한다.
- 사용자가 `geist`나 `inter`를 선택해도 코드 본문은 monospace를 유지한다.
- `mono` 선택 시 일반 UI도 monospace 느낌을 따르되, Material Symbols 아이콘 폰트는 그대로 유지한다.

### 7. Persistence Alignment

- `wip-settings.font`를 기준 저장소로 둔다.
- `wip_font`는 빠른 초기 렌더링 캐시로 둔다.
- 저장 성공 시 두 값을 함께 업데이트한다.
- HTTP 모드에서는 `/settings` 응답의 `font`를 기준으로 UI store를 동기화한다.

### 8. Verification

- `npm run lint`
- `npm run build`
- 수동 확인:
  - 설정 페이지에서 폰트 선택 후 저장 전에는 앱 폰트가 바뀌지 않는지 확인
  - 저장 후 `/app`, `/app/settings`, 채팅 입력, 메시지, 사이드바 폰트 변경 확인
  - 새로고침 후 저장한 폰트 유지 확인
  - 코드 블록/터미널은 `--font-code`로 읽기 좋게 유지되는지 확인

## Acceptance Criteria

- 폰트 선택은 저장 버튼을 눌렀을 때만 앱 전체에 반영된다.
- 저장한 폰트가 새로고침 후에도 유지된다.
- styled-components의 주요 UI가 CSS 폰트 변수를 사용한다.
- 코드/터미널 영역은 일반 UI 폰트 변경으로 가독성이 깨지지 않는다.
- 빌드와 린트가 통과한다.
