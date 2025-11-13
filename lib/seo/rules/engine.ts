/**
 * SEO 감사 룰 엔진
 * 모든 룰을 실행하고 이슈를 수집
 */

import type { RuleContext, RuleFunction, Issue } from './types';
import {
  checkMissingTitle,
  checkDuplicateTitle,
  checkDescriptionLength,
  checkMissingDescription,
  checkNoH1,
  checkMultipleH1,
  checkBrokenInternalLinks,
  checkCanonicalOnParameterized,
  checkSlowPage,
  checkLowSeoScore,
  checkNoStructuredData,
  checkPoorHeadingStructure,
  checkMissingOpenGraph,
} from './base-rules';

/**
 * 모든 기본 룰 목록
 */
const BASE_RULES: RuleFunction[] = [
  checkMissingTitle,
  checkDuplicateTitle,
  checkDescriptionLength,
  checkMissingDescription,
  checkNoH1,
  checkMultipleH1,
  checkBrokenInternalLinks,
  checkCanonicalOnParameterized,
  checkSlowPage,
  checkLowSeoScore,
  checkNoStructuredData,
  checkPoorHeadingStructure,
  checkMissingOpenGraph,
];

/**
 * 룰 엔진 실행
 */
export async function runAuditRules(context: RuleContext): Promise<Issue[]> {
  const allIssues: Issue[] = [];

  // 모든 룰 실행
  for (const rule of BASE_RULES) {
    try {
      const issues = await rule(context);
      allIssues.push(...issues);
    } catch (error) {
      console.error(`Rule execution failed:`, error);
      // 룰 실행 실패해도 계속 진행
    }
  }

  // 중복 제거 (동일한 페이지의 동일한 이슈 타입)
  const uniqueIssues = deduplicateIssues(allIssues);

  return uniqueIssues;
}

/**
 * 중복 이슈 제거
 */
function deduplicateIssues(issues: Issue[]): Issue[] {
  const seen = new Set<string>();
  const unique: Issue[] = [];

  for (const issue of issues) {
    const key = `${issue.site_id}-${issue.issue_type}-${issue.page_url || 'global'}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(issue);
    }
  }

  return unique;
}

/**
 * 룰 확장: 커스텀 룰 추가
 */
export function addCustomRule(rule: RuleFunction): void {
  BASE_RULES.push(rule);
}

