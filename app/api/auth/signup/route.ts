/**
 * 회원가입 API 엔드포인트
 * POST /api/auth/signup
 */

import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken } from '@/utils/auth';
import { createUser } from '@/lib/db/users';
import { createWorkspace } from '@/lib/db/workspaces';
import { getD1Database } from '@/lib/cloudflare/env';
import { getUserByEmail } from '@/lib/db/users';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // 입력 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 길이 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
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

    // 이메일 중복 확인
    const existingUser = await getUserByEmail(db, email);
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해싱
    const password_hash = await hashPassword(password);

    // 사용자 생성
    const user = await createUser(db, {
      email,
      password_hash,
      name,
      plan: 'trial_basic',
    });

    // 워크스페이스 자동 생성
    const workspace = await createWorkspace(db, user.id, `${name}의 워크스페이스`);

    // JWT 토큰 생성
    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    return NextResponse.json(
      {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
