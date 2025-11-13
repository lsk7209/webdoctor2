/**
 * 에러 페이지
 */

'use client';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
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
  );
}

