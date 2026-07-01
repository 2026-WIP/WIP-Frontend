import styled from 'styled-components';
import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { authService } from '@/services/authService';
import { validate, validators } from '@/utils/validation';
import { settingsService } from '@/services/settingsService';
import { useUIStore } from '@/store/useUIStore';
import { useGitHubStore } from '@/store/useGitHubStore';

type Tab = 'account' | 'password' | 'appearance' | 'notifications' | 'github' | 'danger';

const TAB_ITEMS: { id: Tab; label: string; icon: string }[] = [
  { id: 'account',       label: '계정',       icon: 'person'        },
  { id: 'password',      label: '비밀번호',   icon: 'lock'          },
  { id: 'appearance',    label: '화면',       icon: 'palette'       },
  { id: 'notifications', label: '알림',       icon: 'notifications' },
  { id: 'github',        label: 'GitHub',     icon: 'code'          },
  { id: 'danger',        label: '로그아웃',   icon: 'logout'        },
];

// Layout
const Shell = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-app);
`;

const TopBar = styled.div`
  height: 64px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 32px;
  gap: 16px;
  flex-shrink: 0;
`;

const BackBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-family: var(--font-ui);
  font-size: 0.875rem;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 0.25rem;
  transition: background 120ms, color 120ms;

  &:hover { background: var(--bg-hover); color: var(--text-primary); }
`;

const TopBarTitle = styled.h1`
  font-family: var(--font-ui);
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const SideNav = styled.nav`
  width: 220px;
  flex-shrink: 0;
  padding: 24px 12px;
  border-right: 1px solid var(--border);
  background: var(--bg-surface);
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NavSection = styled.div`
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  padding: 12px 10px 6px;
`;

const NavBtn = styled.button<{ $active: boolean; $danger?: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 9px 10px;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-weight: ${p => p.$active ? '600' : '500'};
  font-family: var(--font-ui);
  cursor: pointer;
  transition: background 120ms, color 120ms;
  border: none;
  background: ${p => p.$active ? 'var(--accent)' : 'transparent'};
  color: ${p => p.$danger ? 'var(--danger)' : p.$active ? 'var(--accent-text)' : 'var(--text-secondary)'};

  &:hover {
    background: ${p => p.$active ? 'var(--accent)' : p.$danger ? 'var(--danger-bg)' : 'var(--bg-hover)'};
    color: ${p => p.$danger ? 'var(--danger)' : p.$active ? 'var(--accent-text)' : 'var(--text-primary)'};
  }
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding: 40px 48px;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
`;

const SectionTitle = styled.h2`
  font-family: var(--font-ui);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  margin-bottom: 4px;
`;

const SectionDesc = styled.p`
  font-family: var(--font-body);
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 32px;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border);
  margin: 28px 0;
`;

// Shared form controls
const FieldRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--bg-hover);
`;

const FieldLabel = styled.span`
  width: 120px;
  flex-shrink: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
  font-weight: 500;
  font-family: var(--font-ui);
`;

const FieldValue = styled.span`
  font-size: 0.875rem;
  color: var(--text-primary);
  flex: 1;
  font-family: var(--font-body);
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: var(--font-ui);
  color: var(--text-primary);
`;

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-surface);
  border: 1px solid ${p => p.$error ? 'var(--danger)' : 'var(--border)'};
  border-radius: 0.25rem;
  outline: none;
  font-size: 0.875rem;
  font-family: var(--font-body);
  color: var(--text-primary);
  transition: border-color 150ms;

  &:focus { border: 2px solid ${p => p.$error ? 'var(--danger)' : 'var(--text-primary)'}; padding: 0 11px; }
`;

const InputError = styled.p`
  font-size: 0.75rem;
  color: var(--danger);
  font-family: var(--font-body);
`;

const SuccessMsg = styled.div`
  font-size: 0.8125rem;
  color: var(--success);
  background: var(--success-bg);
  border: 1px solid var(--success-border);
  border-radius: 0.25rem;
  padding: 10px 14px;
  margin-bottom: 20px;
  font-family: var(--font-body);
`;

const ErrorMsg = styled.div`
  font-size: 0.8125rem;
  color: var(--danger);
  background: var(--danger-bg);
  border-radius: 0.25rem;
  padding: 10px 14px;
  margin-bottom: 20px;
  font-family: var(--font-body);
`;

const BtnRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;
`;

const PrimaryBtn = styled.button`
  padding: 9px 20px;
  font-size: 0.875rem;
  font-weight: 700;
  background: var(--accent);
  color: var(--accent-text);
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: filter 150ms;

  &:hover { filter: brightness(0.93); }
  &:disabled { opacity: 0.45; cursor: not-allowed; filter: none; }
`;

const OutlineBtn = styled.button`
  padding: 9px 16px;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--border);
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-family: var(--font-ui);
  color: var(--text-primary);
  transition: background 120ms, border-color 120ms;

  &:hover { background: var(--bg-hover); border-color: var(--text-muted); }
`;

const DangerBtn = styled.button`
  padding: 9px 16px;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--danger);
  border: 1px solid var(--danger);
  background: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-family: var(--font-ui);
  transition: background 150ms;

  &:hover { background: var(--danger-bg); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

// Appearance controls
const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
`;

const OptionCard = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-radius: 0.25rem;
  border: 2px solid ${p => p.$active ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$active ? 'var(--bg-app)' : 'var(--bg-surface)'};
  cursor: pointer;
  transition: border-color 120ms, background 120ms;

  &:hover { border-color: var(--text-muted); }
`;

const OptionPreview = styled.div<{ $bg: string; $text: string }>`
  width: 100%;
  height: 52px;
  border-radius: 0.125rem;
  background: ${p => p.$bg};
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  font-weight: 700;
  color: ${p => p.$text};
`;

const OptionLabel = styled.span`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--text-primary);
`;

const FontOption = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 0.25rem;
  border: 2px solid ${p => p.$active ? 'var(--text-primary)' : 'var(--border)'};
  background: ${p => p.$active ? 'var(--bg-app)' : 'var(--bg-surface)'};
  cursor: pointer;
  transition: border-color 120ms;
  margin-bottom: 8px;
  width: 100%;

  &:hover { border-color: var(--text-muted); }
`;

const FontPreview = styled.span<{ $font: string }>`
  font-family: ${p => p.$font};
  font-size: 1rem;
  color: var(--text-primary);
`;

const FontName = styled.span`
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--text-muted);
`;

// Notification controls
const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  border-bottom: 1px solid var(--bg-hover);
`;

const ToggleInfo = styled.div`
  flex: 1;
`;

const ToggleLabel = styled.p`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
`;

const ToggleDesc = styled.p`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-muted);
`;

const Toggle = styled.button<{ $on: boolean }>`
  width: 44px;
  height: 24px;
  border-radius: 999px;
  border: none;
  background: ${p => p.$on ? 'var(--text-primary)' : 'var(--border)'};
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  transition: background 150ms;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${p => p.$on ? '23px' : '3px'};
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--bg-surface);
    transition: left 150ms;
  }
`;

// Danger zone controls
const DangerCard = styled.div<{ $highlight?: boolean }>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border: 1px solid ${p => p.$highlight ? 'var(--danger)' : 'var(--border)'};
  border-radius: 0.25rem;
  background: var(--bg-surface);
  margin-bottom: 12px;
`;

// Page component
export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('account');
  const currentUser = useAuthStore((s) => s.currentUser);
  const navigate = useNavigate();
  if (!currentUser) return null;

  return (
    <Shell>
      <TopBar>
        <BackBtn onClick={() => navigate('/app')}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          앱으로 돌아가기
        </BackBtn>
        <TopBarTitle>설정</TopBarTitle>
      </TopBar>

      <Body>
        <SideNav>
          <NavSection>계정</NavSection>
          {TAB_ITEMS.slice(0, 2).map((t) => (
            <NavBtn key={t.id} $active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
              {t.label}
            </NavBtn>
          ))}

          <NavSection>환경 설정</NavSection>
          {TAB_ITEMS.slice(2, 4).map((t) => (
            <NavBtn key={t.id} $active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
              {t.label}
            </NavBtn>
          ))}

          <NavSection>연동</NavSection>
          {TAB_ITEMS.slice(4, 5).map((t) => (
            <NavBtn key={t.id} $active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
              {t.label}
            </NavBtn>
          ))}

          <div style={{ flex: 1 }} />

          {TAB_ITEMS.slice(5).map((t) => (
            <NavBtn key={t.id} $active={activeTab === t.id} $danger onClick={() => setActiveTab(t.id)}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{t.icon}</span>
              {t.label}
            </NavBtn>
          ))}
        </SideNav>

        <Content>
          {activeTab === 'account'       && <AccountTab />}
          {activeTab === 'password'      && <PasswordTab />}
          {activeTab === 'appearance'    && <AppearanceTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'github'        && <GitHubTab />}
          {activeTab === 'danger'        && <DangerTab />}
        </Content>
      </Body>
    </Shell>
  );
}

// Account tab
function AccountTab() {
  const currentUser = useAuthStore((s) => s.currentUser)!;
  const isLoading   = useAuthStore((s) => s.isLoading);
  const navigate = useNavigate();
  const [editing, setEditing]         = useState(false);
  const [nickname, setNickname]       = useState(currentUser.nickname);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm]         = useState(false);
  const [deletePassword, setDeletePassword]       = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);

  async function handleSave(ev: FormEvent) {
    ev.preventDefault();
    const err = validate(nickname, validators.nickname);
    if (err) { setNicknameError(err); return; }
    try {
      await authService.updateNickname(nickname);
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* handled in store */ }
  }

  async function handleDeactivate() {
    try { await authService.deactivateAccount(); navigate('/login'); } catch { /* in store */ }
  }

  async function handleDelete(ev: FormEvent) {
    ev.preventDefault();
    if (!deletePassword) { setDeletePasswordError('비밀번호를 입력해주세요.'); return; }
    setDeletePasswordError(null);
    try { await authService.deleteAccount(deletePassword); navigate('/login'); }
    catch (e) { setDeletePasswordError(e instanceof Error ? e.message : '오류가 발생했습니다.'); }
  }

  return (
    <div>
      <SectionTitle>계정</SectionTitle>
      <SectionDesc>프로필 정보와 계정 설정을 관리합니다.</SectionDesc>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, padding: '20px 24px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '0.25rem' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-text)', fontFamily: 'var(--font-ui)', flexShrink: 0 }}>
          {currentUser.nickname.charAt(0).toUpperCase()}
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 2 }}>{currentUser.nickname}</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{currentUser.email}</p>
        </div>
      </div>

      {success && <SuccessMsg>프로필이 업데이트되었습니다.</SuccessMsg>}

      <FieldRow>
        <FieldLabel>이메일</FieldLabel>
        <FieldValue>{currentUser.email}</FieldValue>
      </FieldRow>

      {editing ? (
        <form onSubmit={handleSave} style={{ paddingTop: 16, maxWidth: 400 }}>
          <FormGroup>
            <Label htmlFor="nickname">닉네임</Label>
            <Input id="nickname" value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onBlur={() => setNicknameError(validate(nickname, validators.nickname))}
              $error={!!nicknameError} />
            {nicknameError && <InputError>{nicknameError}</InputError>}
          </FormGroup>
          <BtnRow>
            <PrimaryBtn type="submit" disabled={isLoading}>{isLoading ? '저장 중...' : '저장'}</PrimaryBtn>
            <OutlineBtn type="button" onClick={() => { setEditing(false); setNickname(currentUser.nickname); }}>취소</OutlineBtn>
          </BtnRow>
        </form>
      ) : (
        <FieldRow>
          <FieldLabel>닉네임</FieldLabel>
          <FieldValue style={{ flex: 1 }}>{currentUser.nickname}</FieldValue>
          <OutlineBtn type="button" onClick={() => setEditing(true)}>편집</OutlineBtn>
        </FieldRow>
      )}
      <Divider />

      <SectionTitle style={{ marginTop: 0 }}>위험 구역</SectionTitle>
      <SectionDesc>되돌릴 수 없는 작업입니다. 신중하게 진행하세요.</SectionDesc>

      <DangerCard>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            계정 비활성화
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            세션을 종료합니다. 데이터는 보존되며 다시 활성화하려면 고객 지원에 문의하세요.
          </p>
        </div>
        {deactivateConfirm ? (
          <BtnRow style={{ flexShrink: 0 }}>
            <OutlineBtn onClick={() => setDeactivateConfirm(false)}>취소</OutlineBtn>
            <DangerBtn onClick={handleDeactivate} disabled={isLoading}>비활성화</DangerBtn>
          </BtnRow>
        ) : (
          <OutlineBtn style={{ flexShrink: 0 }} onClick={() => setDeactivateConfirm(true)}>비활성화</OutlineBtn>
        )}
      </DangerCard>

      <DangerCard $highlight>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--danger)', marginBottom: 4 }}>
                계정 영구 삭제
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                모든 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            {!deleteConfirm && (
              <DangerBtn style={{ flexShrink: 0 }} onClick={() => setDeleteConfirm(true)}>계정 삭제</DangerBtn>
            )}
          </div>
          {deleteConfirm && (
            <form onSubmit={handleDelete} style={{ marginTop: 16, maxWidth: 280 }} noValidate>
              <FormGroup>
                <Label htmlFor="delete-pw">비밀번호 확인</Label>
                <Input id="delete-pw" type="password"
                  value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)}
                  $error={!!deletePasswordError} />
                {deletePasswordError && <InputError>{deletePasswordError}</InputError>}
              </FormGroup>
              <BtnRow>
                <OutlineBtn type="button" onClick={() => setDeleteConfirm(false)}>취소</OutlineBtn>
                <DangerBtn type="submit" disabled={isLoading}>영구 삭제</DangerBtn>
              </BtnRow>
            </form>
          )}
        </div>
      </DangerCard>
    </div>
  );
}

// Password tab
function PasswordTab() {
  const isLoading  = useAuthStore((s) => s.isLoading);
  const storeError = useAuthStore((s) => s.error);
  const [current, setCurrent]   = useState('');
  const [next, setNext]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [success, setSuccess]   = useState(false);

  function runValidate() {
    const e: Record<string, string> = {};
    if (!current) e.current = '현재 비밀번호를 입력해주세요.';
    const pwErr = validators.password(next);
    if (pwErr !== true) e.next = pwErr as string;
    const cfErr = validators.confirmPassword(confirm, next);
    if (cfErr !== true) e.confirm = cfErr as string;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (!runValidate()) return;
    try {
      await authService.changePassword(current, next);
      setCurrent(''); setNext(''); setConfirm('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch { /* in store */ }
  }

  return (
    <div>
      <SectionTitle>비밀번호 변경</SectionTitle>
      <SectionDesc>정기적으로 비밀번호를 변경해 계정을 보호하세요.</SectionDesc>
      {success && <SuccessMsg>비밀번호가 변경되었습니다.</SuccessMsg>}
      {storeError && <ErrorMsg>{storeError}</ErrorMsg>}
      <form onSubmit={handleSubmit} style={{ maxWidth: 400 }} noValidate>
        <FormGroup>
          <Label htmlFor="current">현재 비밀번호</Label>
          <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} $error={!!errors.current} />
          {errors.current && <InputError>{errors.current}</InputError>}
        </FormGroup>
        <Divider />
        <FormGroup>
          <Label htmlFor="next">새 비밀번호</Label>
          <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} $error={!!errors.next} />
          {errors.next && <InputError>{errors.next}</InputError>}
        </FormGroup>
        <FormGroup>
          <Label htmlFor="confirm">새 비밀번호 확인</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} $error={!!errors.confirm} />
          {errors.confirm && <InputError>{errors.confirm}</InputError>}
        </FormGroup>
        <PrimaryBtn type="submit" disabled={isLoading}>{isLoading ? '변경 중...' : '비밀번호 변경'}</PrimaryBtn>
      </form>
    </div>
  );
}

// Appearance tab
type ThemeOption = 'light' | 'dark' | 'system';
type FontOption2 = 'geist' | 'inter' | 'mono';
type DensityOption = 'compact' | 'default' | 'spacious';

function AppearanceTab() {
  const globalTheme = useUIStore((state) => state.theme);
  const globalFont = useUIStore((state) => state.font);
  const globalDensity = useUIStore((state) => state.density);
  const setGlobalTheme = useUIStore((state) => state.setTheme);
  const setGlobalFont = useUIStore((state) => state.setFont);
  const setGlobalDensity = useUIStore((state) => state.setDensity);
  const [theme, setTheme]     = useState<ThemeOption>(globalTheme);
  const [font, setFont]       = useState<FontOption2>(globalFont);
  const [density, setDensity] = useState<DensityOption>(globalDensity);
  const [saved, setSaved]     = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    settingsService.get().then((settings) => {
      setTheme(settings.theme);
      setGlobalTheme(settings.theme);
      setGlobalFont(settings.font);
      setFont(settings.font);
      setGlobalDensity(settings.density);
      setDensity(settings.density);
    }).catch(() => {});
  }, [setGlobalFont, setGlobalTheme, setGlobalDensity]);

  const THEMES: { id: ThemeOption; label: string; bg: string; text: string }[] = [
    { id: 'light',  label: '라이트', bg: 'var(--bg-surface)', text: 'var(--text-primary)' },
    { id: 'dark',   label: '다크',   bg: '#1e1e1e', text: '#d4d4d4' },
    { id: 'system', label: '시스템', bg: 'linear-gradient(135deg,#ffffff 50%,#1e1e1e 50%)', text: '#888' },
  ];

  const FONTS: { id: FontOption2; label: string; preview: string; family: string }[] = [
    { id: 'geist', label: '고딕 (기본)',   preview: 'Aa 가나다',  family: "'Noto Sans KR', system-ui, sans-serif" },
    { id: 'inter', label: '명조',          preview: 'Aa 가나다',  family: "'Noto Serif KR', Georgia, serif" },
    { id: 'mono',  label: '모노스페이스',  preview: 'Aa 가나다',  family: "'JetBrains Mono', 'Courier New', monospace" },
  ];

  const DENSITIES: { id: DensityOption; label: string; desc: string }[] = [
    { id: 'compact',  label: '좁게',   desc: '더 많은 내용을 한 화면에 표시' },
    { id: 'default',  label: '기본',   desc: '균형 잡힌 기본 간격' },
    { id: 'spacious', label: '넓게',   desc: '여유 있는 간격으로 가독성 향상' },
  ];

  async function handleSave() {
    try {
      await settingsService.update({ theme, font, density });
      setGlobalTheme(theme);
      setGlobalFont(font);
      setGlobalDensity(density);
      setSaveError(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaved(false);
      setSaveError(true);
    }
  }

  function selectTheme(nextTheme: ThemeOption) {
    setTheme(nextTheme);
    setSaveError(false);
  }

  return (
    <div>
      <SectionTitle>화면</SectionTitle>
      <SectionDesc>테마, 폰트, 레이아웃 반응을 취향에 맞게 설정합니다.</SectionDesc>

      {saved && <SuccessMsg>설정이 저장되었습니다.</SuccessMsg>}
      {saveError && <ErrorMsg>설정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.</ErrorMsg>}

      <Label style={{ marginBottom: 12, display: 'block' }}>테마</Label>
      <OptionGrid>
        {THEMES.map((t) => (
          <OptionCard key={t.id} $active={theme === t.id} onClick={() => selectTheme(t.id)}>
            <OptionPreview $bg={t.bg} $text={t.text}>
              WIP
            </OptionPreview>
            <OptionLabel>{t.label}</OptionLabel>
          </OptionCard>
        ))}
      </OptionGrid>

      <Divider />

      <Label style={{ marginBottom: 12, display: 'block' }}>폰트</Label>
      {FONTS.map((f) => (
        <FontOption key={f.id} $active={font === f.id} onClick={() => setFont(f.id)}>
          <FontPreview $font={f.family}>{f.preview}</FontPreview>
          <FontName>{f.label}</FontName>
        </FontOption>
      ))}

      <Divider />

      <Label style={{ marginBottom: 12, display: 'block' }}>메시지 밀도</Label>
      <OptionGrid>
        {DENSITIES.map((d) => (
          <OptionCard key={d.id} $active={density === d.id} onClick={() => setDensity(d.id)}
            style={{ alignItems: 'flex-start', gap: 6 }}>
            <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{d.label}</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'left' }}>{d.desc}</p>
          </OptionCard>
        ))}
      </OptionGrid>

      <div style={{ marginTop: 28 }}>
        <PrimaryBtn onClick={handleSave}>변경사항 저장</PrimaryBtn>
      </div>
    </div>
  );
}

// Notifications tab
function NotificationsTab() {
  const [settings, setSettings] = useState({
    mention:    true,
    reply:      true,
    reaction:   false,
    statusChange: true,
    dmNew:      true,
    sound:      false,
    desktop:    false,
    email:      false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    settingsService.get().then((value) => setSettings(value.notifications)).catch(() => {});
  }, []);

  function toggle(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const ITEMS: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: 'mention',      label: '멘션',          desc: '@멘션을 받으면 알림' },
    { key: 'reply',        label: '답글',          desc: '내 메시지에 답글이 달리면 알림' },
    { key: 'reaction',     label: '반응',          desc: '내 메시지에 이모지 반응이 달리면 알림' },
    { key: 'statusChange', label: '작업 상태 변경', desc: '진행 중/완료 상태가 바뀌면 알림' },
    { key: 'dmNew',        label: 'DM 수신',       desc: '새 다이렉트 메시지를 받으면 알림' },
  ];

  const SYSTEM_ITEMS: { key: keyof typeof settings; label: string; desc: string }[] = [
    { key: 'sound',   label: '알림음',       desc: '알림 수신 시 소리 재생' },
    { key: 'desktop', label: '데스크톱 알림', desc: '브라우저 데스크톱 표시 알림' },
    { key: 'email',   label: '이메일 알림',   desc: '중요 알림을 이메일로 수신' },
  ];

  return (
    <div>
      <SectionTitle>알림</SectionTitle>
      <SectionDesc>어떤 활동에 대한 알림을 받을지 설정합니다.</SectionDesc>

      <Label style={{ marginBottom: 4, display: 'block' }}>알림 유형</Label>
      {ITEMS.map((item) => (
        <ToggleRow key={item.key}>
          <ToggleInfo>
            <ToggleLabel>{item.label}</ToggleLabel>
            <ToggleDesc>{item.desc}</ToggleDesc>
          </ToggleInfo>
          <Toggle $on={settings[item.key]} onClick={() => toggle(item.key)} />
        </ToggleRow>
      ))}

      <Divider />

      <Label style={{ marginBottom: 4, display: 'block' }}>알림 방식</Label>
      {SYSTEM_ITEMS.map((item) => (
        <ToggleRow key={item.key}>
          <ToggleInfo>
            <ToggleLabel>{item.label}</ToggleLabel>
            <ToggleDesc>{item.desc}</ToggleDesc>
          </ToggleInfo>
          <Toggle $on={settings[item.key]} onClick={() => toggle(item.key)} />
        </ToggleRow>
      ))}

      <div style={{ marginTop: 28 }}>
        {saved && <SuccessMsg style={{ marginBottom: 12 }}>저장되었습니다.</SuccessMsg>}
        <PrimaryBtn onClick={() => {
          settingsService.update({ notifications: settings }).then(() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
          }).catch(() => setSaved(false));
        }}>
          변경사항 저장
        </PrimaryBtn>
      </div>
    </div>
  );
}

const GitHubConnectedCard = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 0.25rem;
  background: var(--bg-surface);
  margin-bottom: 20px;
`;

const GitHubRepoMeta = styled.div`
  flex: 1;
  min-width: 0;
`;

const GitHubRepoName = styled.div`
  font-family: var(--font-ui);
  font-size: 0.9375rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
`;

const GitHubRepoDesc = styled.div`
  font-family: var(--font-body);
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-bottom: 8px;
  line-height: 1.5;
`;

const GitHubRepoBadges = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const GitHubBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-ui);
  font-size: 0.75rem;
  color: var(--text-muted);
`;

const GitHubUserTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-app);
  font-family: var(--font-ui);
  font-size: 0.8125rem;
  color: var(--text-primary);
  margin-bottom: 20px;
`;

const HintText = styled.p`
  font-family: var(--font-body);
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.5;
`;

// GitHub tab
function GitHubTab() {
  const { connected, step, error, userLogin, repoInfo, startOAuth, connectRepo, disconnect } = useGitHubStore();
  const [localRepo, setLocalRepo] = useState('');

  // 연결 완료 상태
  if (connected && repoInfo) {
    return (
      <div>
        <SectionTitle>GitHub 연동</SectionTitle>
        <SectionDesc>레포지터리가 연결되었습니다. 커밋, PR, 이슈 알림을 알림 패널에서 확인하세요.</SectionDesc>

        {userLogin && (
          <GitHubUserTag>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person</span>
            @{userLogin}
          </GitHubUserTag>
        )}

        <GitHubConnectedCard>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: 'var(--text-muted)', flexShrink: 0 }}>folder</span>
          <GitHubRepoMeta>
            <GitHubRepoName>{repoInfo.fullName}</GitHubRepoName>
            {repoInfo.description && <GitHubRepoDesc>{repoInfo.description}</GitHubRepoDesc>}
            <GitHubRepoBadges>
              {repoInfo.language && (
                <GitHubBadge>
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>code</span>
                  {repoInfo.language}
                </GitHubBadge>
              )}
              <GitHubBadge>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>star</span>
                {repoInfo.starCount.toLocaleString()}
              </GitHubBadge>
              <GitHubBadge>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>account_tree</span>
                {repoInfo.defaultBranch}
              </GitHubBadge>
            </GitHubRepoBadges>
          </GitHubRepoMeta>
        </GitHubConnectedCard>

        <DangerBtn onClick={disconnect}>연결 해제</DangerBtn>
      </div>
    );
  }

  // 인증 완료 → 레포지터리 선택 단계
  if (step === 'repo-pending' || step === 'connecting') {
    return (
      <div>
        <SectionTitle>GitHub 연동</SectionTitle>
        <SectionDesc>GitHub 계정이 연결되었습니다. 모니터링할 레포지터리를 입력하세요.</SectionDesc>

        {userLogin && (
          <GitHubUserTag>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>check_circle</span>
            @{userLogin} 로그인됨
          </GitHubUserTag>
        )}

        {error && <ErrorMsg style={{ marginBottom: 16 }}>{error}</ErrorMsg>}

        <form onSubmit={ev => { ev.preventDefault(); if (localRepo.trim()) void connectRepo(localRepo.trim()); }}>
          <FormGroup>
            <Label htmlFor="gh-repo">레포지터리</Label>
            <Input
              id="gh-repo"
              type="text"
              placeholder="owner/repository"
              value={localRepo}
              onChange={e => setLocalRepo(e.target.value)}
              autoFocus
            />
            <HintText>예: octocat/Hello-World</HintText>
          </FormGroup>
          <PrimaryBtn type="submit" disabled={step === 'connecting' || !localRepo.trim()}>
            {step === 'connecting' ? '연결 중...' : '레포지터리 연결'}
          </PrimaryBtn>
        </form>
      </div>
    );
  }

  // 초기 상태 — OAuth 로그인 버튼
  return (
    <div>
      <SectionTitle>GitHub 연동</SectionTitle>
      <SectionDesc>GitHub 계정을 연결해 커밋, PR, 이슈 알림을 WIP에서 바로 받아보세요.</SectionDesc>

      {error && <ErrorMsg style={{ marginBottom: 20 }}>{error}</ErrorMsg>}

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 16, padding: '32px 24px',
        border: '1px solid var(--border)', borderRadius: '0.25rem',
        background: 'var(--bg-surface)', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '2rem', opacity: 0.4 }}>hub</span>
          <div>
            <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 4 }}>
              GitHub으로 로그인
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              팝업 창에서 GitHub 계정을 인증합니다. <code style={{ fontFamily: 'var(--font-code)', fontSize: '0.75rem' }}>repo</code> 권한을 요청합니다.
            </p>
          </div>
        </div>
        <PrimaryBtn
          type="button"
          disabled={step === 'oauth-pending'}
          onClick={startOAuth}
        >
          {step === 'oauth-pending' ? '인증 대기 중...' : 'GitHub으로 로그인'}
        </PrimaryBtn>
        {step === 'oauth-pending' && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            팝업 창에서 GitHub 인증을 완료해주세요.
          </p>
        )}
      </div>
    </div>
  );
}

// Danger tab
function DangerTab() {
  const navigate  = useNavigate();

  function handleLogout() {
    authService.logout();
    navigate('/login');
  }

  return (
    <div>
      <DangerCard>
        <div style={{ flex: 1 }}>
          <p style={{ fontFamily: 'var(--font-ui)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', marginBottom: 4 }}>
            로그아웃
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            현재 계정 세션을 종료하고 로그인 화면으로 이동합니다.
          </p>
        </div>
        <OutlineBtn style={{ flexShrink: 0 }} onClick={handleLogout}>로그아웃</OutlineBtn>
      </DangerCard>
    </div>
  );
}
