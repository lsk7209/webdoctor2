/**
 * Cloudflare 환경 변수 및 바인딩 타입 정의
 * Next.js API Routes에서 Cloudflare Workers 환경 변수 접근
 * 
 * 참고: Next.js를 Cloudflare Pages에 배포할 때는 @cloudflare/next-on-pages 사용
 * 또는 Cloudflare Pages Functions를 통해 바인딩 접근
 */

import type { D1Database } from '@/db/client';

// Cloudflare Queue 타입 정의
export interface Queue {
  send(message: unknown): Promise<void>;
}

// MailChannels 바인딩 타입 (최소한의 타입 정의)
export interface MailChannelsBinding {
  send?(message: unknown): Promise<unknown>;
  [key: string]: unknown;
}

export interface CloudflareEnv {
  DB: D1Database;
  QUEUE?: Queue; // 크롤 작업 큐
  MAILCHANNELS?: MailChannelsBinding; // MailChannels 바인딩
  RESEND_API_KEY?: string; // Resend API 키 (환경 변수)
  PAGESPEED_API_KEY?: string; // Pagespeed Insights API 키 (환경 변수)
  JWT_SECRET?: string;
  NODE_ENV?: string;
  NEXT_PUBLIC_APP_URL?: string; // 앱 URL (환경 변수)
}

/**
 * Next.js Request에서 Cloudflare 환경 변수 가져오기
 * 
 * Cloudflare Pages + Next.js 환경에서:
 * 1. @cloudflare/next-on-pages 사용 시: process.env에 바인딩됨
 * 2. Cloudflare Pages Functions: request.env 또는 process.env
 * 3. Cloudflare Workers: globalThis.env
 * 
 * 우선순위: Request 객체 > globalThis.env > process.env
 */
export function getCloudflareEnv(request?: Request): CloudflareEnv | null {
  // 방법 1: Request 객체를 통한 접근 (Cloudflare Pages Functions)
  // @cloudflare/next-on-pages가 Request 객체에 env를 주입할 수 있음
  if (request && typeof request === 'object') {
    // Request 객체에 env 속성이 있는지 확인
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const requestAny = request as Record<string, any>;
    if (requestAny.env && requestAny.env.DB) {
      return requestAny.env as CloudflareEnv;
    }
    
    // Request.cf 또는 Request.ctx를 통한 접근 시도
    if (requestAny.cf?.env && requestAny.cf.env.DB) {
      return requestAny.cf.env as CloudflareEnv;
    }
  }

  // 방법 2: Cloudflare Workers 환경 (globalThis.env)
  if (typeof globalThis !== 'undefined') {
    if ('env' in globalThis) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const env = (globalThis as Record<string, any>).env;
      if (env && env.DB) {
        return env as CloudflareEnv;
      }
    }
  }

  // 방법 3: Next.js Edge Runtime + Cloudflare Pages
  // @cloudflare/next-on-pages를 사용하면 process.env에 바인딩됨
  if (typeof process !== 'undefined' && process.env) {
    // D1 바인딩 확인
    if (process.env.DB) {
      return {
        DB: process.env.DB as unknown as D1Database,
        QUEUE: process.env.QUEUE as unknown as Queue | undefined,
        MAILCHANNELS: process.env.MAILCHANNELS as unknown as MailChannelsBinding | undefined,
        RESEND_API_KEY: process.env.RESEND_API_KEY,
        PAGESPEED_API_KEY: process.env.PAGESPEED_API_KEY,
        JWT_SECRET: process.env.JWT_SECRET,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      };
    }
  }

  return null;
}

/**
 * D1 데이터베이스 가져오기
 * Next.js API Routes에서 사용
 * 
 * @param request NextRequest 객체 (선택사항)
 * @returns D1Database 인스턴스 또는 null
 */
export function getD1Database(request?: Request): D1Database | null {
  const env = getCloudflareEnv(request);
  if (env?.DB) {
    return env.DB;
  }

  // Fallback: 직접 process.env 확인
  if (typeof process !== 'undefined' && process.env && process.env.DB) {
    return process.env.DB as unknown as D1Database;
  }

  return null;
}

/**
 * Queue 가져오기
 */
export function getQueue(request?: Request): Queue | null {
  const env = getCloudflareEnv(request);
  if (env?.QUEUE) {
    return env.QUEUE;
  }

  // Fallback: 직접 process.env 확인
  if (typeof process !== 'undefined' && process.env && process.env.QUEUE) {
    return process.env.QUEUE as unknown as Queue;
  }

  return null;
}

/**
 * 환경 변수 가져오기 (JWT_SECRET 등)
 */
export function getEnvVar(key: string, request?: Request): string | undefined {
  const env = getCloudflareEnv(request);
  if (env && key in env) {
    const value = env[key as keyof CloudflareEnv];
    return typeof value === 'string' ? value : undefined;
  }
  
  // Fallback to process.env (개발 환경 및 Cloudflare Pages)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  
  return undefined;
}

/**
 * MailChannels 바인딩 가져오기
 */
export function getMailChannels(request?: Request): MailChannelsBinding | null {
  const env = getCloudflareEnv(request);
  if (env?.MAILCHANNELS) {
    return env.MAILCHANNELS;
  }
  
  // Fallback: 직접 process.env 확인
  if (typeof process !== 'undefined' && process.env && process.env.MAILCHANNELS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return process.env.MAILCHANNELS as unknown as MailChannelsBinding;
  }
  
  return null;
}
