import styled from 'styled-components';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useSnippetStore } from '@/store/useSnippetStore';
import { useUIStore } from '@/store/useUIStore';
import { formatTimestamp } from '@/utils/timeUtils';
import { searchService, type SearchResult } from '@/services/searchService';

type SearchScope = 'all' | 'messages' | 'code';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

const Page = styled.div`
  flex: 1;
  overflow-y: auto;
  background: var(--bg-app);

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const SearchHeader = styled.div`
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 12px 24px;
`;

const SearchBoxWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  border: 2px solid var(--text-primary);
  border-radius: 0.25rem;
  padding: 8px 14px;
  background: var(--bg-surface);
  margin-bottom: 10px;
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.9375rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: transparent;

  &::placeholder { color: rgba(18,18,18,0.35); }
`;

const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 2px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  border-radius: 0.125rem;
  transition: color 120ms;

  &:hover { color: var(--text-primary); }
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ScopeBtn = styled.button<{ $active: boolean }>`
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid ${p => p.$active ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$active ? 'var(--text-primary)' : 'transparent'};
  color: ${p => p.$active ? 'var(--bg-surface)' : 'var(--text-muted)'};
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 120ms;

  &:hover { border-color: var(--text-primary); color: ${p => p.$active ? 'var(--bg-surface)' : 'var(--text-primary)'}; }
`;

const ResultCount = styled.span`
  margin-left: auto;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const ResultList = styled.div`
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 24px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-body);
  text-align: center;
`;

const ResultCard = styled.button`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  cursor: pointer;
  text-align: left;
  transition: border-color 120ms, background 120ms;

  &:hover { border-color: var(--text-muted); background: var(--bg-app); }
`;

const ResultIcon = styled.div<{ $isCode: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 0.25rem;
  background: ${p => p.$isCode ? '#1e1e1e' : 'var(--bg-hover)'};
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${p => p.$isCode ? '#d4d4d4' : 'var(--text-muted)'};
`;

const ResultBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ResultMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
`;

const ResultAuthor = styled.span`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const ResultChannel = styled.span`
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const ResultTime = styled.span`
  font-size: 0.6875rem;
  color: var(--text-muted);
  margin-left: auto;
`;

const Badge = styled.span`
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 0.125rem;
  background: var(--bg-active);
  color: var(--text-secondary);
`;

const ResultSnippet = styled.p`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-secondary);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const Highlight = styled.mark`
  background: rgba(242,233,116,0.5);
  color: var(--text-primary);
  border-radius: 2px;
  padding: 0 1px;
`;

function normalizeQuery(value: string) {
  return value.replace(/^#\S+\s*/, '').trim();
}

function makeExcerpt(text: string, query: string) {
  const lower = text.toLowerCase();
  const index = lower.indexOf(query.toLowerCase());
  if (index < 0) return text.slice(0, 120);
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + query.length + 60);
  return `${start > 0 ? '...' : ''}${text.slice(start, end)}${end < text.length ? '...' : ''}`;
}

function highlightText(text: string, query: string) {
  const q = normalizeQuery(query);
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === q.toLowerCase()
          ? <Highlight key={index}>{part}</Highlight>
          : <span key={index}>{part}</span>
      )}
    </>
  );
}

export function SearchPane() {
  const globalSearchQuery = useUIStore((state) => state.globalSearchQuery);
  const setGlobalSearchQuery = useUIStore((state) => state.setGlobalSearchQuery);
  const [query, setQuery] = useState(globalSearchQuery);
  const [scope, setScope] = useState<SearchScope>('all');
  const [remoteResults, setRemoteResults] = useState<SearchResult[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const messagesMap = useMessagesStore((state) => state.messages);
  const channelsMap = useMessagesStore((state) => state.channels);
  const snippets = useSnippetStore((state) => state.snippets);
  const setActiveChannel = useUIStore((state) => state.setActiveChannel);
  const setActiveView = useUIStore((state) => state.setActiveView);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const localResults = useMemo<SearchResult[]>(() => {
    const q = normalizeQuery(query).toLowerCase();
    if (!q) return [];
    const out: SearchResult[] = [];

    for (const msg of Object.values(messagesMap)) {
      const channelName = channelsMap[msg.channelId]?.name ?? msg.channelId;
      const channelFilter = query.startsWith('#') ? query.split(/\s+/)[0].slice(1) : '';
      if (channelFilter && channelName !== channelFilter) continue;

      if ((scope === 'all' || scope === 'messages') && msg.content.toLowerCase().includes(q)) {
        out.push({
          type: 'message',
          messageId: msg.id,
          channelId: msg.channelId,
          channelName,
          authorName: msg.authorName,
          snippet: makeExcerpt(msg.content.replace(/```[\s\S]*?```/g, '[code]'), q),
          ts: msg.createdAt,
        });
      }

      if (scope === 'all' || scope === 'code') {
        for (const block of msg.codeBlocks) {
          const haystack = `${block.fileName ?? ''}\n${block.code}`.toLowerCase();
          if (!haystack.includes(q)) continue;
          out.push({
            type: 'code',
            messageId: msg.id,
            channelId: msg.channelId,
            channelName,
            authorName: msg.authorName,
            snippet: makeExcerpt(block.code.replace(/\n/g, ' '), q),
            codeLanguage: block.language,
            fileName: block.fileName,
            ts: msg.createdAt,
          });
        }
      }
    }

    if (scope === 'all' || scope === 'code') {
      for (const snippet of snippets) {
        const haystack = `${snippet.title}\n${snippet.fileName ?? ''}\n${snippet.code}`.toLowerCase();
        if (!haystack.includes(q)) continue;
        out.push({
          type: 'code',
          messageId: snippet.id,
          channelId: 'snippets',
          channelName: 'snippets',
          authorName: snippet.title,
          snippet: makeExcerpt(snippet.code.replace(/\n/g, ' '), q),
          codeLanguage: snippet.language,
          fileName: snippet.fileName,
          ts: snippet.createdAt,
        });
      }
    }

    return out.sort((a, b) => b.ts - a.ts);
  }, [channelsMap, messagesMap, query, scope, snippets]);

  useEffect(() => {
    if (!isHttp) return;
    const q = normalizeQuery(query);
    if (!q) return;
    const timer = setTimeout(() => {
      searchService.search(q, scope).then(setRemoteResults).catch(() => setRemoteResults([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query, scope]);

  const results = !normalizeQuery(query) ? [] : (isHttp ? remoteResults : localResults);

  function updateQuery(value: string) {
    setQuery(value);
    setGlobalSearchQuery(value);
  }

  function handleClick(result: SearchResult) {
    if (result.channelId === 'snippets') {
      setActiveView('snippets');
      return;
    }
    setActiveChannel(result.channelId);
  }

  const hasQuery = normalizeQuery(query).length > 0;

  return (
    <Page>
      <SearchHeader>
        <SearchBoxWrap>
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>search</span>
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="메시지, 코드, 작성자 검색..."
          />
          {query && (
            <ClearBtn onClick={() => updateQuery('')}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
            </ClearBtn>
          )}
        </SearchBoxWrap>

        <FilterRow>
          <ScopeBtn $active={scope === 'all'} onClick={() => setScope('all')}>전체</ScopeBtn>
          <ScopeBtn $active={scope === 'messages'} onClick={() => setScope('messages')}>메시지</ScopeBtn>
          <ScopeBtn $active={scope === 'code'} onClick={() => setScope('code')}>코드</ScopeBtn>
          {hasQuery && <ResultCount>{results.length}개 결과</ResultCount>}
        </FilterRow>
      </SearchHeader>

      <ResultList>
        {!hasQuery && (
          <EmptyState>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.25 }}>manage_search</span>
            메시지, 코드 블록, 스니펫을 검색하세요.
          </EmptyState>
        )}

        {hasQuery && results.length === 0 && (
          <EmptyState>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.25 }}>search_off</span>
            <strong style={{ color: 'var(--text-primary)' }}>"{normalizeQuery(query)}"</strong>에 대한 결과가 없습니다.
          </EmptyState>
        )}

        {results.map((result, index) => (
          <ResultCard key={`${result.messageId}-${index}`} onClick={() => handleClick(result)}>
            <ResultIcon $isCode={result.type === 'code'}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                {result.type === 'code' ? 'code' : 'chat_bubble'}
              </span>
            </ResultIcon>
            <ResultBody>
              <ResultMeta>
                <ResultAuthor>{result.authorName}</ResultAuthor>
                <ResultChannel>#{result.channelName}</ResultChannel>
                {result.codeLanguage && <Badge>{result.codeLanguage}</Badge>}
                {result.fileName && <Badge>{result.fileName}</Badge>}
                <ResultTime>{formatTimestamp(result.ts)}</ResultTime>
              </ResultMeta>
              <ResultSnippet>{highlightText(result.snippet, query)}</ResultSnippet>
            </ResultBody>
          </ResultCard>
        ))}
      </ResultList>
    </Page>
  );
}
