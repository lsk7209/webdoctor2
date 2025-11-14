/**
 * 이슈 관리 API 엔드포인트
 * GET /api/sites/[siteId]/issues - 이슈 목록 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { getIssuesBySiteId, updateIssueStatus } from '@/lib/db/issues';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
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

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

/**
 * 이슈 목록 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  const startTime = Date.now();
  const MAX_EXECUTION_TIME = 25 * 1000; // 25초 타임아웃

  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { siteId } = params;

    // siteId 검증
    const siteIdValidation = validateSiteId(siteId);
    if (!siteIdValidation.valid) {
      return NextResponse.json(
        { error: siteIdValidation.error },
        { status: 400 }
      );
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

    // 쿼리 파라미터에서 필터 및 페이지네이션 가져오기
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100); // 최대 100개
    const offset = (page - 1) * limit;

    const filters = {
      issue_type: searchParams.get('issue_type') || undefined,
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined,
      limit,
      offset,
    };

    // 이슈 목록 조회 (페이지네이션 포함)
    const { issues, total } = await getIssuesBySiteId(db, siteId, filters);

    // 타임아웃 체크
    if (Date.now() - startTime > MAX_EXECUTION_TIME) {
      console.warn('Issues API timeout approaching, returning partial results');
      return successResponse({
        issues,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          open: 0,
          in_progress: 0,
          resolved: 0,
        },
      });
    }

    // 전체 통계 계산을 위해 필터 없이 조회 (최적화: 필요한 필드만)
    const { issues: allIssues } = await getIssuesBySiteId(db, siteId, { limit: 999999 });
    const stats = {
      total: allIssues.length,
      high: allIssues.filter((i) => i.severity === 'high').length,
      medium: allIssues.filter((i) => i.severity === 'medium').length,
      low: allIssues.filter((i) => i.severity === 'low').length,
      open: allIssues.filter((i) => i.status === 'open').length,
      in_progress: allIssues.filter((i) => i.status === 'in_progress').length,
      resolved: allIssues.filter((i) => i.status === 'resolved').length,
    };

    const duration = Date.now() - startTime;
    console.log(`GET /api/sites/${siteId}/issues completed in ${duration}ms`);

    return successResponse({
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`GET /api/sites/${params.siteId}/issues failed after ${duration}ms:`, error);
    return serverErrorResponse('이슈 목록을 불러오는 중 오류가 발생했습니다.', error);
  }
}

