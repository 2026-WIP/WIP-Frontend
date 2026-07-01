import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle`
  :root,
  [data-theme='light'] {
    --bg-app: #f9f9f9;
    --bg-surface: #ffffff;
    --bg-sidebar: #eeeeee;
    --bg-panel: #f3f3f3;
    --bg-hover: #f3f3f3;
    --bg-active: #e2e2e2;
    --text-primary: #121212;
    --text-secondary: #494737;
    --text-muted: #7a7865;
    --border: #e2e2e2;
    --border-focus: #121212;
    --accent: #f2e974;
    --accent-text: #6e6800;
    --danger: #ba1a1a;
    --danger-bg: #ffdad6;
    --success: #15803d;
    --success-bg: #f0fdf4;
    --success-border: #bbf7d0;
  }

  [data-theme='dark'] {
    --bg-app: #0d0d0d;
    --bg-surface: #1a1a1a;
    --bg-sidebar: #111111;
    --bg-panel: #222222;
    --bg-hover: #2a2a2a;
    --bg-active: #333333;
    --text-primary: #f0f0f0;
    --text-secondary: #c0bdb0;
    --text-muted: #969285;
    --border: #2e2e2e;
    --border-focus: #f0f0f0;
    --accent: #f2e974;
    --accent-text: #1e1c00;
    --danger: #f28b82;
    --danger-bg: rgba(242, 139, 130, 0.16);
    --success: #86efac;
    --success-bg: rgba(34, 197, 94, 0.14);
    --success-border: rgba(134, 239, 172, 0.36);
  }

  :root,
  [data-density='default'] {
    --density-list-padding: 8px 20px 4px;
    --density-list-gap: 0px;
    --density-bubble-padding: 2px 8px;
    --density-bubble-gap: 10px;
    --density-avatar-size: 28px;
    --density-avatar-font: 0.75rem;
    --density-date-padding: 8px 0 4px;
    --density-dm-list-gap: 0;
    --density-dm-row-padding: 1px 0;
    --density-dm-compact-row-padding: 1px 0;
    --density-dm-content-gap: 1px;
    --density-dm-message-padding: 5px 9px;
  }

  [data-density='compact'] {
    --density-list-padding: 8px 20px 4px;
    --density-list-gap: 0px;
    --density-bubble-padding: 2px 8px;
    --density-bubble-gap: 10px;
    --density-avatar-size: 28px;
    --density-avatar-font: 0.75rem;
    --density-date-padding: 8px 0 4px;
    --density-dm-list-gap: 0;
    --density-dm-row-padding: 1px 0;
    --density-dm-compact-row-padding: 1px 0;
    --density-dm-content-gap: 1px;
    --density-dm-message-padding: 5px 9px;
  }

  [data-density='spacious'] {
    --density-list-padding: 8px 20px 4px;
    --density-list-gap: 0px;
    --density-bubble-padding: 2px 8px;
    --density-bubble-gap: 10px;
    --density-avatar-size: 28px;
    --density-avatar-font: 0.75rem;
    --density-date-padding: 8px 0 4px;
    --density-dm-list-gap: 0;
    --density-dm-row-padding: 1px 0;
    --density-dm-compact-row-padding: 1px 0;
    --density-dm-content-gap: 1px;
    --density-dm-message-padding: 5px 9px;
  }

  :root,
  [data-font='geist'] {
    --font-body: 'Noto Sans KR', system-ui, sans-serif;
    --font-heading: 'Noto Sans KR', system-ui, sans-serif;
    --font-ui: 'Noto Sans KR', system-ui, sans-serif;
    --font-code: 'JetBrains Mono', 'Courier New', monospace;
  }

  [data-font='inter'] {
    --font-body: 'Noto Serif KR', Georgia, serif;
    --font-heading: 'Noto Serif KR', Georgia, serif;
    --font-ui: 'Noto Serif KR', Georgia, serif;
    --font-code: 'JetBrains Mono', 'Courier New', monospace;
  }

  [data-font='mono'] {
    --font-body: 'JetBrains Mono', 'Courier New', monospace;
    --font-heading: 'JetBrains Mono', 'Courier New', monospace;
    --font-ui: 'JetBrains Mono', 'Courier New', monospace;
    --font-code: 'JetBrains Mono', 'Courier New', monospace;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    height: 100%;
  }

  body {
    background-color: var(--bg-app);
    color: var(--text-primary);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    transition: background-color 200ms, color 200ms;
  }

  h1, h2, h3 {
    font-family: var(--font-heading);
  }

  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }

  /* Diff styles used by react-diff-viewer */
  .diff-added { background-color: rgba(155, 240, 252, 0.1); }
  .diff-removed { background-color: rgba(186, 26, 26, 0.05); }
  .syntax-error { text-decoration: underline wavy var(--danger); }

  /* Custom scrollbar */
  .custom-scrollbar::-webkit-scrollbar { width: 6px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;
