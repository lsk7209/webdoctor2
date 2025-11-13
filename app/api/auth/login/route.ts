/**
 * 로그인 API 엔드포인트
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/utils/auth';
import { getUserByEmail } from '@/lib/db/users';
import { getD1Database } from '@/lib/cloudflare/env';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const db = getD1Database(request);
    if (!db) {
      return NextResponse.json(
        { error: '데이터베이스 연결을 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.' },
        { status: 503 }
      );
    }

    // 사용자 조회
    const user = await getUserByEmail(db, email);
    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 검증
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    // 쿠키에 토큰 설정
    const response = NextResponse.json(
      {
        message: '로그인 성공',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: true, // Cloudflare에서는 항상 HTTPS
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
