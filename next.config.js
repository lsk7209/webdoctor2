/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 호환성
  // @cloudflare/next-on-pages를 사용할 때는 output 설정 불필요
  // output: 'standalone', // Cloudflare Pages에서는 제거
  experimental: {
    // Edge Runtime 최적화
  },
  // Cloudflare 환경 변수 처리
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig
