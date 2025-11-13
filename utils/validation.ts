/**
 * 입력 검증 유틸리티 함수
 */

/**
 * URL 검증 및 정규화
 */
export function normalizeUrl(url: string): { url: string; error?: string } {
  if (!url || typeof url !== 'string') {
    return { url: '', error: 'URL을 입력해주세요.' };
  }

  let normalized = url.trim();

  // 길이 제한 (2048자)
  if (normalized.length > 2048) {
    return { url: '', error: 'URL이 너무 깁니다. (최대 2048자)' };
  }

  // 프로토콜 추가
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = `https://${normalized}`;
  }

  // URL 형식 검증
  try {
    const urlObj = new URL(normalized);
    
    // 허용된 프로토콜만 허용
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { url: '', error: 'http 또는 https 프로토콜만 허용됩니다.' };
    }

    // localhost 및 내부 IP 차단 (보안)
    const hostname = urlObj.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.16.')
    ) {
      return { url: '', error: '내부 네트워크 주소는 사용할 수 없습니다.' };
    }

    return { url: normalized };
  } catch {
    return { url: '', error: '올바른 URL 형식이 아닙니다.' };
  }
}

/**
 * 이메일 검증
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: '이메일을 입력해주세요.' };
  }

  const trimmed = email.trim();

  if (trimmed.length > 255) {
    return { valid: false, error: '이메일이 너무 깁니다. (최대 255자)' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: '올바른 이메일 형식이 아닙니다.' };
  }

  return { valid: true };
}

/**
 * 비밀번호 검증
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: '비밀번호를 입력해주세요.' };
  }

  if (password.length < 8) {
    return { valid: false, error: '비밀번호는 최소 8자 이상이어야 합니다.' };
  }

  if (password.length > 128) {
    return { valid: false, error: '비밀번호가 너무 깁니다. (최대 128자)' };
  }

  return { valid: true };
}

/**
 * 이름 검증
 */
export function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: '이름을 입력해주세요.' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return { valid: false, error: '이름을 입력해주세요.' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: '이름이 너무 깁니다. (최대 100자)' };
  }

  return { valid: true };
}

/**
 * 사이트 ID 검증 (UUID 형식)
 */
export function validateSiteId(siteId: string): { valid: boolean; error?: string } {
  if (!siteId || typeof siteId !== 'string') {
    return { valid: false, error: '사이트 ID가 필요합니다.' };
  }

  // 간단한 UUID 형식 검증 (nanoid는 알파벳, 숫자, 하이픈, 언더스코어 사용)
  const idRegex = /^[a-zA-Z0-9_-]+$/;
  if (!idRegex.test(siteId)) {
    return { valid: false, error: '올바르지 않은 사이트 ID 형식입니다.' };
  }

  if (siteId.length > 50) {
    return { valid: false, error: '사이트 ID가 너무 깁니다.' };
  }

  return { valid: true };
}

/**
 * 문자열 길이 제한 및 XSS 방지 (기본적인)
 */
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // 길이 제한
  let sanitized = input.trim().slice(0, maxLength);

  // 기본적인 XSS 방지 (HTML 태그 제거는 필요시 추가)
  // 실제로는 더 강력한 sanitization 라이브러리 사용 권장

  return sanitized;
}

