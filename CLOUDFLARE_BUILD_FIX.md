# Cloudflare Pages 빌드 최적화 가이드

## 문제점

Next.js가 빌드 시 정적 생성을 시도하여 클라이언트 컴포넌트에서 `useContext` 에러가 발생합니다.

## 해결 방법

### 1. 모든 레이아웃에 동적 렌더링 강제

모든 레이아웃 파일에 `export const dynamic = 'force-dynamic'`을 추가했습니다:
- `app/layout.tsx` (루트 레이아웃)
- `app/(site)/layout.tsx` (사이트 레이아웃)
- `app/(plain)/layout.tsx` (플레인 레이아웃)
- `app/(admin)/layout.tsx` (관리자 레이아웃)

### 2. 클라이언트 컴포넌트 처리

클라이언트 컴포넌트(`'use client'`)에서는 `export const dynamic`이 작동하지 않으므로:
- 클라이언트 컴포넌트 페이지에서 `export const dynamic` 제거
- 레이아웃에서 동적 렌더링 처리
- `Navigation` 컴포넌트는 `next/dynamic`으로 동적 import (`ssr: false`)

### 3. 빌드 설정 최적화

`next.config.js`에서:
- `generateBuildId`를 동적으로 생성하여 빌드 캐싱 방지
- 정적 export 비활성화 (기본값 유지)

### 4. Cloudflare Pages 빌드 설정

Cloudflare Pages 대시보드에서:
- **Build command**: `npm run build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (프로젝트 루트)

또는 GitHub Actions를 사용하는 경우:
- `.github/workflows/deploy-cloudflare.yml`이 자동으로 처리

## 빌드 프로세스

```bash
# 1. Next.js 빌드 (정적 생성 시도하지만 동적 렌더링으로 처리됨)
npm run build

# 2. Cloudflare Pages 변환
npm run pages:build

# 3. 배포
wrangler pages deploy .vercel/output/static
```

## 확인 사항

✅ 모든 레이아웃에 `export const dynamic = 'force-dynamic'` 추가됨
✅ 클라이언트 컴포넌트에서 불필요한 `export const dynamic` 제거됨
✅ `Navigation` 컴포넌트 동적 import로 변경됨
✅ `next.config.js` 최적화됨
✅ API Routes는 모두 `export const runtime = 'edge'` 설정됨

## 참고

- Cloudflare Pages는 Edge Runtime에서 동적 렌더링을 완벽하게 지원합니다
- 정적 생성이 필요 없는 경우 동적 렌더링이 더 적합합니다
- 모든 페이지가 요청 시 렌더링되므로 실시간 데이터에 최적화됩니다

