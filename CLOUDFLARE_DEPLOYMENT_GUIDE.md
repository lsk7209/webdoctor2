# Cloudflare 배포 가이드 (최종)

## 아키텍처 개요

- **Frontend**: Next.js (Cloudflare Pages)
- **API Routes**: Next.js API Routes (Edge Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Queue**: Cloudflare Queue (크롤 작업)
- **Cron**: Cloudflare Workers (주간 자동 감사)

## 배포 방법

### 옵션 1: @cloudflare/next-on-pages 사용 (권장)

Next.js를 Cloudflare Pages에 배포하는 공식 방법입니다.

#### 1. 패키지 설치
```bash
npm install -D @cloudflare/next-on-pages
```

#### 2. 빌드 및 배포
```bash
# 빌드
npm run build
npm run pages:build

# 배포
wrangler pages deploy .vercel/output/static
```

#### 3. D1 바인딩 설정
Cloudflare Pages 대시보드에서:
- Settings > Functions > D1 Database bindings
- Binding name: `DB`
- Database: `webdoctor-db` 선택

#### 4. 환경 변수 설정
Cloudflare Pages 대시보드에서:
- Settings > Environment variables
- `JWT_SECRET` 추가

### 옵션 2: Cloudflare Pages Functions 직접 사용

Next.js API Routes를 Cloudflare Pages Functions로 변환합니다.

## D1 데이터베이스 설정

### 1. 데이터베이스 생성
```bash
wrangler d1 create webdoctor-db
```

### 2. database_id 설정
생성된 `database_id`를 다음 파일에 입력:
- `wrangler.toml` (Workers용)
- Cloudflare Pages 대시보드 (Pages용)

### 3. 마이그레이션 실행
```bash
# 프로덕션
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql

# 로컬 개발
wrangler d1 execute webdoctor-db --local --file=./migrations/0001_initial_schema.sql
```

## Queue 설정

### 1. Queue 생성
```bash
wrangler queues create crawl-queue
```

### 2. Queue Consumer Worker 배포
```bash
wrangler deploy --config workers/crawl-consumer.wrangler.toml
```

### 3. Pages에서 Queue 바인딩
Cloudflare Pages 대시보드에서:
- Settings > Functions > Queue bindings
- Binding name: `QUEUE`
- Queue: `crawl-queue` 선택

## Cron 작업 설정

### 1. Cron Worker 배포
```bash
wrangler deploy --config workers/cron-weekly-audit.wrangler.toml
```

### 2. Cron 스케줄 확인
`workers/cron-weekly-audit.wrangler.toml`에서:
```toml
[triggers]
crons = ["0 0 * * 1"] # 매주 월요일 00:00 UTC
```

## 로컬 개발

### 1. Wrangler 개발 서버
```bash
# D1 로컬 데이터베이스와 함께 실행
wrangler pages dev .next --d1=DB=webdoctor-db --queue=QUEUE=crawl-queue
```

### 2. 환경 변수 설정
`.dev.vars` 파일 생성:
```
JWT_SECRET=your-local-secret-key
```

## 중요 사항

### 1. D1 접근 방법
- **@cloudflare/next-on-pages 사용 시**: `process.env.DB`로 접근
- **Cloudflare Pages Functions**: `request.env.DB` 또는 `process.env.DB`
- 현재 코드는 두 방법 모두 지원

### 2. Edge Runtime 제한
- 30초 타임아웃
- Node.js 전용 API 사용 불가
- 긴 작업은 Queue 사용 필수

### 3. 환경 변수
- **개발**: `.dev.vars` 파일 또는 `wrangler dev`
- **프로덕션**: Cloudflare 대시보드에서 설정

## 문제 해결

### D1 연결 실패
1. `wrangler.toml`의 `database_id` 확인
2. Cloudflare Pages 대시보드에서 바인딩 확인
3. 바인딩 이름이 `DB`인지 확인

### Queue 작동 안 함
1. Queue가 생성되었는지 확인
2. Worker의 queue 바인딩 확인
3. Pages에서 Queue 바인딩 확인

### 빌드 실패
1. `@cloudflare/next-on-pages` 설치 확인
2. Next.js 버전 호환성 확인
3. Edge Runtime 호환 라이브러리 사용 확인

## 체크리스트

### 배포 전
- [ ] D1 데이터베이스 생성 및 마이그레이션
- [ ] Queue 생성
- [ ] 환경 변수 설정
- [ ] `@cloudflare/next-on-pages` 설치
- [ ] 빌드 테스트 (`npm run pages:build`)

### 배포 후
- [ ] Pages Functions에서 D1 바인딩 확인
- [ ] Pages Functions에서 Queue 바인딩 확인
- [ ] API Routes 정상 작동 확인
- [ ] Queue Consumer Worker 배포 확인
- [ ] Cron Worker 배포 확인

