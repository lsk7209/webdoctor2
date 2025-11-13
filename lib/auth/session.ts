/**
 * 세션 관리 유틸리티
 * 서버 컴포넌트에서 사용자 정보 가져오기
 */

import { headers } from 'next/headers';
import { verifyToken, getTokenFromCookie } from '@/utils/auth';

export interface Session {
  userId: string;
  email: string;
}

/**
 * 서버 컴포넌트에서 현재 세션 가져오기
 */
export async function getSession(): Promise<Session | null> {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie');
  const token = getTokenFromCookie(cookieHeader);

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    userId: payload.userId,
    email: payload.email,
  };
}

/**
 * 클라이언트에서 토큰 가져오기 (클라이언트 컴포넌트용)
 */
export function getTokenFromClient(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return cookies['auth-token'] || null;
}

