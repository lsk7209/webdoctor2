import type { Metadata } from "next";
import "./globals.css";

// Cloudflare Pages: 모든 페이지를 동적으로 렌더링
export const dynamic = 'force-dynamic';
export const revalidate = 0; // 캐싱 완전 비활성화
export const dynamicParams = true; // 동적 파라미터 허용

export const metadata: Metadata = {
  title: "웹닥터 - 웹사이트 SEO 무료 진단",
  description: "URL을 입력하고, 데이터 기반의 SEO 최적화를 경험해보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light">
      <body className="font-display">{children}</body>
    </html>
  );
}

