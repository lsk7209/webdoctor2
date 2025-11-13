# GitHub 자동 배포 설정 가이드

## 개요

이 프로젝트는 GitHub Actions를 통해 Cloudflare Pages와 Workers에 자동 배포됩니다.

## 워크플로우 설명

### 1. `deploy-cloudflare.yml`
- **트리거**: `main` 브랜치에 push 또는 PR
- **작업**: Next.js 빌드 → Cloudflare Pages 배포
- **사용 시크릿**:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`

### 2. `deploy-workers.yml`
- **트리거**: `workers/` 디렉토리 변경 또는 수동 실행
- **작업**: Crawl Consumer Worker 및 Cron Worker 배포
- **사용 시크릿**:
  - `CLOUDFLARE_API_TOKEN`
  - `CLOUDFLARE_ACCOUNT_ID`

### 3. `type-check.yml`
- **트리거**: `main` 또는 `develop` 브랜치에 push/PR
- **작업**: TypeScript 타입 체크 및 ESLint 실행

### 4. `build-test.yml`
- **트리거**: `main` 또는 `develop` 브랜치에 push/PR
- **작업**: Next.js 빌드 테스트

### 5. `d1-migration.yml`
- **트리거**: 수동 실행 (workflow_dispatch)
- **작업**: D1 데이터베이스 마이그레이션 실행

## GitHub Secrets 설정

### 필수 Secrets

1. **CLOUDFLARE_API_TOKEN**
   - Cloudflare 대시보드 → My Profile → API Tokens
   - "Create Token" 클릭
   - 권한: Account > Cloudflare Pages > Edit, Workers Scripts > Edit
   - 생성된 토큰을 GitHub Secrets에 추가

2. **CLOUDFLARE_ACCOUNT_ID**
   - Cloudflare 대시보드 → 우측 사이드바에서 Account ID 확인
   - GitHub Secrets에 추가

### 설정 방법

1. GitHub 저장소로 이동
2. Settings > Secrets and variables > Actions
3. "New repository secret" 클릭
4. 각 시크릿 추가:
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: (생성한 API 토큰)
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Secret: (Account ID)

## Cloudflare Pages 설정

### 1. Pages 프로젝트 생성

Cloudflare 대시보드에서:
1. Workers & Pages > Create application > Pages
2. "Connect to Git" 선택
3. GitHub 저장소 연결
4. 프로젝트 이름: `koreseo`

### 2. 빌드 설정

- **Framework preset**: Next.js
- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`
- **Root directory**: `/` (프로젝트 루트)

### 3. 환경 변수 설정

Cloudflare Pages 대시보드에서:
- Settings > Environment variables
- 다음 변수 추가:
  - `JWT_SECRET`: JWT 토큰 서명용 시크릿 키
  - `NODE_ENV`: `production`

### 4. D1 바인딩 설정

Cloudflare Pages 대시보드에서:
- Settings > Functions > D1 Database bindings
- "Add binding" 클릭
- Binding name: `DB`
- Database: `webdoctor-db` 선택

### 5. Queue 바인딩 설정

Cloudflare Pages 대시보드에서:
- Settings > Functions > Queue bindings
- "Add binding" 클릭
- Binding name: `QUEUE`
- Queue: `crawl-queue` 선택

## 배포 프로세스

### 자동 배포

1. **코드 푸시**: `main` 브랜치에 push
2. **GitHub Actions 실행**: 자동으로 빌드 및 배포
3. **Cloudflare Pages 배포**: 빌드 완료 후 자동 배포

### 수동 배포

1. **Workers 배포**: GitHub Actions에서 "Deploy Cloudflare Workers" 워크플로우 수동 실행
2. **D1 마이그레이션**: "D1 Database Migration" 워크플로우 수동 실행

## 배포 확인

### 1. GitHub Actions
- 저장소 > Actions 탭에서 워크플로우 실행 상태 확인

### 2. Cloudflare Pages
- Cloudflare 대시보드 > Workers & Pages > koreseo
- Deployments 탭에서 배포 상태 확인

### 3. Workers
- Cloudflare 대시보드 > Workers & Pages > Workers
- `crawl-consumer`, `weekly-audit` Worker 확인

## 문제 해결

### 배포 실패
1. GitHub Actions 로그 확인
2. Cloudflare API 토큰 권한 확인
3. Account ID 확인

### 빌드 실패
1. 로컬에서 `npm run build` 테스트
2. `npm run pages:build` 테스트
3. 의존성 문제 확인

### D1 연결 실패
1. Cloudflare Pages에서 D1 바인딩 확인
2. 데이터베이스 ID 확인
3. 마이그레이션 실행 확인

## 추가 설정 (선택사항)

### 브랜치별 배포
- `main`: 프로덕션 배포
- `develop`: 프리뷰 배포

워크플로우에서 브랜치 조건을 수정하여 설정 가능합니다.

### 알림 설정
- GitHub Actions에서 실패 시 이메일 알림 설정
- Cloudflare Pages에서 배포 알림 설정

