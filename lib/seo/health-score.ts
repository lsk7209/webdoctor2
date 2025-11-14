/**
 * 사이트 Health 점수 계산 유틸리티
 */

import type { Issue } from '@/db/schema';

export interface HealthScore {
  score: number; // 0-100
  high: number;
  medium: number;
  low: number;
  total: number;
}

/**
 * 이슈 목록으로부터 Health 점수 계산
 * @param issues 이슈 목록
 * @returns Health 점수 정보
 */
export function calculateHealthScore(issues: Issue[]): HealthScore {
  // open 상태인 이슈만 계산에 포함 (단일 순회로 최적화)
  let high = 0;
  let medium = 0;
  let low = 0;
  let total = 0;

  for (const issue of issues) {
    if (issue.status === 'open') {
      total++;
      if (issue.severity === 'high') {
        high++;
      } else if (issue.severity === 'medium') {
        medium++;
      } else if (issue.severity === 'low') {
        low++;
      }
    }
  }

  // 점수 계산: 기본 100점에서 감점
  // high: -10점, medium: -5점, low: -1점
  let score = 100;
  score -= high * 10;
  score -= medium * 5;
  score -= low * 1;

  // 최소 0점, 최대 100점으로 제한
  score = Math.max(0, Math.min(100, score));

  return {
    score: Math.round(score),
    high,
    medium,
    low,
    total,
  };
}

/**
 * Health 점수에 따른 색상 반환
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Health 점수에 따른 배경 색상 반환
 */
export function getHealthScoreBgColor(score: number): string {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-yellow-100';
  return 'bg-red-100';
}

