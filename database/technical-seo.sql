-- Locitra Technical SEO Troubleshooter
-- Background scan persistence model.
-- Apply to the production Postgres database after the Neon project is connected.

create extension if not exists pgcrypto;

create table if not exists seo_scans (
  id uuid primary key default gen_random_uuid(),
  website_url text not null,
  final_url text,
  problem text not null,
  plan text not null,
  access_mode text not null default 'public',
  report_token_hash text,
  payment_status text not null default 'unpaid',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  customer_email text,
  paid_at timestamptz,
  background_event_sent_at timestamptz,
  status text not null default 'queued',
  max_urls integer not null,
  pages_discovered integer not null default 0,
  pages_checked integer not null default 0,
  pages_not_crawled integer not null default 0,
  urls_blocked_by_robots integer not null default 0,
  crawl_errors integer not null default 0,
  progress_percent integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  report_json jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists seo_scans_status_created_idx
  on seo_scans (status, created_at);

create unique index if not exists seo_scans_stripe_checkout_session_uidx
  on seo_scans (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create table if not exists seo_scan_urls (
  id bigserial primary key,
  scan_id uuid not null references seo_scans(id) on delete cascade,
  url text not null,
  normalized_url text not null,
  state text not null default 'queued',
  depth integer not null default 0,
  discovered_from text,
  attempts integer not null default 0,
  http_status integer,
  duration_ms integer,
  scanned_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, normalized_url)
);

create index if not exists seo_scan_urls_scan_state_idx
  on seo_scan_urls (scan_id, state, id);

create index if not exists seo_scan_urls_scan_created_idx
  on seo_scan_urls (scan_id, created_at);

create table if not exists seo_scan_findings (
  id bigserial primary key,
  scan_id uuid not null references seo_scans(id) on delete cascade,
  finding_key text not null,
  severity text not null,
  confidence text not null,
  title text not null,
  category text not null,
  summary text not null,
  recommendation text not null,
  diagnostic_problems jsonb not null default '[]'::jsonb,
  affected_urls jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scan_id, finding_key)
);

create index if not exists seo_scan_findings_scan_severity_idx
  on seo_scan_findings (scan_id, severity);

-- Allowed state values are enforced in application code for the MVP:
-- queued -> running -> analyzing -> complete
-- queued -> cancelled
-- running/analyzing -> failed

create unique index if not exists seo_scans_report_token_hash_uidx
  on seo_scans (report_token_hash)
  where report_token_hash is not null;
