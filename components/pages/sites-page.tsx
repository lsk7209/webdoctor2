/**
 * 사이트 목록 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Site {
  id: string;
  url: string;
  display_name: string | null;
  status: 'pending' | 'crawling' | 'ready' | 'failed';
  last_crawled_at: number | null;
  created_at: number;
  health_score: number | null;
}

export default function SitesPageClient() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'health' | 'status' | 'date'>('name');

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const response = await fetch('/api/sites');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '사이트 목록을 불러오는데 실패했습니다.');
        return;
      }

      setSites(data.sites || []);
    } catch (err) {
      setError('사이트 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Site['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      crawling: 'bg-blue-100 text-blue-800',
      ready: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };

    const labels = {
      pending: '대기 중',
      crawling: '분석 중',
      ready: '완료',
      failed: '실패',
    };

    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          styles[status]
        }`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="text-gray-600">사이트 목록을 불러오는 중...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">사이트 관리</h1>
              <p className="mt-2 text-gray-600">
                등록된 사이트를 관리하고 SEO 감사를 실행하세요.
              </p>
            </div>
            <Link
              href="/sites/new"
              className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              사이트 추가
            </Link>
          </div>

          {/* 검색 및 정렬 */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="사이트 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="name">이름순</option>
              <option value="health">Health 점수순</option>
              <option value="status">상태순</option>
              <option value="date">최근 분석순</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {sites.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">등록된 사이트가 없습니다.</p>
            <Link
              href="/sites/new"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              첫 사이트 추가하기
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sites
              .filter((site) => {
                if (!searchQuery) return true;
                const query = searchQuery.toLowerCase();
                return (
                  site.url.toLowerCase().includes(query) ||
                  (site.display_name && site.display_name.toLowerCase().includes(query))
                );
              })
              .sort((a, b) => {
                switch (sortBy) {
                  case 'name':
                    return (
                      (a.display_name || a.url).localeCompare(b.display_name || b.url) ||
                      a.url.localeCompare(b.url)
                    );
                  case 'health':
                    if (a.health_score === null && b.health_score === null) return 0;
                    if (a.health_score === null) return 1;
                    if (b.health_score === null) return -1;
                    return b.health_score - a.health_score;
                  case 'status':
                    const statusOrder = { ready: 0, crawling: 1, pending: 2, failed: 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  case 'date':
                    if (!a.last_crawled_at && !b.last_crawled_at) return 0;
                    if (!a.last_crawled_at) return 1;
                    if (!b.last_crawled_at) return -1;
                    return b.last_crawled_at - a.last_crawled_at;
                  default:
                    return 0;
                }
              })
              .map((site) => (
              <Link
                key={site.id}
                href={`/sites/${site.id}`}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {site.display_name || site.url}
                  </h3>
                  {getStatusBadge(site.status)}
                </div>
                <p className="text-sm text-gray-600">{site.url}</p>
                {site.health_score !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Health 점수:</span>
                    <span
                      className={`text-sm font-bold ${
                        site.health_score >= 80
                          ? 'text-green-600'
                          : site.health_score >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {site.health_score}
                    </span>
                  </div>
                )}
                {site.last_crawled_at && (
                  <p className="mt-2 text-xs text-gray-500">
                    마지막 분석:{' '}
                    {new Date(site.last_crawled_at * 1000).toLocaleDateString('ko-KR')}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}

