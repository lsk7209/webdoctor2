/**
 * CrawlJobs 데이터베이스 레포지토리
 */

import type { D1Database } from '@/db/client';
import type { CrawlJob } from '@/db/schema';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * 사이트 ID로 크롤 작업 조회
 */
export async function getCrawlJobsBySiteId(
  db: D1Database,
  siteId: string,
  limit: number = 10
): Promise<CrawlJob[]> {
  const result = await db
    .prepare(
      'SELECT * FROM crawl_jobs WHERE site_id = ? ORDER BY created_at DESC LIMIT ?'
    )
    .bind(siteId, limit)
    .all<CrawlJob>();

  return result.results || [];
}

/**
 * ID로 크롤 작업 조회
 */
export async function getCrawlJobById(
  db: D1Database,
  id: string
): Promise<CrawlJob | null> {
  const result = await db
    .prepare('SELECT * FROM crawl_jobs WHERE id = ?')
    .bind(id)
    .first<CrawlJob>();

  return result || null;
}

/**
 * 크롤 작업 생성
 */
export async function createCrawlJob(
  db: D1Database,
  siteId: string
): Promise<CrawlJob> {
  const id = generateId();
  const now = getUnixTimestamp();

  await db
    .prepare(
      `INSERT INTO crawl_jobs (id, site_id, status, created_at)
       VALUES (?, ?, ?, ?)`
    )
    .bind(id, siteId, 'pending', now)
    .run();

  const job = await getCrawlJobById(db, id);
  if (!job) {
    throw new Error('Failed to create crawl job');
  }

  return job;
}

/**
 * 크롤 작업 상태 업데이트
 */
export async function updateCrawlJobStatus(
  db: D1Database,
  id: string,
  status: CrawlJob['status'],
  errorMessage?: string
): Promise<void> {
  const now = getUnixTimestamp();

  if (status === 'running') {
    await db
      .prepare(
        `UPDATE crawl_jobs 
         SET status = ?, started_at = ?
         WHERE id = ?`
      )
      .bind(status, now, id)
      .run();
  } else if (status === 'completed' || status === 'failed') {
    await db
      .prepare(
        `UPDATE crawl_jobs 
         SET status = ?, finished_at = ?, error_message = ?
         WHERE id = ?`
      )
      .bind(status, now, errorMessage || null, id)
      .run();
  }
}

