# Cloudflare 배포 가이드

## 개요

이 프로젝트는 Cloudflare Pages (Next.js) + Cloudflare Workers + D1 + Queue + Cron을 사용합니다.

## 아키텍처

- **Frontend**: Next.js (Cloudflare Pages)
- **API Routes**: Next.js API Routes (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Queue**: Cloudflare Queue (크롤 작업)
- **Cron**: Cloudflare Workers (주간 자동 감사)

## 사전 준비

### 1. Cloudflare 계정 설정

1. Cloudflare 대시보드에 로그인
2. Workers & Pages 섹션으로 이동

### 2. D1 데이터베이스 생성

```bash
# 로컬에서 D1 데이터베이스 생성
wrangler d1 create webdoctor-db

# 생성된 database_id를 wrangler.toml에 입력
```

### 3. 마이그레이션 실행

```bash
# 로컬 개발 환경
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql --local

# 프로덕션 환경
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
```

### 4. Queue 생성

```bash
# Queue 생성
wrangler queues create crawl-queue
```

### 5. 환경 변수 설정

Cloudflare 대시보드에서 환경 변수 설정:
- `JWT_SECRET`: JWT 토큰 서명용 시크릿 키

## 배포

### 1. Next.js 빌드 및 배포

```bash
# 빌드
npm run build

# Cloudflare Pages에 배포
wrangler pages deploy .next
```

또는 GitHub 연동을 통해 자동 배포 설정

### 2. Workers 배포

```bash
# 크롤 큐 Consumer 배포
wrangler deploy --config workers/crawl-consumer.toml

# 주간 감사 Cron Worker 배포
wrangler deploy --config workers/cron-weekly-audit.toml
```

## 로컬 개발

### 1. Wrangler 개발 서버 실행

```bash
# D1 로컬 데이터베이스와 함께 개발 서버 실행
wrangler pages dev .next --d1=DB=webdoctor-db --queue=QUEUE=crawl-queue
```

### 2. 환경 변수 설정

`.dev.vars` 파일 생성:
```
JWT_SECRET=your-local-secret-key
```

## 주의사항

1. **Edge Runtime**: 모든 API Routes는 `export const runtime = 'edge'`를 사용해야 합니다.
2. **D1 접근**: D1은 Cloudflare Workers 환경에서만 접근 가능합니다.
3. **Queue**: Queue는 별도 Worker에서 처리해야 합니다.
4. **Cron**: Cron 작업은 별도 Worker로 분리되어야 합니다.
5. **타임아웃**: Edge Runtime은 30초 타임아웃이 있으므로, 긴 작업은 Queue를 사용하세요.

## 모니터링

- Cloudflare 대시보드에서 Workers 로그 확인
- D1 쿼리 성능 모니터링
- Queue 처리 상태 확인

