# Cloudflare Pages 빌드 오류 수정 가이드

## 문제점

Cloudflare Pages가 자동 빌드를 시도할 때 다음 오류가 발생했습니다:

```
Error: Page /middleware provided runtime 'edge', the edge runtime for rendering is currently experimental. Use runtime 'experimental-edge' instead.
```

## 해결 방법

### 1. Middleware Runtime 수정 ✅

**파일**: `middleware.ts`

Next.js 14.2.33에서는 middleware에서 runtime을 명시하지 않는 것이 가장 안전합니다. middleware는 기본적으로 Edge Runtime에서 실행됩니다.

**변경 사항**:
- `export const runtime = 'experimental-edge'` 제거
- runtime 선언 없이 사용 (기본값: Edge Runtime)

### 2. Cloudflare Pages 빌드 설정

Cloudflare Pages 대시보드에서 빌드 설정을 변경해야 합니다:

#### 방법 1: 대시보드에서 설정 (권장)

1. **Cloudflare 대시보드** 접속
2. **Workers & Pages** > **koreseo** 프로젝트 선택
3. **Settings** > **Builds & deployments** 이동
4. **Build configuration** 수정:
   - **Build command**: `npm run build && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (프로젝트 루트)
5. **Environment variables** 확인:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (프로덕션 시크릿 키)

#### 방법 2: GitHub Actions 사용 (자동 배포)

GitHub Actions를 사용하면 자동으로 올바른 빌드 순서를 따릅니다:

1. `.github/workflows/deploy-cloudflare.yml`이 이미 설정되어 있습니다
2. GitHub에 코드를 푸시하면 자동으로 배포됩니다
3. 필요한 Secrets 설정:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### 3. 빌드 프로세스

올바른 빌드 순서:

```bash
# 1. Next.js 빌드
npm run build

# 2. Cloudflare Pages 변환 (@cloudflare/next-on-pages)
npm run pages:build

# 3. 결과물: .vercel/output/static 디렉토리
```

### 4. D1 데이터베이스 바인딩

Cloudflare Pages 대시보드에서:

1. **Settings** > **Functions** > **D1 Database bindings**
2. **Add binding** 클릭
3. 설정:
   - **Binding name**: `DB`
   - **Database**: `webdoctor-db` 선택

### 5. Queue 바인딩

Cloudflare Pages 대시보드에서:

1. **Settings** > **Functions** > **Queue bindings**
2. **Add binding** 클릭
3. 설정:
   - **Binding name**: `QUEUE`
   - **Queue**: `crawl-queue` 선택

## 확인 사항

- [x] middleware.ts에서 runtime 선언 제거
- [ ] Cloudflare Pages 빌드 명령어 설정 (`npm run build && npm run pages:build`)
- [ ] 빌드 출력 디렉토리 설정 (`.vercel/output/static`)
- [ ] D1 데이터베이스 바인딩 설정
- [ ] Queue 바인딩 설정
- [ ] 환경 변수 설정 (JWT_SECRET)

## 참고

- API Routes는 여전히 `runtime = 'edge'`를 사용합니다 (문제 없음)
- Middleware는 runtime 선언 없이 사용 (기본값: Edge Runtime)
- `@cloudflare/next-on-pages`는 Next.js를 Cloudflare Pages에 배포하기 위한 공식 도구입니다

