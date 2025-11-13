/**
 * @cloudflare/next-on-pages 설정 파일
 * Cloudflare Pages 배포를 위한 Next.js 최적화 설정
 */

import type { NextOnPagesOptions } from '@cloudflare/next-on-pages';

const config: NextOnPagesOptions = {
  // Cloudflare Pages 출력 디렉토리
  outputDir: '.vercel/output/static',
  
  // 정적 파일 처리
  staticAssets: {
    // 정적 파일을 Cloudflare Pages에 최적화
    basePath: '',
  },
  
  // 함수 최적화
  functions: {
    // Edge Runtime 사용
    runtime: 'edge',
  },
  
  // 빌드 최적화
  build: {
    // 정적 생성 완전 비활성화
    staticGeneration: false,
    
    // 동적 렌더링 강제
    dynamicRendering: true,
  },
};

export default config;

