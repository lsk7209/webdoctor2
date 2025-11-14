/**
 * Issues 데이터베이스 레포지토리
 */

import type { D1Database } from '@/db/client';
import type { Issue } from '@/db/schema';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * ID로 이슈 조회
 */
export async function getIssueById(
  db: D1Database,
  id: string
): Promise<Issue | null> {
  const result = await db
    .prepare('SELECT * FROM issues WHERE id = ?')
    .bind(id)
    .first<Issue>();

  return result || null;
}

/**
 * 사이트 ID로 이슈 목록 조회 (페이지네이션 지원)
 */
export async function getIssuesBySiteId(
  db: D1Database,
  siteId: string,
  filters?: {
    issue_type?: string;
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ issues: Issue[]; total: number }> {
  let query = 'SELECT * FROM issues WHERE site_id = ?';
  let countQuery = 'SELECT COUNT(*) as total FROM issues WHERE site_id = ?';
  const params: any[] = [siteId];
  const countParams: any[] = [siteId];

  if (filters?.issue_type) {
    query += ' AND issue_type = ?';
    countQuery += ' AND issue_type = ?';
    params.push(filters.issue_type);
    countParams.push(filters.issue_type);
  }

  if (filters?.severity) {
    query += ' AND severity = ?';
    countQuery += ' AND severity = ?';
    params.push(filters.severity);
    countParams.push(filters.severity);
  }

  if (filters?.status) {
    query += ' AND status = ?';
    countQuery += ' AND status = ?';
    params.push(filters.status);
    countParams.push(filters.status);
  }

  query += ' ORDER BY severity DESC, created_at DESC';

  // 페이지네이션 적용
  const limit = filters?.limit || 50;
  const offset = filters?.offset || 0;
  query += ` LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  // D1 데이터베이스 최적화: Prepared statements 재사용
  const issuesStmt = db.prepare(query);
  const countStmt = db.prepare(countQuery);
  
  const [issuesResult, countResult] = await Promise.all([
    issuesStmt.bind(...params).all<Issue>(),
    countStmt.bind(...countParams).first<{ total: number }>(),
  ]);

  return {
    issues: issuesResult.results || [],
    total: countResult?.total || 0,
  };
}

/**
 * 이슈 생성
 */
export async function createIssue(db: D1Database, issue: Omit<Issue, 'id' | 'created_at' | 'updated_at'>): Promise<Issue> {
  const id = generateId();
  const now = getUnixTimestamp();

  await db
    .prepare(
      `INSERT INTO issues 
       (id, site_id, page_url, issue_type, severity, status, summary, description, fix_hint, affected_pages_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      issue.site_id,
      issue.page_url,
      issue.issue_type,
      issue.severity,
      issue.status,
      issue.summary,
      issue.description,
      issue.fix_hint,
      issue.affected_pages_count,
      now,
      now
    )
    .run();

  const created = await db
    .prepare('SELECT * FROM issues WHERE id = ?')
    .bind(id)
    .first<Issue>();

  if (!created) {
    throw new Error('Failed to create issue');
  }

  return created;
}

/**
 * 여러 이슈 일괄 생성
 */
export async function createIssuesBatch(
  db: D1Database,
  issues: Array<Omit<Issue, 'id' | 'created_at' | 'updated_at'>>
): Promise<void> {
  const now = getUnixTimestamp();

  // 기존 이슈와 중복 확인을 위해 먼저 조회
  const { issues: existingIssues } = await getIssuesBySiteId(db, issues[0]?.site_id || '');

  for (const issue of issues) {
    // 중복 확인: 동일한 site_id, issue_type, page_url 조합
    const isDuplicate = existingIssues.some(
      (existing) =>
        existing.site_id === issue.site_id &&
        existing.issue_type === issue.issue_type &&
        existing.page_url === issue.page_url &&
        existing.status !== 'resolved' // 해결된 이슈는 제외
    );

    if (!isDuplicate) {
      const id = generateId();
      await db
        .prepare(
          `INSERT INTO issues 
           (id, site_id, page_url, issue_type, severity, status, summary, description, fix_hint, affected_pages_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(
          id,
          issue.site_id,
          issue.page_url,
          issue.issue_type,
          issue.severity,
          issue.status,
          issue.summary,
          issue.description,
          issue.fix_hint,
          issue.affected_pages_count,
          now,
          now
        )
        .run();
    }
  }
}

/**
 * 이슈 상태 업데이트
 */
export async function updateIssueStatus(
  db: D1Database,
  id: string,
  status: Issue['status']
): Promise<void> {
  const now = getUnixTimestamp();

  await db
    .prepare('UPDATE issues SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, now, id)
    .run();
}

/**
 * 워크스페이스의 모든 사이트에 대한 이슈 목록 조회
 */
export async function getIssuesByWorkspaceId(
  db: D1Database,
  workspaceId: string
): Promise<Issue[]> {
  const result = await db
    .prepare(
      `SELECT i.* FROM issues i
       INNER JOIN sites s ON i.site_id = s.id
       WHERE s.workspace_id = ?
       ORDER BY i.severity DESC, i.created_at DESC`
    )
    .bind(workspaceId)
    .all<Issue>();

  return result.results || [];
}

/**
 * 사이트의 모든 이슈 삭제 (크롤 재실행 시)
 */
export async function deleteIssuesBySiteId(db: D1Database, siteId: string): Promise<void> {
  await db.prepare('DELETE FROM issues WHERE site_id = ?').bind(siteId).run();
}

