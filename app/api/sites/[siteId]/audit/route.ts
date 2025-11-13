/**
 * SEO 감사 실행 API
 * POST /api/sites/[siteId]/audit
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getPageSnapshotsBySiteId } from '@/lib/db/page-snapshots';
import { runAuditRules } from '@/lib/seo/rules/engine';
import { createIssuesBatch, deleteIssuesBySiteId } from '@/lib/db/issues';
import { getD1Database } from '@/lib/cloudflare/env';

// Edge Runtime 사용 (Cloudflare 호환)
export const runtime = 'edge';

/**
 * SEO 감사 실행
 */
export async function POST(
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

    const db = getD1Database(request);
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

    // 페이지 스냅샷 조회
    const pageSnapshots = await getPageSnapshotsBySiteId(db, siteId);

    if (pageSnapshots.length === 0) {
      return NextResponse.json(
        { error: '크롤링된 페이지가 없습니다. 먼저 크롤링을 실행하세요.' },
        { status: 400 }
      );
    }

    // 룰 엔진 실행
    const context = {
      siteId: site.id,
      pageSnapshots: pageSnapshots.map((p) => ({
        id: p.id,
        url: p.url,
        title: p.title,
        meta_description: p.meta_description,
        h1: p.h1,
        headings_json: p.headings_json,
        links_in: p.links_in,
        links_out: p.links_out,
        canonical: p.canonical,
        noindex: p.noindex,
        structured_data_json: p.structured_data_json,
        lighthouse_score_json: p.lighthouse_score_json,
        http_status: p.http_status,
      })),
    };

    const issues = await runAuditRules(context);

    // 기존 이슈 삭제 (새 감사 결과로 대체)
    await deleteIssuesBySiteId(db, siteId);

    // 새 이슈 저장
    await createIssuesBatch(db, issues);

    return NextResponse.json(
      {
        message: 'SEO 감사가 완료되었습니다.',
        issuesCount: issues.length,
        issues: issues.slice(0, 10), // 처음 10개만 반환
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit error:', error);
    return NextResponse.json(
      { error: 'SEO 감사 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
