# 빌드 문제 해결 가이드

## 현재 적용된 최적화

### 1. 정적 생성 완전 비활성화
- ✅ 모든 레이아웃에 `export const dynamic = 'force-dynamic'`
- ✅ 모든 레이아웃에 `export const revalidate = 0`
- ✅ 모든 서버 컴포넌트 페이지에 동적 렌더링 설정
- ✅ 클라이언트 컴포넌트를 서버 컴포넌트 래퍼로 분리

### 2. Next.js 설정 최적화
- ✅ `outputFileTracing: false`
- ✅ `images.unoptimized: true`
- ✅ `compress: false`
- ✅ `swcMinify: true`
- ✅ Webpack 설정으로 Node.js 모듈 제외

### 3. 빌드 프로세스
- ✅ `build:cloudflare` 스크립트 통합
- ✅ GitHub Actions 자동화

## 빌드 실패 시 확인 사항

### 1. 로컬 빌드 테스트
```bash
# 의존성 설치
npm ci

# 빌드 테스트
npm run build:cloudflare
```

### 2. 빌드 로그 확인
GitHub Actions 또는 Cloudflare Pages 대시보드에서 빌드 로그를 확인하고 다음을 확인하세요:

- **정적 생성 시도**: `Static page generation` 관련 메시지
- **모듈 오류**: `Cannot find module` 또는 `Module not found`
- **타입 오류**: TypeScript 컴파일 오류
- **런타임 오류**: `useContext` 또는 `useState` 관련 오류

### 3. 일반적인 문제 해결

#### 문제: 정적 생성 시도
**증상**: `Static page generation` 또는 `getStaticProps` 관련 오류

**해결책**:
1. 모든 페이지 파일에 `export const dynamic = 'force-dynamic'` 확인
2. `next.config.js`에서 `output` 설정이 없는지 확인
3. `generateStaticParams` 함수가 없는지 확인

#### 문제: 모듈을 찾을 수 없음
**증상**: `Cannot find module '@cloudflare/next-on-pages'`

**해결책**:
```bash
npm install --save-dev @cloudflare/next-on-pages@1.12.1
npm ci
```

#### 문제: 타입 오류
**증상**: TypeScript 컴파일 오류

**해결책**:
```bash
npm run type-check
```

#### 문제: 빌드 시간 초과
**증상**: 빌드가 10분 이상 걸리거나 타임아웃

**해결책**:
1. `next.config.js`에서 `outputFileTracing: false` 확인
2. 불필요한 의존성 제거
3. 빌드 캐시 삭제 후 재시도

### 4. Cloudflare Pages 대시보드 설정

#### 빌드 설정 확인
1. **Workers & Pages** > 프로젝트 선택
2. **Settings** > **Builds & deployments**
3. 다음 설정 확인:
   - **Build command**: `npm run build:cloudflare`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/`
   - **Node version**: `20` (또는 `18`)

#### 환경 변수 확인
1. **Settings** > **Environment variables**
2. 다음 변수 설정:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (프로덕션 시크릿 키)

### 5. GitHub Actions 설정

#### Secrets 확인
저장소 > Settings > Secrets and variables > Actions에서 다음 확인:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `JWT_SECRET` (선택사항)

### 6. 최종 확인 체크리스트

- [ ] 모든 레이아웃에 `export const dynamic = 'force-dynamic'` 설정
- [ ] 모든 서버 컴포넌트 페이지에 동적 렌더링 설정
- [ ] 클라이언트 컴포넌트가 서버 컴포넌트 래퍼로 분리됨
- [ ] `next.config.js`에 `outputFileTracing: false` 설정
- [ ] `package.json`에 `build:cloudflare` 스크립트 확인
- [ ] `.vercelignore` 파일이 올바르게 설정됨
- [ ] Cloudflare Pages 대시보드 빌드 설정 확인
- [ ] GitHub Actions Secrets 설정 확인

## 추가 도움

빌드가 계속 실패하는 경우:
1. 전체 빌드 로그를 확인하세요
2. 특정 에러 메시지를 공유해주세요
3. 로컬 빌드 결과를 확인하세요

