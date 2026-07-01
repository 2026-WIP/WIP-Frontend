import styled from 'styled-components';
import { useState, useEffect } from 'react';
import { useMessagesStore } from '@/store/useMessagesStore';
import { useSnippetStore, type Snippet } from '@/store/useSnippetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { CodeBlock } from '@/components/code/CodeBlock';
import { snippetService } from '@/services/snippetService';
import type { CodeBlockData, SupportedLanguage } from '@/types/message';
import { v4 as uuidv4 } from 'uuid';

const isHttp = import.meta.env.VITE_API_MODE === 'http';

// ─── Styles ───────────────────────────────────────────────────────────────────
const Pane = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  overflow: hidden;
`;

const ListCol = styled.div`
  width: 260px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--bg-app);
  overflow: hidden;
`;

const ListHeader = styled.div`
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ListTitle = styled.h2`
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary);
`;

const NewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  background: var(--accent);
  border: none;
  border-radius: 0.25rem;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--accent-text);
  cursor: pointer;
  transition: filter 120ms;

  &:hover { filter: brightness(0.93); }
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
`;

const SearchInput = styled.input`
  flex: 1;
  border: none;
  outline: none;
  font-size: 0.8125rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  background: transparent;

  &::placeholder { color: rgba(18,18,18,0.35); }
`;

const SnippetList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 6px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
`;

const SnippetItem = styled.button<{ $active: boolean }>`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid ${p => p.$active ? 'var(--accent)' : 'transparent'};
  border-radius: 0.25rem;
  background: ${p => p.$active ? 'rgba(242,233,116,0.1)' : 'transparent'};
  cursor: pointer;
  text-align: left;
  transition: background 120ms, border-color 120ms;
  margin-bottom: 2px;

  &:hover { background: ${p => p.$active ? 'rgba(242,233,116,0.1)' : 'var(--bg-panel)'}; }
`;

const SnippetItemTitle = styled.div`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SnippetItemMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const LangChip = styled.span`
  font-family: var(--font-code);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 0.125rem;
  background: var(--bg-active);
  color: var(--text-secondary);
`;

const TagChip = styled.span`
  font-family: var(--font-ui);
  font-size: 10px;
  color: var(--text-muted);
  background: var(--bg-hover);
  padding: 1px 5px;
  border-radius: 999px;
  border: 1px solid var(--border);
`;

// 오른쪽 뷰어/에디터
const ViewerCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ViewerHeader = styled.div`
  height: 52px;
  border-bottom: 1px solid var(--border);
  padding: 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
`;

const ViewerTitle = styled.input`
  flex: 1;
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  border: none;
  outline: none;
  background: transparent;

  &::placeholder { color: rgba(18,18,18,0.3); }
`;

const IconBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 6px 7px;
  border: none;
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  color: var(--text-muted);
  transition: background 120ms, color 120ms;

  &:hover { background: var(--bg-hover); color: var(--text-primary); }
`;

const SaveBtn = styled.button`
  padding: 6px 16px;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 0.25rem;
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
  transition: filter 120ms;

  &:hover { filter: brightness(0.93); }
`;

const ViewerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 20px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const FileNameInput = styled.input`
  min-width: 180px;
  font-family: var(--font-code);
  font-size: 0.8125rem;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 4px 8px;
  color: var(--text-primary);
  background: var(--bg-surface);
  outline: none;

  &:focus { border-color: var(--text-primary); }
`;

const TagInput = styled.input`
  font-size: 0.8125rem;
  font-family: var(--font-ui);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 3px 10px;
  color: var(--text-primary);
  background: var(--bg-surface);
  outline: none;
  width: 120px;

  &:focus { border-color: var(--text-primary); }
  &::placeholder { color: rgba(18,18,18,0.35); }
`;

const EmptyViewer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-family: var(--font-body);
`;

const CodeEditor = styled.textarea`
  width: 100%;
  min-height: 300px;
  font-family: var(--font-code);
  font-size: 13px;
  line-height: 1.7;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 16px;
  color: var(--text-primary);
  background: var(--bg-surface);
  outline: none;
  resize: vertical;

  &:focus { border-color: var(--text-primary); }
`;

function inferLanguageFromFileName(fileName: string | undefined, fallback: SupportedLanguage): SupportedLanguage {
  if (!fileName?.trim()) return fallback;
  const ext = fileName.trim().split('.').pop()?.toLowerCase();
  const map: Record<string, SupportedLanguage> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    sh: 'bash',
    html: 'html',
    htm: 'html',
    css: 'css',
    txt: 'plain',
  };
  return ext ? (map[ext] ?? fallback) : fallback;
}

const INDENT = '  '; // 2 spaces

function handleCodeTab(
  e: React.KeyboardEvent<HTMLTextAreaElement>,
  value: string,
  setValue: (v: string) => void,
) {
  if (e.key !== 'Tab') return;
  e.preventDefault();

  const el = e.currentTarget;
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const unindent = e.shiftKey;

  if (start === end) {
    // 선택 없음: 커서 위치에 들여쓰기 삽입 or 현재 줄 내어쓰기
    if (!unindent) {
      const next = value.slice(0, start) + INDENT + value.slice(end);
      setValue(next);
      requestAnimationFrame(() => el.setSelectionRange(start + INDENT.length, start + INDENT.length));
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      if (value.slice(lineStart, lineStart + INDENT.length) === INDENT) {
        const next = value.slice(0, lineStart) + value.slice(lineStart + INDENT.length);
        const newPos = Math.max(lineStart, start - INDENT.length);
        setValue(next);
        requestAnimationFrame(() => el.setSelectionRange(newPos, newPos));
      }
    }
    return;
  }

  // 여러 줄 선택: 선택된 모든 줄 일괄 들여쓰기/내어쓰기
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = value.indexOf('\n', end - 1);
  const block = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd);

  const lines = block.split('\n');
  const newLines = unindent
    ? lines.map((l) => (l.startsWith(INDENT) ? l.slice(INDENT.length) : l))
    : lines.map((l) => INDENT + l);
  const newBlock = newLines.join('\n');

  const endIdx = lineEnd === -1 ? value.length : lineEnd;
  const next = value.slice(0, lineStart) + newBlock + value.slice(endIdx);

  const firstRemovedLen = unindent && lines[0].startsWith(INDENT) ? INDENT.length : 0;
  const delta = newBlock.length - block.length;
  setValue(next);
  requestAnimationFrame(() => {
    el.setSelectionRange(
      Math.max(lineStart, start - firstRemovedLen),
      end + delta,
    );
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function SnippetPane() {
  const messagesMap  = useMessagesStore((s) => s.messages);
  const channelsMap  = useMessagesStore((s) => s.channels);

  const saved = useSnippetStore((s) => s.snippets);

  // 채널 메시지에서 코드 블록 추출해 자동 등록 (중복 제외)
  const codeFromMessages: Snippet[] = Object.values(messagesMap).flatMap((msg) =>
    msg.codeBlocks
      .filter((b) => b.code.trim().length > 0)
      .map((b) => ({
        id: `msg-${b.id}`,
        title: `${msg.authorName}의 코드 — #${channelsMap[msg.channelId]?.name ?? ''}`,
        language: b.language,
        code: b.code,
        fileName: b.fileName,
        tags: [b.language],
        createdAt: msg.createdAt,
        fromChannel: channelsMap[msg.channelId]?.name,
      }))
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editLang, setEditLang] = useState<SupportedLanguage>('javascript');
  const [editFileName, setEditFileName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const currentUser = useAuthStore((s) => s.currentUser);

  // HTTP 모드: 백엔드에서 이미 필터된 스니펫 / 로컬 모드: ownerId로 필터
  const savedOwned = isHttp ? saved : saved.filter((s) => !!currentUser && s.ownerId === currentUser.id);

  const allSnippets = [...savedOwned, ...codeFromMessages];
  const filtered = allSnippets.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.fileName?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
    s.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())) ||
    s.language.toLowerCase().includes(search.toLowerCase())
  );

  const active = allSnippets.find((s) => s.id === activeId);

  function selectSnippet(s: Snippet) {
    setActiveId(s.id);
    setEditTitle(s.title);
    setEditCode(s.code);
    setEditLang(s.language);
    setEditFileName(s.fileName ?? '');
    setEditTags(s.tags.join(', '));
    setIsEditing(false);
    setIsNew(false);
  }

  function startNew() {
    const id = `new-${uuidv4().slice(0, 8)}`;
    setActiveId(id);
    setEditTitle('');
    setEditCode('');
    setEditLang('plain');
    setEditFileName('');
    setEditTags('');
    setIsEditing(true);
    setIsNew(true);
  }

  async function handleSave() {
    if (!activeId) return;
    if (!isNew && activeId.startsWith('msg-')) {
      alert('메시지에서 바로 스니펫으로 저장할 수 없습니다. 새 스니펫을 만들어 붙여넣으세요.');
      return;
    }

    const data = {
      title: editTitle || '제목 없음',
      language: inferLanguageFromFileName(editFileName, editLang),
      code: editCode,
      fileName: editFileName.trim() || undefined,
      ownerId: currentUser?.id,
      tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
      fromChannel: active?.fromChannel,
    };

    if (isNew) {
      const created = await snippetService.createSnippet(data).catch(() => null);
      if (created) setActiveId(created.id);
    } else {
      await snippetService.updateSnippet(activeId, data).catch(() => {});
    }
    setIsEditing(false);
    setIsNew(false);
  }

  async function handleDelete() {
    if (!activeId) return;
    await snippetService.deleteSnippet(activeId).catch(() => {});
    setActiveId(saved[0]?.id ?? null);
    setIsEditing(false);
  }

  // CodeBlock용 block 객체
  const previewBlock: CodeBlockData | null = active
    ? {
        id: active.id,
        code: active.code,
        language: active.language,
        fileName: active.fileName,
      }
    : null;

  // Allow inline editing only for saved snippets owned by the current user
  // HTTP 모드: 백엔드가 이미 owner_id 필터링 완료. 로컬 모드: savedOwned 이미 ownerId 필터링 완료.
  // saved에 있으면 무조건 현재 유저 소유이므로 ownerId 재비교 불필요.
  const isOwnedSaved = !!active && saved.some((s) => s.id === active.id);
  const canEditInline = isOwnedSaved;

  const activeSnippetId = useUIStore((s) => s.activeSnippetId);
  const clearActiveSnippet = useUIStore((s) => s.setActiveSnippet);

  // 홈화면 등 외부에서 activeSnippetId가 설정되면 해당 스니펫을 열고 편집 모드로 진입
  useEffect(() => {
    if (!activeSnippetId) return;
    const target = allSnippets.find((s) => s.id === activeSnippetId);
    if (target) {
      setActiveId(target.id);
      setEditTitle(target.title);
      setEditCode(target.code);
      setEditLang(target.language);
      setEditFileName(target.fileName ?? '');
      setEditTags(target.tags.join(', '));
      setIsEditing(saved.some((s) => s.id === target.id));
      setIsNew(false);
    }
    clearActiveSnippet(null);
  }, [activeSnippetId]); // eslint-disable-line react-hooks/exhaustive-deps

  const setChatDraft = useUIStore((s) => s.setChatDraft);
  const activeChannelId = useUIStore((s) => s.activeChannelId);

  return (
    <Pane>
      {/* 목록 */}
      <ListCol>
        <ListHeader>
          <ListTitle>스니펫</ListTitle>
          <NewBtn onClick={startNew}>
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
            새 스니펫
          </NewBtn>
        </ListHeader>

        <SearchBox>
          <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--text-muted)' }}>search</span>
          <SearchInput
            placeholder="제목, 태그, 언어 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SearchBox>

        <SnippetList>
          {filtered.length === 0 && (
            <div style={{ padding: '16px', fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-body)' }}>
              결과 없음
            </div>
          )}
          {filtered.map((s) => (
            <SnippetItem key={s.id} $active={s.id === activeId} onClick={() => selectSnippet(s)}>
              <SnippetItemTitle>{s.title}</SnippetItemTitle>
              <SnippetItemMeta>
                <LangChip>{s.language}</LangChip>
                {s.fileName && <TagChip>{s.fileName}</TagChip>}
                {s.tags.slice(0, 2).map((t) => <TagChip key={t}>{t}</TagChip>)}
                {s.fromChannel && <TagChip>#{s.fromChannel}</TagChip>}
              </SnippetItemMeta>
            </SnippetItem>
          ))}
        </SnippetList>
      </ListCol>

      {/* 뷰어 / 에디터 */}
      <ViewerCol>
        {!activeId || (!active && !isNew) ? (
          <EmptyViewer>
            <span className="material-symbols-outlined" style={{ fontSize: '40px', opacity: 0.25 }}>code_blocks</span>
            스니펫을 선택하거나 새로 만드세요.
          </EmptyViewer>
        ) : (
          <>
            <ViewerHeader>
              {isEditing ? (
                <ViewerTitle
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="스니펫 제목…"
                />
              ) : (
                <ViewerTitle as="span" style={{ pointerEvents: 'none' }}>
                  {active?.title}
                </ViewerTitle>
              )}
                {!isEditing && (
                  <>
                    {isOwnedSaved && (
                      <IconBtn title="채팅에 사용" onClick={() => {
                        if (!activeChannelId) return;
                        const fenceLang = active?.language ?? 'plain';
                        const codeBlock = `\n\n\`\`\`${fenceLang}\n${active?.code}\n\`\`\`\n`;
                        const current = useUIStore.getState().chatDrafts[activeChannelId] ?? '';
                        const newDraft = current + codeBlock;
                        setChatDraft(activeChannelId, newDraft);
                        // switch view to channel and focus chat input
                        useUIStore.getState().setActiveView('channel');
                        useUIStore.getState().setActiveChannel(activeChannelId);
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>send</span>
                      </IconBtn>
                    )}
                    {canEditInline && (
                      <IconBtn title="편집" onClick={() => {
                        if (active) {
                          setEditTitle(active.title);
                          setEditCode(active.code);
                          setEditLang(active.language);
                          setEditFileName(active.fileName ?? '');
                          setEditTags(active.tags.join(', '));
                        }
                        setIsEditing(true);
                      }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>edit</span>
                      </IconBtn>
                    )}
                  </>
                )}
              {!isEditing && saved.some((s) => s.id === activeId) && (
                <IconBtn title="삭제" onClick={handleDelete}>
                  <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>delete</span>
                </IconBtn>
              )}
              {isEditing && (
                <>
                  <IconBtn title="취소" onClick={() => { setIsEditing(false); setIsNew(false); }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '17px' }}>close</span>
                  </IconBtn>
                  <SaveBtn onClick={handleSave}>저장</SaveBtn>
                </>
              )}
            </ViewerHeader>

            <ViewerBody>
              <MetaRow>
                {isEditing ? (
                  <>
                    <FileNameInput
                      value={editFileName}
                      onChange={(e) => setEditFileName(e.target.value)}
                      placeholder="파일명 예: main.js"
                    />
                    <TagInput
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      placeholder="태그 (쉼표 구분)"
                    />
                  </>
                ) : (
                  <>
                    <LangChip style={{ fontSize: '11px', padding: '3px 8px' }}>{active?.language}</LangChip>
                    {active?.fileName && <TagChip>{active.fileName}</TagChip>}
                    {active?.tags.map((t) => <TagChip key={t}>{t}</TagChip>)}
                    {active?.fromChannel && (
                      <TagChip style={{ color: 'var(--text-secondary)' }}>#{active.fromChannel}</TagChip>
                    )}
                  </>
                )}
              </MetaRow>

              {isEditing ? (
                <CodeEditor
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  onKeyDown={(e) => handleCodeTab(e, editCode, setEditCode)}
                  placeholder="코드를 입력하세요…"
                  spellCheck={false}
                />
              ) : (
                previewBlock && active && (
                  <CodeBlock
                    block={previewBlock}
                    onSaveBlock={(patch) => {
                      const lang = inferLanguageFromFileName(patch.fileName, active.language);
                      if (canEditInline) {
                        // 본인 소유 스니펫: 제자리 업데이트
                        snippetService.updateSnippet(active.id, { ...patch, language: lang }).catch(() => {});
                      } else {
                        // 채팅 출처/미소유 스니펫: 편집 내용으로 새 스니펫 생성
                        snippetService.createSnippet({
                          title: patch.fileName?.trim() || active.title,
                          language: lang,
                          code: patch.code,
                          fileName: patch.fileName,
                          tags: active.tags,
                          fromChannel: active.fromChannel,
                        }).then((created) => setActiveId(created.id)).catch(() => {});
                      }
                    }}
                  />
                )
              )}
            </ViewerBody>
          </>
        )}
      </ViewerCol>
    </Pane>
  );
}
