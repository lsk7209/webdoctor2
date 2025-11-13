/**
 * Lighthouse 점수 수집을 위한 주요 페이지 선별 로직
 */

import type { PageSnapshot } from '@/db/schema';

export interface PagePriority {
  url: string;
  priority: number;
  reason: string;
}

/**
 * 페이지 우선순위 계산
 * 홈페이지, 인기 페이지, 중요한 경로 등을 우선순위로 설정
 */
export function calculatePagePriority(
  page: PageSnapshot,
  allPages: PageSnapshot[]
): PagePriority {
  const url = page.url;
  const urlObj = new URL(url);
  const path = urlObj.pathname;

  let priority = 0;
  let reason = '';

  // 홈페이지는 최우선
  if (path === '/' || path === '') {
    priority = 100;
    reason = '홈페이지';
    return { url, priority, reason };
  }

  // 링크 수가 많은 페이지 (인기 페이지)
  const linkScore = (page.links_in || 0) * 2 + (page.links_out || 0);
  priority += Math.min(linkScore, 30);
  if (linkScore > 10) {
    reason += '인기 페이지';
  }

  // 중요한 경로 패턴
  const importantPaths = [
    '/about',
    '/contact',
    '/products',
    '/services',
    '/blog',
    '/news',
    '/help',
    '/support',
  ];
  for (const importantPath of importantPaths) {
    if (path.startsWith(importantPath)) {
      priority += 20;
      if (reason) reason += ', ';
      reason += '중요 경로';
      break;
    }
  }

  // 제품/서비스 상세 페이지
  if (path.match(/\/products?\/|\/services?\/|\/items?\/|\/products?\/[^/]+$/)) {
    priority += 15;
    if (reason) reason += ', ';
    reason += '제품/서비스 페이지';
  }

  // 블로그/뉴스 포스트
  if (path.match(/\/blog\/|\/news\/|\/posts?\/|\/articles?\/|\/post\/|\/article\//)) {
    priority += 10;
    if (reason) reason += ', ';
    reason += '콘텐츠 페이지';
  }

  // SEO 메타데이터가 있는 페이지 (중요도 높음)
  if (page.title && page.meta_description) {
    priority += 5;
  }

  // 구조화 데이터가 있는 페이지
  if (page.structured_data_json) {
    try {
      const structuredData = JSON.parse(page.structured_data_json);
      if (Array.isArray(structuredData) && structuredData.length > 0) {
        priority += 5;
        if (reason) reason += ', ';
        reason += '구조화 데이터';
      }
    } catch {
      // JSON 파싱 실패 무시
    }
  }

  if (!reason) {
    reason = '일반 페이지';
  }

  return { url, priority, reason };
}

/**
 * 상위 N개 페이지 선별
 */
export function selectTopPages(
  pages: PageSnapshot[],
  limit: number = 100
): PageSnapshot[] {
  // 우선순위 계산
  const pagesWithPriority = pages.map((page) => ({
    page,
    priority: calculatePagePriority(page, pages),
  }));

  // 우선순위 순으로 정렬
  pagesWithPriority.sort((a, b) => b.priority.priority - a.priority.priority);

  // 상위 N개 선택
  return pagesWithPriority.slice(0, limit).map((item) => item.page);
}

