/**
 * 자동 감사 스케줄링 로직
 */

import type { D1Database } from '@/db/client';
import type { Site } from '@/db/schema';
import { getPlanLimits } from '@/lib/plans';
import { getCrawlJobsBySiteId } from '@/lib/db/crawl-jobs';
import { getUnixTimestamp } from '@/db/client';

/**
 * 사이트가 자동 감사를 실행해야 하는지 확인
 * @param db 데이터베이스
 * @param site 사이트 정보
 * @param userPlan 사용자 플랜
 * @returns 자동 감사 실행 여부 및 이유
 */
export async function shouldRunAutoAudit(
  db: D1Database,
  site: Site,
  userPlan: string
): Promise<{ shouldRun: boolean; reason?: string }> {
  // 사이트가 ready 상태가 아니면 실행하지 않음
  if (site.status !== 'ready') {
    return {
      shouldRun: false,
      reason: `사이트 상태가 'ready'가 아닙니다 (현재: ${site.status})`,
    };
  }

  // 플랜 제한 확인
  const limits = getPlanLimits(userPlan as any);
  const frequency = limits.autoAuditFrequency;

  // 마지막 크롤 시간 확인
  const lastCrawledAt = site.last_crawled_at;
  if (!lastCrawledAt) {
    // 크롤 기록이 없으면 실행
    return { shouldRun: true, reason: '크롤 기록이 없습니다' };
  }

  const now = getUnixTimestamp();
  const daysSinceLastCrawl = (now - lastCrawledAt) / (24 * 60 * 60);

  // 플랜별 주기 확인
  switch (frequency) {
    case 'weekly':
      if (daysSinceLastCrawl >= 7) {
        return { shouldRun: true, reason: '주간 감사 주기 도달 (7일 경과)' };
      }
      break;
    case 'biweekly':
      if (daysSinceLastCrawl >= 14) {
        return { shouldRun: true, reason: '격주 감사 주기 도달 (14일 경과)' };
      }
      break;
    case 'monthly':
      if (daysSinceLastCrawl >= 30) {
        return { shouldRun: true, reason: '월간 감사 주기 도달 (30일 경과)' };
      }
      break;
  }

  return {
    shouldRun: false,
    reason: `마지막 크롤 이후 ${Math.floor(daysSinceLastCrawl)}일 경과 (주기: ${frequency})`,
  };
}

/**
 * 사이트의 최근 크롤 작업 상태 확인
 */
export async function getRecentCrawlStatus(
  db: D1Database,
  siteId: string
): Promise<{
  lastCompletedAt: number | null;
  hasRunningJob: boolean;
  hasFailedJob: boolean;
}> {
  const recentJobs = await getCrawlJobsBySiteId(db, siteId, 5);

  const completedJobs = recentJobs.filter((j) => j.status === 'completed');
  const runningJobs = recentJobs.filter((j) => j.status === 'running');
  const failedJobs = recentJobs.filter((j) => j.status === 'failed');

  return {
    lastCompletedAt: completedJobs[0]?.finished_at || null,
    hasRunningJob: runningJobs.length > 0,
    hasFailedJob: failedJobs.length > 0,
  };
}

