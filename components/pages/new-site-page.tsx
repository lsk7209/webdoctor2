/**
 * 사이트 등록 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/utils/api-client';
import { normalizeUrl } from '@/utils/validation';

export default function NewSitePageClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 클라이언트 사이드 URL 검증
  const urlError = useMemo(() => {
    if (!url.trim()) return null;
    const validation = normalizeUrl(url.trim());
    return validation.error || null;
  }, [url]);

  const isFormValid = useMemo(() => {
    return url.trim() && !urlError;
  }, [url, urlError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 클라이언트 사이드 URL 검증
    const urlValidation = normalizeUrl(url.trim());
    if (urlValidation.error) {
      setError(urlValidation.error);
      return;
    }

    setLoading(true);

    // 표준화된 API 클라이언트 사용
    const result = await apiPost<{ site: { id: string } }>(
      '/api/sites',
      {
        url: urlValidation.url,
        display_name: displayName.trim() || undefined,
      },
      { timeout: 30000, retries: 1 }
    );

    if (!result.ok || result.error) {
      setError(result.error || '사이트 등록에 실패했습니다.');
      setLoading(false);
      return;
    }

    // 등록 성공 시 사이트 목록으로 이동
    router.push('/sites');
  }, [url, displayName, router]);

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
                aria-invalid={urlError ? 'true' : 'false'}
                aria-describedby={urlError ? 'url-error' : undefined}
                placeholder="https://example.com 또는 example.com"
                className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 sm:text-sm ${
                  urlError
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
              />
              {urlError && (
                <p id="url-error" className="mt-1 text-xs text-red-600" role="alert">
                  {urlError}
                </p>
              )}
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
                disabled={loading || !isFormValid}
                aria-label="사이트 등록"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

