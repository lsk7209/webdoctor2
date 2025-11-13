/**
 * Database Schema Types
 * Cloudflare D1 (SQLite) 타입 정의
 */

export type UserPlan = 'trial_basic' | 'basic' | 'pro' | 'enterprise';

export type SiteStatus = 'pending' | 'crawling' | 'ready' | 'failed';

export type CrawlJobStatus = 'pending' | 'running' | 'completed' | 'failed';

export type IssueSeverity = 'high' | 'medium' | 'low';

export type IssueStatus = 'open' | 'in_progress' | 'resolved' | 'ignored';

export type IntegrationType = 'gsc' | 'ga4' | 'naver';

export type IntegrationStatus = 'pending' | 'connected' | 'failed' | 'disconnected';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  plan: UserPlan;
  trial_expires_at: number | null;
  created_at: number;
  updated_at: number;
}

export interface Workspace {
  id: string;
  owner_user_id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export interface Site {
  id: string;
  workspace_id: string;
  url: string;
  display_name: string | null;
  status: SiteStatus;
  last_crawled_at: number | null;
  page_limit: number;
  gsc_connected: boolean;
  ga_connected: boolean;
  naver_connected: boolean;
  naver_site_id: string | null;
  created_at: number;
  updated_at: number;
}

export interface CrawlJob {
  id: string;
  site_id: string;
  status: CrawlJobStatus;
  started_at: number | null;
  finished_at: number | null;
  error_message: string | null;
  created_at: number;
}

export interface PageSnapshot {
  id: string;
  site_id: string;
  url: string;
  last_crawled_at: number;
  http_status: number | null;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  headings_json: string | null; // JSON string
  links_in: number;
  links_out: number;
  canonical: string | null;
  noindex: boolean;
  structured_data_json: string | null; // JSON string
  lighthouse_score_json: string | null; // JSON string
  created_at: number;
  updated_at: number;
}

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

export interface Integration {
  id: string;
  site_id: string;
  type: IntegrationType;
  external_id: string | null;
  status: IntegrationStatus;
  last_synced_at: number | null;
  credentials_json: string | null; // Encrypted JSON string
  created_at: number;
  updated_at: number;
}

export interface KeywordDaily {
  id: string;
  site_id: string;
  date: number; // Unix timestamp (start of day)
  query: string;
  page_url: string | null;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  created_at: number;
}

export interface PageMetricDaily {
  id: string;
  site_id: string;
  date: number; // Unix timestamp (start of day)
  page_url: string;
  sessions: number;
  users: number;
  bounce_rate: number;
  engagement_rate: number;
  avg_session_duration: number; // in seconds
  created_at: number;
}

export interface MetricDaily {
  id: string;
  site_id: string;
  date: number; // Unix timestamp (start of day)
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  sessions: number;
  users: number;
  bounce_rate: number;
  created_at: number;
}

