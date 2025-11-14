/**
 * 인증 유틸리티 함수
 * 비밀번호 해싱, JWT 토큰 생성/검증
 * 
 * Edge Runtime 호환: Web Crypto API 사용 (bcryptjs 대체)
 */

import { SignJWT, jwtVerify } from 'jose';
import { getEnvVar } from '@/lib/cloudflare/env';

/**
 * JWT 시크릿 키 가져오기 (환경 변수 검증 포함)
 * 빌드 타임에는 검증을 완화하고, 런타임에만 엄격하게 검증
 */
function getJwtSecret(): string {
  // 빌드 타임 체크: CI 환경이나 빌드 중에는 검증 완화
  // Next.js 빌드 단계 감지
  const isBuildTime = 
    process.env.CI === 'true' || 
    process.env.NEXT_PHASE === 'phase-production-build' ||
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    (typeof process !== 'undefined' && process.env && !process.env.JWT_SECRET && process.env.NODE_ENV !== 'production');
  
  const isProduction = process.env.NODE_ENV === 'production' && !isBuildTime;
  const secret = getEnvVar('JWT_SECRET') || process.env.JWT_SECRET;
  
  if (!secret || secret === 'your-secret-key-change-in-production') {
    // 빌드 타임에는 기본값 사용 (에러 방지)
    // 최소 32자 길이를 만족하는 빌드 타임 기본값
    if (isBuildTime) {
      return 'dev-secret-key-change-in-production-build-time-32chars';
    }
    
    // 런타임 프로덕션 환경에서만 에러 발생
    if (isProduction) {
      throw new Error('JWT_SECRET 환경 변수가 설정되지 않았습니다. 프로덕션 환경에서는 필수입니다.');
    }
    
    // 개발 환경에서는 경고만 출력
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  JWT_SECRET이 설정되지 않았습니다. 기본값을 사용합니다. 프로덕션에서는 반드시 설정하세요.');
    }
    return 'dev-secret-key-change-in-production';
  }
  
  // 시크릿 키 길이 검증 (최소 32자) - 빌드 타임에는 스킵
  if (!isBuildTime && secret.length < 32) {
    throw new Error('JWT_SECRET은 최소 32자 이상이어야 합니다.');
  }
  
  return secret;
}

// 지연 평가: 함수 호출 시점에만 검증 (빌드 타임 에러 방지)
function getJwtSecretLazy(): string {
  return getJwtSecret();
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 비밀번호 해싱 (Edge Runtime 호환 - PBKDF2 사용)
 * Web Crypto API를 사용하여 Edge Runtime에서 작동
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  
  // Salt 생성 (랜덤 16바이트)
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // PBKDF2를 사용한 키 파생 (100,000회 반복)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256 // 256비트 = 32바이트
  );
  
  // Salt와 해시를 결합하여 저장
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const saltArray = Array.from(salt);
  
  // Base64로 인코딩하여 저장: "salt:hash"
  const saltBase64 = btoa(String.fromCharCode(...saltArray));
  const hashBase64 = btoa(String.fromCharCode(...hashArray));
  
  return `${saltBase64}:${hashBase64}`;
}

/**
 * 비밀번호 검증 (Edge Runtime 호환)
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  try {
    const [saltBase64, hashBase64] = hashedPassword.split(':');
    
    if (!saltBase64 || !hashBase64) {
      return false;
    }
    
    // Base64 디코딩
    const salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
    const storedHash = Uint8Array.from(atob(hashBase64), c => c.charCodeAt(0));
    
    const encoder = new TextEncoder();
    const passwordData = encoder.encode(password);
    
    // 동일한 방식으로 해시 생성
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordData,
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );
    
    const computedHash = new Uint8Array(hashBuffer);
    
    // 해시 비교 (타이밍 공격 방지를 위한 상수 시간 비교)
    if (computedHash.length !== storedHash.length) {
      return false;
    }
    
    let isEqual = true;
    for (let i = 0; i < computedHash.length; i++) {
      if (computedHash[i] !== storedHash[i]) {
        isEqual = false;
      }
    }
    
    return isEqual;
  } catch (error) {
    // 비밀번호 검증 에러는 민감한 정보이므로 로깅 최소화
    if (process.env.NODE_ENV === 'development') {
      console.error('Password verification error:', error);
    }
    return false;
  }
}

/**
 * JWT 토큰 생성 (jose 사용 - Edge Runtime 호환)
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const jwtSecret = getJwtSecretLazy();
  const secret = new TextEncoder().encode(jwtSecret);
  
  const jwt = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  } as Record<string, string>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
  
  return jwt;
}

/**
 * JWT 토큰 검증 (jose 사용 - Edge Runtime 호환)
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const jwtSecret = getJwtSecretLazy();
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    
    // jose의 JWTPayload를 우리 타입으로 변환
    if (payload && typeof payload === 'object' && 'userId' in payload && 'email' in payload) {
      return {
        userId: payload.userId as string,
        email: payload.email as string,
      };
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * 쿠키에서 토큰 추출
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
  
  return cookies['auth-token'] || null;
}

