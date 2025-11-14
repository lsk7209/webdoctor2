/**
 * 사이트 상세 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CrawlStatus from '@/components/crawl-status';
import HealthScore from '@/components/health-score';
import IssuesList from '@/components/issues-list';
import IssueDetailPanel from '@/components/issue-detail-panel';
import { apiGet } from '@/utils/api-client';

interface Site {
  id: string;
  url: string;
  display_name: string | null;
  status: 'pending' | 'crawling' | 'ready' | 'failed';
  last_crawled_at: number | null;
  page_limit: number;
  gsc_connected: boolean;
  ga_connected: boolean;
  naver_connected: boolean;
}

interface HealthScoreData {
  score: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface Issue {
  id: string;
  site_id: string;
  page_url: string | null;
  issue_type: string;
  severity: 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'ignored';
  summary: string;
  description: string | null;
  fix_hint: string | null;
  affected_pages_count: number;
  created_at: number;
  updated_at: number;
}

function SiteDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<Site | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchSite = useCallback(async () => {
    setLoading(true);
    setError('');

    // 표준화된 API 클라이언트 사용
    const result = await apiGet<{ site: Site; healthScore: HealthScoreData | null }>(
      `/api/sites/${siteId}`,
      { timeout: 30000, retries: 1 }
    );

    if (!result.ok || result.error) {
      setError(result.error || '사이트 정보를 불러오는데 실패했습니다.');
      setLoading(false);
      return;
    }

    if (result.data) {
      setSite(result.data.site);
      setHealthScore(result.data.healthScore || null);
    }
    setLoading(false);
  }, [siteId]);

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId, fetchSite]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {error || '사이트를 찾을 수 없습니다.'}
            </p>
          </div>
          <Link
            href="/sites"
            className="mt-4 inline-block text-blue-600 hover:text-blue-500"
          >
            사이트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/sites"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← 사이트 목록으로
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            {site.display_name || site.url}
          </h1>
          <p className="mt-2 text-gray-600">{site.url}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {/* 크롤 진행 상태 */}
            <CrawlStatus siteId={siteId} siteStatus={site.status} />

            {/* Health 점수 */}
            {healthScore && site.status === 'ready' && (
              <div className="mt-6">
                <HealthScore
                  score={healthScore.score}
                  high={healthScore.high}
                  medium={healthScore.medium}
                  low={healthScore.low}
                  total={healthScore.total}
                />
              </div>
            )}

            {/* 이슈 목록 */}
            {site.status === 'ready' && (
              <div className="mt-6">
                <IssuesList
                  siteId={siteId}
                  onIssueClick={(issue) => setSelectedIssue(issue)}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                사이트 정보
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">상태</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {site.status === 'pending' && '대기 중'}
                    {site.status === 'crawling' && '분석 중'}
                    {site.status === 'ready' && '완료'}
                    {site.status === 'failed' && '실패'}
                  </dd>
                </div>
                {site.last_crawled_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      마지막 분석
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(site.last_crawled_at * 1000).toLocaleString('ko-KR')}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    페이지 제한
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {site.page_limit.toLocaleString()}개
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                연동 상태
              </h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Google Search Console
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {site.gsc_connected ? (
                      <span className="text-green-600">연동됨</span>
                    ) : (
                      <span className="text-gray-400">미연동</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Google Analytics 4
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {site.ga_connected ? (
                      <span className="text-green-600">연동됨</span>
                    ) : (
                      <span className="text-gray-400">미연동</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">네이버</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {site.naver_connected ? (
                      <span className="text-green-600">연동됨</span>
                    ) : (
                      <span className="text-gray-400">미연동</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* 이슈 상세 패널 */}
        {selectedIssue && (
          <IssueDetailPanel
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onStatusChange={() => {
              // 이슈 상태 변경 후 목록 새로고침
              setSelectedIssue(null);
              setRefreshTrigger((prev) => prev + 1);
              // 사이트 정보도 다시 불러와서 Health 점수 업데이트
              fetchSite();
            }}
          />
        )}
      </div>
    </div>
  );
}

// 성능 최적화: React.memo로 불필요한 리렌더링 방지
export default memo(SiteDetailPageClient);

