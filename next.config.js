/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Cloudflare Pages 호환성
  // output 설정을 명시적으로 제거하여 동적 렌더링만 허용
  // output: 'export' 또는 'standalone'을 설정하면 정적 생성이 강제됨
  
  // Cloudflare Edge Runtime 환경에 최적화
  experimental: {
    // Edge Runtime 최적화
  },
  
  // Cloudflare 환경 변수 처리
  env: {
    JWT_SECRET: process.env.JWT_SECRET,
  },
  
  // 빌드 시 정적 페이지 생성을 완전히 비활성화
  // Cloudflare Pages는 Edge Runtime에서 동적 렌더링을 지원
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  
  // 모든 페이지를 동적으로 렌더링하도록 강제
  // 정적 생성을 완전히 비활성화
  outputFileTracing: false,
  
  // 이미지 최적화 비활성화 (Cloudflare Pages에서 지원하지 않음)
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
