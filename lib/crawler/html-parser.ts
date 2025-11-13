/**
 * HTML 파서
 * Cheerio를 사용하여 HTML에서 링크 및 메타 정보 추출
 */

import * as cheerio from 'cheerio';

export interface ParsedPage {
  url: string;
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  headings: Array<{ level: number; text: string }>;
  links: {
    internal: string[];
    external: string[];
  };
  images: Array<{ src: string; alt: string | null }>;
  canonical: string | null;
  noindex: boolean;
  structuredData: Array<{ type: string; data: any }>;
}

/**
 * HTML 파싱
 */
export function parseHTML(html: string, baseUrl: string): ParsedPage {
  const $ = cheerio.load(html);
  const baseUrlObj = new URL(baseUrl);

  // Title
  const title = $('title').first().text().trim() || null;

  // Meta description
  const metaDescription =
    $('meta[name="description"]').attr('content')?.trim() || null;

  // H1
  const h1 = $('h1').first().text().trim() || null;

  // Headings (H1-H6)
  const headings: Array<{ level: number; text: string }> = [];
  for (let level = 1; level <= 6; level++) {
    $(`h${level}`).each((_, el) => {
      const text = $(el).text().trim();
      if (text) {
        headings.push({ level, text });
      }
    });
  }

  // Links
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;

    try {
      const linkUrl = new URL(href, baseUrl);
      const normalizedUrl = linkUrl.toString().split('#')[0]; // Fragment 제거

      if (linkUrl.hostname === baseUrlObj.hostname) {
        if (!internalLinks.includes(normalizedUrl)) {
          internalLinks.push(normalizedUrl);
        }
      } else {
        if (!externalLinks.includes(normalizedUrl)) {
          externalLinks.push(normalizedUrl);
        }
      }
    } catch {
      // 잘못된 URL 무시
    }
  });

  // Images
  const images: Array<{ src: string; alt: string | null }> = [];
  $('img[src]').each((_, el) => {
    const src = $(el).attr('src');
    const alt = $(el).attr('alt') || null;
    if (src) {
      try {
        const imageUrl = new URL(src, baseUrl).toString();
        images.push({ src: imageUrl, alt });
      } catch {
        // 잘못된 URL 무시
      }
    }
  });

  // Canonical
  const canonical =
    $('link[rel="canonical"]').attr('href') ||
    $('meta[property="og:url"]').attr('content') ||
    null;

  // Noindex
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  const noindex = robotsMeta.toLowerCase().includes('noindex');

  // Structured Data (JSON-LD)
  const structuredData: Array<{ type: string; data: any }> = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const jsonText = $(el).html();
      if (jsonText) {
        const data = JSON.parse(jsonText);
        const type = data['@type'] || 'Unknown';
        structuredData.push({ type, data });
      }
    } catch {
      // JSON 파싱 실패 무시
    }
  });

  return {
    url: baseUrl,
    title,
    metaDescription,
    h1,
    headings,
    links: {
      internal: internalLinks,
      external: externalLinks,
    },
    images,
    canonical,
    noindex,
    structuredData,
  };
}

