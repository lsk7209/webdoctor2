/**
 * Edge Runtime 호환 인증 유틸리티
 * Web Crypto API 사용 (bcryptjs 대체)
 */

// Edge Runtime에서는 Web Crypto API 사용
// bcryptjs는 Node.js 전용이므로 Edge에서는 다른 방식 필요

/**
 * 비밀번호 해싱 (Edge Runtime 호환)
 * 실제로는 서버리스 함수에서 bcryptjs 사용 권장
 * 또는 Cloudflare Workers의 Web Crypto API 사용
 */
export async function hashPasswordEdge(password: string): Promise<string> {
  // Web Crypto API를 사용한 간단한 해싱
  // 실제 프로덕션에서는 더 안전한 방법 필요
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  // 실제로는 salt 추가 및 반복 해싱 필요
  // 임시 구현 - 프로덕션에서는 bcryptjs를 별도 API에서 사용
  return hashHex;
}

/**
 * JWT 토큰 생성 (Edge Runtime 호환)
 * Web Crypto API 사용
 */
export async function generateTokenEdge(payload: Record<string, any>): Promise<string> {
  const secret = process.env.JWT_SECRET || 'your-secret-key';
  
  // 간단한 JWT 구현 (실제로는 라이브러리 사용 권장)
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = await signJWT(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function signJWT(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureArray = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

