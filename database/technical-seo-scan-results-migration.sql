-- Locitra Technical SEO Troubleshooter
-- Phase 6B-2 Remediation Migration: Store full per-page scan results in seo_scan_urls
-- Safe to re-run because every change is idempotent.

alter table seo_scan_urls
  add column if not exists result_json jsonb;
