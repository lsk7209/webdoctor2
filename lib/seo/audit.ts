/**
 * SEO 감사 실행 모듈
 * 크롤 완료 후 자동으로 SEO 감사를 실행하고 이슈를 생성
 */

import type { D1Database } from '@/db/client';
import { runAuditRules } from './rules/engine';
import type { RuleContext } from './rules/types';
import { getPageSnapshotsBySiteId } from '@/lib/db/page-snapshots';
import { createIssuesBatch, deleteIssuesBySiteId } from '@/lib/db/issues';

/**
 * 사이트에 대한 SEO 감사 실행
 * @param db 데이터베이스 인스턴스
 * @param siteId 사이트 ID
 */
export async function runSiteAudit(db: D1Database, siteId: string): Promise<number> {
  // 페이지 스냅샷 조회
  const pageSnapshots = await getPageSnapshotsBySiteId(db, siteId, 10000); // 충분히 큰 제한

  if (pageSnapshots.length === 0) {
    console.log(`No page snapshots found for site ${siteId}`);
    return 0;
  }

  // RuleContext 생성
  const context: RuleContext = {
    siteId,
    pageSnapshots: pageSnapshots.map((snapshot) => ({
      id: snapshot.id,
      url: snapshot.url,
      title: snapshot.title,
      meta_description: snapshot.meta_description,
      h1: snapshot.h1,
      headings_json: snapshot.headings_json,
      links_in: snapshot.links_in,
      links_out: snapshot.links_out,
      canonical: snapshot.canonical,
      noindex: Boolean(snapshot.noindex),
      structured_data_json: snapshot.structured_data_json,
      lighthouse_score_json: snapshot.lighthouse_score_json,
      http_status: snapshot.http_status,
    })),
  };

  // 기존 이슈 삭제 (새로운 감사 결과로 대체)
  await deleteIssuesBySiteId(db, siteId);

  // SEO 룰 실행
  const issues = await runAuditRules(context);

  // 이슈를 데이터베이스에 저장
  if (issues.length > 0) {
    await createIssuesBatch(
      db,
      issues.map((issue) => ({
        site_id: issue.site_id,
        page_url: issue.page_url,
        issue_type: issue.issue_type,
        severity: issue.severity,
        status: issue.status,
        summary: issue.summary,
        description: issue.description,
        fix_hint: issue.fix_hint,
        affected_pages_count: issue.affected_pages_count,
      }))
    );
  }

  return issues.length;
}

