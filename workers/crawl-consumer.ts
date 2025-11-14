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
    const startTime = Date.now();
    const batchId = batch.messages[0]?.id?.substring(0, 8) || 'unknown';
    
    console.log(`[${new Date().toISOString()}] Processing crawl queue batch ${batchId} (${batch.messages.length} messages)`);

    const results = {
      succeeded: 0,
      failed: 0,
      retried: 0,
    };

    // Cloudflare Queue는 배치 단위로 처리하므로 순차 처리 (동시성 제어)
    for (const message of batch.messages) {
      const messageId = message.id.substring(0, 8);
      const jobStartTime = Date.now();
      
      try {
        await processCrawlJob(env.DB, message.body, env);
        message.ack();
        results.succeeded++;
        
        const duration = Date.now() - jobStartTime;
        console.log(`[${messageId}] Crawl job completed in ${duration}ms`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        console.error(`[${messageId}] Failed to process crawl job:`, {
          error: errorMessage,
          stack: errorStack,
          message: message.body,
        });
        
        // 재시도 (Cloudflare Queue가 자동으로 재시도 정책 적용)
        message.retry();
        results.retried++;
        results.failed++;
      }
    }

    const totalDuration = Date.now() - startTime;
    console.log(`[${batchId}] Batch processing completed in ${totalDuration}ms:`, results);
  },
};

