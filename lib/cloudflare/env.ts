/**
 * Cloudflare 환경 변수 및 바인딩 타입 정의
 */

import type { D1Database } from '@/db/client';

// Cloudflare Queue 타입 정의
export interface Queue {
  send(message: any): Promise<void>;
}

export interface CloudflareEnv {
  DB: D1Database;
  QUEUE?: Queue; // 크롤 작업 큐
  JWT_SECRET?: string;
  NODE_ENV?: string;
}

/**
 * Cloudflare Workers 환경에서 env 가져오기
 * Next.js API Routes에서 사용
 */
export function getCloudflareEnv(): CloudflareEnv | null {
  // Cloudflare Workers 환경에서는 globalThis에 env가 바인딩됨
  if (typeof globalThis !== 'undefined' && 'env' in globalThis) {
    return (globalThis as any).env as CloudflareEnv;
  }

  // Next.js 개발 환경에서는 process.env 사용
  if (typeof process !== 'undefined' && process.env) {
    // 개발 환경에서는 D1 모의 객체 반환 (실제로는 wrangler dev 사용)
    return null;
  }

  return null;
}

/**
 * D1 데이터베이스 가져오기
 */
export function getD1Database(): D1Database | null {
  const env = getCloudflareEnv();
  return env?.DB || null;
}

/**
 * Queue 가져오기
 */
export function getQueue(): Queue | null {
  const env = getCloudflareEnv();
  return env?.QUEUE || null;
}

