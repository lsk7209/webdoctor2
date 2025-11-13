/**
 * API 응답 형식 표준화
 */

import { NextResponse } from 'next/server';

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiSuccess<T = any> {
  message?: string;
  data?: T;
}

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data?: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccess<T>> {
  return NextResponse.json(
    {
      ...(message && { message }),
      ...(data && { data }),
    },
    { status }
  );
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  error: string,
  status: number = 400,
  code?: string,
  details?: Record<string, any>
): NextResponse<ApiError> {
  return NextResponse.json(
    {
      error,
      ...(code && { code }),
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * 인증 에러 응답
 */
export function unauthorizedResponse(message: string = '인증이 필요합니다.'): NextResponse<ApiError> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * 권한 에러 응답
 */
export function forbiddenResponse(message: string = '권한이 없습니다.'): NextResponse<ApiError> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * 찾을 수 없음 에러 응답
 */
export function notFoundResponse(resource: string = '리소스'): NextResponse<ApiError> {
  return errorResponse(`${resource}를 찾을 수 없습니다.`, 404, 'NOT_FOUND');
}

/**
 * 서버 에러 응답
 */
export function serverErrorResponse(
  message: string = '서버 오류가 발생했습니다.',
  error?: unknown
): NextResponse<ApiError> {
  console.error('Server error:', error);
  return errorResponse(message, 500, 'INTERNAL_SERVER_ERROR');
}

/**
 * 데이터베이스 연결 에러 응답
 */
export function databaseErrorResponse(): NextResponse<ApiError> {
  return errorResponse(
    '데이터베이스 연결을 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.',
    503,
    'DATABASE_UNAVAILABLE'
  );
}

