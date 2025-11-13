/**
 * 주간 자동 감사 Cron Worker
 * 매주 실행되어 모든 사이트에 대해 SEO 감사를 실행
 */

import type { D1Database } from '@/db/client';
import { getSitesByWorkspaceId } from '@/lib/db/sites';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { createCrawlJob } from '@/lib/db/crawl-jobs';
import { enqueueCrawlJob } from '@/lib/queue/crawl-queue';
import { getUserById } from '@/lib/db/users';

export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

export interface Env {
  DB: D1Database;
  QUEUE: {
    send(message: any): Promise<void>;
  };
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    console.log('Starting weekly audit cron job');

    try {
      // 모든 워크스페이스 조회 (간단한 구현)
      // 실제로는 페이지네이션 필요
      const workspaces = await env.DB
        .prepare('SELECT * FROM workspaces')
        .all();

      if (!workspaces.results) {
        console.log('No workspaces found');
        return;
      }

      for (const workspace of workspaces.results as any[]) {
        // 사용자 정보 조회
        const user = await getUserById(env.DB, workspace.owner_user_id);
        if (!user) continue;

        // 사이트 목록 조회
        const sites = await getSitesByWorkspaceId(env.DB, workspace.id);

        for (const site of sites) {
          // 크롤 작업 생성 및 큐에 추가
          const crawlJob = await createCrawlJob(env.DB, site.id);
          await enqueueCrawlJob({
            siteId: site.id,
            crawlJobId: crawlJob.id,
            url: site.url,
            userPlan: user.plan,
          });
        }
      }

      console.log('Weekly audit cron job completed');
    } catch (error) {
      console.error('Weekly audit cron job failed:', error);
      throw error;
    }
  },
};

