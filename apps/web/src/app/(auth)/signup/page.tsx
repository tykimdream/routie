'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signupSchema, type SignupFormData } from '@/lib/validations/auth';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8자 이상', met: password.length >= 8 },
    { label: '대문자 포함', met: /[A-Z]/.test(password) },
    { label: '소문자 포함', met: /[a-z]/.test(password) },
    { label: '숫자 포함', met: /\d/.test(password) },
  ];
  const strength = checks.filter((c) => c.met).length;

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Strength bar */}
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              strength >= level
                ? strength <= 1
                  ? 'bg-error'
                  : strength <= 2
                    ? 'bg-warning'
                    : strength <= 3
                      ? 'bg-accent-500'
                      : 'bg-success'
                : 'bg-sand-100'
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`text-xs flex items-center gap-1 transition-colors ${
              check.met ? 'text-success' : 'text-sand-300'
            }`}
          >
            {check.met ? (
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width={12}
                height={12}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
              </svg>
            )}
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    setServerError('');
    setIsLoading(true);
    try {
      await signup({
        email: data.email,
        password: data.password,
        name: data.name,
      });
      router.push('/trips');
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('회원가입 중 오류가 발생했습니다');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-sand-900 mb-2">
          여행의 시작, Routie
        </h1>
        <p className="text-sand-500">
          계정을 만들고 최적의 여행 경로를 받아보세요
        </p>
      </div>

      <div className="bg-white rounded-[20px] shadow-lg border border-sand-200 p-8">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
          noValidate
        >
          {serverError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-[12px] text-sm text-red-600 flex items-start gap-2">
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {serverError}
            </div>
          )}

          <Input
            label="이름"
            type="text"
            placeholder="이름을 입력하세요"
            autoComplete="name"
            error={errors.name?.message}
            leftIcon={
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            {...register('name')}
          />

          <Input
            label="이메일"
            type="email"
            placeholder="hello@example.com"
            autoComplete="email"
            error={errors.email?.message}
            leftIcon={
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
            {...register('email')}
          />

          <div>
            <Input
              label="비밀번호"
              isPassword
              placeholder="8자 이상, 대소문자 + 숫자"
              autoComplete="new-password"
              error={errors.password?.message}
              leftIcon={
                <svg
                  width={18}
                  height={18}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
              {...register('password')}
            />
            <PasswordStrength password={password ?? ''} />
          </div>

          <Input
            label="비밀번호 확인"
            isPassword
            placeholder="비밀번호를 한 번 더 입력하세요"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            leftIcon={
              <svg
                width={18}
                height={18}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            {...register('confirmPassword')}
          />

          <Button type="submit" size="lg" fullWidth disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                계정 생성 중...
              </span>
            ) : (
              '회원가입'
            )}
          </Button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-sand-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white text-sand-400">또는</span>
          </div>
        </div>

        <button
          type="button"
          className="mt-6 w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white border-2 border-sand-200 rounded-[12px] font-medium text-sand-700 hover:bg-sand-50 hover:border-sand-300 transition-all cursor-pointer"
        >
          <svg width={20} height={20} viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google로 계속하기
        </button>
      </div>

      <p className="text-center mt-6 text-sm text-sand-500">
        이미 계정이 있으신가요?{' '}
        <Link
          href="/login"
          className="font-semibold text-primary-500 hover:text-primary-600 transition-colors"
        >
          로그인
        </Link>
      </p>
    </div>
  );
}
