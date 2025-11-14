/**
 * SEO 감사 실행 API
 * POST /api/sites/[siteId]/audit - SEO 감사 수동 실행
 * GET /api/sites/[siteId]/audit - SEO 감사 결과 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { runSiteAudit } from '@/lib/seo/audit';
import { getIssuesBySiteId, getIssuesStatsBySiteId } from '@/lib/db/issues';
import { getD1Database } from '@/lib/cloudflare/env';
import { validateSiteId } from '@/utils/validation';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  databaseErrorResponse,
  serverErrorResponse,
  successResponse,
  errorResponse,
} from '@/utils/api-response';
import { logApiRequest, error as logError } from '@/utils/logger';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

/**
 * SEO 감사 실행 (수동)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { siteId } = params;

    // siteId 검증
    const siteIdValidation = validateSiteId(siteId);
    if (!siteIdValidation.valid) {
      return errorResponse(siteIdValidation.error || '올바르지 않은 사이트 ID 형식입니다.', 400, 'INVALID_SITE_ID');
    }

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    // 사이트 조회 및 권한 확인
    const site = await getSiteById(db, siteId);
    if (!site) {
      return notFoundResponse('사이트');
    }

    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace || site.workspace_id !== workspace.id) {
      return forbiddenResponse();
    }

    // SEO 감사 실행
    const startTime = Date.now();
    const issueCount = await runSiteAudit(db, siteId);
    const duration = Date.now() - startTime;

    logApiRequest('POST', `/api/sites/${siteId}/audit`, 200, duration, {
      siteId,
      issuesCount: issueCount,
    });

    return successResponse(
      {
        issuesCount: issueCount,
      },
      `SEO 감사가 완료되었습니다. ${issueCount}개의 이슈를 발견했습니다.`,
      200
    );
  } catch (error) {
    logError('SEO audit failed', error, { siteId: params.siteId });
    return serverErrorResponse('SEO 감사 중 오류가 발생했습니다.', error);
  }
}

/**
 * SEO 감사 결과 조회 (이슈 목록)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { siteId } = params;

    // siteId 검증
    const siteIdValidation = validateSiteId(siteId);
    if (!siteIdValidation.valid) {
      return errorResponse(siteIdValidation.error || '올바르지 않은 사이트 ID 형식입니다.', 400, 'INVALID_SITE_ID');
    }

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    // 사이트 조회 및 권한 확인
    const site = await getSiteById(db, siteId);
    if (!site) {
      return notFoundResponse('사이트');
    }

    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace || site.workspace_id !== workspace.id) {
      return forbiddenResponse();
    }

    // 쿼리 파라미터에서 필터 가져오기
    const { searchParams } = new URL(request.url);
    const filters = {
      issue_type: searchParams.get('issue_type') || undefined,
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined,
    };

    const startTime = Date.now();

    // 이슈 목록 조회 및 통계 계산 (최적화: 데이터베이스 집계 쿼리 사용)
    const [issuesResult, statsResult] = await Promise.all([
      getIssuesBySiteId(db, siteId, filters),
      getIssuesStatsBySiteId(db, siteId, { issue_type: filters.issue_type }),
    ]);

    const duration = Date.now() - startTime;
    logApiRequest('GET', `/api/sites/${siteId}/audit`, 200, duration, {
      siteId,
      issuesCount: issuesResult.issues.length,
    });

    return successResponse({
      issues: issuesResult.issues,
      stats: statsResult,
    });
  } catch (error) {
    logError('Audit results fetch failed', error, { siteId: params.siteId });
    return serverErrorResponse('이슈 목록을 불러오는 중 오류가 발생했습니다.', error);
  }
}
