import styled from 'styled-components';
import type { Channel } from '@/types/channel';

interface ChannelItemProps {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

const Item = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  font-size: 0.875rem;
  border-radius: 0.25rem;
  text-align: left;
  border: none;
  cursor: pointer;
  transition: background 150ms;
  background: ${p => p.$active ? 'var(--border)' : 'transparent'};
  color: ${p => p.$active ? 'var(--text-primary)' : 'var(--text-secondary)'};
  font-weight: ${p => p.$active ? '600' : '400'};

  &:hover { background: ${p => p.$active ? 'var(--border)' : 'var(--bg-panel)'}; }
`;

const Hash = styled.span<{ $active: boolean }>`
  font-weight: 700;
  color: ${p => p.$active ? 'var(--accent)' : 'var(--border)'};
`;

const Name = styled.span`
  font-family: var(--font-ui);
`;

export function ChannelItem({ channel, isActive, onClick }: ChannelItemProps) {
  return (
    <Item $active={isActive} onClick={onClick} title={channel.description}>
      <Hash $active={isActive}>#</Hash>
      <Name>{channel.name}</Name>
    </Item>
  );
}
