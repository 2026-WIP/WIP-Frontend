import styled from 'styled-components';
import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/Input';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  font-family: var(--font-ui);
`;

const ErrorText = styled.span`
  font-size: 0.75rem;
  color: var(--danger);
`;

export function FormField({ label, error, id, ...rest }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <Field>
      <Label htmlFor={fieldId}>{label}</Label>
      <Input id={fieldId} error={!!error} {...rest} />
      {error && <ErrorText>{error}</ErrorText>}
    </Field>
  );
}
