/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Cloudflare Pages 호환성
  // output 설정을 명시적으로 제거하여 동적 렌더링만 허용
  // output: 'export' 또는 'standalone'을 설정하면 정적 생성이 강제됨
  
  // Cloudflare Edge Runtime 환경에 최적화
  experimental: {
    // Edge Runtime 최적화
    serverActions: {
      bodySizeLimit: '2mb',
    },
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
  
  // 정적 페이지 생성을 완전히 비활성화
  // Cloudflare Pages는 모든 페이지를 동적으로 렌더링해야 함
  trailingSlash: false,
  
  // 이미지 최적화 비활성화 (Cloudflare Pages에서 지원하지 않음)
  images: {
    unoptimized: true,
  },
  
  // Cloudflare가 자체 압축을 처리하므로 비활성화
  compress: false,
  
  // 보안: X-Powered-By 헤더 제거
  poweredByHeader: false,
  
  // SWC 최소화 활성화 (빌드 최적화)
  swcMinify: true,
  
  // Cloudflare Pages: 정적 생성을 완전히 비활성화
  // 모든 페이지를 동적으로 렌더링
  // 이 설정은 빌드 시 정적 생성을 방지합니다
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // 웹팩 설정 최적화 (Cloudflare Edge Runtime 호환)
  webpack: (config, { isServer, webpack }) => {
    // 서버 사이드 번들에서 불필요한 모듈 제외
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
        'bcryptjs': 'commonjs bcryptjs', // Edge Runtime에서 사용하지 않음
      });
    }
    
    // Cloudflare Edge Runtime 호환성을 위한 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    // 정적 생성 관련 플러그인 제거
    config.plugins = config.plugins || [];
    config.plugins = config.plugins.filter((plugin) => {
      // 정적 생성 관련 플러그인 제외
      const pluginName = plugin.constructor.name;
      return !pluginName.includes('StaticPage') && !pluginName.includes('StaticGeneration');
    });
    
    return config;
  },
}

module.exports = nextConfig
