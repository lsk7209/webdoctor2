# 빌드 오류 수정 완료 ✅

## 수정된 내용

### 1. Middleware Runtime 수정
- **파일**: `middleware.ts`
- **변경**: `runtime = 'edge'` → `runtime = 'experimental-edge'`
- **이유**: Next.js 14.2.33에서는 middleware에서 `experimental-edge`를 사용해야 합니다.

### 2. wrangler.toml Pages 설정 추가
- **파일**: `wrangler.toml`
- **추가**: `pages_build_output_dir = ".vercel/output/static"`
- **이유**: Cloudflare Pages가 wrangler.toml을 읽을 때 필요합니다.

## Cloudflare Pages 빌드 설정 확인

현재 빌드 로그를 보면 Cloudflare Pages가 직접 빌드를 시도하고 있습니다. 다음 설정을 확인하세요:

### Cloudflare Pages 대시보드 설정

1. **Workers & Pages** > **koreseo** 프로젝트 선택
2. **Settings** > **Builds & deployments** 이동
3. **Build configuration** 확인:
   - **Build command**: `npm run build && npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (프로젝트 루트)

### 또는 GitHub Actions 사용 (권장)

GitHub Actions를 통해 배포하면 자동으로 올바른 빌드 순서를 따릅니다:
1. `npm run build` (Next.js 빌드)
2. `npm run pages:build` (Cloudflare Pages 변환)
3. `.vercel/output/static` 디렉토리 배포

## 다음 단계

1. **코드 커밋 및 푸시**:
   ```bash
   git add .
   git commit -m "fix: middleware runtime 및 wrangler.toml Pages 설정 추가"
   git push origin main
   ```

2. **GitHub Actions 확인**:
   - 저장소 > Actions 탭에서 자동 배포 확인
   - 빌드가 성공하는지 확인

3. **Cloudflare Pages 대시보드 확인**:
   - 빌드 로그에서 오류가 해결되었는지 확인
   - 배포가 성공하는지 확인

## 참고

- API Routes는 여전히 `runtime = 'edge'`를 사용합니다 (문제 없음)
- Middleware만 `experimental-edge`를 사용합니다
- wrangler.toml은 Workers와 Pages 모두에서 사용됩니다

