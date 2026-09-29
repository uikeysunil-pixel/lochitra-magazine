alter table seo_scans
  add column if not exists gsc_search_analytics_json jsonb;
