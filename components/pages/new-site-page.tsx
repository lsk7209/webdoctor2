/**
 * 사이트 등록 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewSitePageClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          display_name: displayName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || '사이트 등록에 실패했습니다.');
        return;
      }

      // 등록 성공 시 사이트 목록으로 이동
      router.push('/sites');
    } catch (err) {
      setError('사이트 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/sites"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← 사이트 목록으로
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">사이트 추가</h1>
          <p className="mt-2 text-gray-600">
            SEO 감사를 받을 사이트를 등록하세요.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700"
              >
                사이트 URL <span className="text-red-500">*</span>
              </label>
              <input
                id="url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com 또는 example.com"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                프로토콜(http:// 또는 https://)을 포함하거나 제외할 수 있습니다.
              </p>
            </div>

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-gray-700"
              >
                표시 이름 (선택사항)
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="예: 메인 사이트"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                사이트 목록에서 표시될 이름입니다. 비워두면 URL이 표시됩니다.
              </p>
            </div>

            <div className="flex items-center justify-end gap-4">
              <Link
                href="/sites"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '등록 중...' : '사이트 등록'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

