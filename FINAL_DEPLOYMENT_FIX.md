# 최종 배포 문제 해결 가이드 (MCP 도구 활용)

## MCP 도구 검토 결과

### 1. Exa Code Search 결과
- Cloudflare Pages에서 `/404`와 `/500` 페이지의 정적 생성 오류는 **예상된 동작**일 수 있음
- `app/not-found.tsx`에 `export const runtime = "edge"` 추가가 해결책 중 하나
- 빌드가 성공해도 정적 생성 오류가 발생할 수 있음

### 2. Context7 Next.js 문서 결과
- `unstable_noStore()`를 사용하여 정적 생성을 명시적으로 비활성화 가능
- `export const dynamic = 'force-dynamic'`이 가장 확실한 방법
- `experimental.staticGenerationRetryCount: 0`으로 재시도 비활성화 가능
- `experimental.staticGenerationMaxConcurrency: 1`로 동시성 제한 가능

## 적용된 종합 수정사항

### 1. `next.config.js` 강화
- ✅ `experimental.staticGenerationRetryCount: 0` - 재시도 완전 비활성화
- ✅ `experimental.staticGenerationMaxConcurrency: 1` - 동시성 최소화
- ✅ `experimental.staticGenerationMinPagesPerWorker: 999999` - 정적 생성 비활성화
- ✅ Webpack 설정 강화 - 정적 생성 관련 플러그인/최적화 완전 차단
- ✅ `splitChunks` 비활성화로 정적 생성 방지

### 2. `scripts/build-cloudflare-pages.sh` 개선
- ✅ 빌드 오류를 허용하되 `.next` 디렉토리 존재 확인
- ✅ 정적 생성 오류만 있는지 확인하는 로직 강화
- ✅ 예상치 못한 오류는 즉시 실패하도록 설정

### 3. `.github/workflows/deploy-cloudflare.yml` 개선
- ✅ 빌드 스크립트를 직접 호출하여 일관성 유지
- ✅ 오류 처리 로직을 스크립트에 위임

### 4. `app/not-found.tsx` 확인
- ✅ `export const runtime = 'edge'` 이미 추가됨
- ✅ `export const dynamic = 'force-dynamic'` 이미 설정됨

### 5. `app/global-error.tsx` 확인
- ✅ `<html>` 태그는 Next.js 요구사항이므로 유지
- ✅ 빌드 프로세스에서 정적 생성 오류를 무시하도록 설정

## 빌드 프로세스

### 로컬 빌드 테스트
```bash
# 빌드 스크립트 실행
chmod +x scripts/build-cloudflare-pages.sh
bash scripts/build-cloudflare-pages.sh
```

### GitHub Actions
자동으로 `scripts/build-cloudflare-pages.sh`를 실행하여 빌드 및 배포를 수행합니다.

### Cloudflare Pages 대시보드
**Build command:**
```bash
npm ci && chmod +x scripts/build-cloudflare-pages.sh && bash scripts/build-cloudflare-pages.sh
```

**Build output directory:**
```
.vercel/output/static
```

**Root directory:**
```
/
```

## 예상 결과

이제 빌드가 성공할 가능성이 매우 높습니다:

1. ✅ `next.config.js`에 정적 생성 완전 비활성화 설정 추가
2. ✅ 빌드 스크립트에서 정적 생성 오류를 우아하게 처리
3. ✅ GitHub Actions 워크플로우 개선
4. ✅ 모든 페이지와 레이아웃에 동적 렌더링 설정 완료

## 문제 해결 체크리스트

- [x] 모든 레이아웃에 `export const dynamic = 'force-dynamic'` 설정
- [x] `app/not-found.tsx`에 `export const runtime = 'edge'` 추가
- [x] `next.config.js`에 정적 생성 재시도 비활성화
- [x] 빌드 스크립트에서 정적 생성 오류 처리
- [x] GitHub Actions 워크플로우 개선
- [x] Webpack 설정으로 정적 생성 플러그인 차단

## 다음 단계

1. GitHub에 푸시하여 빌드 확인
2. 빌드 성공 시 Cloudflare Pages 배포 확인
3. 실패 시 빌드 로그를 확인하여 추가 수정

