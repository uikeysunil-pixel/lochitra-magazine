-- Locitra Technical SEO report access migration
-- Run once against the existing production database.
-- Safe to re-run because every change is idempotent.

alter table seo_scans
  add column if not exists access_mode text not null default 'public';

alter table seo_scans
  add column if not exists report_token_hash text;

create unique index if not exists seo_scans_report_token_hash_uidx
  on seo_scans (report_token_hash)
  where report_token_hash is not null;

-- Existing Free scans remain public.
-- Paid scans will be created as private and receive a report access token.
