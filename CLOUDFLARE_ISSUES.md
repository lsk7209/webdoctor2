# Cloudflare 호환성 이슈 및 해결 방안

## 현재 이슈

### 1. bcryptjs - Edge Runtime 호환성

**문제**: `bcryptjs`는 Node.js 전용이며 Edge Runtime에서 완전히 작동하지 않을 수 있습니다.

**해결 방안**:
- 옵션 A: 인증 API를 별도 Node.js 서버리스 함수로 분리
- 옵션 B: Web Crypto API 사용 (보안성 낮음, 권장하지 않음)
- 옵션 C: Cloudflare Workers에서 bcryptjs 사용 (실제로는 작동할 수 있음)

**권장**: 옵션 C - 실제 테스트 후 결정

### 2. jsonwebtoken - Edge Runtime 호환성

**문제**: `jsonwebtoken`은 Node.js 전용입니다.

**해결 방안**:
- 옵션 A: Web Crypto API로 직접 구현 (복잡함)
- 옵션 B: `jose` 라이브러리 사용 (Edge 호환)
- 옵션 C: Cloudflare Workers에서 jsonwebtoken 사용 (실제로는 작동할 수 있음)

**권장**: 옵션 B - `jose` 라이브러리로 교체

### 3. cheerio - Edge Runtime 호환성

**문제**: `cheerio`는 Node.js 전용입니다.

**해결 방안**:
- 옵션 A: `linkedom` 또는 `happy-dom` 사용 (Edge 호환)
- 옵션 B: Cloudflare Workers에서 cheerio 사용 (실제로는 작동할 수 있음)

**권장**: 옵션 B - 실제 테스트 후 결정

## 수정 권장 사항

### 즉시 수정 필요

1. **JWT 라이브러리 교체**
   ```bash
   npm uninstall jsonwebtoken @types/jsonwebtoken
   npm install jose
   ```

2. **인증 유틸리티 수정**
   - `utils/auth.ts`에서 `jose` 사용하도록 변경

### 테스트 후 결정

1. **bcryptjs**: 실제 Cloudflare Workers에서 테스트
2. **cheerio**: 실제 Cloudflare Workers에서 테스트

## 대안 구현

Edge Runtime에서 작동하지 않는 경우:
- 별도 API 엔드포인트로 분리
- Cloudflare Workers로 직접 구현
- 외부 서비스 활용 (예: Auth0, Clerk)

