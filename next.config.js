/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Cloudflare Pages 호환성
  // @cloudflare/next-on-pages를 사용할 때는 output 설정 불필요
  // output: 'standalone', // Cloudflare Pages에서는 제거
  
  // Cloudflare Edge Runtime 환경에 최적화
  // 모든 페이지를 동적 렌더링으로 강제 (정적 생성 비활성화)
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
}

module.exports = nextConfig
