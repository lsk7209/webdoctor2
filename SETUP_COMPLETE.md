# 데이터베이스 설정 완료 가이드

## 🎯 전체 설정 프로세스

### 1단계: Wrangler CLI 설치

```bash
# npm으로 전역 설치
npm install -g wrangler

# 또는 프로젝트 로컬 설치 (이미 package.json에 포함됨)
npm install
```

### 2단계: Cloudflare 로그인

```bash
wrangler login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하세요.

### 3단계: D1 데이터베이스 생성

```bash
# 방법 1: npm 스크립트 사용
npm run db:create

# 방법 2: 직접 실행
wrangler d1 create webdoctor-db
```

**출력에서 `database_id`를 복사하세요!**

예시:
```
✅ Successfully created DB 'webdoctor-db'!

[[d1_databases]]
binding = "DB"
database_name = "webdoctor-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  ← 이 ID 복사
```

### 4단계: wrangler.toml에 database_id 입력

`wrangler.toml` 파일을 열고:

```toml
[[d1_databases]]
binding = "DB"
database_name = "webdoctor-db"
database_id = "여기에_복사한_ID_입력"  # ← 여기에 입력
```

### 5단계: 마이그레이션 실행

```bash
# 프로덕션 환경
npm run db:migrate

# 또는 로컬 테스트
npm run db:migrate:local
```

### 6단계: 데이터베이스 확인

```bash
# 프로덕션
npm run db:check

# 로컬
npm run db:check:local
```

**예상 결과:** 10개의 테이블이 생성되어야 합니다.

## 🔧 Cloudflare Pages 바인딩 설정

### D1 바인딩

1. Cloudflare 대시보드 접속
2. Workers & Pages > koreseo 프로젝트 선택
3. Settings > Functions 탭
4. D1 Database bindings > "Add binding"
5. 설정:
   - **Binding name**: `DB`
   - **Database**: `webdoctor-db`
6. Save

### Queue 바인딩

1. Queue 생성 (아직 안 했다면):
   ```bash
   wrangler queues create crawl-queue
   ```

2. Cloudflare Pages에서:
   - Settings > Functions > Queue bindings
   - "Add binding"
   - **Binding name**: `QUEUE`
   - **Queue**: `crawl-queue`

## 🔐 환경 변수 설정

Cloudflare Pages 대시보드:
- Settings > Environment variables
- `JWT_SECRET` 추가 (강력한 랜덤 문자열)

## ✅ 설정 확인 체크리스트

- [ ] Wrangler CLI 설치 완료
- [ ] Cloudflare 로그인 완료
- [ ] D1 데이터베이스 생성 완료
- [ ] `wrangler.toml`에 `database_id` 입력
- [ ] 마이그레이션 실행 완료
- [ ] 테이블 생성 확인 (10개)
- [ ] Cloudflare Pages에서 D1 바인딩 설정
- [ ] Cloudflare Pages에서 Queue 바인딩 설정
- [ ] 환경 변수 설정 (JWT_SECRET)

## 📚 관련 문서

- [DATABASE_SETUP.md](./DATABASE_SETUP.md): 상세 가이드
- [DATABASE_SETUP_STEPS.md](./DATABASE_SETUP_STEPS.md): 단계별 가이드
- [QUICK_START.md](./QUICK_START.md): 빠른 시작

## 🚀 다음 단계

데이터베이스 설정이 완료되면:

1. GitHub Secrets 설정 (자동 배포용)
2. 첫 배포 실행
3. API 테스트

