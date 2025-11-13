# D1 데이터베이스 상태 확인 스크립트 (PowerShell)

Write-Host "🔍 D1 데이터베이스 상태 확인 중..." -ForegroundColor Cyan

# wrangler.toml에서 database_id 확인
if (Test-Path "wrangler.toml") {
    $content = Get-Content "wrangler.toml" -Raw
    if ($content -match 'database_id\s*=\s*"([^"]+)"') {
        $dbId = $matches[1]
        if ($dbId -eq "" -or $dbId -eq $null) {
            Write-Host "❌ wrangler.toml에 database_id가 설정되지 않았습니다." -ForegroundColor Red
            Write-Host "   wrangler d1 create webdoctor-db 명령어를 실행하고 database_id를 입력하세요."
        } else {
            Write-Host "✅ database_id: $dbId" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ wrangler.toml에서 database_id를 찾을 수 없습니다." -ForegroundColor Red
    }
} else {
    Write-Host "❌ wrangler.toml 파일을 찾을 수 없습니다." -ForegroundColor Red
}

# 테이블 목록 확인
Write-Host ""
Write-Host "📊 데이터베이스 테이블 확인:" -ForegroundColor Yellow
Write-Host "프로덕션 환경:"
try {
    wrangler d1 execute webdoctor-db --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>$null
} catch {
    Write-Host "  (연결 실패 또는 database_id 미설정)" -ForegroundColor Red
}

Write-Host ""
Write-Host "로컬 환경:"
try {
    wrangler d1 execute webdoctor-db --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>$null
} catch {
    Write-Host "  (로컬 데이터베이스 없음)" -ForegroundColor Yellow
}

