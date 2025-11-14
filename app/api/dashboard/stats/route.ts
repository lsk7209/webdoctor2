/**
 * 대시보드 통계 API 엔드포인트
 * GET /api/dashboard/stats - 전체 통계 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getSitesByWorkspaceId } from '@/lib/db/sites';
import { getIssuesStatsByWorkspaceId, getIssuesBySiteIds } from '@/lib/db/issues';
import { getSitesStatusStatsByWorkspaceId } from '@/lib/db/issues';
import { getD1Database } from '@/lib/cloudflare/env';
import { calculateHealthScore } from '@/lib/seo/health-score';
import {
  unauthorizedResponse,
  databaseErrorResponse,
  serverErrorResponse,
  successResponse,
} from '@/utils/api-response';
import { logApiRequest, warn, error as logError } from '@/utils/logger';

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

    // 사이트 상태 통계 조회 (최적화: 데이터베이스 집계 쿼리 사용)
    const sitesStats = await getSitesStatusStatsByWorkspaceId(db, workspace.id);

    // 타임아웃 체크
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      warn('Dashboard stats API timeout approaching', { duration: Date.now() - startTime });
      return successResponse({
        sites: sitesStats,
        issues: { total: 0, high: 0, medium: 0, low: 0 },
        healthScore: null,
      });
    }

    // Health 점수 계산을 위해 ready 상태인 사이트 목록만 조회
    const sites = await getSitesByWorkspaceId(db, workspace.id);
    const readySites = sites.filter((s) => s.status === 'ready');

    // 이슈 통계 (최적화: 데이터베이스 집계 쿼리 사용)
    const allIssuesStats = await getIssuesStatsByWorkspaceId(db, workspace.id);
    // 열린 이슈만 계산 (open + in_progress)
    const totalIssues = allIssuesStats.open + allIssuesStats.in_progress;
    const highIssues = allIssuesStats.high;
    const mediumIssues = allIssuesStats.medium;
    const lowIssues = allIssuesStats.low;

    // 사이트별 Health 점수 계산 (최적화: ready 상태인 사이트의 이슈만 조회)
    const readySiteIds = readySites.map((s) => s.id);
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
    logApiRequest('GET', '/api/dashboard/stats', 200, duration, {
      sitesCount: sitesStats.total,
      issuesCount: totalIssues,
    });

    return successResponse({
      sites: sitesStats,
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
    logError('Dashboard stats API failed', error, { duration });
    return serverErrorResponse('대시보드 통계를 불러오는 중 오류가 발생했습니다.', error);
  }
}

