/**
 * 이슈 내보내기 API 엔드포인트
 * GET /api/sites/[siteId]/issues/export - 이슈를 CSV 또는 JSON으로 내보내기
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { getIssuesBySiteId } from '@/lib/db/issues';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getD1Database } from '@/lib/cloudflare/env';
import { validateSiteId } from '@/utils/validation';
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  databaseErrorResponse,
  serverErrorResponse,
} from '@/utils/api-response';

export const runtime = 'edge';

/**
 * 이슈 내보내기 (CSV 또는 JSON)
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

    // 쿼리 파라미터에서 형식 및 필터 가져오기
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' 또는 'csv'
    const filters = {
      issue_type: searchParams.get('issue_type') || undefined,
      severity: searchParams.get('severity') || undefined,
      status: searchParams.get('status') || undefined,
      limit: 999999, // 모든 이슈 가져오기
      offset: 0,
    };

    // 이슈 목록 조회
    const { issues } = await getIssuesBySiteId(db, siteId, filters);

    if (format === 'csv') {
      // CSV 형식으로 변환
      const headers = [
        'ID',
        '이슈 타입',
        '심각도',
        '상태',
        '요약',
        '설명',
        '수정 힌트',
        '페이지 URL',
        '영향받은 페이지 수',
        '생성일',
        '수정일',
      ];

      const rows = issues.map((issue) => [
        issue.id,
        issue.issue_type,
        issue.severity,
        issue.status,
        issue.summary,
        issue.description || '',
        issue.fix_hint || '',
        issue.page_url || '',
        issue.affected_pages_count.toString(),
        new Date(issue.created_at * 1000).toISOString(),
        new Date(issue.updated_at * 1000).toISOString(),
      ]);

      // CSV 생성 (BOM 추가하여 Excel에서 한글 깨짐 방지)
      const csvContent = [
        '\uFEFF' + headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // 쉼표, 따옴표, 줄바꿈 이스케이프
              const cellStr = String(cell).replace(/"/g, '""');
              if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                return `"${cellStr}"`;
              }
              return cellStr;
            })
            .join(',')
        ),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="issues-${siteId}-${Date.now()}.csv"`,
        },
      });
    } else {
      // JSON 형식
      return NextResponse.json(
        {
          site_id: siteId,
          site_url: site.url,
          exported_at: new Date().toISOString(),
          total: issues.length,
          issues: issues.map((issue) => ({
            id: issue.id,
            issue_type: issue.issue_type,
            severity: issue.severity,
            status: issue.status,
            summary: issue.summary,
            description: issue.description,
            fix_hint: issue.fix_hint,
            page_url: issue.page_url,
            affected_pages_count: issue.affected_pages_count,
            created_at: new Date(issue.created_at * 1000).toISOString(),
            updated_at: new Date(issue.updated_at * 1000).toISOString(),
          })),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="issues-${siteId}-${Date.now()}.json"`,
          },
        }
      );
    }
  } catch (error) {
    return serverErrorResponse('이슈 내보내기 중 오류가 발생했습니다.', error);
  }
}

