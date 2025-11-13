# Cloudflare 호환성 가이드

## 주요 변경사항

### 1. Edge Runtime 사용

모든 API Routes에 `export const runtime = 'edge'`를 추가했습니다.
- Cloudflare Workers와 호환
- 빠른 응답 시간
- 제한: 30초 타임아웃

### 2. D1 데이터베이스 접근

- `lib/cloudflare/env.ts`를 통해 환경 변수에서 D1 바인딩 가져오기
- `getD1Database()` 함수로 일관된 접근
- 모든 API Routes에서 실제 DB 연결 사용

### 3. Queue를 통한 비동기 처리

- 크롤링 작업은 Queue에 추가하여 비동기 처리
- `workers/crawl-consumer.ts`에서 큐 메시지 처리
- Edge Runtime 타임아웃 문제 해결

### 4. Cron 작업 분리

- `workers/cron-weekly-audit.ts`로 주간 감사 작업 분리
- 별도 Worker로 실행되어 메인 앱에 영향 없음

## Edge Runtime 제한사항

### 사용 불가능한 Node.js API

다음 Node.js 전용 기능은 Edge Runtime에서 사용할 수 없습니다:
- `fs` (파일 시스템)
- `crypto` (일부 기능)
- `child_process`
- `Buffer` (일부 기능)

### 대체 방안

1. **bcryptjs**: Edge Runtime에서 작동하지만 성능이 느릴 수 있음
   - 대안: Web Crypto API 사용 고려
2. **jsonwebtoken**: Edge Runtime에서 작동
3. **cheerio**: Edge Runtime에서 작동

## 환경 변수 처리

### 개발 환경
- `.dev.vars` 파일 사용
- `wrangler dev`로 로컬 개발

### 프로덕션 환경
- Cloudflare 대시보드에서 환경 변수 설정
- Workers & Pages > Settings > Variables

## 배포 체크리스트

- [ ] D1 데이터베이스 생성 및 마이그레이션 실행
- [ ] Queue 생성
- [ ] 환경 변수 설정 (JWT_SECRET 등)
- [ ] wrangler.toml의 database_id 입력
- [ ] Next.js 빌드 테스트
- [ ] Workers 배포
- [ ] Cron 작업 테스트

## 문제 해결

### D1 연결 실패
- `wrangler.toml`의 `database_id` 확인
- 바인딩 이름이 `DB`인지 확인

### Queue 작동 안 함
- Queue가 생성되었는지 확인
- Worker의 queue 바인딩 확인

### Edge Runtime 오류
- Node.js 전용 API 사용 여부 확인
- 타임아웃 발생 시 Queue 사용

