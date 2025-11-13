/**
 * 대시보드 페이지
 * 로그인 필요
 */

import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-2 text-gray-600">
          SEO 감사 결과와 인사이트를 확인하세요.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">사이트 관리</h2>
            <p className="mt-2 text-sm text-gray-600">
              등록된 사이트를 관리하고 SEO 감사를 실행하세요.
            </p>
            <Link
              href="/sites"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              사이트 목록 보기
            </Link>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">SEO 이슈</h2>
            <p className="mt-2 text-sm text-gray-600">
              발견된 SEO 이슈를 확인하고 해결하세요.
            </p>
            <p className="mt-4 text-2xl font-bold text-gray-900">-</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">인사이트</h2>
            <p className="mt-2 text-sm text-gray-600">
              검색 성과와 트래픽 데이터를 확인하세요.
            </p>
            <p className="mt-4 text-2xl font-bold text-gray-900">-</p>
          </div>
        </div>
      </div>
    </div>
  );
}

