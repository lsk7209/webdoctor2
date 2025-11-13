# Cloudflare Pages 최종 최적화 가이드

## 적용된 최적화 사항

### 1. 정적 생성 완전 비활성화

#### `next.config.js`
- ✅ `output` 설정 제거 (동적 렌더링만 허용)
- ✅ `outputFileTracing: false` (정적 파일 추적 비활성화)
- ✅ `images.unoptimized: true` (Cloudflare Pages에서 이미지 최적화 미지원)
- ✅ `generateBuildId` 동적 생성 (빌드 캐싱 방지)

#### 모든 레이아웃
- ✅ `export const dynamic = 'force-dynamic'` (동적 렌더링 강제)
- ✅ `export const revalidate = 0` (캐싱 완전 비활성화)
- ✅ `export const dynamicParams = true` (루트 레이아웃, 동적 파라미터 허용)

#### 서버 컴포넌트 페이지
- ✅ `export const dynamic = 'force-dynamic'`
- ✅ `export const revalidate = 0`

#### 클라이언트 컴포넌트 페이지
- ✅ `export const dynamic` 제거 (작동하지 않음)
- ✅ 레이아웃에서 동적 렌더링 처리
- ✅ `Navigation` 컴포넌트는 `next/dynamic`으로 동적 import (`ssr: false`)

### 2. Cloudflare 환경 최적화

#### D1 데이터베이스
- ✅ `wrangler.toml`에 D1 바인딩 설정
- ✅ 모든 API Routes에서 `getD1Database(request)` 사용
- ✅ Edge Runtime 호환

#### Queue
- ✅ Cloudflare Pages 대시보드에서 Queue 바인딩 설정 필요
- ✅ `workers/crawl-consumer.ts`에서 Queue 처리
- ✅ API Routes에서 Queue 접근

#### Cron
- ✅ `workers/cron-weekly-audit.ts`에서 주간 자동 감사
- ✅ `workers/cron-weekly-audit.wrangler.toml`에 Cron 설정

#### Edge Runtime
- ✅ 모든 API Routes에 `export const runtime = 'edge'`
- ✅ Middleware는 기본적으로 Edge Runtime

### 3. 빌드 프로세스

#### 로컬 빌드
```bash
npm run build
npm run pages:build
```

#### GitHub Actions
- ✅ 자동 배포 설정됨
- ✅ 빌드 → Cloudflare Pages 변환 → 배포

#### Cloudflare Pages 대시보드
- **Build command**: `npm run build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/`

## 확인 사항 체크리스트

### 코드 레벨
- [x] 모든 레이아웃에 `dynamic = 'force-dynamic'` 및 `revalidate = 0`
- [x] 모든 서버 컴포넌트 페이지에 동적 렌더링 설정
- [x] 클라이언트 컴포넌트에서 불필요한 `export const dynamic` 제거
- [x] `Navigation` 컴포넌트 동적 import
- [x] `next.config.js` 최적화
- [x] 모든 API Routes에 `runtime = 'edge'`

### Cloudflare 설정
- [ ] D1 데이터베이스 생성 및 마이그레이션 완료
- [ ] Queue 바인딩 설정 (대시보드에서)
- [ ] Cron Workers 배포 완료
- [ ] 환경 변수 설정 (JWT_SECRET 등)

### 빌드 및 배포
- [x] GitHub Actions 워크플로우 설정 완료
- [x] 빌드 스크립트 최적화
- [ ] 첫 배포 성공 확인

## 문제 해결

### 정적 생성 에러가 계속 발생하는 경우

1. **빌드 캐시 삭제**
   ```bash
   rm -rf .next
   npm run build
   ```

2. **Cloudflare Pages 빌드 설정 확인**
   - Build command가 정확한지 확인
   - Environment variables 설정 확인

3. **로컬에서 빌드 테스트**
   ```bash
   npm run build
   npm run pages:build
   ```

4. **빌드 로그 확인**
   - GitHub Actions 로그 확인
   - Cloudflare Pages 빌드 로그 확인

## 참고

- Cloudflare Pages는 Edge Runtime에서 완벽하게 동적 렌더링을 지원합니다
- 정적 생성이 필요 없는 경우 동적 렌더링이 더 적합합니다
- 모든 페이지가 요청 시 렌더링되므로 실시간 데이터에 최적화됩니다

