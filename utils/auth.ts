/**
 * 인증 유틸리티 함수
 * 비밀번호 해싱, JWT 토큰 생성/검증
 * 
 * 주의: bcryptjs는 Edge Runtime에서 완전히 작동하지 않을 수 있습니다.
 * 실제 Cloudflare Workers 환경에서 테스트 필요.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * 비밀번호 해싱
 * 주의: bcryptjs는 Edge Runtime에서 문제가 될 수 있습니다.
 * 실제 배포 시 Cloudflare Workers 환경에서 테스트 필요.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 토큰 생성 (jose 사용 - Edge Runtime 호환)
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  
  const jwt = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  } as Record<string, any>)
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
    const secret = new TextEncoder().encode(JWT_SECRET);
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

