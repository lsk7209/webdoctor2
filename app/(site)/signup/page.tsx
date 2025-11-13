/**
 * 회원가입 페이지
 */

// Cloudflare Pages: 동적 렌더링 강제
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import dynamicImport from 'next/dynamic';

// 클라이언트 컴포넌트를 동적으로 로드 (서버 렌더링 비활성화)
const SignupPageClient = dynamicImport(() => import('@/components/pages/signup-page'), {
  ssr: false,
});

export default function SignupPage() {
  return <SignupPageClient />;
}

