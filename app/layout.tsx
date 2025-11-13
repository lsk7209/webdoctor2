import type { Metadata } from "next";
import "./globals.css";

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

