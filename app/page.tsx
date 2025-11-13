import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">KoreSEO</h1>
        <p className="text-lg mb-8">한국형 SEO SaaS 플랫폼</p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
          >
            회원가입
          </Link>
        </div>
      </div>
    </main>
  );
}

