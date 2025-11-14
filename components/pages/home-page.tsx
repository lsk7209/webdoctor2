/**
 * 메인 페이지 클라이언트 컴포넌트
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost } from '@/utils/api-client';
import { normalizeUrl } from '@/utils/validation';

export default function HomePageClient() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  // URL 검증 (클라이언트 사이드)
  const urlError = useMemo(() => {
    if (!url.trim()) return null;
    const validation = normalizeUrl(url.trim());
    return validation.error || null;
  }, [url]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      return;
    }

    // 클라이언트 사이드 URL 검증
    const urlValidation = normalizeUrl(trimmedUrl);
    if (urlValidation.error) {
      // 에러는 urlError를 통해 표시됨
      return;
    }

    setLoading(true);

    // 빠른 시작 API 호출 (표준화된 API 클라이언트 사용)
    const result = await apiPost<{ url: string; note?: string }>(
      '/api/sites/quick-start',
      { url: urlValidation.url },
      { timeout: 30000, retries: 1 }
    );

    if (!result.ok || result.error) {
      // 에러 발생 시 로그인 페이지로 이동
      if (result.status === 401 || result.status === 403) {
        router.push(`/login?redirect=${encodeURIComponent(urlValidation.url)}`);
        return;
      }
      // 에러는 나중에 표시
    } else {
      // 성공 시 알림 표시
      setShowNotification(true);
      
      // 5초 후 알림 숨김 및 로그인 페이지로 이동
      setTimeout(() => {
        setShowNotification(false);
        router.push('/login');
      }, 5000);
    }

    setLoading(false);
  }, [url, router]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex items-center justify-between w-full h-16 px-4 md:px-6 bg-white dark:bg-background-dark border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">웹닥터</span>
        </Link>
        <div className="flex items-center gap-4">
          <button
            className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="알림"
          >
            <span className="material-symbols-outlined text-gray-600 dark:text-gray-400">
              notifications
            </span>
          </button>
          <Link
            href="/login"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              로그인
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#121317] dark:text-white font-display">
            웹사이트 SEO, 무료로 시작하세요.
          </h1>
          <p className="mt-4 text-lg text-[#656f86] dark:text-gray-300">
            URL을 입력하고, 데이터 기반의 SEO 최적화를 경험해보세요.
          </p>
          
          <div className="mt-10 max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  link
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.example.com"
                  aria-invalid={urlError ? 'true' : 'false'}
                  aria-describedby={urlError ? 'url-error' : undefined}
                  className={`form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#121317] dark:text-white focus:outline-0 focus:ring-2 border bg-white dark:bg-gray-800 h-14 placeholder:text-[#656f86] p-[15px] pl-12 text-base font-normal leading-normal ${
                    urlError
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-[#dcdfe5] dark:border-gray-600 focus:ring-primary/50 focus:border-primary'
                  }`}
                  required
                />
                {urlError && (
                  <p id="url-error" className="mt-2 text-sm text-red-600" role="alert">
                    {urlError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex min-w-[84px] w-full sm:w-auto cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="truncate">
                  {loading ? '처리 중...' : '무료 진단 시작하기'}
                </span>
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Notification Toast */}
      {showNotification && (
        <div className="fixed bottom-5 right-5 flex items-center gap-3 p-4 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-in slide-in-from-bottom-5 z-50 max-w-md">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <span className="material-symbols-outlined text-sm text-white">
                check
              </span>
            </div>
          </div>
          <div className="flex-grow">
            <p className="font-medium text-[#121317] dark:text-white">
              진단이 시작되었습니다.
            </p>
            <p className="text-sm text-[#656f86] dark:text-gray-400">
              {url || 'example.com'}의 분석이 완료되면 알려드릴게요.
            </p>
          </div>
          <button
            onClick={() => setShowNotification(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}
    </div>
  );
}

