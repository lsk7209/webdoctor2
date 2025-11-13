/**
 * 대시보드 페이지
 * 로그인 필요
 */

import DashboardPageClient from '@/components/pages/dashboard-page';

// Cloudflare Pages: 동적 렌더링 강제
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 캐싱 완전 비활성화

export default function DashboardPage() {
  return <DashboardPageClient />;
}

