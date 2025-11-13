/**
 * 크롤러 타입 정의
 */

export interface CrawlConfig {
  url: string;
  pageLimit: number;
  crawlDepthLimit: number;
  userAgent?: string;
  respectRobotsTxt?: boolean;
}

export interface CrawlResult {
  url: string;
  statusCode: number;
  html?: string;
  error?: string;
}

export interface CrawlJob {
  id: string;
  siteId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: number;
  finishedAt?: number;
  errorMessage?: string;
  pagesCrawled: number;
  totalPages: number;
}

export interface RobotsTxtData {
  isAllowed: (path: string) => boolean;
  getCrawlDelay?: (path: string) => number | undefined;
  getSitemaps?: () => string[];
}

