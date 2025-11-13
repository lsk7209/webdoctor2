# Cloudflare D1 데이터베이스 설정 가이드

## 📋 개요

이 가이드는 Cloudflare D1 데이터베이스를 생성하고 설정하는 방법을 안내합니다.

## 🚀 빠른 시작

### 방법 1: 스크립트 사용 (권장)

#### Windows (PowerShell)
```powershell
.\scripts\setup-database.ps1
```

#### Linux/Mac
```bash
chmod +x scripts/setup-database.sh
./scripts/setup-database.sh
```

### 방법 2: 수동 설정

## 📝 단계별 설정

### 1단계: D1 데이터베이스 생성

```bash
wrangler d1 create webdoctor-db
```

**출력 예시:**
```
✅ Successfully created DB 'webdoctor-db'!

[[d1_databases]]
binding = "DB"
database_name = "webdoctor-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # ← 이 ID를 복사하세요
```

### 2단계: wrangler.toml에 database_id 입력

`wrangler.toml` 파일을 열고 `database_id`를 입력하세요:

```toml
[[d1_databases]]
binding = "DB"
database_name = "webdoctor-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # ← 여기에 입력
```

### 3단계: 마이그레이션 실행

#### 프로덕션 환경
```bash
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
```

#### 로컬 개발 환경
```bash
wrangler d1 execute webdoctor-db --local --file=./migrations/0001_initial_schema.sql
```

### 4단계: Cloudflare Pages에서 D1 바인딩 설정

1. Cloudflare 대시보드 접속
2. Workers & Pages > koreseo 프로젝트 선택
3. Settings > Functions 탭
4. D1 Database bindings 섹션
5. "Add binding" 클릭
6. 설정:
   - **Binding name**: `DB`
   - **Database**: `webdoctor-db` 선택
7. Save

### 5단계: 환경 변수 설정

Cloudflare Pages 대시보드에서:
1. Settings > Environment variables
2. "Add variable" 클릭
3. 다음 변수 추가:
   - **Variable name**: `JWT_SECRET`
   - **Value**: (강력한 시크릿 키 입력)
   - **Environment**: Production, Preview 모두 선택

## 🔍 데이터베이스 확인

### 테이블 목록 확인

```bash
# 프로덕션
wrangler d1 execute webdoctor-db --command="SELECT name FROM sqlite_master WHERE type='table';"

# 로컬
wrangler d1 execute webdoctor-db --local --command="SELECT name FROM sqlite_master WHERE type='table';"
```

### 데이터 확인

```bash
# 프로덕션
wrangler d1 execute webdoctor-db --command="SELECT * FROM users LIMIT 5;"

# 로컬
wrangler d1 execute webdoctor-db --local --command="SELECT * FROM users LIMIT 5;"
```

## 📊 데이터베이스 스키마

### 주요 테이블

1. **users**: 사용자 계정 정보
2. **workspaces**: 워크스페이스 (사용자당 1개)
3. **sites**: 등록된 사이트
4. **crawl_jobs**: 크롤 작업 이력
5. **page_snapshots**: 페이지 스냅샷 데이터
6. **issues**: SEO 이슈 (To-Do)
7. **integrations**: 외부 서비스 연동
8. **keyword_daily**: GSC 키워드 일별 데이터
9. **page_metric_daily**: GA4 페이지별 일별 데이터
10. **metric_daily**: 사이트별 일별 집계 데이터

전체 스키마는 `migrations/0001_initial_schema.sql` 파일을 참조하세요.

## 🔧 문제 해결

### 데이터베이스 생성 실패

**문제**: `wrangler d1 create` 명령어가 실패함

**해결**:
1. Wrangler CLI가 최신 버전인지 확인: `wrangler --version`
2. Cloudflare 계정에 로그인: `wrangler login`
3. 권한 확인: Cloudflare 대시보드에서 D1 사용 가능 여부 확인

### 마이그레이션 실패

**문제**: 마이그레이션 실행 시 오류 발생

**해결**:
1. SQL 파일 경로 확인
2. 데이터베이스 ID 확인
3. 로컬 환경에서는 `--local` 플래그 사용

### 바인딩 인식 안 됨

**문제**: API Routes에서 D1 데이터베이스에 접근할 수 없음

**해결**:
1. Cloudflare Pages에서 바인딩 이름이 `DB`인지 확인
2. 데이터베이스가 올바르게 선택되었는지 확인
3. 배포 후 다시 시도 (바인딩 변경 시 재배포 필요)

## 📚 추가 리소스

- [Cloudflare D1 문서](https://developers.cloudflare.com/d1/)
- [Wrangler CLI 문서](https://developers.cloudflare.com/workers/wrangler/)
- [D1 마이그레이션 가이드](https://developers.cloudflare.com/d1/learning/migrations/)

## ✅ 체크리스트

배포 전 확인사항:

- [ ] D1 데이터베이스 생성 완료
- [ ] `wrangler.toml`에 `database_id` 입력
- [ ] 마이그레이션 실행 완료
- [ ] Cloudflare Pages에서 D1 바인딩 설정
- [ ] 환경 변수 설정 (JWT_SECRET)
- [ ] 로컬 테스트 완료 (`wrangler dev`)

