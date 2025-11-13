/**
 * 페이지 페처
 * HTTP 요청 및 HTML 가져오기
 */

export interface FetchOptions {
  userAgent?: string;
  timeout?: number;
  retries?: number;
}

export interface FetchResult {
  url: string;
  statusCode: number;
  html?: string;
  headers?: Record<string, string>;
  error?: string;
}

/**
 * 페이지 페치
 */
export async function fetchPage(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult> {
  const {
    userAgent = 'KoreSEO Crawler',
    timeout = 30000,
    retries = 3,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const statusCode = response.status;

      // 성공적인 응답만 HTML 파싱
      if (statusCode >= 200 && statusCode < 300) {
        const html = await response.text();
        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        return {
          url,
          statusCode,
          html,
          headers,
        };
      }

      // 리다이렉트 처리
      if (statusCode >= 300 && statusCode < 400) {
        const location = response.headers.get('location');
        if (location) {
          const redirectUrl = new URL(location, url).toString();
          return fetchPage(redirectUrl, options);
        }
      }

      // 실패 응답
      return {
        url,
        statusCode,
        error: `HTTP ${statusCode}`,
      };
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries - 1) {
        // 재시도 전 대기
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return {
    url,
    statusCode: 0,
    error: lastError?.message || 'Unknown error',
  };
}

