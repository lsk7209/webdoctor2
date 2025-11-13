# 빠른 시작 가이드

## 🚀 5분 안에 시작하기

### 1. 데이터베이스 생성 및 설정

```bash
# 1. D1 데이터베이스 생성
wrangler d1 create webdoctor-db

# 2. 생성된 database_id를 wrangler.toml에 입력
# wrangler.toml 파일 열기 → database_id = "여기에_입력"

# 3. 마이그레이션 실행
wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
```

### 2. Cloudflare Pages 설정

1. Cloudflare 대시보드 접속
2. Workers & Pages > Create application > Pages
3. "Connect to Git" 선택
4. GitHub 저장소 연결
5. 프로젝트 이름: `koreseo`

### 3. 바인딩 설정

#### D1 바인딩
- Settings > Functions > D1 Database bindings
- Binding name: `DB`
- Database: `webdoctor-db`

#### Queue 바인딩
- Settings > Functions > Queue bindings
- Binding name: `QUEUE`
- Queue: `crawl-queue` (먼저 생성 필요)

### 4. 환경 변수 설정

- Settings > Environment variables
- `JWT_SECRET` 추가

### 5. GitHub Secrets 설정

GitHub 저장소 > Settings > Secrets and variables > Actions:

- `CLOUDFLARE_API_TOKEN`: Cloudflare API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

### 6. 배포

```bash
# main 브랜치에 push하면 자동 배포됩니다
git push origin main
```

## 📚 상세 가이드

- [DATABASE_SETUP.md](./DATABASE_SETUP.md): 데이터베이스 설정 상세 가이드
- [GITHUB_DEPLOYMENT.md](./GITHUB_DEPLOYMENT.md): GitHub 배포 가이드
- [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md): Cloudflare 배포 가이드

