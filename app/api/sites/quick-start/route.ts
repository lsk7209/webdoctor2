/**
 * 빠른 시작 API
 * POST /api/sites/quick-start
 * 메인 페이지에서 URL 입력 시 사이트 등록 및 크롤링 시작
 */

import { NextRequest, NextResponse } from 'next/server';
import { getD1Database } from '@/lib/cloudflare/env';
import { normalizeUrl } from '@/utils/validation';
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

    const { url } = body;

    // URL 검증 및 정규화
    const urlValidation = normalizeUrl(url);
    if (urlValidation.error) {
      return errorResponse(urlValidation.error, 400, 'INVALID_URL');
    }

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    // 임시: 익명 사용자 처리
    // 실제로는 세션 확인 후 사용자 워크스페이스 사용
    // 또는 게스트 모드로 처리
    
    // 간단한 구현: URL 기반으로 임시 워크스페이스 생성 또는 기존 사이트 확인
    // 실제로는 인증이 필요하지만, 빠른 시작을 위해 임시 처리
    
    return successResponse(
      {
        url: urlValidation.url,
        note: '로그인이 필요합니다. 로그인 후 사이트가 등록됩니다.',
      },
      '진단이 시작되었습니다.',
      202
    );
  } catch (error) {
    return serverErrorResponse('진단 시작 중 오류가 발생했습니다.', error);
  }
}

