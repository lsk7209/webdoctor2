/**
 * sitemap.xml 파싱 및 URL 추출
 */

import { SitemapStream, streamToPromise } from 'sitemap';
import { parseStringPromise } from 'xml2js';

/**
 * sitemap.xml에서 URL 목록 추출
 */
export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  try {
    const response = await fetch(sitemapUrl, {
      headers: {
        'User-Agent': 'KoreSEO Crawler',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml);

    const urls: string[] = [];

    // sitemapindex인 경우 (다른 sitemap들을 참조)
    if (result.sitemapindex) {
      const sitemaps = result.sitemapindex.sitemap || [];
      for (const sitemap of sitemaps) {
        if (sitemap.loc && sitemap.loc[0]) {
          // 재귀적으로 하위 sitemap 파싱
          const subUrls = await parseSitemap(sitemap.loc[0]);
          urls.push(...subUrls);
        }
      }
      return urls;
    }

    // 일반 sitemap인 경우
    if (result.urlset && result.urlset.url) {
      for (const url of result.urlset.url) {
        if (url.loc && url.loc[0]) {
          urls.push(url.loc[0]);
        }
      }
    }

    return urls;
  } catch (error) {
    console.error('Failed to parse sitemap:', error);
    return [];
  }
}

/**
 * sitemap.xml URL 찾기 (robots.txt 또는 기본 경로)
 */
export async function findSitemapUrls(baseUrl: string): Promise<string[]> {
  const sitemapUrls: string[] = [];

  // 1. robots.txt에서 sitemap URL 찾기
  const { fetchRobotsTxt } = await import('./robots');
  const robots = await fetchRobotsTxt(baseUrl);
  if (robots?.getSitemaps) {
    const sitemaps = robots.getSitemaps();
    sitemapUrls.push(...sitemaps);
  }

  // 2. 기본 sitemap 경로 시도
  const defaultSitemaps = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
  ];

  for (const path of defaultSitemaps) {
    try {
      const sitemapUrl = new URL(path, baseUrl).toString();
      const response = await fetch(sitemapUrl, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'KoreSEO Crawler',
        },
      });
      if (response.ok) {
        sitemapUrls.push(sitemapUrl);
        break; // 첫 번째 유효한 sitemap만 사용
      }
    } catch {
      // 무시하고 다음 경로 시도
    }
  }

  return sitemapUrls;
}

