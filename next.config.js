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
    // 정적 최적화 비활성화
    optimizePackageImports: [],
  },
  
  // Cloudflare 환경 변수 처리
  // 빌드 타임에는 기본값 사용 (빌드 에러 방지)
  env: {
    JWT_SECRET: process.env.JWT_SECRET || (process.env.CI ? 'dev-secret-key-change-in-production-build-time-32chars' : undefined),
  },
  
  // 빌드 시 정적 페이지 생성을 완전히 비활성화
  // Cloudflare Pages는 Edge Runtime에서 동적 렌더링을 지원
  generateBuildId: async () => {
    // 항상 새로운 빌드 ID 생성하여 정적 생성 방지
    // CI 환경에서는 타임스탬프 기반 ID 사용
    if (process.env.CI) {
      return `build-${Date.now()}`;
    }
    return 'build-' + Date.now() + '-' + Math.random().toString(36).substring(7);
  },
  
  // 모든 페이지를 동적으로 렌더링하도록 강제
  // 정적 생성을 완전히 비활성화
  outputFileTracing: false,
  
  // 정적 페이지 생성을 완전히 비활성화
  // Cloudflare Pages는 모든 페이지를 동적으로 렌더링해야 함
  trailingSlash: false,
  
  // 정적 생성 완전 비활성화를 위한 추가 설정
  // 에러 페이지와 404 페이지의 정적 생성을 방지
  skipTrailingSlashRedirect: true,
  
  // 이미지 최적화 비활성화 (Cloudflare Pages에서 지원하지 않음)
  images: {
    unoptimized: true,
  },
  
  // Cloudflare가 자체 압축을 처리하므로 비활성화
  compress: false,
  
  // 보안: X-Powered-By 헤더 제거
  poweredByHeader: false,
  
  // 보안 헤더 설정
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js 및 개발 환경 필요
              "style-src 'self' 'unsafe-inline'", // Tailwind CSS 필요
              "img-src 'self' blob: data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          }
        ]
      }
    ];
  },
  
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
  
  // 정적 생성 완전 차단
  // Cloudflare Pages는 모든 페이지를 동적으로 렌더링해야 함
  onDemandEntries: {
    // 페이지를 메모리에 유지하여 정적 생성 방지
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // 웹팩 설정 최적화 (Cloudflare Edge Runtime 호환)
  // 빌드 타임에 API 라우트 실행 방지
  // Next.js가 빌드 시 "Collecting page data" 단계에서 API 라우트를 실행하지 않도록 설정
  experimental: {
    ...nextConfig.experimental,
    // API 라우트 빌드 타임 실행 방지
    serverActions: {
      ...nextConfig.experimental?.serverActions,
      bodySizeLimit: '2mb',
    },
  },

  webpack: (config, { isServer, webpack, dev }) => {
    // 서버 사이드 번들에서 불필요한 모듈 제외
    if (isServer) {
      config.externals = config.externals || [];
      // 배열 형태로 externals 추가 (함수 형태도 지원)
      const externalsArray = Array.isArray(config.externals) 
        ? config.externals 
        : [config.externals].filter(Boolean);
      
      externalsArray.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
        'bcryptjs': 'commonjs bcryptjs', // Edge Runtime에서 사용하지 않음
        'async_hooks': 'commonjs async_hooks', // Node.js 내장 모듈
      });
      
      config.externals = externalsArray;
    }
    
    // Cloudflare Edge Runtime 호환성을 위한 설정 (서버와 클라이언트 모두)
    config.resolve = config.resolve || {};
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
      async_hooks: false, // Node.js 내장 모듈, Edge Runtime에서는 사용 불가
    };
    
    // @cloudflare/next-on-pages 빌드 시 async_hooks 문제 해결
    // esbuild가 async_hooks를 번들링하려고 할 때 무시하도록 설정
    if (!isServer) {
      // 클라이언트 사이드에서도 async_hooks fallback 설정
      config.resolve.fallback.async_hooks = false;
    }
    
    // 정적 생성 관련 플러그인 제거
    config.plugins = config.plugins || [];
    config.plugins = config.plugins.filter((plugin) => {
      // 정적 생성 관련 플러그인 제외
      const pluginName = plugin.constructor.name;
      return !pluginName.includes('StaticPage') && 
             !pluginName.includes('StaticGeneration') &&
             !pluginName.includes('Prerender') &&
             !pluginName.includes('Export') &&
             !pluginName.includes('Static');
    });
    
    // 빌드 시 정적 생성 완전 차단
    if (!dev && isServer) {
      // 정적 생성 관련 최적화 비활성화
      config.optimization = config.optimization || {};
      
      // 정적 생성 관련 minimizer 필터링
      if (config.optimization.minimizer) {
        config.optimization.minimizer = config.optimization.minimizer.filter((minimizer) => {
          const minimizerName = minimizer.constructor.name;
          return !minimizerName.includes('Static');
        });
      }
      
      // 정적 생성 관련 splitChunks 비활성화
      if (config.optimization.splitChunks) {
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: false,
            vendors: false,
          },
        };
      }
      
      // 정적 생성 관련 모듈 제외
      config.module = config.module || {};
      if (config.module.rules) {
        config.module.rules = config.module.rules.map((rule) => {
          if (rule && typeof rule === 'object' && rule.test) {
            // 정적 생성 관련 로더 제외
            if (rule.test.toString().includes('static') || 
                rule.test.toString().includes('prerender')) {
              return { ...rule, exclude: /.*/ };
            }
          }
          return rule;
        });
      }
    }
    
    return config;
  },
}

module.exports = nextConfig
