/**
 * 플랜별 제약 관리
 */

import type { UserPlan } from '@/db/schema';

export interface PlanLimits {
  maxSites: number;
  maxPagesPerSite: number;
  autoAuditFrequency: 'weekly' | 'biweekly' | 'monthly';
  manualRerunLimit: number | null; // null = 무제한
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  trial_basic: {
    maxSites: 1,
    maxPagesPerSite: 500,
    autoAuditFrequency: 'weekly',
    manualRerunLimit: 1, // 주 1회
  },
  basic: {
    maxSites: 5,
    maxPagesPerSite: 2000,
    autoAuditFrequency: 'weekly',
    manualRerunLimit: 2, // 주 2회
  },
  pro: {
    maxSites: 15,
    maxPagesPerSite: 5000,
    autoAuditFrequency: 'weekly',
    manualRerunLimit: null, // 무제한
  },
  enterprise: {
    maxSites: 50,
    maxPagesPerSite: 10000,
    autoAuditFrequency: 'weekly',
    manualRerunLimit: null, // 무제한
  },
};

/**
 * 플랜 제한 조회
 */
export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan];
}

/**
 * 사이트 추가 가능 여부 확인
 */
export async function canAddSite(
  db: any, // D1Database
  workspaceId: string,
  userPlan: UserPlan
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = getPlanLimits(userPlan);

  // 워크스페이스의 현재 사이트 수 확인
  const { getSitesByWorkspaceId } = await import('@/lib/db/sites');
  const sites = await getSitesByWorkspaceId(db, workspaceId);

  if (sites.length >= limits.maxSites) {
    return {
      allowed: false,
      reason: `현재 플랜에서는 최대 ${limits.maxSites}개의 사이트만 등록할 수 있습니다.`,
    };
  }

  return { allowed: true };
}

/**
 * 크롤 재실행 가능 여부 확인
 */
export async function canRerunCrawl(
  db: any, // D1Database
  siteId: string,
  userPlan: UserPlan
): Promise<{ allowed: boolean; reason?: string }> {
  const limits = getPlanLimits(userPlan);

  if (limits.manualRerunLimit === null) {
    return { allowed: true }; // 무제한
  }

  // TODO: 지난 주 재실행 횟수 확인
  // 현재는 간단히 항상 허용
  return { allowed: true };
}

