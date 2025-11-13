# Cloudflare 환경 최종 체크리스트

## ✅ 코드 검토 완료

### 1. Edge Runtime 설정
- ✅ 모든 API Routes (8개)에 `export const runtime = 'edge'` 설정
- ✅ Middleware도 Edge Runtime 사용
- ✅ 타입 체크 통과

### 2. D1 데이터베이스 연결
- ✅ `lib/cloudflare/env.ts`: 환경 변수 접근 함수
- ✅ 모든 API Routes에서 `getD1Database(request)` 사용
- ✅ request 객체 전달로 환경 변수 접근 개선

### 3. Queue 설정
- ✅ `lib/queue/crawl-queue.ts`: 큐 처리 로직
- ✅ `workers/crawl-consumer.ts`: Queue Consumer Worker
- ✅ `wrangler.toml`: Queue 바인딩 설정
- ✅ 크롤링 작업은 Queue를 통해 비동기 처리

### 4. Cron 작업
- ✅ `workers/cron-weekly-audit.ts`: 주간 자동 감사
- ✅ `workers/cron-weekly-audit.wrangler.toml`: Cron 설정
- ✅ 별도 Worker로 분리

### 5. JWT 라이브러리
- ✅ `jose` 라이브러리 사용 (Edge Runtime 호환)
- ✅ 모든 JWT 함수 async 처리

### 6. 메인 페이지
- ✅ 클라이언트 컴포넌트 (Edge Runtime 문제 없음)
- ✅ 빠른 시작 API 연동 (`/api/sites/quick-start`)
- ✅ Material Symbols 아이콘 (CDN)
- ✅ Google Fonts (CDN)

## 📋 배포 전 필수 작업

### 1. D1 데이터베이스 설정
```bash
# D1 데이터베이스 생성
wrangler d1 create webdoctor-db

# database_id를 wrangler.toml에 입력
# [[d1_databases]]
# binding = "DB"
# database_name = "webdoctor-db"
# database_id = "여기에_입력"

# 마이그레이션 실행
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
```

### 2. Queue 생성
```bash
wrangler queues create crawl-queue
```

### 3. 환경 변수 설정
Cloudflare 대시보드에서:
- `JWT_SECRET`: JWT 토큰 서명용 시크릿 키

### 4. Workers 배포
```bash
# 크롤 큐 Consumer 배포
wrangler deploy --config workers/crawl-consumer.wrangler.toml

# 주간 감사 Cron Worker 배포
wrangler deploy --config workers/cron-weekly-audit.wrangler.toml
```

### 5. Next.js 배포
```bash
# 빌드
npm run build

# Cloudflare Pages에 배포
# GitHub 연동 또는 wrangler pages deploy
```

## ⚠️ 테스트 필요 항목

### Edge Runtime 호환성
- [ ] bcryptjs 작동 여부 확인
- [ ] cheerio 작동 여부 확인
- [ ] 모든 API Routes 정상 작동 확인

### 기능 테스트
- [ ] 회원가입/로그인
- [ ] 사이트 등록
- [ ] 크롤링 작업 시작
- [ ] SEO 감사 실행
- [ ] Queue 메시지 처리
- [ ] Cron 작업 실행

## 🔧 문제 해결

### D1 연결 실패
- `wrangler.toml`의 `database_id` 확인
- 바인딩 이름이 `DB`인지 확인
- `wrangler dev`로 로컬 테스트

### Queue 작동 안 함
- Queue가 생성되었는지 확인
- Worker의 queue 바인딩 확인
- `wrangler dev`로 로컬 테스트

### Edge Runtime 오류
- Node.js 전용 API 사용 여부 확인
- 타임아웃 발생 시 Queue 사용
- 로그 확인: Cloudflare 대시보드

## 📚 참고 문서

- `DEPLOYMENT.md`: 상세 배포 가이드
- `CLOUDFLARE_COMPATIBILITY.md`: 호환성 가이드
- `CLOUDFLARE_ISSUES.md`: 알려진 이슈
- `CLOUDFLARE_REVIEW.md`: 이전 검토 결과
- `CLOUDFLARE_FINAL_CHECK.md`: 최종 검토 결과

