import { useState } from 'react';
import { useUIStore } from '@/store/useUIStore';
import { useMessageContext } from '@/components/chat/MessageContext';

interface LineNumberProps {
  lineIndex: number;
  lineText: string;
}

const baseStyle: React.CSSProperties = {
  userSelect: 'none',
  textAlign: 'right',
  padding: '0 12px 0 8px',
  color: 'rgba(255,255,255,0.2)',
  fontFamily: "var(--font-code)",
  fontSize: '12px',
  minWidth: '40px',
  verticalAlign: 'top',
  cursor: 'pointer',
  borderRight: '1px solid rgba(255,255,255,0.05)',
  transition: 'color 120ms, background 120ms',
};

export function LineNumber({ lineIndex, lineText }: LineNumberProps) {
  const { messageId } = useMessageContext();
  const setPendingQuote = useUIStore((s) => s.setPendingQuote);
  const [hovered, setHovered] = useState(false);

  function handleClick() {
    if (!messageId) return;
    setPendingQuote({ messageId, lineNumber: lineIndex, lineContent: lineText });
  }

  return (
    <td
      onClick={handleClick}
      title="클릭하여 이 줄 인용"
      style={{
        ...baseStyle,
        color: hovered ? '#f2e974' : 'rgba(255,255,255,0.2)',
        background: hovered ? 'rgba(242,233,116,0.05)' : undefined,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {lineIndex + 1}
    </td>
  );
}
