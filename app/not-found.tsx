/**
 * 404 Not Found 페이지
 */

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-lg text-gray-600">페이지를 찾을 수 없습니다.</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}

