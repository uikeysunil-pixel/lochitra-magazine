-- Locitra Technical SEO payment migration
-- Run once against the existing production database.
-- Safe to re-run because changes are idempotent.

alter table seo_scans
  add column if not exists payment_status text not null default 'unpaid';

alter table seo_scans
  add column if not exists customer_email text;

alter table seo_scans
  add column if not exists paid_at timestamptz;

alter table seo_scans
  add column if not exists background_event_sent_at timestamptz;
