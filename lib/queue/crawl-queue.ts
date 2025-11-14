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
import { runSiteAudit } from '@/lib/seo/audit';
import { sendFirstAuditCompleteEmail } from '@/lib/email/notifications';
import { getCrawlJobsBySiteId } from '@/lib/db/crawl-jobs';
import { getPageSnapshotsBySiteId } from '@/lib/db/page-snapshots';
import { selectTopPages } from '@/lib/lighthouse/priority';
import { getLighthouseScoresBatch } from '@/lib/lighthouse/pagespeed';
import { updatePageSnapshotLighthouse } from '@/lib/db/page-snapshots';

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
  message: CrawlQueueMessage,
  env?: any
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

    // 결과를 데이터베이스에 저장 (배치 처리 최적화)
    const pageSnapshotsToCreate = [];
    
    for (const result of results) {
      if (result.html) {
        const parsed = parseHTML(result.html, result.url);
        
        pageSnapshotsToCreate.push({
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

    // 배치로 페이지 스냅샷 생성 (D1 최적화: 순차 처리로 메모리 사용량 제어)
    // Edge Runtime 메모리 제한 고려하여 배치 크기 제한
    console.log(`Creating ${pageSnapshotsToCreate.length} page snapshots...`);
    
    const BATCH_SIZE = 50; // Edge Runtime 메모리 제한 고려
    for (let i = 0; i < pageSnapshotsToCreate.length; i += BATCH_SIZE) {
      const batch = pageSnapshotsToCreate.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((snapshot) => createPageSnapshot(db, snapshot))
      );
      console.log(`Created ${Math.min(i + BATCH_SIZE, pageSnapshotsToCreate.length)}/${pageSnapshotsToCreate.length} page snapshots`);
    }
    
    console.log(`Successfully created ${pageSnapshotsToCreate.length} page snapshots`);

    // 주요 페이지 선별 (상위 100페이지)
    // D1 최적화: 필요한 페이지만 조회 (상위 200개만 조회하여 메모리 절약)
    const allPages = await getPageSnapshotsBySiteId(db, siteId, 200);
    const topPages = selectTopPages(allPages, 100);
    
    console.log(`Selected ${topPages.length} top pages for Lighthouse analysis out of ${allPages.length} total pages`);

    // Lighthouse 점수 수집 (주요 페이지만)
    if (topPages.length > 0) {
      console.log(`Collecting Lighthouse scores for ${topPages.length} pages...`);
      const urls = topPages.map((p) => p.url);
      const lighthouseScores = await getLighthouseScoresBatch(urls, {
        strategy: 'mobile', // 모바일 우선
        category: ['performance', 'seo'],
      });

      // Lighthouse 점수 저장
      let scoresCollected = 0;
      for (const [pageUrl, scores] of lighthouseScores.entries()) {
        if (scores) {
          await updatePageSnapshotLighthouse(
            db,
            siteId,
            pageUrl,
            JSON.stringify(scores)
          );
          scoresCollected++;
        }
      }
      console.log(`Collected Lighthouse scores for ${scoresCollected} pages`);
    }

    // SEO 감사 실행
    console.log(`Running SEO audit for site ${siteId}...`);
    const issueCount = await runSiteAudit(db, siteId);
    console.log(`SEO audit completed. Found ${issueCount} issues.`);

    // 크롤 작업 완료
    await updateCrawlJobStatus(db, crawlJobId, 'completed');
    await updateSiteStatus(db, siteId, 'ready', getUnixTimestamp());

    // 첫 감사 완료 이메일 발송 (이전 크롤 작업이 없는 경우)
    try {
      const previousJobs = await getCrawlJobsBySiteId(db, siteId, 2);
      // 현재 작업을 제외하고 완료된 작업이 없으면 첫 감사로 간주
      const isFirstAudit = previousJobs.filter((j) => j.status === 'completed').length === 1;
      if (isFirstAudit) {
        console.log(`Sending first audit complete email for site ${siteId}...`);
        await sendFirstAuditCompleteEmail(db, siteId, env);
      }
    } catch (emailError) {
      // 이메일 발송 실패는 크롤 작업 실패로 간주하지 않음
      console.error('Failed to send first audit complete email:', emailError);
    }
  } catch (error) {
    console.error('Crawl job failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await updateCrawlJobStatus(db, crawlJobId, 'failed', errorMessage);
    await updateSiteStatus(db, siteId, 'failed');
    throw error;
  }
}

