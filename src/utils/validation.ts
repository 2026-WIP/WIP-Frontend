export const validators = {
  email: (v: string): string | true =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || '올바른 이메일 주소를 입력해주세요',

  password: (v: string): string | true =>
    v.length >= 8 || '비밀번호는 8자 이상이어야 합니다',

  confirmPassword: (v: string, pw: string): string | true =>
    v === pw || '비밀번호가 일치하지 않습니다',

  nickname: (v: string): string | true =>
    /^[a-zA-Z0-9_-]{2,20}$/.test(v) || '닉네임은 2~20자, 영문/숫자/-/_ 만 사용 가능합니다',
};

export function validate(
  value: string,
  ruleFn: (v: string) => string | true
): string | null {
  const result = ruleFn(value);
  return result === true ? null : result;
}
