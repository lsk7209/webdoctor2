/**
 * Sites 데이터베이스 레포지토리
 */

import type { D1Database } from '@/db/client';
import type { Site } from '@/db/schema';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * 워크스페이스 ID로 사이트 목록 조회
 */
export async function getSitesByWorkspaceId(
  db: D1Database,
  workspaceId: string
): Promise<Site[]> {
  const result = await db
    .prepare('SELECT * FROM sites WHERE workspace_id = ? ORDER BY created_at DESC')
    .bind(workspaceId)
    .all<Site>();

  return result.results || [];
}

/**
 * ID로 사이트 조회
 */
export async function getSiteById(
  db: D1Database,
  id: string
): Promise<Site | null> {
  const result = await db
    .prepare('SELECT * FROM sites WHERE id = ?')
    .bind(id)
    .first<Site>();

  return result || null;
}

/**
 * URL로 사이트 조회 (중복 확인용)
 */
export async function getSiteByUrl(
  db: D1Database,
  workspaceId: string,
  url: string
): Promise<Site | null> {
  const result = await db
    .prepare('SELECT * FROM sites WHERE workspace_id = ? AND url = ?')
    .bind(workspaceId, url)
    .first<Site>();

  return result || null;
}

/**
 * 사이트 생성
 */
export async function createSite(
  db: D1Database,
  data: {
    workspace_id: string;
    url: string;
    display_name?: string;
    page_limit?: number;
  }
): Promise<Site> {
  const id = generateId();
  const now = getUnixTimestamp();

  // URL 정규화는 호출 전에 이미 수행되어야 함 (normalizeUrl 사용)
  // 여기서는 추가 검증만 수행
  const normalizedUrl = data.url.trim();

  await db
    .prepare(
      `INSERT INTO sites (id, workspace_id, url, display_name, status, page_limit, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.workspace_id,
      normalizedUrl,
      data.display_name || null,
      'pending',
      data.page_limit || 500,
      now,
      now
    )
    .run();

  const site = await getSiteById(db, id);
  if (!site) {
    throw new Error('Failed to create site');
  }

  return site;
}

/**
 * 사이트 상태 업데이트
 */
export async function updateSiteStatus(
  db: D1Database,
  id: string,
  status: Site['status'],
  lastCrawledAt?: number
): Promise<void> {
  const now = getUnixTimestamp();

  await db
    .prepare(
      `UPDATE sites 
       SET status = ?, last_crawled_at = ?, updated_at = ?
       WHERE id = ?`
    )
    .bind(status, lastCrawledAt || null, now, id)
    .run();
}

/**
 * 사이트 삭제
 */
export async function deleteSite(
  db: D1Database,
  id: string
): Promise<void> {
  await db
    .prepare('DELETE FROM sites WHERE id = ?')
    .bind(id)
    .run();
}

