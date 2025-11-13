/**
 * 기본 SEO 감사 룰 세트
 */

import type { RuleContext, Issue, IssueSeverity } from './types';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * Missing Title 룰
 * title 태그가 없거나 비어있는 경우
 */
export async function checkMissingTitle(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  for (const page of context.pageSnapshots) {
    if (!page.title || page.title.trim().length === 0) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: page.url,
        issue_type: 'missing_title',
        severity: 'high',
        status: 'open',
        summary: '페이지에 title 태그가 없습니다',
        description: `페이지 "${page.url}"에 title 태그가 없거나 비어있습니다. 검색 엔진이 페이지를 제대로 인덱싱하지 못할 수 있습니다.`,
        fix_hint: '<title>태그를 추가하고 페이지를 설명하는 제목을 입력하세요. 권장 길이: 45-60자',
        affected_pages_count: 1,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return issues;
}

/**
 * Duplicate Title 룰
 * 동일한 title을 가진 페이지가 여러 개인 경우
 */
export async function checkDuplicateTitle(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  // title별로 그룹화
  const titleMap = new Map<string, string[]>();
  for (const page of context.pageSnapshots) {
    if (page.title && page.title.trim().length > 0) {
      const normalizedTitle = page.title.trim().toLowerCase();
      if (!titleMap.has(normalizedTitle)) {
        titleMap.set(normalizedTitle, []);
      }
      titleMap.get(normalizedTitle)!.push(page.url);
    }
  }

  // 중복된 title 찾기
  for (const [title, urls] of titleMap.entries()) {
    if (urls.length > 1) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: null, // 여러 페이지에 영향
        issue_type: 'duplicate_title',
        severity: 'medium',
        status: 'open',
        summary: `동일한 title을 가진 페이지가 ${urls.length}개 있습니다`,
        description: `다음 페이지들이 동일한 title "${title}"을 사용하고 있습니다: ${urls.slice(0, 5).join(', ')}${urls.length > 5 ? '...' : ''}`,
        fix_hint: '각 페이지마다 고유하고 설명적인 title을 사용하세요. 검색 엔진이 페이지를 구분할 수 있도록 도와줍니다.',
        affected_pages_count: urls.length,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return issues;
}

/**
 * Short or Long Description 룰
 * meta description이 너무 짧거나 긴 경우
 */
export async function checkDescriptionLength(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  for (const page of context.pageSnapshots) {
    if (!page.meta_description) {
      continue; // missing_description은 별도 룰에서 처리
    }

    const length = page.meta_description.trim().length;
    if (length < 50) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: page.url,
        issue_type: 'short_description',
        severity: 'medium',
        status: 'open',
        summary: 'meta description이 너무 짧습니다',
        description: `페이지 "${page.url}"의 meta description이 ${length}자로 너무 짧습니다. 검색 결과에서 클릭률에 영향을 줄 수 있습니다.`,
        fix_hint: 'meta description을 80-160자 사이로 작성하세요. 페이지 내용을 요약하고 사용자를 유도하는 문구를 포함하세요.',
        affected_pages_count: 1,
        created_at: now,
        updated_at: now,
      });
    } else if (length > 160) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: page.url,
        issue_type: 'long_description',
        severity: 'low',
        status: 'open',
        summary: 'meta description이 너무 깁니다',
        description: `페이지 "${page.url}"의 meta description이 ${length}자로 너무 깁니다. 검색 결과에서 잘릴 수 있습니다.`,
        fix_hint: 'meta description을 160자 이하로 줄이세요. 핵심 내용만 포함하도록 요약하세요.',
        affected_pages_count: 1,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return issues;
}

/**
 * No H1 룰
 * H1 태그가 없는 경우
 */
export async function checkNoH1(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  for (const page of context.pageSnapshots) {
    if (!page.h1 || page.h1.trim().length === 0) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: page.url,
        issue_type: 'no_h1',
        severity: 'high',
        status: 'open',
        summary: '페이지에 H1 태그가 없습니다',
        description: `페이지 "${page.url}"에 H1 태그가 없습니다. H1은 페이지의 주요 제목을 나타내며 SEO에 중요합니다.`,
        fix_hint: '페이지의 주요 제목을 H1 태그로 감싸세요. 각 페이지에는 하나의 H1만 있어야 합니다.',
        affected_pages_count: 1,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return issues;
}

/**
 * Multiple H1 룰
 * H1 태그가 여러 개인 경우
 */
export async function checkMultipleH1(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  for (const page of context.pageSnapshots) {
    if (!page.headings_json) continue;

    try {
      const headings = JSON.parse(page.headings_json) as Array<{ level: number; text: string }>;
      const h1Count = headings.filter((h) => h.level === 1).length;

      if (h1Count > 1) {
        issues.push({
          id: generateId(),
          site_id: context.siteId,
          page_url: page.url,
          issue_type: 'multiple_h1',
          severity: 'medium',
          status: 'open',
          summary: `페이지에 H1 태그가 ${h1Count}개 있습니다`,
          description: `페이지 "${page.url}"에 H1 태그가 ${h1Count}개 있습니다. 각 페이지에는 하나의 H1만 있어야 합니다.`,
          fix_hint: '하나의 H1만 남기고 나머지는 H2나 H3로 변경하세요. H1은 페이지의 주요 제목을 나타냅니다.',
          affected_pages_count: 1,
          created_at: now,
          updated_at: now,
        });
      }
    } catch {
      // JSON 파싱 실패 무시
    }
  }

  return issues;
}

/**
 * Broken Internal Link 룰
 * 내부 링크가 4xx/5xx 오류를 반환하는 경우
 */
export async function checkBrokenInternalLinks(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  // 4xx/5xx 오류 페이지 찾기
  const brokenPages = context.pageSnapshots.filter(
    (page) => page.http_status && (page.http_status >= 400 && page.http_status < 600)
  );

  if (brokenPages.length > 0) {
    // 이 페이지들을 참조하는 페이지 찾기
    const brokenUrls = new Set(brokenPages.map((p) => p.url));

    for (const page of context.pageSnapshots) {
      // 이 페이지가 깨진 링크를 참조하는지 확인
      // 실제로는 links_in 데이터를 확인해야 하지만, 간단히 http_status로 판단
      if (page.http_status && brokenUrls.has(page.url)) {
        issues.push({
          id: generateId(),
          site_id: context.siteId,
          page_url: page.url,
          issue_type: 'broken_internal_link',
          severity: 'high',
          status: 'open',
          summary: `깨진 내부 링크: HTTP ${page.http_status}`,
          description: `페이지 "${page.url}"가 HTTP ${page.http_status} 오류를 반환합니다. 이 페이지를 참조하는 다른 페이지의 링크가 깨져있을 수 있습니다.`,
          fix_hint: '페이지를 복구하거나, 다른 페이지로 리다이렉트하거나, 참조하는 링크를 제거하세요.',
          affected_pages_count: 1,
          created_at: now,
          updated_at: now,
        });
      }
    }
  }

  return issues;
}

/**
 * No Canonical on Parameterized URL 룰
 * 파라미터가 있는 URL에 canonical이 없는 경우
 */
export async function checkCanonicalOnParameterized(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  for (const page of context.pageSnapshots) {
    const url = new URL(page.url);
    const hasParameters = url.search.length > 0;

    if (hasParameters && !page.canonical) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: page.url,
        issue_type: 'no_canonical_on_parameterized',
        severity: 'medium',
        status: 'open',
        summary: '파라미터가 있는 URL에 canonical 태그가 없습니다',
        description: `페이지 "${page.url}"에 URL 파라미터가 있지만 canonical 태그가 없습니다. 중복 콘텐츠 문제가 발생할 수 있습니다.`,
        fix_hint: 'canonical 태그를 추가하여 정규 URL을 지정하세요. 예: <link rel="canonical" href="https://example.com/page" />',
        affected_pages_count: 1,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return issues;
}

/**
 * Slow Page 룰
 * Lighthouse performance 점수가 낮은 경우
 */
export async function checkSlowPage(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  for (const page of context.pageSnapshots) {
    if (!page.lighthouse_score_json) continue;

    try {
      const scores = JSON.parse(page.lighthouse_score_json) as {
        performance?: number;
        seo?: number;
      };

      if (scores.performance !== undefined && scores.performance < 50) {
        issues.push({
          id: generateId(),
          site_id: context.siteId,
          page_url: page.url,
          issue_type: 'slow_page',
          severity: 'medium',
          status: 'open',
          summary: `페이지 성능 점수가 낮습니다 (${Math.round(scores.performance)})`,
          description: `페이지 "${page.url}"의 Lighthouse 성능 점수가 ${Math.round(scores.performance)}점입니다. 페이지 로딩 속도가 느려 사용자 경험과 SEO에 영향을 줄 수 있습니다.`,
          fix_hint: '이미지 최적화, 코드 분할, 캐싱 등을 통해 페이지 성능을 개선하세요.',
          affected_pages_count: 1,
          created_at: now,
          updated_at: now,
        });
      }
    } catch {
      // JSON 파싱 실패 무시
    }
  }

  return issues;
}

/**
 * No Structured Data 룰
 * 블로그/가이드 타입 콘텐츠에 구조화 데이터가 없는 경우
 */
export async function checkNoStructuredData(context: RuleContext): Promise<Issue[]> {
  const issues: Issue[] = [];
  const now = getUnixTimestamp();

  // 간단한 휴리스틱: 블로그/가이드 페이지 감지
  const blogKeywords = ['blog', 'post', 'article', 'guide', 'tutorial'];
  
  for (const page of context.pageSnapshots) {
    const urlLower = page.url.toLowerCase();
    const isBlogPage = blogKeywords.some((keyword) => urlLower.includes(keyword));

    if (isBlogPage && (!page.structured_data_json || page.structured_data_json === '[]')) {
      issues.push({
        id: generateId(),
        site_id: context.siteId,
        page_url: page.url,
        issue_type: 'no_structured_data',
        severity: 'low',
        status: 'open',
        summary: '블로그/가이드 페이지에 구조화 데이터가 없습니다',
        description: `페이지 "${page.url}"가 블로그나 가이드 콘텐츠로 보이지만 구조화 데이터(JSON-LD)가 없습니다.`,
        fix_hint: 'BlogPosting 또는 Article 스키마를 추가하여 검색 엔진이 콘텐츠를 더 잘 이해할 수 있도록 하세요.',
        affected_pages_count: 1,
        created_at: now,
        updated_at: now,
      });
    }
  }

  return issues;
}

