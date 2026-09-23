-- Locitra Technical SEO provider-neutral payment fields
-- Safe to re-run because changes are idempotent.

alter table seo_scans
  add column if not exists payment_provider text;

alter table seo_scans
  add column if not exists payment_reference text;

alter table seo_scans
  add column if not exists payment_transaction_id text;

alter table seo_scans
  add column if not exists payment_currency text;

create unique index if not exists seo_scans_payment_reference_provider_uidx
  on seo_scans (payment_provider, payment_reference)
  where payment_provider is not null
    and payment_reference is not null;
