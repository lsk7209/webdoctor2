# 데이터베이스 설정 단계별 가이드

## 🎯 목표

Cloudflare D1 데이터베이스를 생성하고 마이그레이션을 실행하여 프로젝트에 필요한 모든 테이블을 생성합니다.

## 📋 단계별 실행

### 1단계: Wrangler CLI 확인 및 로그인

```bash
# Wrangler 버전 확인
wrangler --version

# Cloudflare에 로그인 (처음 한 번만)
wrangler login
```

### 2단계: D1 데이터베이스 생성

```bash
wrangler d1 create webdoctor-db
```

**출력 예시:**
```
✅ Successfully created DB 'webdoctor-db'!

[[d1_databases]]
binding = "DB"
database_name = "webdoctor-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**중요**: `database_id`를 복사하세요!

### 3단계: wrangler.toml에 database_id 입력

`wrangler.toml` 파일을 열고 `database_id`를 입력:

```toml
[[d1_databases]]
binding = "DB"
database_name = "webdoctor-db"
database_id = "여기에_복사한_ID_입력"  # ← 여기에 입력
```

### 4단계: 마이그레이션 실행

#### 프로덕션 환경 (실제 Cloudflare D1)
```bash
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
```

#### 로컬 개발 환경 (테스트용)
```bash
wrangler d1 execute webdoctor-db --local --file=./migrations/0001_initial_schema.sql
```

### 5단계: 데이터베이스 확인

```bash
# 테이블 목록 확인
wrangler d1 execute webdoctor-db --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"

# 또는 로컬
wrangler d1 execute webdoctor-db --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

**예상 결과:**
```
users
workspaces
sites
crawl_jobs
page_snapshots
issues
integrations
keyword_daily
page_metric_daily
metric_daily
```

## 🔧 Cloudflare Pages 바인딩 설정

### D1 바인딩

1. Cloudflare 대시보드 접속
2. Workers & Pages > koreseo 프로젝트 선택
3. Settings > Functions 탭
4. D1 Database bindings 섹션
5. "Add binding" 클릭
6. 설정:
   - **Binding name**: `DB` (정확히 이 이름)
   - **Database**: `webdoctor-db` 선택
7. Save

### Queue 바인딩

1. Settings > Functions 탭
2. Queue bindings 섹션
3. "Add binding" 클릭
4. 설정:
   - **Binding name**: `QUEUE` (정확히 이 이름)
   - **Queue**: `crawl-queue` 선택 (먼저 생성 필요)

### Queue 생성 (아직 안 했다면)

```bash
wrangler queues create crawl-queue
```

## 🔐 환경 변수 설정

Cloudflare Pages 대시보드에서:

1. Settings > Environment variables
2. "Add variable" 클릭
3. 다음 변수 추가:

| Variable name | Value | Environment |
|--------------|-------|-------------|
| `JWT_SECRET` | (강력한 랜덤 문자열) | Production, Preview |

**JWT_SECRET 생성 방법:**
```bash
# Node.js로 생성
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 또는 온라인 생성기 사용
```

## ✅ 설정 확인

### 스크립트 사용 (권장)

#### Windows
```powershell
.\scripts\check-database.ps1
```

#### Linux/Mac
```bash
chmod +x scripts/check-database.sh
./scripts/check-database.sh
```

### 수동 확인

```bash
# 데이터베이스 연결 테스트
wrangler d1 execute webdoctor-db --command="SELECT 1;"

# 테이블 개수 확인
wrangler d1 execute webdoctor-db --command="SELECT COUNT(*) as table_count FROM sqlite_master WHERE type='table';"
```

## 🚨 문제 해결

### "database_id is required" 오류

**원인**: `wrangler.toml`에 `database_id`가 비어있음

**해결**:
1. `wrangler d1 create webdoctor-db` 실행
2. 생성된 `database_id`를 `wrangler.toml`에 입력

### "Database not found" 오류

**원인**: 데이터베이스가 생성되지 않았거나 잘못된 ID

**해결**:
1. `wrangler d1 list`로 데이터베이스 목록 확인
2. 올바른 `database_id` 사용

### 마이그레이션 실패

**원인**: SQL 문법 오류 또는 이미 실행된 마이그레이션

**해결**:
1. SQL 파일 확인
2. 이미 실행된 경우: `CREATE TABLE IF NOT EXISTS` 사용으로 안전

## 📝 다음 단계

데이터베이스 설정이 완료되면:

1. ✅ GitHub Secrets 설정 (자동 배포용)
2. ✅ Cloudflare Pages 프로젝트 생성 및 연결
3. ✅ 첫 배포 실행
4. ✅ API 테스트

## 📚 참고 문서

- [DATABASE_SETUP.md](./DATABASE_SETUP.md): 상세 가이드
- [QUICK_START.md](./QUICK_START.md): 빠른 시작
- [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md): 배포 가이드

