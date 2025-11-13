/**
 * sitemap.xml 파싱 및 URL 추출
 * Edge Runtime 호환: 정규식 기반 파싱 사용
 */

/**
 * sitemap.xml에서 URL 목록 추출 (Edge Runtime 호환)
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
    const urls: string[] = [];

    // sitemapindex인 경우 (다른 sitemap들을 참조)
    // <sitemap><loc>...</loc></sitemap> 패턴 찾기
    const sitemapIndexRegex = /<sitemap>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/sitemap>/gi;
    const sitemapMatches = xml.matchAll(sitemapIndexRegex);
    
    const sitemapUrls: string[] = [];
    for (const match of sitemapMatches) {
      if (match[1]) {
        sitemapUrls.push(match[1].trim());
      }
    }

    // sitemapindex가 있으면 재귀적으로 파싱
    if (sitemapUrls.length > 0) {
      for (const subSitemapUrl of sitemapUrls) {
        const subUrls = await parseSitemap(subSitemapUrl);
        urls.push(...subUrls);
      }
      return urls;
    }

    // 일반 sitemap인 경우
    // <url><loc>...</loc></url> 패턴 찾기
    const urlRegex = /<url>[\s\S]*?<loc>(.*?)<\/loc>[\s\S]*?<\/url>/gi;
    const urlMatches = xml.matchAll(urlRegex);
    
    for (const match of urlMatches) {
      if (match[1]) {
        urls.push(match[1].trim());
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

