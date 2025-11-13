/**
 * 사이트 상세 페이지
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const siteId = params.siteId as string;

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (siteId) {
      fetchSite();
    }
  }, [siteId]);

  const fetchSite = async () => {
    try {
      const response = await fetch(`/api/sites/${siteId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '사이트 정보를 불러오는데 실패했습니다.');
        return;
      }

      setSite(data.site);
    } catch (err) {
      setError('사이트 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

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
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
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
      </div>
    </div>
  );
}

