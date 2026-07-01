import styled from 'styled-components';
import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
  padding: 24px;
`;

const Card = styled.div`
  width: 100%;
  max-width: 384px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  padding: 32px;
`;

const Brand = styled.div`
  margin-bottom: 24px;
`;


const Title = styled.h1`
  font-family: var(--font-ui);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
`;

const Subtitle = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 24px;
`;

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <PageWrapper>
      <Card>
        <Brand>
          <img src="/logo.png" alt="WIP" style={{ height: '96px', display: 'block' }} />
        </Brand>
        <Title>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        {children}
      </Card>
    </PageWrapper>
  );
}
