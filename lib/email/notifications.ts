/**
 * 이메일 알림 발송 로직
 */

import type { D1Database } from '@/db/client';
import { getSiteById } from '@/lib/db/sites';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getUserById } from '@/lib/db/users';
import { getIssuesBySiteId } from '@/lib/db/issues';
import { calculateHealthScore } from '@/lib/seo/health-score';
import { sendEmail } from './sender';
import { getFirstAuditCompleteEmail } from './templates';

/**
 * 첫 감사 완료 이메일 발송
 */
export async function sendFirstAuditCompleteEmail(
  db: D1Database,
  siteId: string,
  env?: any
): Promise<boolean> {
  try {
    // 사이트 정보 조회
    const site = await getSiteById(db, siteId);
    if (!site) {
      console.warn(`Site ${siteId} not found`);
      return false;
    }

    // 워크스페이스 및 사용자 정보 조회
    const workspace = await getWorkspaceByOwnerId(db, site.workspace_id);
    if (!workspace) {
      console.warn(`Workspace not found for site ${siteId}`);
      return false;
    }

    const user = await getUserById(db, workspace.owner_user_id);
    if (!user || !user.email) {
      console.warn(`User not found or email missing for workspace ${workspace.id}`);
      return false;
    }

    // 이슈 조회 및 Health 점수 계산
    const { issues } = await getIssuesBySiteId(db, siteId);
    const healthScore = calculateHealthScore(issues);

    // 대시보드 URL 생성 (환경에 따라 다를 수 있음)
    const dashboardUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://webdoctor.kr'
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://webdoctor.kr'}/sites/${siteId}`
        : `/sites/${siteId}`;

    // 이메일 발송
    const emailHtml = getFirstAuditCompleteEmail({
      siteName: site.display_name || site.url,
      siteUrl: site.url,
      healthScore: healthScore.score,
      issueCount: healthScore.total,
      highIssueCount: healthScore.high,
      dashboardUrl,
    });

    return await sendEmail(
      {
        to: user.email,
        subject: `🎉 ${site.display_name || site.url}의 첫 SEO 감사가 완료되었습니다`,
        html: emailHtml,
      },
      env
    );
  } catch (error) {
    console.error('Failed to send first audit complete email:', error);
    return false;
  }
}

