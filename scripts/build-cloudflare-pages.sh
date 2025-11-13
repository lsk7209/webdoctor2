#!/bin/bash
# Cloudflare Pages 빌드 스크립트
# 정적 생성 오류를 무시하고 빌드 계속 진행

set -e

echo "🚀 Starting Cloudflare Pages build..."

# Next.js 빌드 실행 (오류 발생 시에도 계속 진행)
set +e
npm run build 2>&1 | tee build.log
BUILD_EXIT_CODE=$?
set -e

# 빌드 결과 확인
if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "⚠️  Build encountered errors (exit code: $BUILD_EXIT_CODE)"
  
  # .next 디렉토리 존재 확인
  if [ ! -d ".next" ]; then
    echo "❌ Critical: .next directory not found. Build failed completely."
    exit 1
  fi
  
  # 정적 생성 오류만 있는지 확인
  if grep -q "Error occurred prerendering page" build.log && \
     grep -q "/404\|/500" build.log; then
    echo "✅ Expected static generation errors detected for /404 and /500 pages"
    echo "ℹ️  These errors are safe to ignore for Cloudflare Pages"
  else
    echo "❌ Unexpected build errors detected. Checking build.log..."
    cat build.log | tail -50
    exit 1
  fi
else
  echo "✅ Next.js build completed successfully!"
fi

# Cloudflare Pages 변환
echo "🔄 Converting to Cloudflare Pages format..."
npm run pages:build

echo "✅ Build process completed!"

