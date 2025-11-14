/**
 * 주간 리포트 이메일 발송 로직
 */

import type { D1Database } from '@/db/client';
import { getWorkspaceByOwnerId } from '@/lib/db/workspaces';
import { getSitesByWorkspaceId } from '@/lib/db/sites';
import { getUserById } from '@/lib/db/users';
import { getIssuesBySiteId } from '@/lib/db/issues';
import { calculateHealthScore } from '@/lib/seo/health-score';
import { sendEmail } from './sender';
import { getWeeklyReportEmail } from './templates';

/**
 * 워크스페이스에 대한 주간 리포트 이메일 발송
 */
export async function sendWeeklyReportEmail(
  db: D1Database,
  workspaceId: string,
  env?: any
): Promise<boolean> {
  try {
    // 워크스페이스 및 사용자 정보 조회
    const workspace = await db
      .prepare('SELECT * FROM workspaces WHERE id = ?')
      .bind(workspaceId)
      .first<{ owner_user_id: string; name: string }>();

    if (!workspace) {
      console.warn(`Workspace ${workspaceId} not found`);
      return false;
    }

    const user = await getUserById(db, workspace.owner_user_id);
    if (!user || !user.email) {
      console.warn(`User not found or email missing for workspace ${workspaceId}`);
      return false;
    }

    // 사이트 목록 조회 (ready 상태만)
    const allSites = await getSitesByWorkspaceId(db, workspaceId);
    const readySites = allSites.filter((s) => s.status === 'ready');

    if (readySites.length === 0) {
      console.log(`No ready sites found for workspace ${workspaceId}`);
      return false;
    }

    // 각 사이트의 Health 점수 및 이슈 통계 계산
    const sitesData = await Promise.all(
      readySites.map(async (site) => {
        const { issues } = await getIssuesBySiteId(db, site.id);
        const healthScore = calculateHealthScore(issues);

        return {
          name: site.display_name || site.url,
          url: site.url,
          healthScore: healthScore.score,
          issueCount: healthScore.total,
        };
      })
    );

    // 전체 이슈 통계
    const allIssuesResults = await Promise.all(
      readySites.map((site) => getIssuesBySiteId(db, site.id))
    );
    const flatIssues = allIssuesResults.flatMap((result) => result.issues);
    const openIssues = flatIssues.filter(
      (i) => i.status === 'open' || i.status === 'in_progress'
    );
    const totalIssues = openIssues.length;
    const highIssues = openIssues.filter((i) => i.severity === 'high').length;

    // 대시보드 URL 생성
    const dashboardUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'https://webdoctor.kr'
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://webdoctor.kr'}/dashboard`
        : '/dashboard';

    // 이메일 발송
    const emailHtml = getWeeklyReportEmail({
      sites: sitesData,
      totalIssues,
      highIssues,
      dashboardUrl,
    });

    return await sendEmail(
      {
        to: user.email,
        subject: `📊 ${workspace.name} 주간 SEO 리포트`,
        html: emailHtml,
      },
      env
    );
  } catch (error) {
    console.error('Failed to send weekly report email:', error);
    return false;
  }
}

