/**
 * 크롤 진행 상태 컴포넌트
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiGet } from '@/utils/api-client';

interface CrawlStatusProps {
  siteId: string;
  siteStatus: 'pending' | 'crawling' | 'ready' | 'failed';
}

interface CrawlStatusData {
  site: {
    id: string;
    status: 'pending' | 'crawling' | 'ready' | 'failed';
    last_crawled_at: number | null;
  };
  crawlJob: {
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    started_at: number | null;
    finished_at: number | null;
    error_message: string | null;
  } | null;
  progress: {
    pages_crawled: number;
    page_limit: number;
  };
}

export default function CrawlStatus({ siteId, siteStatus }: CrawlStatusProps) {
  const [statusData, setStatusData] = useState<CrawlStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = useCallback(async () => {
    // 표준화된 API 클라이언트 사용
    const result = await apiGet<CrawlStatusData>(
      `/api/sites/${siteId}/crawl/status`,
      { timeout: 10000, retries: 1 }
    );

    if (result.ok && result.data) {
      setStatusData(result.data);
    }

    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    if (siteStatus === 'crawling' || siteStatus === 'pending') {
      // 크롤링 중이면 주기적으로 상태 업데이트
      fetchStatus();
      const interval = setInterval(fetchStatus, 3000); // 3초마다 업데이트
      return () => clearInterval(interval);
    } else {
      // 크롤링이 완료되었으면 한 번만 조회
      fetchStatus();
    }
  }, [siteId, siteStatus, fetchStatus]);

  if (loading && !statusData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-2 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!statusData) {
    return null;
  }

  const { crawlJob, progress } = statusData;
  const isCrawling = crawlJob?.status === 'running' || siteStatus === 'crawling';
  const progressPercent =
    progress.page_limit > 0
      ? Math.min((progress.pages_crawled / progress.page_limit) * 100, 100)
      : 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">분석 진행 상태</h2>

      {isCrawling ? (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">진행 중...</span>
              <span className="text-gray-500">
                {progress.pages_crawled} / {progress.page_limit} 페이지
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600">
            페이지를 수집하고 분석하는 중입니다. 잠시만 기다려주세요.
          </p>
          {crawlJob?.started_at && (
            <p className="text-xs text-gray-500">
              시작 시간:{' '}
              {new Date(crawlJob.started_at * 1000).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      ) : crawlJob?.status === 'completed' ? (
        <div className="space-y-2">
          <div className="flex items-center text-green-600">
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">분석 완료</span>
          </div>
          <p className="text-sm text-gray-600">
            {progress.pages_crawled}개의 페이지가 분석되었습니다.
          </p>
          {crawlJob.finished_at && (
            <p className="text-xs text-gray-500">
              완료 시간:{' '}
              {new Date(crawlJob.finished_at * 1000).toLocaleString('ko-KR')}
            </p>
          )}
        </div>
      ) : crawlJob?.status === 'failed' ? (
        <div className="space-y-2">
          <div className="flex items-center text-red-600">
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span className="font-medium">분석 실패</span>
          </div>
          {crawlJob.error_message && (
            <p className="text-sm text-red-600">{crawlJob.error_message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">대기 중입니다.</p>
        </div>
      )}
    </div>
  );
}

