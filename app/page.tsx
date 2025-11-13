/**
 * 메인 페이지
 * 웹닥터 - SEO 진단 시작 페이지
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      return;
    }

    setLoading(true);

    try {
      // 빠른 시작 API 호출
      const response = await fetch('/api/sites/quick-start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 에러 발생 시 로그인 페이지로 이동
        if (response.status === 401 || response.status === 403) {
          router.push(`/login?redirect=${encodeURIComponent(url)}`);
          return;
        }
        throw new Error(data.error || '진단 시작에 실패했습니다.');
      }

      // 성공 시 알림 표시
      setShowNotification(true);
      
      // 5초 후 알림 숨김
      setTimeout(() => {
        setShowNotification(false);
        // 로그인 페이지로 이동 (실제로는 대시보드로 이동)
        router.push('/login');
      }, 5000);
    } catch (error) {
      console.error('Error:', error);
      // 에러 발생 시에도 알림 표시 (사용자 경험)
      setShowNotification(true);
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

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
                  className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#121317] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-[#dcdfe5] dark:border-gray-600 bg-white dark:bg-gray-800 focus:border-primary h-14 placeholder:text-[#656f86] p-[15px] pl-12 text-base font-normal leading-normal"
                  required
                />
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
