-- Skill-balance update detector.
-- A daily pg_cron job calls the `check-skill-updates` Edge Function, which scans
-- the GW1 wiki "Game updates" page for a Feedback:Game_updates/<date> newer than
-- the last one we applied and records a notification when one appears.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Singleton row tracking the newest update date we know about (YYYYMMDD).
create table if not exists public.skill_update_state (
  id boolean primary key default true,
  last_known_update_date text not null,
  last_checked_at timestamptz,
  constraint skill_update_state_singleton check (id)
);

alter table public.skill_update_state enable row level security;
-- No policies on purpose: only the service role (bypasses RLS) reads/writes this.

insert into public.skill_update_state (id, last_known_update_date)
values (true, '20260624')
on conflict (id) do nothing;

-- One row per newly detected update (so we can see history and avoid re-notifying).
create table if not exists public.skill_update_notifications (
  id bigint generated always as identity primary key,
  update_date text not null,
  detected_at timestamptz not null default now(),
  payload jsonb
);

alter table public.skill_update_notifications enable row level security;

-- Daily check at 08:17 UTC. The function URL and service-role key are read from
-- Supabase Vault so no secrets are committed to git. Before this cron can run,
-- create the secrets once (dev project ref aqjfurwosiiicfxqmbjd):
--   select vault.create_secret(
--     'https://aqjfurwosiiicfxqmbjd.supabase.co/functions/v1/check-skill-updates',
--     'skill_update_function_url');
--   select vault.create_secret('<service-role-key>', 'skill_update_service_key');
select cron.schedule(
  'check-skill-updates',
  '17 8 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets
            where name = 'skill_update_function_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets
         where name = 'skill_update_service_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
