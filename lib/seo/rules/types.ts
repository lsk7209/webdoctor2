/**
 * SEO 감사 룰 타입 정의
 */

export type IssueSeverity = 'high' | 'medium' | 'low';
export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

export interface Issue {
  id: string;
  site_id: string;
  page_url: string | null;
  issue_type: string;
  severity: IssueSeverity;
  status: IssueStatus;
  summary: string;
  description: string | null;
  fix_hint: string | null;
  affected_pages_count: number;
  created_at: number;
  updated_at: number;
}

export interface RuleContext {
  siteId: string;
  pageSnapshots: Array<{
    id: string;
    url: string;
    title: string | null;
    meta_description: string | null;
    h1: string | null;
    headings_json: string | null;
    links_in: number;
    links_out: number;
    canonical: string | null;
    noindex: boolean;
    structured_data_json: string | null;
    lighthouse_score_json: string | null;
    http_status: number | null;
  }>;
}

export interface RuleResult {
  issues: Issue[];
}

export type RuleFunction = (context: RuleContext) => Promise<Issue[]>;

