-- Locitra Technical SEO watchdog index for paid scans awaiting background event dispatch.
-- Safe to re-run because changes are idempotent.

create index if not exists seo_scans_unprocessed_paid_idx
  on seo_scans (paid_at)
  where payment_status = 'paid'
    and status = 'queued'
    and background_event_sent_at is null;
