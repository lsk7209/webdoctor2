/**
 * 크롤 작업 큐 처리
 * Cloudflare Queue를 사용한 비동기 크롤링
 */

import type { D1Database } from '@/db/client';
import { getQueue } from '@/lib/cloudflare/env';
import { runCrawler } from '@/lib/crawler/crawler';
import { parseHTML } from '@/lib/crawler/html-parser';
import { createPageSnapshot } from '@/lib/db/page-snapshots';
import { updateCrawlJobStatus } from '@/lib/db/crawl-jobs';
import { updateSiteStatus } from '@/lib/db/sites';
import { getPlanLimits } from '@/lib/plans';
import { getUnixTimestamp } from '@/db/client';

export interface CrawlQueueMessage {
  siteId: string;
  crawlJobId: string;
  url: string;
  userPlan: string;
}

/**
 * 크롤 작업을 큐에 추가
 * @param message 크롤 작업 메시지
 * @param request Request 객체 (선택사항, Queue 바인딩 접근용)
 */
export async function enqueueCrawlJob(
  message: CrawlQueueMessage,
  request?: Request
): Promise<void> {
  const queue = getQueue(request);
  if (!queue) {
    throw new Error('Queue를 사용할 수 없습니다. Cloudflare 환경에서 실행해주세요.');
  }

  await queue.send(message);
}

/**
 * 크롤 작업 처리 (Queue Consumer에서 호출)
 */
export async function processCrawlJob(
  db: D1Database,
  message: CrawlQueueMessage
): Promise<void> {
  const { siteId, crawlJobId, url, userPlan } = message;

  try {
    // 크롤 작업 상태 업데이트
    await updateCrawlJobStatus(db, crawlJobId, 'running');
    await updateSiteStatus(db, siteId, 'crawling');

    const limits = getPlanLimits(userPlan as any);

    // 크롤러 실행
    const results = await runCrawler({
      url,
      pageLimit: limits.maxPagesPerSite,
      crawlDepthLimit: 50,
      respectRobotsTxt: true,
    });

    // 결과를 데이터베이스에 저장
    for (const result of results) {
      if (result.html) {
        const parsed = parseHTML(result.html, result.url);
        
        await createPageSnapshot(db, {
          site_id: siteId,
          url: result.url,
          http_status: result.statusCode,
          title: parsed.title,
          meta_description: parsed.metaDescription,
          h1: parsed.h1,
          headings_json: JSON.stringify(parsed.headings),
          links_in: parsed.links.internal.length,
          links_out: parsed.links.external.length,
          canonical: parsed.canonical,
          noindex: parsed.noindex,
          structured_data_json: JSON.stringify(parsed.structuredData),
        });
      }
    }

    // 크롤 작업 완료
    await updateCrawlJobStatus(db, crawlJobId, 'completed');
    await updateSiteStatus(db, siteId, 'ready', getUnixTimestamp());
  } catch (error) {
    console.error('Crawl job failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateCrawlJobStatus(db, crawlJobId, 'failed', errorMessage);
    await updateSiteStatus(db, siteId, 'failed');
    throw error;
  }
}

