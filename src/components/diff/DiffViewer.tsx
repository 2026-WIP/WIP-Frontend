import styled from 'styled-components';
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

interface DiffViewerProps {
  originalCode: string;
  modifiedCode: string;
}

const Wrapper = styled.div`
  border-radius: 0.75rem;
  border: 1px solid var(--border);
  overflow: hidden;
  font-size: 13px;
`;

const diffStyles = {
  variables: {
    light: {
      diffViewerBackground: 'var(--bg-surface)',
      diffViewerColor: 'var(--text-primary)',
      addedBackground: '#e8f8ee',
      addedColor: '#0f7a3a',
      removedBackground: '#fdecec',
      removedColor: '#b42318',
      wordAddedBackground: '#c9f1d6',
      wordRemovedBackground: '#f9c7c7',
      addedGutterBackground: '#d9f3e2',
      removedGutterBackground: '#f8d7d7',
      gutterBackground: 'var(--bg-panel)',
      gutterColor: 'var(--text-muted)',
    },
  },
  line: {
    padding: '2px 8px',
    fontFamily: "var(--font-code)",
    fontSize: '13px',
  },
  gutter: {
    fontFamily: "var(--font-code)",
    fontSize: '12px',
    minWidth: '40px',
    padding: '0 8px',
  },
  contentText: {
    fontFamily: "var(--font-code)",
    fontSize: '13px',
  },
};

export function DiffViewer({ originalCode, modifiedCode }: DiffViewerProps) {
  return (
    <Wrapper>
      <ReactDiffViewer
        oldValue={originalCode}
        newValue={modifiedCode}
        splitView={false}
        compareMethod={DiffMethod.LINES}
        styles={diffStyles}
        useDarkTheme={false}
        hideLineNumbers={false}
        showDiffOnly={false}
      />
    </Wrapper>
  );
}
