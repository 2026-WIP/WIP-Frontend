import styled, { css } from 'styled-components';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger';
type Size = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantStyles = {
  primary: css`
    background: var(--accent);
    color: var(--accent-text);
    border: none;
  `,
  secondary: css`
    background: var(--text-primary);
    color: var(--bg-surface);
    border: none;
  `,
  tertiary: css`
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border);
  `,
  danger: css`
    background: transparent;
    color: var(--danger);
    border: 1px solid var(--danger);
  `,
};

const sizeStyles = {
  sm: css`
    padding: 6px 12px;
    font-size: 0.75rem;
  `,
  md: css`
    padding: 8px 16px;
    font-size: 0.875rem;
  `,
};

const StyledButton = styled.button<{ $variant: Variant; $size: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-weight: 600;
  font-family: var(--font-ui);
  cursor: pointer;
  transition: filter 150ms, opacity 150ms;

  ${p => variantStyles[p.$variant]}
  ${p => sizeStyles[p.$size]}

  &:hover { filter: brightness(0.95); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? '로딩 중...' : children}
    </StyledButton>
  );
}
