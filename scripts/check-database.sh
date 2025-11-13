#!/bin/bash

# D1 데이터베이스 상태 확인 스크립트

echo "🔍 D1 데이터베이스 상태 확인 중..."

# wrangler.toml에서 database_id 확인
if [ -f "wrangler.toml" ]; then
    DB_ID=$(grep -A 3 "\[\[d1_databases\]\]" wrangler.toml | grep "database_id" | cut -d'"' -f2)
    
    if [ -z "$DB_ID" ] || [ "$DB_ID" == "" ]; then
        echo "❌ wrangler.toml에 database_id가 설정되지 않았습니다."
        echo "   wrangler d1 create webdoctor-db 명령어를 실행하고 database_id를 입력하세요."
    else
        echo "✅ database_id: $DB_ID"
    fi
else
    echo "❌ wrangler.toml 파일을 찾을 수 없습니다."
fi

# 테이블 목록 확인
echo ""
echo "📊 데이터베이스 테이블 확인:"
echo "프로덕션 환경:"
wrangler d1 execute webdoctor-db --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null || echo "  (연결 실패 또는 database_id 미설정)"

echo ""
echo "로컬 환경:"
wrangler d1 execute webdoctor-db --local --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" 2>/dev/null || echo "  (로컬 데이터베이스 없음)"

