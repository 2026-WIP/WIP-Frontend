# Settings Theme Workflow

## Goal

Settings 페이지의 화면 탭에서 선택한 테마가 앱 전체에 즉시 반영되고, 새로고침과 재접속 이후에도 유지되도록 구현한다.

## Current State

- `SettingsPage`에는 `light`, `dark`, `system` 테마 선택 UI가 있다.
- `settingsService`는 로컬 모드에서 `wip-settings`에 설정을 저장하고, HTTP 모드에서는 `/settings` API를 사용한다.
- `useUIStore`에는 `theme`, `setTheme`, `applyTheme`, `resolveTheme`가 있다.
- `AppShell`은 `data-theme` 적용과 시스템 테마 변경 감지를 처리한다.
- 실제 화면 스타일은 일부 컴포넌트만 CSS 변수(`--bg-app`, `--text-primary` 등)를 사용하고, `SettingsPage`에는 하드코딩 색상이 많다.

## Implementation Flow

### 1. Theme Token Contract

- `light`와 `dark`에서 사용할 CSS 변수 목록을 확정한다.
- 최소 변수:
  - `--bg-app`
  - `--bg-surface`
  - `--bg-panel`
  - `--bg-hover`
  - `--text-primary`
  - `--text-secondary`
  - `--text-muted`
  - `--border`
  - `--border-focus`
  - `--accent`
  - `--accent-text`
  - `--danger`
  - `--danger-bg`
  - `--success`
  - `--success-bg`
- `GlobalStyle`에서 `[data-theme='light']`, `[data-theme='dark']`에 위 변수를 정의한다.

### 2. Initial Theme Bootstrap

- 앱 시작 시 `useUIStore`의 저장된 테마를 즉시 DOM에 적용한다.
- 현재는 `AppShell` 진입 후에만 적용되므로, 로그인/설정/홈 같은 라우트에서도 적용되게 만든다.
- `system` 선택 시 `prefers-color-scheme` 변경을 전역에서 감지한다.

### 3. Settings Page Wiring

- `AppearanceTab` 진입 시 `settingsService.get()`으로 저장된 설정을 불러온다.
- 테마 카드를 클릭하면 미리보기 수준이 아니라 실제 앱 테마도 즉시 바뀌게 할지 결정한다.
- 저장 버튼 클릭 시:
  - `settingsService.update({ theme, font, density })`
  - `useUIStore.setTheme(theme)`
  - 성공 메시지 표시
- 저장 실패 시 사용자에게 실패 메시지를 표시한다.

### 4. Settings Page Theme Refactor

- `SettingsPage`의 하드코딩 색상을 CSS 변수로 교체한다.
- 우선순위:
  - 페이지 레이아웃: `Shell`, `TopBar`, `SideNav`, `Content`
  - 텍스트: `SectionTitle`, `SectionDesc`, `Label`, `FieldValue`
  - 입력/버튼: `Input`, `PrimaryBtn`, `OutlineBtn`, `DangerBtn`
  - 카드/토글: `OptionCard`, `DangerCard`, `EmptyCard`, `Toggle`
- 인라인 스타일 중 테마 색상을 쓰는 부분도 CSS 변수 기반 styled component로 옮긴다.

### 5. App-Wide Coverage

- 주요 앱 영역이 CSS 변수를 사용하고 있는지 확인한다.
- 우선 적용 대상:
  - `TopNavBar`
  - `Sidebar`
  - `ChatPane`
  - `MessageBubble`
  - `ChatInput`
  - `ThreadPane`
  - `CodeBlock`
- 코드 블록과 터미널처럼 자체 다크 UI가 필요한 영역은 무리하게 전역 테마에 맞추지 않고 읽기 좋은 대비를 유지한다.

### 6. Persistence Alignment

- `wip_theme`와 `wip-settings.theme`가 서로 어긋나지 않게 정리한다.
- 권장 방식:
  - `settingsService`를 사용자 설정의 기준 저장소로 둔다.
  - `useUIStore`의 `wip_theme`는 빠른 초기 렌더링용 캐시로 둔다.
  - 설정 저장 성공 시 두 값을 함께 업데이트한다.

### 7. Verification

- `npm run lint`
- `npm run build`
- 수동 확인:
  - 설정 페이지에서 라이트/다크/시스템 선택
  - 저장 후 새로고침
  - `/`, `/login`, `/app`, `/app/settings` 라우트의 배경/텍스트 대비 확인
  - OS 테마 변경 시 `system` 모드 반영 확인

## Acceptance Criteria

- 설정 페이지에서 선택한 테마가 앱 전체에 적용된다.
- 저장한 테마가 새로고침 후에도 유지된다.
- `system` 모드는 OS 테마를 따라간다.
- 설정 페이지 자체도 라이트/다크 테마에서 깨지지 않는다.
- 빌드와 린트가 통과한다.
