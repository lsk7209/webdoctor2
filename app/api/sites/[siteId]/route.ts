/**
 * 사이트 상세 API 엔드포인트
 * GET /api/sites/[siteId] - 사이트 상세 조회
 * DELETE /api/sites/[siteId] - 사이트 삭제
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById, deleteSite } from '@/lib/db/sites';
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
 * 사이트 상세 조회
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

    // 사이트 조회
    const site = await getSiteById(db, siteId);
    if (!site) {
      return notFoundResponse('사이트');
    }

    // 권한 확인 (워크스페이스 소유자 확인)
    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace || site.workspace_id !== workspace.id) {
      return forbiddenResponse();
    }

    return successResponse({
      site: {
        id: site.id,
        url: site.url,
        display_name: site.display_name,
        status: site.status,
        last_crawled_at: site.last_crawled_at,
        page_limit: site.page_limit,
        gsc_connected: site.gsc_connected,
        ga_connected: site.ga_connected,
        naver_connected: site.naver_connected,
        created_at: site.created_at,
      },
    });
  } catch (error) {
    return serverErrorResponse('사이트 정보를 불러오는 중 오류가 발생했습니다.', error);
  }
}

/**
 * 사이트 삭제
 */
export async function DELETE(
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

    // 사이트 삭제
    await deleteSite(db, siteId);

    return successResponse(undefined, '사이트가 삭제되었습니다.');
  } catch (error) {
    return serverErrorResponse('사이트 삭제 중 오류가 발생했습니다.', error);
  }
}
