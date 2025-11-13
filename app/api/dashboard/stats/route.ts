/**
 * 대시보드 통계 API 엔드포인트
 * GET /api/dashboard/stats - 전체 통계 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getSitesByWorkspaceId } from '@/lib/db/sites';
import { getIssuesByWorkspaceId } from '@/lib/db/issues';
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

    // 모든 이슈 조회
    const allIssues = await getIssuesByWorkspaceId(db, workspace.id);

    // 전체 통계 계산
    const totalSites = sites.length;
    const readySites = sites.filter((s) => s.status === 'ready').length;
    const crawlingSites = sites.filter((s) => s.status === 'crawling').length;
    const pendingSites = sites.filter((s) => s.status === 'pending').length;
    const failedSites = sites.filter((s) => s.status === 'failed').length;

    // 이슈 통계
    const openIssues = allIssues.filter(
      (i) => i.status === 'open' || i.status === 'in_progress'
    );
    const totalIssues = openIssues.length;
    const highIssues = openIssues.filter((i) => i.severity === 'high').length;
    const mediumIssues = openIssues.filter((i) => i.severity === 'medium').length;
    const lowIssues = openIssues.filter((i) => i.severity === 'low').length;

    // 사이트별 Health 점수 계산
    const siteHealthScores: Array<{ siteId: string; score: number }> = [];
    for (const site of sites) {
      if (site.status === 'ready') {
        const siteIssues = allIssues.filter((i) => i.site_id === site.id);
        const healthScore = calculateHealthScore(siteIssues);
        siteHealthScores.push({ siteId: site.id, score: healthScore.score });
      }
    }

    // 평균 Health 점수 계산
    const averageHealthScore =
      siteHealthScores.length > 0
        ? Math.round(
            siteHealthScores.reduce((sum, s) => sum + s.score, 0) / siteHealthScores.length
          )
        : null;

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
    return serverErrorResponse('대시보드 통계를 불러오는 중 오류가 발생했습니다.', error);
  }
}

