/**
 * 주간 자동 감사 Cron Worker
 * 매주 실행되어 모든 사이트에 대해 SEO 감사를 실행
 */

import type { D1Database } from '@/db/client';
import { getSitesByWorkspaceId } from '@/lib/db/sites';
import { createCrawlJob } from '@/lib/db/crawl-jobs';
import { getUserById } from '@/lib/db/users';
import { shouldRunAutoAudit, getRecentCrawlStatus } from '@/lib/cron/audit-scheduler';
import { sendWeeklyReportEmail } from '@/lib/email/weekly-report';
import { enqueueCrawlJob } from '@/lib/queue/crawl-queue';

export interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

export interface Env {
  DB: D1Database;
  QUEUE: {
    send(message: any): Promise<void>;
  };
  MAILCHANNELS?: any; // MailChannels 바인딩
  RESEND_API_KEY?: string; // Resend API 키 (환경 변수)
  PAGESPEED_API_KEY?: string; // Pagespeed Insights API 키 (환경 변수)
  NEXT_PUBLIC_APP_URL?: string; // 앱 URL (환경 변수)
}

interface CronJobStats {
  totalWorkspaces: number;
  totalSites: number;
  sitesScheduled: number;
  sitesSkipped: number;
  errors: number;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const startTime = Date.now();
    console.log(`[${new Date().toISOString()}] Starting weekly audit cron job`);

    const stats: CronJobStats = {
      totalWorkspaces: 0,
      totalSites: 0,
      sitesScheduled: 0,
      sitesSkipped: 0,
      errors: 0,
    };

    try {
      // 모든 워크스페이스 조회
      const workspaces = await env.DB.prepare('SELECT * FROM workspaces').all();

      if (!workspaces.results || workspaces.results.length === 0) {
        console.log('No workspaces found');
        return;
      }

      stats.totalWorkspaces = workspaces.results.length;
      console.log(`Found ${stats.totalWorkspaces} workspaces`);

      // 각 워크스페이스 처리
      for (const workspace of workspaces.results as any[]) {
        try {
          // 사용자 정보 조회
          const user = await getUserById(env.DB, workspace.owner_user_id);
          if (!user) {
            console.warn(`User not found for workspace ${workspace.id}`);
            continue;
          }

          // 플랜 만료 확인
          const now = Math.floor(Date.now() / 1000);
          if (user.trial_expires_at && user.trial_expires_at < now && user.plan === 'trial_basic') {
            console.log(`Skipping workspace ${workspace.id}: trial expired`);
            continue;
          }

          // 사이트 목록 조회
          const sites = await getSitesByWorkspaceId(env.DB, workspace.id);
          stats.totalSites += sites.length;

          const sitesToAudit: Array<{ site: any; reason: string }> = [];

          // 각 사이트에 대해 자동 감사 필요 여부 확인
          for (const site of sites) {
            try {
              // 실행 중인 작업이 있으면 스킵
              const crawlStatus = await getRecentCrawlStatus(env.DB, site.id);
              if (crawlStatus.hasRunningJob) {
                console.log(`Skipping site ${site.id}: has running crawl job`);
                stats.sitesSkipped++;
                continue;
              }

              // 자동 감사 실행 여부 확인
              const auditCheck = await shouldRunAutoAudit(env.DB, site, user.plan);
              if (auditCheck.shouldRun) {
                sitesToAudit.push({ site, reason: auditCheck.reason || 'scheduled' });
              } else {
                console.log(`Skipping site ${site.id}: ${auditCheck.reason}`);
                stats.sitesSkipped++;
              }
            } catch (siteError) {
              console.error(`Error processing site ${site.id}:`, siteError);
              stats.errors++;
            }
          }

          // 크롤 작업 생성 및 큐에 추가
          for (const { site, reason } of sitesToAudit) {
            try {
              const crawlJob = await createCrawlJob(env.DB, site.id);
              
              // Queue에 작업 추가
              await env.QUEUE.send({
                siteId: site.id,
                crawlJobId: crawlJob.id,
                url: site.url,
                userPlan: user.plan,
              });

              console.log(`Scheduled crawl job for site ${site.id} (${reason})`);
              stats.sitesScheduled++;
            } catch (queueError) {
              console.error(`Failed to enqueue crawl job for site ${site.id}:`, queueError);
              stats.errors++;
            }
          }

          // 주간 리포트 이메일 발송 (ready 상태 사이트가 있는 경우)
          const readySites = sites.filter((s) => s.status === 'ready');
          if (readySites.length > 0) {
            try {
              await sendWeeklyReportEmail(env.DB, workspace.id, env);
              console.log(`Sent weekly report email for workspace ${workspace.id}`);
            } catch (emailError) {
              // 이메일 발송 실패는 크론 작업 실패로 간주하지 않음
              console.error(`Failed to send weekly report email for workspace ${workspace.id}:`, emailError);
            }
          }
        } catch (workspaceError) {
          console.error(`Error processing workspace ${workspace.id}:`, workspaceError);
          stats.errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[${new Date().toISOString()}] Weekly audit cron job completed`);
      console.log(`Stats:`, {
        ...stats,
        duration: `${duration}ms`,
      });
    } catch (error) {
      console.error('Weekly audit cron job failed:', error);
      throw error;
    }
  },
};

