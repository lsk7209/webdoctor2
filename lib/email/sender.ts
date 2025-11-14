/**
 * 이메일 발송 유틸리티
 * Cloudflare MailChannels 또는 Resend 사용
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Cloudflare MailChannels를 사용한 이메일 발송
 * Cloudflare Workers 환경에서만 작동
 */
async function sendViaMailChannels(
  options: EmailOptions,
  env?: any
): Promise<boolean> {
  try {
    // Cloudflare 환경에서만 MailChannels 사용 가능
    if (!env) {
      console.warn('MailChannels는 Cloudflare Workers 환경에서만 사용 가능합니다.');
      return false;
    }

    const mailChannel = env.MAILCHANNELS;

    if (!mailChannel) {
      console.warn('MAILCHANNELS 바인딩이 설정되지 않았습니다.');
      return false;
    }

    const response = await mailChannel.send({
      personalizations: [
        {
          to: [{ email: options.to }],
        },
      ],
      from: {
        email: options.from || 'noreply@webdoctor.kr',
        name: 'KoreSEO',
      },
      subject: options.subject,
      content: [
        {
          type: 'text/html',
          value: options.html,
        },
      ],
    });

    return response.status === 202;
  } catch (error) {
    console.error('MailChannels 이메일 발송 실패:', error);
    return false;
  }
}

/**
 * Resend를 사용한 이메일 발송
 */
async function sendViaResend(options: EmailOptions): Promise<boolean> {
  try {
    // Cloudflare 환경 변수에서 가져오기
    const resendApiKey = 
      (typeof process !== 'undefined' && process.env?.RESEND_API_KEY) ||
      (typeof globalThis !== 'undefined' && 'env' in globalThis && (globalThis as any).env?.RESEND_API_KEY);
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY 환경 변수가 설정되지 않았습니다.');
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: options.from || 'KoreSEO <noreply@webdoctor.kr>',
        to: [options.to],
        subject: options.subject,
        html: options.html,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Resend 이메일 발송 실패:', error);
    return false;
  }
}

/**
 * 이메일 발송 (자동으로 사용 가능한 서비스 선택)
 */
export async function sendEmail(
  options: EmailOptions,
  env?: any
): Promise<boolean> {
  // Cloudflare 환경에서 MailChannels 우선 사용
  if (env) {
    const mailChannelsSuccess = await sendViaMailChannels(options, env);
    if (mailChannelsSuccess) {
      return true;
    }
  }

  // Resend 사용 시도
  const resendSuccess = await sendViaResend(options);
  if (resendSuccess) {
    return true;
  }

  // 개발 환경에서는 콘솔에만 출력
  const nodeEnv = 
    (typeof process !== 'undefined' && process.env?.NODE_ENV) ||
    (typeof globalThis !== 'undefined' && 'env' in globalThis && (globalThis as any).env?.NODE_ENV) ||
    'production';
  if (nodeEnv === 'development') {
    console.log('📧 이메일 발송 (개발 모드):', {
      to: options.to,
      subject: options.subject,
    });
    return true;
  }

  return false;
}

