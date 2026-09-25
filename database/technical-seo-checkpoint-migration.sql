-- Locitra Technical SEO Troubleshooter
-- Phase 6B-2 Migration: Add checkpoint_json to seo_scans for durable chunked crawl resilience.
alter table seo_scans
  add column if not exists checkpoint_json jsonb;
