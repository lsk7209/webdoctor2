/**
 * 글로벌 에러 페이지
 * Next.js 특수 파일: 반드시 클라이언트 컴포넌트여야 함
 * app/layout.tsx에서 발생한 에러를 처리
 * 
 * 주의: global-error.tsx는 Next.js 14에서 <html>과 <body> 태그를 포함해야 하는 유일한 파일입니다.
 * 정적 생성이 되지 않도록 명시적으로 설정합니다.
 */

'use client';

// 정적 생성 완전 비활성화
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">오류가 발생했습니다</h1>
            <p className="mt-4 text-lg text-gray-600">{error.message}</p>
            <button
              onClick={reset}
              className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              다시 시도
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

