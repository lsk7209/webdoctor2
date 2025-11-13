/**
 * robots.txt 파싱 및 검증
 */

import robotsParser from 'robots-parser';

export interface RobotsTxtData {
  isAllowed: (path: string) => boolean;
  getCrawlDelay?: (path: string) => number | undefined;
  getSitemaps?: () => string[];
}

/**
 * robots.txt 가져오기 및 파싱
 */
export async function fetchRobotsTxt(
  baseUrl: string,
  userAgent: string = 'KoreSEO Crawler'
): Promise<RobotsTxtData | null> {
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsUrl, {
      headers: {
        'User-Agent': userAgent,
      },
    });

    if (!response.ok) {
      // robots.txt가 없으면 모든 경로 허용
      return {
        isAllowed: () => true,
        getCrawlDelay: () => undefined,
        getSitemaps: () => [],
      };
    }

    const robotsTxt = await response.text();
    const robots = robotsParser(robotsUrl, robotsTxt);

    return {
      isAllowed: (path: string) => {
        return robots.isAllowed(path, userAgent) ?? true;
      },
      getCrawlDelay: (path: string) => {
        return robots.getCrawlDelay(userAgent);
      },
      getSitemaps: () => {
        return robots.getSitemaps() || [];
      },
    };
  } catch (error) {
    console.error('Failed to fetch robots.txt:', error);
    // 에러 발생 시 모든 경로 허용
    return {
      isAllowed: () => true,
      getCrawlDelay: () => undefined,
      getSitemaps: () => [],
    };
  }
}

