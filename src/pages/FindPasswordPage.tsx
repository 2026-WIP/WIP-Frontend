import styled from 'styled-components';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/useAuthStore';
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
  justify-content: space-between;
  padding: 24px;

  @media (min-width: 768px) {
    width: 50%;
    border-bottom: none;
    border-right: 1px solid var(--border);
    padding: 48px;
  }
`;

const BrandLogo = styled.div`
  display: flex;
  align-items: center;
`;

const BrandContent = styled.div`
  max-width: 448px;
  margin-top: 64px;

  @media (min-width: 768px) {
    margin-top: 128px;
  }
`;

const BrandHeadline = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 32px;
  font-family: var(--font-ui);
  letter-spacing: -0.02em;
  color: var(--text-primary);
`;

const BrandBody = styled.p`
  font-size: 1.125rem;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const BrandFooter = styled.footer`
  margin-top: 48px;
  color: var(--text-secondary);
`;

const BrandFooterText = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  font-family: var(--font-ui);
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
  display: block;
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
  transition: border-color 150ms;
  color: var(--text-primary);

  &::placeholder { color: var(--text-muted); }
  &:focus { border-color: ${p => p.$error ? 'var(--danger)' : 'var(--text-primary)'}; }
`;

const FieldError = styled.p`
  font-size: 0.75rem;
  color: var(--danger);
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
  transition: filter 150ms;

  &:hover { filter: brightness(0.95); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const BackLink = styled(Link)`
  display: block;
  text-align: center;
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-family: var(--font-ui);
  transition: color 150ms;

  &:hover { color: var(--text-primary); }
`;

const OutlineButton = styled.button`
  width: 100%;
  height: 48px;
  border: 1px solid var(--border);
  background: none;
  color: var(--text-primary);
  font-weight: 500;
  border-radius: 0.125rem;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: background 150ms;

  &:hover { background: var(--bg-hover); }
`;

const SuccessTitle = styled.h2`
  font-size: 1.875rem;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: var(--font-ui);
  color: var(--text-primary);
`;

const SuccessBody = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 32px;
`;

const SuccessNote = styled.p`
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 32px;
`;

export function FindPasswordPage() {
  const { isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    const err = validate(email, validators.email);
    if (err) { setEmailError(err); return; }
    setEmailError(null);
    try {
      await authService.findPassword(email);
      setSent(true);
    } catch { /* error in store */ }
  }

  if (sent) {
    return (
      <Page>
        <BrandSection>
          <BrandLogo><img src="/logo.png" alt="WIP" style={{ height: '112px', display: 'block' }} /></BrandLogo>
        </BrandSection>
        <FormSection>
          <FormCard>
            <SuccessTitle>받은편지함을 확인하세요</SuccessTitle>
            <SuccessBody><strong>{email}</strong>으로 재설정 링크를 보냈습니다.</SuccessBody>
            <SuccessNote>이메일이 오지 않았나요? 스팸 폴더를 확인하거나 다른 주소로 다시 시도해보세요.</SuccessNote>
            <Link to="/login">
              <OutlineButton>로그인으로 돌아가기</OutlineButton>
            </Link>
          </FormCard>
        </FormSection>
      </Page>
    );
  }

  return (
    <Page>
      <BrandSection>
        <div>
          <BrandLogo><img src="/logo.png" alt="WIP" style={{ height: '112px', display: 'block' }} /></BrandLogo>
          <BrandContent>
            <BrandHeadline>잠긴 문을 열어드립니다.</BrandHeadline>
            <BrandBody>이메일 주소만 알려주시면, 새로운 비밀번호를 설정할 수 있는 링크를 보내드립니다.</BrandBody>
          </BrandContent>
        </div>
        <BrandFooter>
          <BrandFooterText>© 2024 WIP. 엔지니어를 위한 솔직한 기록.</BrandFooterText>
        </BrandFooter>
      </BrandSection>

      <FormSection>
        <FormCard>
          <FormTitle>비밀번호 찾기</FormTitle>
          <FormSubtitle>이메일로 재설정 링크를 보내드립니다.</FormSubtitle>
          <Form onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setEmailError(validate(email, validators.email))}
                placeholder="hello@example.com"
                $error={!!emailError}
              />
              {emailError && <FieldError>{emailError}</FieldError>}
            </FieldGroup>
            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? '전송 중…' : '재설정 링크 보내기'}
            </SubmitButton>
            <BackLink to="/login">로그인으로 돌아가기</BackLink>
          </Form>
        </FormCard>
      </FormSection>
    </Page>
  );
}
