-- Performance + free-tier hygiene for analytics
-- Run in Supabase SQL Editor after 004_admin_platform.sql

create index if not exists analytics_events_visitor_idx
  on public.analytics_events (visitor_id);

create index if not exists analytics_events_occurred_idx
  on public.analytics_events (occurred_at desc);

create index if not exists analytics_live_seen_idx
  on public.analytics_live (last_seen_at desc);

create index if not exists analytics_live_visitor_idx
  on public.analytics_live (visitor_id);

-- Keep analytics tables small on the free plan (default: 21 days of events)
create or replace function public.prune_analytics(retention_days int default 21)
returns jsonb
language plpgsql
security definer
as $$
declare
  cutoff timestamptz := now() - make_interval(days => retention_days);
  events_deleted int;
  sessions_deleted int;
  live_deleted int;
begin
  delete from public.analytics_events where occurred_at < cutoff;
  get diagnostics events_deleted = row_count;

  delete from public.analytics_sessions where started_at < cutoff;
  get diagnostics sessions_deleted = row_count;

  delete from public.analytics_live where last_seen_at < now() - interval '10 minutes';
  get diagnostics live_deleted = row_count;

  -- Drop visitors with no recent activity
  delete from public.analytics_visitors
  where last_seen_at < cutoff;

  return jsonb_build_object(
    'cutoff', cutoff,
    'events_deleted', events_deleted,
    'sessions_deleted', sessions_deleted,
    'live_deleted', live_deleted
  );
end;
$$;

-- Optional: schedule weekly prune via Supabase cron (pg_cron) if enabled:
-- select cron.schedule('prune-analytics-weekly', '0 3 * * 0', $$select public.prune_analytics(21)$$);
