-- Locitra Technical SEO payment migration
-- Run once against the existing production database.
-- Safe to re-run because changes are idempotent.

alter table seo_scans
  add column if not exists payment_status text not null default 'unpaid';

alter table seo_scans
  add column if not exists stripe_checkout_session_id text;

alter table seo_scans
  add column if not exists stripe_payment_intent_id text;

alter table seo_scans
  add column if not exists customer_email text;

alter table seo_scans
  add column if not exists paid_at timestamptz;

alter table seo_scans
  add column if not exists background_event_sent_at timestamptz;

create unique index if not exists seo_scans_stripe_checkout_session_uidx
  on seo_scans (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;
