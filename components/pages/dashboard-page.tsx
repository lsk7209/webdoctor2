/**
 * 대시보드 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import Link from 'next/link';
import { apiGet } from '@/utils/api-client';

interface DashboardStats {
  sites: {
    total: number;
    ready: number;
    crawling: number;
    pending: number;
    failed: number;
  };
  issues: {
    total: number;
    high: number;
    medium: number;
    low: number;
  };
  healthScore: number | null;
}

function DashboardPageClient() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');

    // 표준화된 API 클라이언트 사용
    const result = await apiGet<DashboardStats>('/api/dashboard/stats', {
      timeout: 30000,
      retries: 1,
    });

    if (!result.ok || result.error) {
      setError(result.error || '대시보드 통계를 불러오는데 실패했습니다.');
      setLoading(false);
      return;
    }

    setStats(result.data);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const healthScoreColor =
    stats.healthScore === null
      ? 'text-gray-600'
      : stats.healthScore >= 80
        ? 'text-green-600'
        : stats.healthScore >= 50
          ? 'text-yellow-600'
          : 'text-red-600';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">SEO 감사 결과와 인사이트를 확인하세요.</p>

        {/* 통계 카드 */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* 사이트 통계 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">사이트</h2>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">{stats.sites.total}</div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>완료:</span>
                  <span className="font-medium text-green-600">{stats.sites.ready}</span>
                </div>
                <div className="flex justify-between">
                  <span>분석 중:</span>
                  <span className="font-medium text-blue-600">{stats.sites.crawling}</span>
                </div>
                <div className="flex justify-between">
                  <span>대기 중:</span>
                  <span className="font-medium text-gray-600">{stats.sites.pending}</span>
                </div>
                {stats.sites.failed > 0 && (
                  <div className="flex justify-between">
                    <span>실패:</span>
                    <span className="font-medium text-red-600">{stats.sites.failed}</span>
                  </div>
                )}
              </div>
            </div>
            <Link
              href="/sites"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              사이트 관리
            </Link>
          </div>

          {/* 이슈 통계 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">SEO 이슈</h2>
            <div className="mt-4">
              <div className="text-3xl font-bold text-gray-900">{stats.issues.total}</div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>심각:</span>
                  <span className="font-medium text-red-600">{stats.issues.high}</span>
                </div>
                <div className="flex justify-between">
                  <span>보통:</span>
                  <span className="font-medium text-yellow-600">{stats.issues.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span>낮음:</span>
                  <span className="font-medium text-blue-600">{stats.issues.low}</span>
                </div>
              </div>
            </div>
            {stats.issues.total > 0 && (
              <Link
                href="/sites"
                className="mt-4 inline-block rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                이슈 확인하기
              </Link>
            )}
          </div>

          {/* Health 점수 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">평균 Health 점수</h2>
            <div className="mt-4">
              {stats.healthScore === null ? (
                <div className="text-3xl font-bold text-gray-400">-</div>
              ) : (
                <>
                  <div className={`text-4xl font-bold ${healthScoreColor}`}>
                    {stats.healthScore}
                  </div>
                  <div className="mt-2">
                    <div className="h-2 w-full rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full ${
                          stats.healthScore >= 80
                            ? 'bg-green-500'
                            : stats.healthScore >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${stats.healthScore}%` }}
                      ></div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              {stats.healthScore === null
                ? '완료된 사이트가 없습니다.'
                : stats.healthScore >= 80
                  ? '전반적으로 좋은 상태입니다.'
                  : stats.healthScore >= 50
                    ? '개선이 필요합니다.'
                    : '즉시 조치가 필요합니다.'}
            </p>
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">빠른 시작</h3>
            <p className="mt-2 text-sm text-gray-600">
              새로운 사이트를 등록하고 SEO 감사를 시작하세요.
            </p>
            <Link
              href="/sites/new"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              사이트 추가하기
            </Link>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">최근 활동</h3>
            <p className="mt-2 text-sm text-gray-600">
              등록된 사이트의 크롤링 상태와 이슈를 확인하세요.
            </p>
            <Link
              href="/sites"
              className="mt-4 inline-block rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              사이트 목록 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// 성능 최적화: React.memo로 불필요한 리렌더링 방지
export default memo(DashboardPageClient);

