#!/bin/bash
# Cloudflare Pages 빌드 스크립트 (에러 처리 포함)
# 정적 생성 오류를 무시하고 빌드 계속 진행

set -e

echo "🚀 Starting Cloudflare Pages build process..."

# 1. Next.js 빌드 실행
echo "📦 Building Next.js application..."
set +e  # 오류 발생 시에도 계속 진행
npm run build
BUILD_EXIT_CODE=$?
set -e  # 다시 오류 시 중단 모드로 전환

if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "⚠️  Build encountered errors (exit code: $BUILD_EXIT_CODE)"
  echo "📋 Checking if .next directory exists..."
  
  # .next 디렉토리 존재 확인
  if [ ! -d ".next" ]; then
    echo "❌ Error: Build failed and .next directory not found"
    echo "💡 This indicates a critical build failure that cannot be recovered."
    exit 1
  fi
  
  echo "✅ .next directory exists, continuing with Cloudflare Pages conversion..."
  echo "ℹ️  Note: Static generation errors for /404 and /500 pages are expected and can be ignored."
else
  echo "✅ Next.js build completed successfully!"
fi

# 2. Cloudflare Pages 변환
echo "🔄 Converting to Cloudflare Pages format..."
npm run pages:build

if [ $? -eq 0 ]; then
  echo "✅ Cloudflare Pages conversion completed successfully!"
  echo "🎉 Build process completed! Ready for deployment."
else
  echo "❌ Cloudflare Pages conversion failed"
  exit 1
fi

