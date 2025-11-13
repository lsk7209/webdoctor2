/**
 * Google Pagespeed Insights API 연동
 * Lighthouse 성능 및 SEO 점수 수집
 */

export interface LighthouseScores {
  performance: number;
  seo: number;
  accessibility?: number;
  bestPractices?: number;
  coreWebVitals?: {
    lcp?: number; // Largest Contentful Paint
    fid?: number; // First Input Delay
    cls?: number; // Cumulative Layout Shift
  };
}

export interface PagespeedOptions {
  apiKey?: string;
  strategy?: 'desktop' | 'mobile';
  category?: ('performance' | 'seo' | 'accessibility' | 'best-practices')[];
}

/**
 * Pagespeed Insights API를 사용하여 Lighthouse 점수 수집
 */
export async function getLighthouseScores(
  url: string,
  options: PagespeedOptions = {}
): Promise<LighthouseScores | null> {
  const {
    apiKey = process.env.PAGESPEED_INSIGHTS_API_KEY,
    strategy = 'mobile',
    category = ['performance', 'seo'],
  } = options;

  if (!apiKey) {
    console.warn('PAGESPEED_INSIGHTS_API_KEY가 설정되지 않았습니다.');
    return null;
  }

  try {
    const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
    apiUrl.searchParams.set('url', url);
    apiUrl.searchParams.set('key', apiKey);
    apiUrl.searchParams.set('strategy', strategy);
    apiUrl.searchParams.set('category', category.join(','));

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Pagespeed Insights API error for ${url}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Lighthouse 점수 추출
    const lighthouseResult = data.lighthouseResult;
    if (!lighthouseResult) {
      console.warn(`No lighthouse result for ${url}`);
      return null;
    }

    const scores: LighthouseScores = {
      performance: Math.round(lighthouseResult.categories?.performance?.score * 100 || 0),
      seo: Math.round(lighthouseResult.categories?.seo?.score * 100 || 0),
    };

    // 추가 점수 (선택사항)
    if (lighthouseResult.categories?.accessibility) {
      scores.accessibility = Math.round(lighthouseResult.categories.accessibility.score * 100);
    }
    if (lighthouseResult.categories?.['best-practices']) {
      scores.bestPractices = Math.round(lighthouseResult.categories['best-practices'].score * 100);
    }

    // Core Web Vitals 추출
    const audits = lighthouseResult.audits;
    if (audits) {
      scores.coreWebVitals = {};
      
      // LCP (Largest Contentful Paint)
      if (audits['largest-contentful-paint']) {
        const lcpValue = audits['largest-contentful-paint'].numericValue;
        if (lcpValue !== undefined) {
          scores.coreWebVitals.lcp = Math.round(lcpValue);
        }
      }

      // FID (First Input Delay) - 실제 측정값이 아닌 시뮬레이션
      if (audits['max-potential-fid']) {
        const fidValue = audits['max-potential-fid'].numericValue;
        if (fidValue !== undefined) {
          scores.coreWebVitals.fid = Math.round(fidValue);
        }
      }

      // CLS (Cumulative Layout Shift)
      if (audits['cumulative-layout-shift']) {
        const clsValue = audits['cumulative-layout-shift'].numericValue;
        if (clsValue !== undefined) {
          scores.coreWebVitals.cls = Math.round(clsValue * 1000) / 1000; // 소수점 3자리
        }
      }
    }

    return scores;
  } catch (error) {
    console.error(`Failed to get Lighthouse scores for ${url}:`, error);
    return null;
  }
}

/**
 * 여러 URL에 대한 Lighthouse 점수 수집 (배치 처리)
 * API 호출 제한을 고려하여 순차적으로 처리
 */
export async function getLighthouseScoresBatch(
  urls: string[],
  options: PagespeedOptions = {}
): Promise<Map<string, LighthouseScores | null>> {
  const results = new Map<string, LighthouseScores | null>();
  
  // API 호출 제한을 고려하여 순차 처리 (초당 1회 제한)
  for (const url of urls) {
    const scores = await getLighthouseScores(url, options);
    results.set(url, scores);
    
    // API 호출 제한을 피하기 위해 1초 대기
    if (urls.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

