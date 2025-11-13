/**
 * Next.js Middleware
 * 인증 토큰 검증 및 라우트 보호
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/utils/auth';

// Next.js 14.2.33: middleware는 기본적으로 Edge Runtime에서 실행되므로 runtime 선언 불필요

// 인증이 필요한 경로
const protectedRoutes = ['/dashboard', '/sites', '/reports', '/settings'];

// 인증된 사용자가 접근하면 안 되는 경로 (로그인/회원가입)
const authRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromCookie(request.headers.get('cookie'));

  // 보호된 경로 체크
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 보호된 경로에 접근 시 토큰 검증
  if (isProtectedRoute) {
    if (!token) {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      // 토큰이 유효하지 않으면 로그인 페이지로 리다이렉트
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // 토큰이 유효하면 요청 헤더에 사용자 정보 추가
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-email', payload.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 인증 라우트에 접근 시 (이미 로그인된 경우)
  if (isAuthRoute && token) {
    const payload = await verifyToken(token);
    if (payload) {
      // 이미 로그인되어 있으면 대시보드로 리다이렉트
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

