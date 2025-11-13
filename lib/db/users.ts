/**
 * Users 데이터베이스 레포지토리
 */

import type { D1Database } from '@/db/client';
import type { User } from '@/db/schema';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * 이메일로 사용자 조회
 */
export async function getUserByEmail(
  db: D1Database,
  email: string
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE email = ?')
    .bind(email)
    .first<User>();

  return result || null;
}

/**
 * ID로 사용자 조회
 */
export async function getUserById(
  db: D1Database,
  id: string
): Promise<User | null> {
  const result = await db
    .prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first<User>();

  return result || null;
}

/**
 * 사용자 생성
 */
export async function createUser(
  db: D1Database,
  data: {
    email: string;
    password_hash: string;
    name: string;
    plan?: string;
    trial_expires_at?: number;
  }
): Promise<User> {
  const id = generateId();
  const now = getUnixTimestamp();
  const trialExpiresAt = data.trial_expires_at || now + 14 * 24 * 60 * 60; // 14일 후

  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, name, plan, trial_expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.email,
      data.password_hash,
      data.name,
      data.plan || 'trial_basic',
      trialExpiresAt,
      now,
      now
    )
    .run();

  const user = await getUserById(db, id);
  if (!user) {
    throw new Error('Failed to create user');
  }

  return user;
}

