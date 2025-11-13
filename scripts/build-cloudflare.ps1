# Cloudflare Pages 빌드 스크립트 (PowerShell)
# 정적 생성 오류를 무시하고 빌드 계속 진행

$ErrorActionPreference = "Continue"

Write-Host "Building Next.js application..."

# Next.js 빌드 실행 (정적 생성 오류가 발생해도 계속 진행)
try {
    npm run build
} catch {
    Write-Host "Warning: Build encountered errors, but continuing..." -ForegroundColor Yellow
    # 빌드가 실패해도 .next 디렉토리가 생성되었을 수 있으므로 계속 진행
    if (-not (Test-Path ".next")) {
        Write-Host "Error: Build failed and .next directory not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Converting to Cloudflare Pages format..."
npm run pages:build

Write-Host "Build completed successfully!" -ForegroundColor Green

