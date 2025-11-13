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

    const user = await getUserById(db, session.userId);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 크롤 작업 생성
    const crawlJob = await createCrawlJob(db, siteId);

    // 큐에 작업 추가 (비동기 처리)
    await enqueueCrawlJob({
      siteId: site.id,
      crawlJobId: crawlJob.id,
      url: site.url,
      userPlan: user.plan,
    });

    return NextResponse.json(
      {
        message: '크롤 작업이 시작되었습니다.',
        jobId: crawlJob.id,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('Start crawl error:', error);
    return NextResponse.json(
      { error: '크롤 작업 시작 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
