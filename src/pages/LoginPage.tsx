import styled from 'styled-components';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { validate, validators } from '@/utils/validation';

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
`;

const BrandSection = styled.section`
  width: 100%;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px;

  @media (min-width: 768px) {
    width: 50%;
    border-bottom: none;
    border-right: 1px solid var(--border);
    padding: 48px;
  }
`;

const BrandContent = styled.div`
  max-width: 448px;
  text-align: center;
`;

const BrandHeadline = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 32px;
  font-family: var(--font-ui);
  letter-spacing: -0.02em;
  color: var(--text-primary);
`;

const BrandBody = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  font-family: var(--font-body);
  text-align: center;
  white-space: nowrap;
  text-align: center;
`;

const FormSection = styled.section`
  width: 100%;
  background: var(--bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;

  @media (min-width: 768px) {
    width: 50%;
  }
`;

const FormCard = styled.div`
  width: 100%;
  max-width: 384px;
`;

const FormTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: var(--font-ui);
  letter-spacing: -0.01em;
  color: var(--text-primary);
`;

const FormSubtitle = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 40px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-family: var(--font-ui);
  color: var(--text-primary);
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: var(--bg-surface);
  font-size: 1rem;
  border: 1px solid ${p => p.$error ? 'var(--danger)' : 'var(--border)'};
  border-radius: 0.125rem;
  outline: none;
  color: var(--text-primary);

  &::placeholder { color: var(--text-muted); }
  &:focus { border-color: ${p => p.$error ? 'var(--danger)' : 'var(--text-primary)'}; }
`;

const FieldError = styled.p`
  font-size: 0.75rem;
  color: var(--danger);
`;

const ServerErrorBox = styled.p`
  font-size: 0.875rem;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 0.125rem;
  padding: 8px 12px;
`;

const SubmitButton = styled.button`
  width: 100%;
  height: 56px;
  background: var(--accent);
  color: var(--accent-text);
  font-weight: 600;
  font-size: 1.125rem;
  border: none;
  border-radius: 0.125rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--font-ui);

  &:hover { filter: brightness(0.95); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const FormLinks = styled.div`
  margin-top: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.875rem;
  color: var(--text-secondary);
`;

const StyledLink = styled(Link)<{ $bold?: boolean }>`
  color: ${p => p.$bold ? 'var(--text-primary)' : 'var(--text-secondary)'};
  font-weight: ${p => p.$bold ? '700' : '400'};
  text-decoration: none;
  font-family: var(--font-ui);

  &:hover { text-decoration: underline; color: var(--text-primary); }
`;

const GridOverlay = styled.div`
  position: fixed;
  inset: 0;
  pointer-events: none;
  opacity: 0.03;
  overflow: hidden;
`;

const Grid = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--text-primary) 1px, transparent 1px),
    linear-gradient(90deg, var(--text-primary) 1px, transparent 1px);
  background-size: 80px 80px;
`;

export function LoginPage() {
  const navigate = useNavigate();
  const setActiveView = useUIStore((state) => state.setActiveView);
  const { isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validateAll() {
    const nextErrors: typeof errors = {};
    const emailErr = validate(email, validators.email);
    if (emailErr) nextErrors.email = emailErr;
    if (!password) nextErrors.password = '비밀번호를 입력하세요.';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateAll()) return;
    try {
      await authService.login(email, password);
      setActiveView('home');
      navigate('/app');
    } catch {
      // Auth store owns the visible error message.
    }
  }

  return (
    <Page>
      <BrandSection>
        <BrandContent>
          <BrandHeadline>다시 시작하세요.</BrandHeadline>
          <BrandBody>팀이 이어가고 있는 코드 논의, 미해결 diff, 설계 결정을 다시 확인하세요.</BrandBody>
        </BrandContent>
      </BrandSection>

      <FormSection>
        <FormCard>
          <FormTitle>로그인</FormTitle>
          <FormSubtitle>워크스페이스로 계속 이동하세요.</FormSubtitle>

          <Form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, email: validate(email, validators.email) ?? undefined }))}
                placeholder="hello@example.com"
                $error={!!errors.email}
              />
              {errors.email && <FieldError>{errors.email}</FieldError>}
            </FieldGroup>

            <FieldGroup>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호"
                $error={!!errors.password}
              />
              {errors.password && <FieldError>{errors.password}</FieldError>}
            </FieldGroup>

            <ServerError />

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? '로그인 중...' : (<>워크스페이스 입장 <span className="material-symbols-outlined">arrow_forward</span></>)}
            </SubmitButton>
          </Form>

          <FormLinks>
            <StyledLink to="/find-password">비밀번호를 잊으셨나요?</StyledLink>
            <StyledLink to="/signup" $bold>계정 만들기</StyledLink>
          </FormLinks>
        </FormCard>
      </FormSection>

      <GridOverlay><Grid /></GridOverlay>
    </Page>
  );
}

function ServerError() {
  const error = useAuthStore((state) => state.error);
  if (!error) return null;
  return <ServerErrorBox>{error}</ServerErrorBox>;
}
