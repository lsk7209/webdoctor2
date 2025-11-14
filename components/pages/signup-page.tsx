/**
 * 회원가입 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/utils/api-client';
import { validateEmail, validatePassword, validateName } from '@/utils/validation';

export default function SignupPageClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 클라이언트 사이드 폼 검증
  const nameError = useMemo(() => {
    if (!name.trim()) return null;
    const validation = validateName(name.trim());
    return validation.valid ? null : validation.error || null;
  }, [name]);

  const emailError = useMemo(() => {
    if (!email.trim()) return null;
    const validation = validateEmail(email.trim());
    return validation.valid ? null : validation.error || null;
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return null;
    const validation = validatePassword(password);
    return validation.valid ? null : validation.error || null;
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword) return null;
    if (password && confirmPassword !== password) {
      return '비밀번호가 일치하지 않습니다.';
    }
    return null;
  }, [password, confirmPassword]);

  const isFormValid = useMemo(() => {
    return (
      name.trim() &&
      email.trim() &&
      password &&
      confirmPassword &&
      !nameError &&
      !emailError &&
      !passwordError &&
      !confirmPasswordError
    );
  }, [name, email, password, confirmPassword, nameError, emailError, passwordError, confirmPasswordError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 클라이언트 사이드 검증
    const nameValidation = validateName(name.trim());
    if (!nameValidation.valid) {
      setError(nameValidation.error || '이름은 2자 이상 50자 이하여야 합니다.');
      return;
    }

    const emailValidation = validateEmail(email.trim());
    if (!emailValidation.valid) {
      setError(emailValidation.error || '올바른 이메일 형식이 아닙니다.');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || '비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setLoading(true);

    // 표준화된 API 클라이언트 사용
    const result = await apiPost<{ message: string; userId: string; workspaceId: string }>(
      '/api/auth/signup',
      { name: name.trim(), email: email.trim().toLowerCase(), password },
      { timeout: 30000, retries: 1 }
    );

    if (!result.ok || result.error) {
      setError(result.error || '회원가입에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 회원가입 성공 시 로그인 페이지로 이동
    router.push('/login?registered=true');
  }, [name, email, password, confirmPassword, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-4xl font-bold text-gray-900">
            KoreSEO
          </h1>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              로그인
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="name" className="sr-only">
                이름
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={nameError ? 'true' : 'false'}
                aria-describedby={nameError ? 'name-error' : undefined}
                className={`relative block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:ring-blue-500 sm:text-sm ${
                  nameError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="이름"
              />
              {nameError && (
                <p id="name-error" className="mt-1 text-xs text-red-600" role="alert">
                  {nameError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={emailError ? 'true' : 'false'}
                aria-describedby={emailError ? 'email-error' : undefined}
                className={`relative block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:ring-blue-500 sm:text-sm ${
                  emailError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="이메일 주소"
              />
              {emailError && (
                <p id="email-error" className="mt-1 text-xs text-red-600" role="alert">
                  {emailError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`relative block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:ring-blue-500 sm:text-sm ${
                  passwordError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="비밀번호 (최소 8자)"
              />
              {passwordError && (
                <p id="password-error" className="mt-1 text-xs text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={confirmPasswordError ? 'true' : 'false'}
                aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                className={`relative block w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:ring-blue-500 sm:text-sm ${
                  confirmPasswordError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="비밀번호 확인"
              />
              {confirmPasswordError && (
                <p id="confirm-password-error" className="mt-1 text-xs text-red-600" role="alert">
                  {confirmPasswordError}
                </p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              aria-label="회원가입"
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

