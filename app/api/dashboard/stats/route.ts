/**
 * 대시보드 통계 API 엔드포인트
 * GET /api/dashboard/stats - 전체 통계 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getSitesByWorkspaceId } from '@/lib/db/sites';
import { getIssuesStatsByWorkspaceId, getIssuesBySiteIds } from '@/lib/db/issues';
import { getD1Database } from '@/lib/cloudflare/env';
import { calculateHealthScore } from '@/lib/seo/health-score';
import {
  unauthorizedResponse,
  databaseErrorResponse,
  serverErrorResponse,
  successResponse,
} from '@/utils/api-response';

export const runtime = 'edge';

/**
 * 대시보드 통계 조회
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 25 * 1000; // 25초 타임아웃

  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace) {
      return unauthorizedResponse();
    }

    // 사이트 목록 조회
    const sites = await getSitesByWorkspaceId(db, workspace.id);

    // 타임아웃 체크
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      console.warn('Dashboard stats API timeout approaching');
      return successResponse({
        sites: { total: sites.length, ready: 0, crawling: 0, pending: 0, failed: 0 },
        issues: { total: 0, high: 0, medium: 0, low: 0 },
        healthScore: null,
      });
    }

    // 전체 통계 계산 (최적화: 데이터베이스 집계 쿼리 사용)
    const totalSites = sites.length;
    const readySites = sites.filter((s) => s.status === 'ready').length;
    const crawlingSites = sites.filter((s) => s.status === 'crawling').length;
    const pendingSites = sites.filter((s) => s.status === 'pending').length;
    const failedSites = sites.filter((s) => s.status === 'failed').length;

    // 이슈 통계 (최적화: 데이터베이스 집계 쿼리 사용)
    const allIssuesStats = await getIssuesStatsByWorkspaceId(db, workspace.id);
    // 열린 이슈만 계산 (open + in_progress)
    const totalIssues = allIssuesStats.open + allIssuesStats.in_progress;
    const highIssues = allIssuesStats.high;
    const mediumIssues = allIssuesStats.medium;
    const lowIssues = allIssuesStats.low;

    // 사이트별 Health 점수 계산 (최적화: ready 상태인 사이트의 이슈만 조회)
    const readySiteIds = sites.filter((s) => s.status === 'ready').map((s) => s.id);
    const issuesBySiteId = await getIssuesBySiteIds(db, readySiteIds);
    
    const siteHealthScores: Array<{ siteId: string; score: number }> = [];
    for (const siteId of readySiteIds) {
      const siteIssues = issuesBySiteId.get(siteId) || [];
      const healthScore = calculateHealthScore(siteIssues);
      siteHealthScores.push({ siteId, score: healthScore.score });
    }

    // 평균 Health 점수 계산
    const averageHealthScore =
      siteHealthScores.length > 0
        ? Math.round(
            siteHealthScores.reduce((sum, s) => sum + s.score, 0) / siteHealthScores.length
          )
        : null;

    const duration = Date.now() - startTime;
    console.log(`GET /api/dashboard/stats completed in ${duration}ms`);

    return successResponse({
      sites: {
        total: totalSites,
        ready: readySites,
        crawling: crawlingSites,
        pending: pendingSites,
        failed: failedSites,
      },
      issues: {
        total: totalIssues,
        high: highIssues,
        medium: mediumIssues,
        low: lowIssues,
      },
      healthScore: averageHealthScore,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`GET /api/dashboard/stats failed after ${duration}ms:`, error);
    return serverErrorResponse('대시보드 통계를 불러오는 중 오류가 발생했습니다.', error);
  }
}

