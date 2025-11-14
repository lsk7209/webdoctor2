/**
 * 클라이언트 사이드 API 호출 유틸리티
 * 표준화된 에러 처리 및 응답 검증
 */

import type { ApiSuccess, ApiError } from './api-response';

export interface FetchOptions extends RequestInit {
  timeout?: number; // 타임아웃 (밀리초)
  retries?: number; // 재시도 횟수
}

export interface FetchResult<T = any> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
}

/**
 * 안전한 API 호출 함수
 * - JSON 파싱 에러 처리
 * - 네트워크 에러 처리
 * - 타임아웃 처리
 * - 재시도 로직
 * - 표준화된 응답 형식 검증
 */
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { timeout = 30000, retries = 0, ...fetchOptions } = options;

  // 기본 헤더 설정
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  let lastError: Error | null = null;
  let lastStatus = 0;

  // 재시도 로직
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // 타임아웃 처리
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      lastStatus = response.status;

      // JSON 파싱 시도
      let data: ApiSuccess<T> | ApiError;
      try {
        const text = await response.text();
        if (!text) {
          // 빈 응답 처리
          if (response.ok) {
            return {
              data: null as T,
              error: null,
              status: response.status,
              ok: true,
            };
          }
          return {
            data: null,
            error: '서버에서 응답이 없습니다.',
            status: response.status,
            ok: false,
          };
        }
        data = JSON.parse(text);
      } catch (parseError) {
        // JSON 파싱 실패
        if (process.env.NODE_ENV === 'development') {
          console.error('JSON 파싱 실패:', parseError);
        }
        return {
          data: null,
          error: '서버 응답 형식이 올바르지 않습니다.',
          status: response.status,
          ok: false,
        };
      }

      // 표준화된 응답 형식 검증
      if (response.ok) {
        // 성공 응답: { success: true, data: ... }
        if (data && typeof data === 'object' && 'success' in data && data.success) {
          return {
            data: (data as ApiSuccess<T>).data ?? null,
            error: null,
            status: response.status,
            ok: true,
          };
        }
        // 비표준 성공 응답 (하위 호환성)
        return {
          data: data as T,
          error: null,
          status: response.status,
          ok: true,
        };
      }

      // 에러 응답: { success: false, error: ... } 또는 { error: ... }
      const errorMessage =
        (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : null) || `요청이 실패했습니다. (${response.status})`;

      return {
        data: null,
        error: errorMessage,
        status: response.status,
        ok: false,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // AbortError (타임아웃)
      if (lastError.name === 'AbortError') {
        if (attempt < retries) {
          // 재시도 전 대기 (지수 백오프)
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        return {
          data: null,
          error: '요청 시간이 초과되었습니다.',
          status: 0,
          ok: false,
        };
      }

      // 네트워크 에러
      if (lastError.message.includes('fetch') || lastError.message.includes('network')) {
        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }
        return {
          data: null,
          error: '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.',
          status: 0,
          ok: false,
        };
      }

      // 기타 에러
      if (process.env.NODE_ENV === 'development') {
        console.error('API 호출 실패:', lastError);
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      return {
        data: null,
        error: lastError.message || '알 수 없는 오류가 발생했습니다.',
        status: lastStatus,
        ok: false,
      };
    }
  }

  // 모든 재시도 실패
  return {
    data: null,
    error: lastError?.message || '요청이 실패했습니다.',
    status: lastStatus,
    ok: false,
  };
}

/**
 * GET 요청 헬퍼
 */
export async function apiGet<T = any>(
  url: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, { ...options, method: 'GET' });
}

/**
 * POST 요청 헬퍼
 */
export async function apiPost<T = any>(
  url: string,
  body?: any,
  options?: Omit<FetchOptions, 'method'>
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH 요청 헬퍼
 */
export async function apiPatch<T = any>(
  url: string,
  body?: any,
  options?: Omit<FetchOptions, 'method'>
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 요청 헬퍼
 */
export async function apiDelete<T = any>(
  url: string,
  options?: Omit<FetchOptions, 'method' | 'body'>
): Promise<FetchResult<T>> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' });
}

