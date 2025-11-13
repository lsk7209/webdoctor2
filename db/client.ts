/**
 * Database Client
 * Cloudflare D1 데이터베이스 클라이언트 유틸리티
 */

// D1Database 타입 정의 (Cloudflare Workers 타입)
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<D1ExecResult>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

export interface D1Result<T = unknown> {
  success: boolean;
  meta: {
    duration: number;
    rows_read: number;
    rows_written: number;
    last_row_id: number;
    changed_db: boolean;
    changes: number;
  };
  results?: T[];
  error?: string;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * D1 데이터베이스 클라이언트 래퍼
 * 환경 변수에서 D1 바인딩을 가져와 사용
 */
export function getDb(env: { DB: D1Database }): D1Database {
  return env.DB;
}

/**
 * 마이그레이션 실행 헬퍼
 */
export async function runMigration(
  db: D1Database,
  migrationSql: string
): Promise<void> {
  const statements = migrationSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.exec(statement);
  }
}

/**
 * ID 생성 헬퍼 (nanoid 또는 crypto.randomUUID 사용)
 */
export function generateId(): string {
  // Cloudflare Workers 환경에서는 crypto.randomUUID 사용
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 간단한 랜덤 ID 생성
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Unix timestamp 생성 헬퍼
 */
export function getUnixTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

