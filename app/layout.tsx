import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KoreSEO - 한국형 SEO SaaS",
  description: "URL만 넣으면 한국 환경(구글+네이버)에 맞는 SEO 감사·리포트를 자동으로 받는 SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

