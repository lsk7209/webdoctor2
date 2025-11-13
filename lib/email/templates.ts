/**
 * 이메일 템플릿
 */

interface FirstAuditCompleteEmailData {
  siteName: string;
  siteUrl: string;
  healthScore: number;
  issueCount: number;
  highIssueCount: number;
  dashboardUrl: string;
}

interface WeeklyReportEmailData {
  sites: Array<{
    name: string;
    url: string;
    healthScore: number;
    issueCount: number;
  }>;
  totalIssues: number;
  highIssues: number;
  dashboardUrl: string;
}

/**
 * 첫 감사 완료 이메일 템플릿
 */
export function getFirstAuditCompleteEmail(
  data: FirstAuditCompleteEmailData
): string {
  const healthScoreColor =
    data.healthScore >= 80 ? '#10b981' : data.healthScore >= 50 ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>첫 감사 완료</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🎉 첫 감사 완료!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      안녕하세요! <strong>${data.siteName}</strong>의 첫 SEO 감사가 완료되었습니다.
    </p>

    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 48px; font-weight: bold; color: ${healthScoreColor};">
          ${data.healthScore}
        </div>
        <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Health 점수</div>
      </div>
      
      <div style="display: flex; justify-content: space-around; margin-top: 20px;">
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #111827;">${data.issueCount}</div>
          <div style="color: #6b7280; font-size: 12px;">전체 이슈</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 24px; font-weight: bold; color: #ef4444;">${data.highIssueCount}</div>
          <div style="color: #6b7280; font-size: 12px;">심각 이슈</div>
        </div>
      </div>
    </div>

    <div style="margin: 30px 0;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center;">
        대시보드에서 확인하기
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">사이트 URL: <a href="${data.siteUrl}" style="color: #667eea;">${data.siteUrl}</a></p>
      <p style="margin: 10px 0 0 0;">이 이메일은 KoreSEO에서 자동으로 발송되었습니다.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * 주간 리포트 이메일 템플릿
 */
export function getWeeklyReportEmail(data: WeeklyReportEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>주간 SEO 리포트</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">📊 주간 SEO 리포트</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; margin-bottom: 20px;">
      지난 주 동안의 SEO 감사 결과를 요약해드립니다.
    </p>

    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <div style="display: flex; justify-content: space-around;">
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #111827;">${data.totalIssues}</div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">전체 이슈</div>
        </div>
        <div style="text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${data.highIssues}</div>
          <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">심각 이슈</div>
        </div>
      </div>
    </div>

    <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 15px;">사이트별 현황</h2>
    ${data.sites
      .map(
        (site) => `
      <div style="border: 1px solid #e5e7eb; border-radius: 6px; padding: 15px; margin-bottom: 15px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${site.name}</h3>
          <span style="font-size: 24px; font-weight: bold; color: ${
            site.healthScore >= 80 ? '#10b981' : site.healthScore >= 50 ? '#f59e0b' : '#ef4444'
          };">
            ${site.healthScore}
          </span>
        </div>
        <p style="margin: 5px 0; color: #6b7280; font-size: 14px;">
          <a href="${site.url}" style="color: #667eea; text-decoration: none;">${site.url}</a>
        </p>
        <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">
          이슈 ${site.issueCount}개
        </p>
      </div>
    `
      )
      .join('')}

    <div style="margin: 30px 0;">
      <a href="${data.dashboardUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; text-align: center;">
        대시보드에서 자세히 보기
      </a>
    </div>

    <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
      <p style="margin: 0;">이 이메일은 KoreSEO에서 자동으로 발송되었습니다.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

