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
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { siteId } = params;

    const db = getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: '데이터베이스 연결을 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.' },
        { status: 503 }
      );
    }

    // 사이트 조회
    const site = await getSiteById(db, siteId);
    if (!site) {
      return NextResponse.json(
        { error: '사이트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 권한 확인 (워크스페이스 소유자 확인)
    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace || site.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
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
    console.error('Get site error:', error);
    return NextResponse.json(
      { error: '사이트 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { siteId } = params;

    const db = getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: '데이터베이스 연결을 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.' },
        { status: 503 }
      );
    }

    // 사이트 조회 및 권한 확인
    const site = await getSiteById(db, siteId);
    if (!site) {
      return NextResponse.json(
        { error: '사이트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace || site.workspace_id !== workspace.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 사이트 삭제
    await deleteSite(db, siteId);

    return NextResponse.json(
      { message: '사이트가 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete site error:', error);
    return NextResponse.json(
      { error: '사이트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
