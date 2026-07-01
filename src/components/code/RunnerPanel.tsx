import styled, { keyframes } from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RunnerOutput, SupportedLanguage } from '@/types/message';

interface RunnerPanelProps {
  output?: RunnerOutput;
  isRunning?: boolean;
  onRerun?: (stdin?: string) => void;
  onClose?: () => void;
  stdin?: string;
  onStdinChange?: (value: string) => void;
  previewCode?: string;
  previewLanguage?: SupportedLanguage;
  previewFileName?: string;
  placement?: 'inline' | 'side';
}

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Panel = styled.div<{ $placement: 'inline' | 'side'; $width: number }>`
  position: relative;
  border-top: 1px solid #cbc7b1;
  ${p => p.$placement === 'side' && `
    width: ${p.$width}px;
    min-width: 280px;
    max-width: min(70vw, 920px);
    flex-shrink: 0;
    border-top: none;
    border-left: 1px solid #cbc7b1;
    margin-left: 14px;
    display: flex;
    flex-direction: column;
  `}
`;

const PanelHeader = styled.div`
  background: #1e1e1e;
  padding: 6px 12px;
  border-bottom: 1px solid #333333;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PanelLabel = styled.span`
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #d4d4d4;
`;

const PanelMeta = styled.span`
  margin-left: auto;
  font-family: var(--font-code);
  font-size: 10px;
  color: #9e9e9e;
`;

const HeaderBtn = styled.button`
  position: relative;
  z-index: 4;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9e9e9e;
  border-radius: 0.125rem;
  padding: 0;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: scale(0.94);
  }
`;

const Spinner = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.15);
  border-top-color: #f2e974;
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;
`;

const PanelBody = styled.div`
  background: #121212;
  padding: 14px 16px;
  font-family: var(--font-code);
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #3a3a3a;
    border-radius: 2px;
  }
`;

const InputBox = styled.div`
  border-top: 1px solid #333333;
  background: #181818;
  padding: 10px 12px;
`;

const InputLabel = styled.label`
  display: block;
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #9e9e9e;
  margin-bottom: 6px;
`;

const StdinTextarea = styled.textarea`
  width: 100%;
  min-height: 54px;
  max-height: 140px;
  resize: vertical;
  border: 1px solid #333333;
  border-radius: 0.125rem;
  background: #101010;
  color: #d4d4d4;
  padding: 8px 10px;
  font-family: var(--font-code);
  font-size: 12px;
  line-height: 1.5;
  outline: none;

  &:focus { border-color: #f2e974; }
  &::placeholder { color: #666666; }
`;

const InputHelp = styled.div`
  margin-top: 6px;
  font-family: var(--font-ui);
  font-size: 11px;
  color: #8f8f8f;
`;

const RuntimeHint = styled.div`
  margin-bottom: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(242, 233, 116, 0.28);
  background: rgba(242, 233, 116, 0.08);
  color: #ddd7a2;
  font-family: var(--font-ui);
  font-size: 12px;
  line-height: 1.5;
`;

const CompilerLine = styled.div`
  margin-bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid #333333;
  border-radius: 0.125rem;
  background: #181818;
  color: #d4d4d4;
  font-family: var(--font-code);
  font-size: 11px;
`;

const PreviewBody = styled.div`
  background: #ffffff;
  flex: 1;
  min-height: 0;
`;

const PreviewFrame = styled.iframe<{ $placement: 'inline' | 'side' }>`
  width: 100%;
  height: ${p => p.$placement === 'side' ? '100%' : '420px'};
  min-height: ${p => p.$placement === 'side' ? '360px' : '420px'};
  display: block;
  border: 0;
  background: #ffffff;
`;

const ResizeHandle = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: -14px;
  width: 14px;
  cursor: col-resize;
  z-index: 2;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 6px;
    width: 2px;
    background: transparent;
  }

  &:hover::after {
    background: #f2e974;
  }
`;

const Stdout = styled.div``;

const Stderr = styled.div`
  color: #f87171;
  margin-top: 6px;
  border-top: 1px solid rgba(248,113,113,0.15);
  padding-top: 6px;
`;

const ExitCode = styled.div<{ $ok: boolean }>`
  color: ${p => p.$ok ? '#4ade80' : '#f87171'};
  font-size: 11px;
  margin-top: 8px;
  opacity: 0.7;
`;

const LoadingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
  color: rgba(255,255,255,0.5);
  font-size: 13px;
  font-family: var(--font-code);
`;

function escapeClosingScript(code: string) {
  return code.replace(/<\/script/gi, '<\\/script');
}

function previewFallbackScript() {
  return `<script>
    window.addEventListener('DOMContentLoaded', () => {
      const body = document.body;
      if (!body) return;
      const meaningfulTags = ['IMG', 'SVG', 'CANVAS', 'VIDEO', 'IFRAME', 'INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'];
      const visibleText = body.innerText.trim();
      const hasMeaningfulNode = Array.from(body.querySelectorAll('*')).some((el) => meaningfulTags.includes(el.tagName));
      if (visibleText || hasMeaningfulNode) return;
      const empty = document.createElement('div');
      empty.style.cssText = 'box-sizing:border-box;margin:24px;padding:16px;border:1px dashed #c8c8c8;border-radius:6px;color:#555;font:14px/1.5 system-ui,sans-serif;background:#fafafa;';
      empty.textContent = 'Preview is running, but the HTML body has no visible content.';
      body.appendChild(empty);
    });
  <\\/script>`;
}

function injectPreviewFallback(html: string) {
  const fallback = previewFallbackScript();
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${fallback}</body>`);
  }
  return `${html}${fallback}`;
}

function buildPreviewDocument(code: string, language?: SupportedLanguage) {
  if (language === 'css') {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
    ${code}
  </style>
</head>
<body>
  <main class="preview-root">
    <h1>CSS Preview</h1>
    <p>CSS styles are applied to this preview area.</p>
    <button>Button</button>
  </main>
</body>
</html>`;
  }

  if (language === 'javascript' || language === 'typescript') {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body { margin: 0; padding: 24px; font-family: system-ui, sans-serif; }
    #app { min-height: 120px; }
    #console { margin-top: 16px; padding: 12px; background: #111; color: #eee; border-radius: 4px; white-space: pre-wrap; font-family: ui-monospace, monospace; font-size: 12px; }
  </style>
</head>
<body>
  <div id="app"></div>
  <pre id="console"></pre>
  <script>
    const consoleBox = document.getElementById('console');
    const write = (...args) => {
      consoleBox.textContent += args.map((arg) => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') + '\\n';
    };
    console.log = write;
    console.error = (...args) => write('[error]', ...args);
    window.onerror = (message) => write('[error]', message);
  </script>
  <script type="module">
${escapeClosingScript(code)}
  </script>
</body>
</html>`;
  }

  const html = /<!doctype|<html[\s>]/i.test(code)
    ? code
    : `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
${code}
</body>
</html>`;

  return injectPreviewFallback(html);
}

function canPreview(language?: SupportedLanguage) {
  return language === 'html' || language === 'css' || language === 'javascript' || language === 'typescript';
}

export function RunnerPanel({
  output,
  isRunning,
  onRerun,
  onClose,
  stdin = '',
  onStdinChange,
  previewCode,
  previewLanguage,
  previewFileName,
  placement = 'inline',
}: RunnerPanelProps) {
  const success = output ? output.exitCode === 0 : false;
  const isPreview = !!previewCode && canPreview(previewLanguage);
  const needsInputHint = !stdin.trim() && !!output?.stderr && /NoSuchElementException|EOFError|input\(|Scanner|readLine/i.test(output.stderr);
  const [width, setWidth] = useState(520);
  const [refreshKey, setRefreshKey] = useState(0);
  const previewDocument = useMemo(
    () => (isPreview ? buildPreviewDocument(previewCode, previewLanguage) : ''),
    [isPreview, previewCode, previewLanguage, refreshKey]
  );
  const frameRef = useRef<HTMLIFrameElement>(null);
  const frameKey = isPreview
    ? `${previewLanguage}-${previewFileName ?? ''}-${previewCode.length}-${previewCode.slice(0, 24)}`
    : 'runner-output';

  useEffect(() => {
    if (!isPreview || !frameRef.current) return;

    const frame = frameRef.current;
    const writePreview = () => {
      const doc = frame.contentDocument ?? frame.contentWindow?.document;
      if (!doc) return;
      doc.open();
      doc.write(previewDocument);
      doc.close();
    };

    writePreview();
    frame.addEventListener('load', writePreview);
    return () => frame.removeEventListener('load', writePreview);
  }, [isPreview, previewDocument]);

  function handleRefresh(event?: React.MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();
    setRefreshKey((key) => key + 1);
    onRerun?.(stdin);
  }

  function handleClose(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    onClose?.();
  }

  function handleResizeStart(event: React.PointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = width;

    // iframe이 pointermove를 가로채면 패널 줄이기가 안 됨 — 드래그 중 비활성화
    if (frameRef.current) frameRef.current.style.pointerEvents = 'none';

    function handleMove(moveEvent: PointerEvent) {
      const nextWidth = startWidth - (moveEvent.clientX - startX);
      setWidth(Math.min(920, Math.max(280, nextWidth)));
    }

    function handleUp() {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (frameRef.current) frameRef.current.style.pointerEvents = '';
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  }

  return (
    <Panel $placement={placement} $width={width}>
      {placement === 'side' && isPreview && <ResizeHandle onPointerDown={handleResizeStart} />}
      <PanelHeader>
        <span className="material-symbols-outlined" style={{ color: '#d4d4d4', fontSize: '14px' }}>
          {isPreview ? 'desktop_windows' : 'terminal'}
        </span>
        <PanelLabel>{isPreview ? 'PREVIEW' : 'RUN OUTPUT'}</PanelLabel>
        {isPreview && <PanelMeta>{previewFileName || previewLanguage}</PanelMeta>}
        {!isPreview && output && !isRunning && (
          <PanelMeta>{output.durationMs}ms · exit {output.exitCode}</PanelMeta>
        )}
        {!isPreview && isRunning && <PanelMeta>running...</PanelMeta>}

        {onRerun && !isRunning && (
          <HeaderBtn
            type="button"
            title={isPreview ? 'Refresh preview' : 'Rerun'}
            onClick={isPreview ? handleRefresh : () => onRerun(stdin)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>replay</span>
          </HeaderBtn>
        )}
        {onClose && (
          <HeaderBtn type="button" title="Close" onClick={handleClose}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
          </HeaderBtn>
        )}
      </PanelHeader>

      {isPreview ? (
        <PreviewBody>
          <PreviewFrame
            ref={frameRef}
            key={frameKey}
            title={previewFileName ? `${previewFileName} preview` : 'frontend preview'}
            srcDoc={previewDocument}
            sandbox="allow-scripts allow-same-origin"
            $placement={placement}
          />
        </PreviewBody>
      ) : (
        <>
          <InputBox>
            <InputLabel htmlFor="runner-stdin">INPUT / STDIN</InputLabel>
            <StdinTextarea
              id="runner-stdin"
              value={stdin}
              onChange={(event) => onStdinChange?.(event.target.value)}
              placeholder={'입력이 필요한 코드라면 여기에 직접 입력하세요.\n예:\n50\n75\n63'}
              spellCheck={false}
            />
            <InputHelp>Scanner, input(), readline 같은 입력은 여기에 값을 넣은 뒤 재실행하면 전달됩니다.</InputHelp>
          </InputBox>
          <PanelBody>
            {needsInputHint && (
              <RuntimeHint>
                입력값이 비어 있어 프로그램이 종료되었습니다. 위 INPUT / STDIN 칸에 값을 한 줄씩 넣고 재실행하세요.
              </RuntimeHint>
            )}

            {!isRunning && output?.compiler && (
              <CompilerLine>
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>construction</span>
                {output.compiler}
              </CompilerLine>
            )}

            {isRunning && (
              <LoadingRow>
                <Spinner />
                Running code...
              </LoadingRow>
            )}

            {!isRunning && !output && (
              <ExitCode $ok={false} style={{ opacity: 0.4 }}>No output yet.</ExitCode>
            )}

            {!isRunning && output && (
              <>
                {output.stdout && <Stdout>{output.stdout}</Stdout>}
                {output.stderr && (
                  <Stderr>
                    <span style={{ fontWeight: 700, fontSize: '10px', letterSpacing: '0.06em' }}>STDERR</span>
                    {'\n'}{output.stderr}
                  </Stderr>
                )}
                <ExitCode $ok={success}>
                  Process exited with code {output.exitCode} in {output.durationMs}ms
                  {success ? ' ✓' : ' ✕'}
                </ExitCode>
              </>
            )}
          </PanelBody>
        </>
      )}
    </Panel>
  );
}
