/**
 * 로그아웃 API 엔드포인트
 * POST /api/auth/logout
 */

import { NextResponse } from 'next/server';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

export async function POST() {
  const response = NextResponse.json(
    { message: '로그아웃되었습니다.' },
    { status: 200 }
  );

  // 쿠키 삭제
  response.cookies.delete('auth-token');

  return response;
}
