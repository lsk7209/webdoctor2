/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 호환성
  output: 'standalone',
  experimental: {
    // Edge Runtime 최적화
  },
  // Cloudflare 환경 변수 처리
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
}

module.exports = nextConfig

