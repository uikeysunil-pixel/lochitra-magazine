-- Locitra Technical SEO Google Search Console Integration
-- Phase 10B: Store encrypted refresh token and metadata for Deep Investigation scans.
-- Safe to re-run because every change is idempotent.

alter table seo_scans
  add column if not exists gsc_property text;

alter table seo_scans
  add column if not exists gsc_refresh_token_encrypted text;

alter table seo_scans
  add column if not exists gsc_token_expires_at timestamptz;

alter table seo_scans
  add column if not exists gsc_connected_at timestamptz;

alter table seo_scans
  add column if not exists gsc_oauth_state_hash text;
