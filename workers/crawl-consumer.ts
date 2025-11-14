/**
 * 크롤 작업 큐 Consumer
 * Cloudflare Workers에서 실행되는 큐 처리 Worker
 */

import type { D1Database } from '@/db/client';
import { processCrawlJob } from '@/lib/queue/crawl-queue';

export interface CrawlQueueMessage {
  siteId: string;
  crawlJobId: string;
  url: string;
  userPlan: string;
}

export interface MessageBatch<T = any> {
  messages: Array<{
    id: string;
    body: T;
    ack(): void;
    retry(): void;
  }>;
}

export interface Env {
  DB: D1Database;
  QUEUE: {
    send(message: any): Promise<void>;
  };
  MAILCHANNELS?: any; // MailChannels 바인딩
  RESEND_API_KEY?: string; // Resend API 키 (환경 변수)
  PAGESPEED_API_KEY?: string; // Pagespeed Insights API 키 (환경 변수)
}

export default {
  async queue(batch: MessageBatch<CrawlQueueMessage>, env: Env): Promise<void> {
    for (const message of batch.messages) {
      try {
        await processCrawlJob(env.DB, message.body, env);
        message.ack();
      } catch (error) {
        console.error('Failed to process crawl job:', error);
        message.retry();
      }
    }
  },
};

