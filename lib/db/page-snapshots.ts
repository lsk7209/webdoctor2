/**
 * PageSnapshots 데이터베이스 레포지토리
 */

import type { D1Database } from '@/db/client';
import type { PageSnapshot } from '@/db/schema';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * 사이트 ID로 페이지 스냅샷 목록 조회
 */
export async function getPageSnapshotsBySiteId(
  db: D1Database,
  siteId: string,
  limit: number = 100
): Promise<PageSnapshot[]> {
  const result = await db
    .prepare(
      'SELECT * FROM page_snapshots WHERE site_id = ? ORDER BY last_crawled_at DESC LIMIT ?'
    )
    .bind(siteId, limit)
    .all<PageSnapshot>();

  return result.results || [];
}

/**
 * URL로 페이지 스냅샷 조회
 */
export async function getPageSnapshotByUrl(
  db: D1Database,
  siteId: string,
  url: string
): Promise<PageSnapshot | null> {
  const result = await db
    .prepare('SELECT * FROM page_snapshots WHERE site_id = ? AND url = ?')
    .bind(siteId, url)
    .first<PageSnapshot>();

  return result || null;
}

/**
 * 페이지 스냅샷 생성 또는 업데이트
 */
export async function createPageSnapshot(
  db: D1Database,
  data: {
    site_id: string;
    url: string;
    http_status: number | null;
    title?: string | null;
    meta_description?: string | null;
    h1?: string | null;
    headings_json?: string | null;
    links_in?: number;
    links_out?: number;
    canonical?: string | null;
    noindex?: boolean;
    structured_data_json?: string | null;
    lighthouse_score_json?: string | null;
  }
): Promise<PageSnapshot> {
  const existing = await getPageSnapshotByUrl(db, data.site_id, data.url);

  const now = getUnixTimestamp();

  if (existing) {
    // 업데이트
    await db
      .prepare(
        `UPDATE page_snapshots 
         SET http_status = ?, title = ?, meta_description = ?, h1 = ?,
             headings_json = ?, links_in = ?, links_out = ?, canonical = ?,
             noindex = ?, structured_data_json = ?, lighthouse_score_json = ?,
             last_crawled_at = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(
        data.http_status,
        data.title || null,
        data.meta_description || null,
        data.h1 || null,
        data.headings_json || null,
        data.links_in || 0,
        data.links_out || 0,
        data.canonical || null,
        data.noindex ? 1 : 0,
        data.structured_data_json || null,
        data.lighthouse_score_json || null,
        now,
        now,
        existing.id
      )
      .run();

    const updated = await getPageSnapshotByUrl(db, data.site_id, data.url);
    if (!updated) {
      throw new Error('Failed to update page snapshot');
    }
    return updated;
  } else {
    // 생성
    const id = generateId();

    await db
      .prepare(
        `INSERT INTO page_snapshots 
         (id, site_id, url, http_status, title, meta_description, h1,
          headings_json, links_in, links_out, canonical, noindex,
          structured_data_json, lighthouse_score_json, last_crawled_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        id,
        data.site_id,
        data.url,
        data.http_status,
        data.title || null,
        data.meta_description || null,
        data.h1 || null,
        data.headings_json || null,
        data.links_in || 0,
        data.links_out || 0,
        data.canonical || null,
        data.noindex ? 1 : 0,
        data.structured_data_json || null,
        data.lighthouse_score_json || null,
        now,
        now,
        now
      )
      .run();

    const created = await getPageSnapshotByUrl(db, data.site_id, data.url);
    if (!created) {
      throw new Error('Failed to create page snapshot');
    }
    return created;
  }
}

/**
 * 페이지 스냅샷의 Lighthouse 점수 업데이트
 */
export async function updatePageSnapshotLighthouse(
  db: D1Database,
  siteId: string,
  url: string,
  lighthouseScoreJson: string
): Promise<void> {
  const now = getUnixTimestamp();

  await db
    .prepare(
      `UPDATE page_snapshots 
       SET lighthouse_score_json = ?, updated_at = ?
       WHERE site_id = ? AND url = ?`
    )
    .bind(lighthouseScoreJson, now, siteId, url)
    .run();
}

