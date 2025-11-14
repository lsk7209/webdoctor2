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
import { validateEmail, validatePassword, validateName, sanitizeString } from '@/utils/validation';
import {
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

    const { email, password, name } = body;

    // 입력 검증
    if (!email || !password || !name) {
      return errorResponse('이메일, 비밀번호, 이름을 모두 입력해주세요.', 400, 'MISSING_FIELDS');
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

    // 이름 검증
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return errorResponse(nameValidation.error || '이름 형식이 올바르지 않습니다.', 400, 'INVALID_NAME');
    }

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    // 이메일 중복 확인 (소문자로 정규화)
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await getUserByEmail(db, normalizedEmail);
    if (existingUser) {
      return errorResponse('이미 등록된 이메일입니다.', 409, 'DUPLICATE_EMAIL');
    }

    // 비밀번호 해싱
    const password_hash = await hashPassword(password);

    // 이름 sanitization
    const sanitizedName = sanitizeString(name, 100);

    // 사용자 생성
    const user = await createUser(db, {
      email: normalizedEmail,
      password_hash,
      name: sanitizedName,
      plan: 'trial_basic',
    });

    // 워크스페이스 자동 생성
    const workspaceName = sanitizeString(`${sanitizedName}의 워크스페이스`, 200);
    const workspace = await createWorkspace(db, user.id, workspaceName);

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
      '회원가입이 완료되었습니다.',
      201
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
    return serverErrorResponse('회원가입 중 오류가 발생했습니다.', error);
  }
}
