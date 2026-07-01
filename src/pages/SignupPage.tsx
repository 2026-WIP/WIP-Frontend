import styled from 'styled-components';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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
  margin-bottom: 48px;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Feature = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  text-align: left;
`;

const FeatureText = styled.div``;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  font-family: var(--font-ui);
  color: var(--text-primary);
`;

const FeatureDesc = styled.p`
  font-size: 0.925rem;
  color: var(--text-secondary);
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

const LoginLink = styled.p`
  margin-top: 40px;
  text-align: center;
  font-size: 1rem;
  color: var(--text-secondary);
`;

const BoldLink = styled(Link)`
  font-weight: 700;
  color: var(--text-primary);
  text-decoration: none;

  &:hover { text-decoration: underline; }
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const FieldLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  font-family: var(--font-ui);
  color: var(--text-primary);
`;

const FieldInput = styled.input<{ $error?: boolean }>`
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

const FieldErrorText = styled.p`
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

export function SignupPage() {
  const navigate = useNavigate();
  const { isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateAll() {
    const nextErrors: Record<string, string> = {};
    const emailErr = validate(email, validators.email);
    const pwErr = validate(password, validators.password);
    const cfErr = validate(confirm, (value) => validators.confirmPassword(value, password));
    const nnErr = validate(nickname, validators.nickname);
    if (emailErr) nextErrors.email = emailErr;
    if (pwErr) nextErrors.password = pwErr;
    if (cfErr) nextErrors.confirm = cfErr;
    if (nnErr) nextErrors.nickname = nnErr;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateAll()) return;
    try {
      await authService.signup(email, password, nickname);
      navigate('/login', { state: { email } });
    } catch {
      // Auth store owns the visible error message.
    }
  }

  return (
    <Page>
      <BrandSection>
        <BrandContent>
          <BrandHeadline>결과보다 과정을<br />함께 빌드하세요.</BrandHeadline>
          <BrandBody>
            WIP는 개발자의 날것 그대로를 위한 공간입니다.<br />완성된 코드가 아닌, 고민하고 부수고 다시 쌓아가는<br />모든 순간을 기록합니다.
          </BrandBody>
          <FeatureList>
            <Feature>
              <span className="material-symbols-outlined" style={{ color: 'var(--accent-text)', marginTop: '4px' }}>terminal</span>
              <FeatureText>
                <FeatureTitle>코드 중심 커뮤니케이션</FeatureTitle>
                <FeatureDesc>코드 블록, diff, 실행 결과까지. 엔지니어 팀을 위해 설계되었습니다.</FeatureDesc>
              </FeatureText>
            </Feature>
            <Feature>
              <span className="material-symbols-out lined" style={{ color: 'var(--accent-text)', marginTop: '4px' }}>history</span>
              <FeatureText>
                <FeatureTitle>반복의 투명성</FeatureTitle>
                <FeatureDesc>모든 스냅샷, 스니펫, 돌파구를 실시간으로 팀과 공유하세요.</FeatureDesc>
              </FeatureText>
            </Feature>
          </FeatureList>
        </BrandContent>
      </BrandSection>

      <FormSection>
        <FormCard>
          <FormTitle>계정 만들기</FormTitle>
          <FormSubtitle>코드 논의를 위한 워크스페이스를 시작하세요.</FormSubtitle>

          <Form onSubmit={handleSubmit} noValidate>
            <Field
              label="이메일"
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              onBlur={() => setErrors((prev) => ({ ...prev, email: validate(email, validators.email) ?? '' }))}
              error={errors.email}
              placeholder="hello@example.com"
            />

            <Field
              label="닉네임"
              id="nickname"
              type="text"
              value={nickname}
              onChange={setNickname}
              onBlur={() => setErrors((prev) => ({ ...prev, nickname: validate(nickname, validators.nickname) ?? '' }))}
              error={errors.nickname}
              placeholder="coder_kim"
            />

            <Field
              label="비밀번호"
              id="password"
              type="password"
              value={password}
              onChange={setPassword}
              onBlur={() => setErrors((prev) => ({ ...prev, password: validate(password, validators.password) ?? '' }))}
              error={errors.password}
              placeholder="비밀번호"
            />

            <Field
              label="비밀번호 확인"
              id="confirm"
              type="password"
              value={confirm}
              onChange={setConfirm}
              onBlur={() => setErrors((prev) => ({ ...prev, confirm: validate(confirm, (value) => validators.confirmPassword(value, password)) ?? '' }))}
              error={errors.confirm}
              placeholder="비밀번호 확인"
            />

            <ServerError />

            <SubmitButton type="submit" disabled={isLoading}>
              {isLoading ? '계정 생성 중...' : (<>계정 만들기 <span className="material-symbols-outlined">arrow_forward</span></>)}
            </SubmitButton>
          </Form>

          <LoginLink>
            이미 계정이 있나요? <BoldLink to="/login">로그인 →</BoldLink>
          </LoginLink>
        </FormCard>
      </FormSection>

      <GridOverlay><Grid /></GridOverlay>
    </Page>
  );
}

function Field({ label, id, error, onChange, onBlur, ...rest }: {
  label: string;
  id: string;
  error?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'onBlur'>) {
  return (
    <FieldGroup>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <FieldInput
        id={id}
        $error={!!error}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        {...rest}
      />
      {error && <FieldErrorText>{error}</FieldErrorText>}
    </FieldGroup>
  );
}

function ServerError() {
  const error = useAuthStore((state) => state.error);
  if (!error) return null;
  return <ServerErrorBox>{error}</ServerErrorBox>;
}
