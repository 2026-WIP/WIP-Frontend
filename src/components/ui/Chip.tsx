import styled, { css } from 'styled-components';
import type { ReactNode } from 'react';

type ChipVariant = 'default' | 'active' | 'done';

interface ChipProps {
  children: ReactNode;
  variant?: ChipVariant;
  className?: string;
}

const variantStyles = {
  default: css`
    background: var(--bg-panel);
    color: var(--text-secondary);
  `,
  active: css`
    background: var(--accent);
    color: var(--accent-text);
  `,
  done: css`
    background: var(--text-primary);
    color: var(--bg-surface);
  `,
};

const StyledChip = styled.span<{ $variant: ChipVariant }>`
  display: inline-flex;
  align-items: center;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 2px 6px;
  border-radius: 0.125rem;
  font-family: var(--font-ui);

  ${p => variantStyles[p.$variant]}
`;

export function Chip({ children, variant = 'default', className }: ChipProps) {
  return (
    <StyledChip $variant={variant} className={className}>
      {children}
    </StyledChip>
  );
}
