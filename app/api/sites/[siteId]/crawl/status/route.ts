/**
 * 크롤 작업 상태 조회 API
 * GET /api/sites/[siteId]/crawl/status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { getCrawlJobsBySiteId, getCrawlJobById } from '@/lib/db/crawl-jobs';
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
} from '@/utils/api-response';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

/**
 * 크롤 작업 상태 조회
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

    // 최신 크롤 작업 조회
    const crawlJobs = await getCrawlJobsBySiteId(db, siteId, 1);
    const latestJob = crawlJobs.length > 0 ? crawlJobs[0] : null;

    // 페이지 스냅샷 개수 조회 (진행률 계산용)
    const snapshotCount = await db
      .prepare('SELECT COUNT(*) as count FROM page_snapshots WHERE site_id = ?')
      .bind(siteId)
      .first<{ count: number }>();

    return successResponse({
      site: {
        id: site.id,
        status: site.status,
        last_crawled_at: site.last_crawled_at,
      },
      crawlJob: latestJob
        ? {
            id: latestJob.id,
            status: latestJob.status,
            started_at: latestJob.started_at,
            finished_at: latestJob.finished_at,
            error_message: latestJob.error_message,
          }
        : null,
      progress: {
        pages_crawled: snapshotCount?.count || 0,
        page_limit: site.page_limit,
      },
    });
  } catch (error) {
    return serverErrorResponse('크롤 상태 조회 중 오류가 발생했습니다.', error);
  }
}

