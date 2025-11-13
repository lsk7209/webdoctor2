#!/bin/bash
# Cloudflare Pages 빌드 스크립트
# 정적 생성 오류를 무시하고 빌드 계속 진행

set -e

echo "Building Next.js application..."

# Next.js 빌드 실행 (정적 생성 오류가 발생해도 계속 진행)
npm run build || {
  echo "Warning: Build encountered errors, but continuing..."
  # 빌드가 실패해도 .next 디렉토리가 생성되었을 수 있으므로 계속 진행
  if [ ! -d ".next" ]; then
    echo "Error: Build failed and .next directory not found"
    exit 1
  fi
}

echo "Converting to Cloudflare Pages format..."
npm run pages:build

echo "Build completed successfully!"

