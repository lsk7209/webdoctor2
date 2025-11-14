/**
 * 로그인 API 엔드포인트
 * POST /api/auth/login
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/utils/auth';
import { getUserByEmail } from '@/lib/db/users';
import { getD1Database } from '@/lib/cloudflare/env';
import { validateEmail, validatePassword } from '@/utils/validation';
import {
  unauthorizedResponse,
  databaseErrorResponse,
  serverErrorResponse,
  successResponse,
  errorResponse,
} from '@/utils/api-response';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // JSON 파싱 에러 처리
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse('요청 본문을 파싱할 수 없습니다.', 400, 'INVALID_JSON');
    }

    const { email, password } = body;

    // 입력 검증
    if (!email || !password) {
      return errorResponse('이메일과 비밀번호를 입력해주세요.', 400, 'MISSING_FIELDS');
    }

    // 이메일 형식 검증
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return errorResponse(emailValidation.error || '올바른 이메일 형식이 아닙니다.', 400, 'INVALID_EMAIL');
    }

    // 비밀번호 검증
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return errorResponse(passwordValidation.error || '비밀번호 형식이 올바르지 않습니다.', 400, 'INVALID_PASSWORD');
    }

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    // 사용자 조회
    const user = await getUserByEmail(db, email.trim().toLowerCase());
    if (!user) {
      // 보안: 사용자 존재 여부를 노출하지 않기 위해 동일한 메시지 반환
      return unauthorizedResponse('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 검증
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return unauthorizedResponse('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // JWT 토큰 생성
    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    // 쿠키에 토큰 설정
    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        },
      },
      '로그인 성공',
      200
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // 프로덕션에서만 secure
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (error) {
    return serverErrorResponse('로그인 중 오류가 발생했습니다.', error);
  }
}
