/**
 * 글로벌 에러 페이지
 * Next.js 특수 파일: 반드시 클라이언트 컴포넌트여야 함
 * app/layout.tsx에서 발생한 에러를 처리
 * 
 * 주의: <html> 태그는 Next.js가 자동으로 추가하므로 여기서는 제거
 */

'use client';

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

