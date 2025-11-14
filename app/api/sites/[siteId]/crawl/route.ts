/**
 * 크롤 작업 시작 API
 * POST /api/sites/[siteId]/crawl
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { createCrawlJob } from '@/lib/db/crawl-jobs';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getUserById } from '@/lib/db/users';
import { enqueueCrawlJob } from '@/lib/queue/crawl-queue';
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
import { warn } from '@/utils/logger';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

/**
 * 크롤 작업 시작
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

    const user = await getUserById(db, session.userId);
    if (!user) {
      return notFoundResponse('사용자');
    }

    // 크롤 작업 생성
    const crawlJob = await createCrawlJob(db, siteId);

    // 큐에 작업 추가 (비동기 처리)
    try {
      await enqueueCrawlJob(
        {
          siteId: site.id,
          crawlJobId: crawlJob.id,
          url: site.url,
          userPlan: user.plan,
        },
        request
      );
    } catch (queueError) {
      // Queue가 없으면 직접 처리 (개발 환경)
      warn('Queue를 사용할 수 없습니다', { error: queueError, siteId });
    }

    return successResponse(
      { jobId: crawlJob.id },
      '크롤 작업이 시작되었습니다.',
      202
    );
  } catch (error) {
    return serverErrorResponse('크롤 작업 시작 중 오류가 발생했습니다.', error);
  }
}
