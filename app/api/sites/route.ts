/**
 * 사이트 관리 API 엔드포인트
 * GET /api/sites - 사이트 목록 조회
 * POST /api/sites - 사이트 등록
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getSitesByWorkspaceId, createSite, getSiteByUrl } from '@/lib/db/sites';
import { canAddSite, getPlanLimits } from '@/lib/plans';
import { getUserById } from '@/lib/db/users';
import { getD1Database } from '@/lib/cloudflare/env';
import { normalizeUrl, sanitizeString } from '@/utils/validation';
import { createCrawlJob } from '@/lib/db/crawl-jobs';
import { enqueueCrawlJob } from '@/lib/queue/crawl-queue';
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
 * 사이트 목록 조회
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

    // 사용자 정보 조회
    const user = await getUserById(db, session.userId);
    if (!user) {
      return notFoundResponse('사용자');
    }

    // 워크스페이스 조회
    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace) {
      return notFoundResponse('워크스페이스');
    }

    // 사이트 목록 조회
    const sites = await getSitesByWorkspaceId(db, workspace.id);

    return successResponse({
      sites: sites.map((site) => ({
        id: site.id,
        url: site.url,
        display_name: site.display_name,
        status: site.status,
        last_crawled_at: site.last_crawled_at,
        created_at: site.created_at,
      })),
    });
  } catch (error) {
    return serverErrorResponse('사이트 목록을 불러오는 중 오류가 발생했습니다.', error);
  }
}

/**
 * 사이트 등록
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    // JSON 파싱 에러 처리
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse('요청 본문을 파싱할 수 없습니다.', 400, 'INVALID_JSON');
    }

    const { url, display_name } = body;

    // URL 검증 및 정규화
    const urlValidation = normalizeUrl(url);
    if (urlValidation.error) {
      return errorResponse(urlValidation.error, 400, 'INVALID_URL');
    }

    // display_name 정규화 (선택사항)
    const sanitizedDisplayName = display_name
      ? sanitizeString(display_name, 200)
      : undefined;

    const db = getD1Database(request);
    if (!db) {
      return databaseErrorResponse();
    }

    // 사용자 정보 조회
    const user = await getUserById(db, session.userId);
    if (!user) {
      return notFoundResponse('사용자');
    }

    // 워크스페이스 조회
    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace) {
      return notFoundResponse('워크스페이스');
    }

    // 플랜 제한 확인
    const canAdd = await canAddSite(db, workspace.id, user.plan);
    if (!canAdd.allowed) {
      return forbiddenResponse(canAdd.reason);
    }

    // URL 중복 확인
    const existingSite = await getSiteByUrl(db, workspace.id, urlValidation.url);
    if (existingSite) {
      return errorResponse('이미 등록된 사이트입니다.', 409, 'DUPLICATE_SITE');
    }

    // 사이트 생성
    const limits = getPlanLimits(user.plan);
    const site = await createSite(db, {
      workspace_id: workspace.id,
      url: urlValidation.url,
      display_name: sanitizedDisplayName,
      page_limit: limits.maxPagesPerSite,
    });

    // 크롤 작업 생성 및 시작
    let crawlJobId: string | null = null;
    try {
      const crawlJob = await createCrawlJob(db, site.id);
      crawlJobId = crawlJob.id;

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
        console.warn('Queue를 사용할 수 없습니다:', queueError);
        // 개발 환경에서는 직접 처리하거나 경고만 표시
      }
    } catch (crawlError) {
      // 크롤 작업 생성 실패는 사이트 등록을 막지 않음
      console.error('크롤 작업 생성 실패:', crawlError);
    }

    return successResponse(
      {
        site: {
          id: site.id,
          url: site.url,
          display_name: site.display_name,
          status: site.status,
        },
        crawlJobId,
      },
      '사이트가 등록되었습니다. 크롤링이 시작되었습니다.',
      201
    );
  } catch (error) {
    return serverErrorResponse('사이트 등록 중 오류가 발생했습니다.', error);
  }
}
