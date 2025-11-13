// Cloudflare Pages: 모든 페이지를 동적으로 렌더링
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 캐싱 완전 비활성화

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

