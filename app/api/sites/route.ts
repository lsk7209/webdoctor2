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

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

/**
 * 사이트 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const db = getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: '데이터베이스 연결을 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.' },
        { status: 503 }
      );
    }

    // 사용자 정보 조회
    const user = await getUserById(db, session.userId);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 워크스페이스 조회
    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace) {
      return NextResponse.json(
        { error: '워크스페이스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사이트 목록 조회
    const sites = await getSitesByWorkspaceId(db, workspace.id);

    return NextResponse.json({
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
    console.error('Get sites error:', error);
    return NextResponse.json(
      { error: '사이트 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * 사이트 등록
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, display_name } = body;

    // 입력 검증
    if (!url) {
      return NextResponse.json(
        { error: '사이트 URL을 입력해주세요.' },
        { status: 400 }
      );
    }

    const db = getD1Database();
    if (!db) {
      return NextResponse.json(
        { error: '데이터베이스 연결을 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.' },
        { status: 503 }
      );
    }

    // 사용자 정보 조회
    const user = await getUserById(db, session.userId);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 워크스페이스 조회
    const workspace = await getWorkspaceByOwnerId(db, session.userId);
    if (!workspace) {
      return NextResponse.json(
        { error: '워크스페이스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 플랜 제한 확인
    const canAdd = await canAddSite(db, workspace.id, user.plan);
    if (!canAdd.allowed) {
      return NextResponse.json(
        { error: canAdd.reason },
        { status: 403 }
      );
    }

    // URL 중복 확인
    const existingSite = await getSiteByUrl(db, workspace.id, url);
    if (existingSite) {
      return NextResponse.json(
        { error: '이미 등록된 사이트입니다.' },
        { status: 409 }
      );
    }

    // 사이트 생성
    const limits = getPlanLimits(user.plan);
    const site = await createSite(db, {
      workspace_id: workspace.id,
      url,
      display_name,
      page_limit: limits.maxPagesPerSite,
    });

    return NextResponse.json(
      {
        message: '사이트가 등록되었습니다.',
        site: {
          id: site.id,
          url: site.url,
          display_name: site.display_name,
          status: site.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create site error:', error);
    return NextResponse.json(
      { error: '사이트 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
