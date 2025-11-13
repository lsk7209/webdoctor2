/**
 * Workspaces 데이터베이스 레포지토리
 */

import type { D1Database } from '@/db/client';
import type { Workspace } from '@/db/schema';
import { generateId, getUnixTimestamp } from '@/db/client';

/**
 * 사용자 ID로 워크스페이스 조회
 */
export async function getWorkspaceByOwnerId(
  db: D1Database,
  ownerUserId: string
): Promise<Workspace | null> {
  const result = await db
    .prepare('SELECT * FROM workspaces WHERE owner_user_id = ?')
    .bind(ownerUserId)
    .first<Workspace>();

  return result || null;
}

/**
 * 워크스페이스 생성
 */
export async function createWorkspace(
  db: D1Database,
  ownerUserId: string,
  name: string
): Promise<Workspace> {
  const id = generateId();
  const now = getUnixTimestamp();

  await db
    .prepare(
      `INSERT INTO workspaces (id, owner_user_id, name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .bind(id, ownerUserId, name, now, now)
    .run();

  const workspace = await db
    .prepare('SELECT * FROM workspaces WHERE id = ?')
    .bind(id)
    .first<Workspace>();

  if (!workspace) {
    throw new Error('Failed to create workspace');
  }

  return workspace;
}

