/**
 * 메인 크롤러 엔진
 * BFS 기반 페이지 탐색 및 크롤링
 */

import type { CrawlConfig, CrawlResult } from './types';
import { fetchRobotsTxt } from './robots';
import { findSitemapUrls, parseSitemap } from './sitemap';
import { fetchPage } from './fetcher';
import { parseHTML } from './html-parser';

export interface CrawlProgress {
  crawled: number;
  total: number;
  urls: string[];
  results: CrawlResult[];
}

/**
 * BFS 기반 크롤러
 */
export class Crawler {
  private config: CrawlConfig;
  private visitedUrls: Set<string> = new Set();
  private queue: string[] = [];
  private results: CrawlResult[] = [];
  private robots: Awaited<ReturnType<typeof fetchRobotsTxt>> | null = null;

  constructor(config: CrawlConfig) {
    this.config = {
      userAgent: 'KoreSEO Crawler',
      respectRobotsTxt: true,
      ...config,
    };
  }

  /**
   * 크롤링 시작
   */
  async crawl(): Promise<CrawlResult[]> {
    const baseUrl = this.config.url;
    this.visitedUrls.clear();
    this.queue = [baseUrl];
    this.results = [];

    // robots.txt 가져오기
    if (this.config.respectRobotsTxt) {
      this.robots = await fetchRobotsTxt(baseUrl, this.config.userAgent);
    }

    // sitemap 우선순위 크롤링
    const sitemapUrls = await findSitemapUrls(baseUrl);
    if (sitemapUrls.length > 0) {
      console.log(`Found ${sitemapUrls.length} sitemap(s), using sitemap-based crawling`);
      return await this.crawlFromSitemap(sitemapUrls);
    }

    // BFS 기반 크롤링
    console.log('No sitemap found, using BFS crawling');
    return await this.crawlBFS();
  }

  /**
   * Sitemap 기반 크롤링
   */
  private async crawlFromSitemap(sitemapUrls: string[]): Promise<CrawlResult[]> {
    const allUrls: string[] = [];

    // 모든 sitemap에서 URL 수집
    for (const sitemapUrl of sitemapUrls) {
      const urls = await parseSitemap(sitemapUrl);
      allUrls.push(...urls);
    }

    // 중복 제거 및 제한 적용
    const uniqueUrls = Array.from(new Set(allUrls)).slice(0, this.config.pageLimit);

    console.log(`Crawling ${uniqueUrls.length} URLs from sitemap`);

    // 병렬 크롤링 (동시 요청 수 제한)
    const batchSize = 5;
    for (let i = 0; i < uniqueUrls.length; i += batchSize) {
      const batch = uniqueUrls.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((url) => this.crawlPage(url))
      );
      this.results.push(...batchResults);

      if (this.results.length >= this.config.pageLimit) {
        break;
      }
    }

    return this.results;
  }

  /**
   * BFS 기반 크롤링
   */
  private async crawlBFS(): Promise<CrawlResult[]> {
    let depth = 0;

    while (this.queue.length > 0 && this.results.length < this.config.pageLimit) {
      if (depth > this.config.crawlDepthLimit) {
        break;
      }

      const currentLevelSize = this.queue.length;
      const currentLevelUrls: string[] = [];

      // 현재 레벨의 모든 URL 처리
      for (let i = 0; i < currentLevelSize && this.results.length < this.config.pageLimit; i++) {
        const url = this.queue.shift();
        if (!url || this.visitedUrls.has(url)) {
          continue;
        }

        this.visitedUrls.add(url);
        currentLevelUrls.push(url);
      }

      // 현재 레벨 병렬 크롤링
      const batchSize = 5;
      for (let i = 0; i < currentLevelUrls.length; i += batchSize) {
        const batch = currentLevelUrls.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map((url) => this.crawlPage(url))
        );

        for (const result of batchResults) {
          this.results.push(result);

          // 성공한 페이지만 다음 레벨에 추가
          if (result.statusCode >= 200 && result.statusCode < 300 && result.html) {
            const parsed = parseHTML(result.html, result.url);
            for (const link of parsed.links.internal) {
              if (
                !this.visitedUrls.has(link) &&
                !this.queue.includes(link) &&
                this.isSameDomain(link, this.config.url)
              ) {
                this.queue.push(link);
              }
            }
          }
        }
      }

      depth++;
    }

    return this.results;
  }

  /**
   * 단일 페이지 크롤링
   */
  private async crawlPage(url: string): Promise<CrawlResult> {
    // robots.txt 확인
    if (this.robots) {
      const urlPath = new URL(url).pathname;
      if (!this.robots.isAllowed(urlPath)) {
        return {
          url,
          statusCode: 403,
          error: 'Disallowed by robots.txt',
        };
      }

      // Crawl delay 적용
      const delay = this.robots.getCrawlDelay?.(urlPath);
      if (delay) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
    }

    // 페이지 페치
    const fetchResult = await fetchPage(url, {
      userAgent: this.config.userAgent,
    });

    return {
      url: fetchResult.url,
      statusCode: fetchResult.statusCode,
      html: fetchResult.html,
      error: fetchResult.error,
    };
  }

  /**
   * 같은 도메인인지 확인
   */
  private isSameDomain(url1: string, url2: string): boolean {
    try {
      const domain1 = new URL(url1).hostname;
      const domain2 = new URL(url2).hostname;
      return domain1 === domain2;
    } catch {
      return false;
    }
  }
}

/**
 * 크롤러 실행 헬퍼
 */
export async function runCrawler(config: CrawlConfig): Promise<CrawlResult[]> {
  const crawler = new Crawler(config);
  return crawler.crawl();
}

