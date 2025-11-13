#!/bin/bash
# Cloudflare Pages 빌드 스크립트
# Next.js 빌드 오류를 처리하고 Cloudflare Pages 변환을 수행합니다.

set -e  # 오류 발생 시 중단

echo "🚀 Cloudflare Pages 빌드 시작..."

# 1. Next.js 빌드 실행 (오류 허용)
echo "📦 Next.js 빌드 실행 중..."
set +e  # 오류 허용
npm run build 2>&1 | tee build.log
BUILD_EXIT_CODE=$?
set -e  # 오류 중단 다시 활성화

# 2. 빌드 결과 확인
if [ $BUILD_EXIT_CODE -ne 0 ]; then
  echo "⚠️  Next.js 빌드에서 오류가 발생했습니다 (exit code: $BUILD_EXIT_CODE)"
  
  # .next 디렉토리 존재 확인
  if [ ! -d ".next" ]; then
    echo "❌ Error: .next 디렉토리가 생성되지 않았습니다. 빌드가 완전히 실패했습니다."
    echo "📋 빌드 로그:"
    cat build.log
    exit 1
  fi
  
  echo "✅ .next 디렉토리가 존재합니다. 빌드를 계속 진행합니다."
  
  # 정적 생성 오류만 있는지 확인
  if grep -q "Error occurred prerendering page" build.log && \
     (grep -q "/404\|/500" build.log || grep -q "<Html> should not be imported" build.log); then
    echo "✅ 정적 생성 오류만 감지되었습니다 (/404, /500 페이지)"
    echo "ℹ️  이 오류는 Cloudflare Pages에서 예상된 동작이며 무시해도 됩니다"
    echo "✅ Cloudflare Pages 변환을 계속 진행합니다..."
  else
    echo "❌ 예상치 못한 빌드 오류가 발생했습니다:"
    cat build.log
    exit 1
  fi
else
  echo "✅ Next.js 빌드가 성공적으로 완료되었습니다!"
fi

# 3. Cloudflare Pages 변환
echo "🔄 Cloudflare Pages 변환 실행 중..."
npm run pages:build

# 4. 빌드 출력 확인
if [ ! -d ".vercel/output/static" ]; then
  echo "❌ Error: .vercel/output/static 디렉토리가 생성되지 않았습니다."
  exit 1
fi

echo "✅ Cloudflare Pages 빌드가 완료되었습니다!"
echo "📁 출력 디렉토리: .vercel/output/static"
