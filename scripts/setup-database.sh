#!/bin/bash

# Cloudflare D1 데이터베이스 설정 스크립트

echo "🚀 Cloudflare D1 데이터베이스 설정을 시작합니다..."

# 1. D1 데이터베이스 생성
echo ""
echo "📦 1단계: D1 데이터베이스 생성"
echo "다음 명령어를 실행하세요:"
echo "  wrangler d1 create webdoctor-db"
echo ""
read -p "데이터베이스를 생성하셨나요? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "데이터베이스를 먼저 생성해주세요."
    exit 1
fi

# 2. database_id 입력 안내
echo ""
echo "📝 2단계: database_id 설정"
echo "생성된 database_id를 wrangler.toml에 입력하세요."
echo ""
echo "wrangler.toml 파일에서:"
echo "  [[d1_databases]]"
echo "  binding = \"DB\""
echo "  database_name = \"webdoctor-db\""
echo "  database_id = \"여기에_입력\"  # ← 여기에 database_id 입력"
echo ""
read -p "database_id를 입력하셨나요? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "database_id를 먼저 입력해주세요."
    exit 1
fi

# 3. 마이그레이션 실행
echo ""
echo "📊 3단계: 데이터베이스 마이그레이션 실행"
echo "프로덕션 환경에 마이그레이션을 실행하시겠습니까? (y/n)"
read -p "로컬 환경은 'n'을 입력하세요: " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "프로덕션 마이그레이션 실행 중..."
    wrangler d1 execute webdoctor-db --file=./migrations/0001_initial_schema.sql
else
    echo "로컬 마이그레이션 실행 중..."
    wrangler d1 execute webdoctor-db --local --file=./migrations/0001_initial_schema.sql
fi

echo ""
echo "✅ 데이터베이스 설정이 완료되었습니다!"
echo ""
echo "다음 단계:"
echo "1. Cloudflare Pages 대시보드에서 D1 바인딩 설정"
echo "2. 환경 변수 설정 (JWT_SECRET 등)"
echo "3. Queue 바인딩 설정"

