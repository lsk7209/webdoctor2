# Cloudflare Pages 최종 체크리스트

## ✅ 코드 레벨 최적화 완료

### 1. 정적 생성 완전 비활성화
- [x] `next.config.js`: `outputFileTracing: false` 설정
- [x] `next.config.js`: `images.unoptimized: true` 설정
- [x] 모든 레이아웃에 `export const dynamic = 'force-dynamic'`
- [x] 모든 레이아웃에 `export const revalidate = 0`
- [x] 루트 레이아웃에 `export const dynamicParams = true`
- [x] 서버 컴포넌트 페이지에 동적 렌더링 설정
- [x] 클라이언트 컴포넌트에서 불필요한 `export const dynamic` 제거

### 2. 클라이언트 컴포넌트 최적화
- [x] `Navigation` 컴포넌트를 `next/dynamic`으로 동적 import
- [x] `ssr: false`로 서버 렌더링 비활성화
- [x] 모든 클라이언트 컴포넌트 페이지 정리

### 3. Edge Runtime 설정
- [x] 모든 API Routes에 `export const runtime = 'edge'`
- [x] Middleware는 기본적으로 Edge Runtime

### 4. 빌드 설정
- [x] `package.json`에 `build:cloudflare` 스크립트 추가
- [x] GitHub Actions 워크플로우 설정 완료
- [x] `.vercelignore` 파일 생성

## 🔧 Cloudflare 대시보드 설정 필요

### 1. D1 데이터베이스
```bash
# 로컬에서 실행
wrangler d1 create webdoctor-db
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
```

또는 Cloudflare 대시보드에서:
1. Workers & Pages > D1 > Create database
2. Database name: `webdoctor-db`
3. Database ID: `bb9a7b36-f877-4d4b-80cf-bf0e1993ca4e` (이미 생성된 경우)
4. Pages 프로젝트에 바인딩 추가

### 2. Queue 설정
Cloudflare Pages 대시보드에서:
1. 프로젝트 선택 > Settings > Functions
2. Queue bindings 섹션에서:
   - Binding name: `QUEUE`
   - Queue: `crawl-queue` (생성 필요)

Queue 생성:
```bash
wrangler queues create crawl-queue
```

### 3. Cron Workers 배포
```bash
# Crawl Consumer Worker
cd workers
wrangler deploy crawl-consumer.ts --config crawl-consumer.wrangler.toml

# Weekly Audit Cron Worker
wrangler deploy cron-weekly-audit.ts --config cron-weekly-audit.wrangler.toml
```

### 4. 환경 변수 설정
Cloudflare Pages 대시보드에서:
1. 프로젝트 선택 > Settings > Environment variables
2. Production 환경에 추가:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (강력한 시크릿 키)

### 5. 빌드 설정
Cloudflare Pages 대시보드에서:
1. 프로젝트 선택 > Settings > Builds & deployments
2. Build configuration:
   - **Build command**: `npm run build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (프로젝트 루트)
   - **Node version**: `20`

## 📋 빌드 프로세스 확인

### 로컬 빌드 테스트
```bash
# 1. 의존성 설치
npm ci

# 2. Next.js 빌드
npm run build

# 3. Cloudflare Pages 변환
npm run pages:build

# 4. 빌드 출력 확인
ls -la .vercel/output/static
```

### GitHub Actions 빌드
1. GitHub 저장소 > Actions 탭 확인
2. 빌드 로그에서 에러 확인
3. 성공 시 Cloudflare Pages에 자동 배포

## 🐛 문제 해결

### 정적 생성 에러가 계속 발생하는 경우

1. **빌드 캐시 완전 삭제**
   ```bash
   rm -rf .next
   rm -rf .vercel
   rm -rf node_modules/.cache
   npm run build
   ```

2. **Cloudflare Pages 빌드 설정 재확인**
   - Build command: `npm run build` (단일 명령)
   - Build output directory: `.vercel/output/static`
   - Environment variables 확인

3. **로컬 빌드 테스트**
   ```bash
   NODE_ENV=production npm run build
   npm run pages:build
   ```

4. **빌드 로그 분석**
   - GitHub Actions 로그 확인
   - Cloudflare Pages 빌드 로그 확인
   - 에러 메시지의 정확한 위치 확인

### 빌드가 성공하지만 배포가 실패하는 경우

1. **Cloudflare Pages Functions 확인**
   - API Routes가 Functions로 변환되었는지 확인
   - D1 바인딩이 올바른지 확인

2. **환경 변수 확인**
   - `JWT_SECRET` 설정 확인
   - D1 데이터베이스 바인딩 확인

3. **Queue 바인딩 확인**
   - Queue가 생성되었는지 확인
   - Pages 프로젝트에 바인딩되었는지 확인

## ✅ 최종 확인 사항

### 코드
- [x] 모든 레이아웃 최적화 완료
- [x] 모든 페이지 최적화 완료
- [x] API Routes Edge Runtime 설정 완료
- [x] 빌드 설정 최적화 완료

### Cloudflare 설정
- [ ] D1 데이터베이스 생성 및 바인딩
- [ ] Queue 생성 및 바인딩
- [ ] Cron Workers 배포
- [ ] 환경 변수 설정
- [ ] 빌드 설정 확인

### 배포
- [ ] 로컬 빌드 테스트 성공
- [ ] GitHub Actions 빌드 성공
- [ ] Cloudflare Pages 배포 성공
- [ ] 프로덕션 환경 동작 확인

## 📝 참고

- Cloudflare Pages는 Edge Runtime에서 완벽하게 동적 렌더링을 지원합니다
- 정적 생성이 필요 없는 경우 동적 렌더링이 더 적합합니다
- 모든 페이지가 요청 시 렌더링되므로 실시간 데이터에 최적화됩니다
- D1, Queue, Cron은 Cloudflare의 네이티브 서비스로 완벽하게 통합됩니다

