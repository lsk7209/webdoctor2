/**
 * 사이트 목록 페이지
 */

'use client';

// 클라이언트 컴포넌트에서는 export const dynamic이 작동하지 않음
// 레이아웃에서 처리됨

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Site {
  id: string;
  url: string;
  display_name: string | null;
  status: 'pending' | 'crawling' | 'ready' | 'failed';
  last_crawled_at: number | null;
  created_at: number;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
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
            {sites.map((site) => (
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
      </div>
    </div>
  );
}

