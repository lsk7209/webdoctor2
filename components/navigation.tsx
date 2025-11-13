/**
 * 네비게이션 컴포넌트
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path);
  };

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              KoreSEO
            </Link>
            <div className="ml-10 flex space-x-4">
              <Link
                href="/dashboard"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                대시보드
              </Link>
              <Link
                href="/sites"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive('/sites')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                사이트
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/settings/profile"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              설정
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}

