/**
 * 개별 이슈 관리 API 엔드포인트
 * PATCH /api/sites/[siteId]/issues/[issueId] - 이슈 상태 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getSiteById } from '@/lib/db/sites';
import { getIssueById, updateIssueStatus } from '@/lib/db/issues';
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
 * 이슈 상태 업데이트
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { siteId: string; issueId: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return unauthorizedResponse();
    }

    const { siteId, issueId } = params;

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

    // 이슈 조회
    const issue = await getIssueById(db, issueId);
    if (!issue) {
      return notFoundResponse('이슈');
    }

    // 이슈가 해당 사이트에 속하는지 확인
    if (issue.site_id !== siteId) {
      return forbiddenResponse();
    }

    // 요청 본문에서 상태 가져오기
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return errorResponse('요청 본문을 파싱할 수 없습니다.', 400, 'INVALID_JSON');
    }

    const { status } = body;
    if (!status || !['open', 'in_progress', 'resolved', 'ignored'].includes(status)) {
      return errorResponse(
        '유효하지 않은 상태입니다. (open, in_progress, resolved, ignored 중 하나)',
        400,
        'INVALID_STATUS'
      );
    }

    // 이슈 상태 업데이트
    await updateIssueStatus(db, issueId, status);

    // 업데이트된 이슈 조회
    const updatedIssue = await getIssueById(db, issueId);

    return successResponse(
      {
        issue: updatedIssue,
      },
      '이슈 상태가 업데이트되었습니다.'
    );
  } catch (error) {
    return serverErrorResponse('이슈 상태 업데이트 중 오류가 발생했습니다.', error);
  }
}

