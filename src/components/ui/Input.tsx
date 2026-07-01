import styled from 'styled-components';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const StyledInput = styled.input<{ $error?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: var(--bg-surface);
  font-size: 1rem;
  border: 1px solid ${p => p.$error ? 'var(--danger)' : 'var(--border)'};
  border-radius: 0.125rem;
  outline: none;
  transition: border-color 150ms;
  color: var(--text-primary);

  &::placeholder { color: var(--text-muted); }

  &:focus {
    border-color: ${p => p.$error ? 'var(--danger)' : 'var(--text-primary)'};
  }
`;

export function Input({ error, ...rest }: InputProps) {
  return <StyledInput $error={error} {...rest} />;
}
