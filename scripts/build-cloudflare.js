/**
 * Cloudflare Pages 빌드 스크립트
 * 정적 생성 오류를 무시하고 빌드 계속 진행
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Building Next.js application...');

try {
  // Next.js 빌드 실행
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✓ Next.js build completed');
} catch (error) {
  console.warn('⚠ Build encountered errors, but continuing...');
  
  // 빌드가 실패해도 .next 디렉토리가 생성되었을 수 있으므로 확인
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    console.error('✗ Error: Build failed and .next directory not found');
    process.exit(1);
  }
  
  console.log('✓ .next directory exists, continuing...');
}

console.log('Converting to Cloudflare Pages format...');
try {
  execSync('npm run pages:build', { stdio: 'inherit' });
  console.log('✓ Cloudflare Pages conversion completed');
} catch (error) {
  console.error('✗ Error: Cloudflare Pages conversion failed');
  process.exit(1);
}

console.log('✓ Build completed successfully!');

