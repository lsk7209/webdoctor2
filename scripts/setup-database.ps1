# Cloudflare D1 데이터베이스 설정 스크립트 (PowerShell)

Write-Host "🚀 Cloudflare D1 데이터베이스 설정을 시작합니다..." -ForegroundColor Cyan

# 1. D1 데이터베이스 생성
Write-Host ""
Write-Host "📦 1단계: D1 데이터베이스 생성" -ForegroundColor Yellow
Write-Host "다음 명령어를 실행하세요:"
Write-Host "  wrangler d1 create webdoctor-db" -ForegroundColor Green
Write-Host ""
$confirm = Read-Host "데이터베이스를 생성하셨나요? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "데이터베이스를 먼저 생성해주세요." -ForegroundColor Red
    exit 1
}

# 2. database_id 입력 안내
Write-Host ""
Write-Host "📝 2단계: database_id 설정" -ForegroundColor Yellow
Write-Host "생성된 database_id를 wrangler.toml에 입력하세요."
Write-Host ""
Write-Host "wrangler.toml 파일에서:"
Write-Host "  [[d1_databases]]"
Write-Host "  binding = `"DB`""
Write-Host "  database_name = `"webdoctor-db`""
Write-Host "  database_id = `"여기에_입력`"  # ← 여기에 database_id 입력" -ForegroundColor Green
Write-Host ""
$confirm = Read-Host "database_id를 입력하셨나요? (y/n)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "database_id를 먼저 입력해주세요." -ForegroundColor Red
    exit 1
}

# 3. 마이그레이션 실행
Write-Host ""
Write-Host "📊 3단계: 데이터베이스 마이그레이션 실행" -ForegroundColor Yellow
$envType = Read-Host "프로덕션 환경에 마이그레이션을 실행하시겠습니까? (y/n, 로컬은 n)"

if ($envType -eq "y" -or $envType -eq "Y") {
    Write-Host "프로덕션 마이그레이션 실행 중..." -ForegroundColor Green
    wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
} else {
    Write-Host "로컬 마이그레이션 실행 중..." -ForegroundColor Green
    wrangler d1 execute webdoctor-db --local --file=./migrations/0001_initial_schema.sql
}

Write-Host ""
Write-Host "✅ 데이터베이스 설정이 완료되었습니다!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:"
Write-Host "1. Cloudflare Pages 대시보드에서 D1 바인딩 설정"
Write-Host "2. 환경 변수 설정 (JWT_SECRET 등)"
Write-Host "3. Queue 바인딩 설정"

