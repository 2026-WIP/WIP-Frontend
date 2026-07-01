import styled from 'styled-components';
import { Children, isValidElement, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { CodeBlockData } from '@/types/message';
import { CodeBlock } from '@/components/code/CodeBlock';
import { normalizeLanguage, detectLanguage } from '@/utils/codeUtils';
import { normalizeKnownEncodingArtifacts } from '@/utils/textUtils';

interface MarkdownRendererProps {
  content: string;
  codeBlocks: CodeBlockData[];
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-primary);
  overflow-wrap: anywhere;
`;

const InlineCode = styled.code`
  font-family: var(--font-code);
  font-size: 0.75rem;
  background: var(--bg-panel);
  padding: 2px 6px;
  border-radius: 0.125rem;
  color: var(--text-primary);
`;

const Paragraph = styled.p`
  font-size: 1rem;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

const UnorderedList = styled.ul`
  list-style-type: disc;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 1rem;
`;

const OrderedList = styled.ol`
  list-style-type: decimal;
  padding-left: 24px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 1rem;
`;

const Strong = styled.strong`
  font-family: var(--font-ui);
  font-weight: 600;
  color: var(--text-primary);
`;

const Mention = styled.span`
  color: var(--accent-text);
  background: rgba(242,233,116,0.35);
  border-radius: 0.125rem;
  padding: 0 4px;
  font-weight: 700;
`;

function renderMentions(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child !== 'string') {
      if (!isValidElement(child)) return child;
      return child;
    }
    const parts = child.split(/(@[A-Za-z0-9가-힣_-]+)/g);
    return parts.map((part, index) =>
      part.startsWith('@') ? <Mention key={`${part}-${index}`}>{part}</Mention> : part
    );
  });
}


export function MarkdownRenderer({ content, codeBlocks }: MarkdownRendererProps) {
  const normalizedContent = normalizeKnownEncodingArtifacts(content)
    .replace(/(^|\n)(수정한 파일\s*:)/g, '$1**$2**')
    .replace(/(^|\n)(코드 수정)(?=\n|$)/g, '$1**$2**');
  const blockMap = new Map<string, CodeBlockData>();
  for (const block of codeBlocks) {
    blockMap.set(block.code.trim(), block);
  }

  function normalizeCodeContent(value: unknown) {
    return String(value).replace(/\n$/, '');
  }

  const components: Components = {
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className ?? '');
      const rawCode = normalizeCodeContent(children);
      const hasNewlines = rawCode.includes('\n');
      const isBlock = !!match || hasNewlines;

      if (!isBlock) {
        return <InlineCode>{children}</InlineCode>;
      }

      const language = match ? normalizeLanguage(match[1]) : detectLanguage(rawCode);
      const found = blockMap.get(rawCode.trim());
      const block: CodeBlockData = found ?? { id: `inline-${rawCode.slice(0, 16)}`, code: rawCode, language };
      return <CodeBlock block={block} />;
    },
    p({ children }) {
      return <Paragraph>{renderMentions(children)}</Paragraph>;
    },
    ul({ children }) {
      return <UnorderedList>{children}</UnorderedList>;
    },
    ol({ children }) {
      return <OrderedList>{children}</OrderedList>;
    },
    strong({ children }) {
      return <Strong>{children}</Strong>;
    },
  };

  return (
    <Container>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {normalizedContent}
      </ReactMarkdown>
    </Container>
  );
}
