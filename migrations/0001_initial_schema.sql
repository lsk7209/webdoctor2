-- KoreSEO Database Schema
-- Cloudflare D1 (SQLite) Migration

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'trial_basic' CHECK(plan IN ('trial_basic', 'basic', 'pro', 'enterprise')),
  trial_expires_at INTEGER, -- Unix timestamp
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_plan ON users(plan);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_workspaces_owner ON workspaces(owner_user_id);

-- Sites table
CREATE TABLE IF NOT EXISTS sites (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  url TEXT NOT NULL,
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'crawling', 'ready', 'failed')),
  last_crawled_at INTEGER,
  page_limit INTEGER NOT NULL DEFAULT 500,
  gsc_connected INTEGER NOT NULL DEFAULT 0, -- SQLite boolean
  ga_connected INTEGER NOT NULL DEFAULT 0,
  naver_connected INTEGER NOT NULL DEFAULT 0,
  naver_site_id TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_sites_workspace ON sites(workspace_id);
CREATE INDEX idx_sites_status ON sites(status);
CREATE INDEX idx_sites_url ON sites(url);

-- CrawlJobs table
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'running', 'completed', 'failed')),
  started_at INTEGER,
  finished_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX idx_crawl_jobs_site ON crawl_jobs(site_id);
CREATE INDEX idx_crawl_jobs_status ON crawl_jobs(status);
CREATE INDEX idx_crawl_jobs_created ON crawl_jobs(created_at DESC);

-- PageSnapshots table
CREATE TABLE IF NOT EXISTS page_snapshots (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  url TEXT NOT NULL,
  last_crawled_at INTEGER NOT NULL DEFAULT (unixepoch()),
  http_status INTEGER,
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  headings_json TEXT, -- JSON array of headings
  links_in INTEGER DEFAULT 0, -- Internal links count
  links_out INTEGER DEFAULT 0, -- External links count
  canonical TEXT,
  noindex INTEGER NOT NULL DEFAULT 0, -- SQLite boolean
  structured_data_json TEXT, -- JSON array of structured data
  lighthouse_score_json TEXT, -- JSON object with performance/seo scores
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX idx_page_snapshots_site ON page_snapshots(site_id);
CREATE INDEX idx_page_snapshots_url ON page_snapshots(url);
CREATE INDEX idx_page_snapshots_crawled ON page_snapshots(last_crawled_at DESC);

-- Issues table (To-Do items)
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  page_url TEXT,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK(severity IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved', 'ignored')),
  summary TEXT NOT NULL,
  description TEXT,
  fix_hint TEXT,
  affected_pages_count INTEGER DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX idx_issues_site ON issues(site_id);
CREATE INDEX idx_issues_type ON issues(issue_type);
CREATE INDEX idx_issues_severity ON issues(severity);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_page_url ON issues(page_url);

-- Integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('gsc', 'ga4', 'naver')),
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'connected', 'failed', 'disconnected')),
  last_synced_at INTEGER,
  credentials_json TEXT, -- Encrypted credentials (OAuth tokens, etc.)
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

CREATE INDEX idx_integrations_site ON integrations(site_id);
CREATE INDEX idx_integrations_type ON integrations(type);
CREATE INDEX idx_integrations_status ON integrations(status);

-- KeywordDaily table (GSC data)
CREATE TABLE IF NOT EXISTS keyword_daily (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  date INTEGER NOT NULL, -- Unix timestamp (start of day)
  query TEXT NOT NULL,
  page_url TEXT,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0.0, -- Click-through rate
  avg_position REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, date, query, page_url)
);

CREATE INDEX idx_keyword_daily_site ON keyword_daily(site_id);
CREATE INDEX idx_keyword_daily_date ON keyword_daily(date DESC);
CREATE INDEX idx_keyword_daily_query ON keyword_daily(query);

-- PageMetricDaily table (GA4 data)
CREATE TABLE IF NOT EXISTS page_metric_daily (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  date INTEGER NOT NULL, -- Unix timestamp (start of day)
  page_url TEXT NOT NULL,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  bounce_rate REAL DEFAULT 0.0,
  engagement_rate REAL DEFAULT 0.0,
  avg_session_duration REAL DEFAULT 0.0, -- in seconds
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, date, page_url)
);

CREATE INDEX idx_page_metric_daily_site ON page_metric_daily(site_id);
CREATE INDEX idx_page_metric_daily_date ON page_metric_daily(date DESC);
CREATE INDEX idx_page_metric_daily_url ON page_metric_daily(page_url);

-- MetricDaily table (aggregated metrics)
CREATE TABLE IF NOT EXISTS metric_daily (
  id TEXT PRIMARY KEY,
  site_id TEXT NOT NULL,
  date INTEGER NOT NULL, -- Unix timestamp (start of day)
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr REAL DEFAULT 0.0,
  avg_position REAL DEFAULT 0.0,
  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  bounce_rate REAL DEFAULT 0.0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
  UNIQUE(site_id, date)
);

CREATE INDEX idx_metric_daily_site ON metric_daily(site_id);
CREATE INDEX idx_metric_daily_date ON metric_daily(date DESC);

