-- Remove legacy payment-gateway columns from the Technical SEO database.
-- Run once against an existing database created before the Cashfree migration.
-- Safe to re-run.

drop index if exists seo_scans_stripe_checkout_session_uidx;

alter table seo_scans
  drop column if exists stripe_checkout_session_id,
  drop column if exists stripe_payment_intent_id;
