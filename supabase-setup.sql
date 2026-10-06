-- 7ACE Hub: one private row of data per user, per app.
-- Paste this whole script into Supabase > SQL Editor > New query, then click Run.

create table if not exists public.user_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  app        text        not null check (char_length(app) <= 40),
  data       jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, app),
  constraint user_data_size check (pg_column_size(data) < 2000000)   -- 2 MB cap per app per user
);

-- Row Level Security: the database itself refuses to show anyone else's rows.
alter table public.user_data enable row level security;

create policy "Users read their own data"
  on public.user_data for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert their own data"
  on public.user_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own data"
  on public.user_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete their own data"
  on public.user_data for delete to authenticated
  using ((select auth.uid()) = user_id);

-- "Automatically expose new tables" is off, so grant access on purpose:
-- signed-in users only, never anonymous visitors.
revoke all on public.user_data from anon;
grant select, insert, update, delete on public.user_data to authenticated;

-- Keep updated_at honest (the apps use it to detect two devices saving at once).
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

create trigger user_data_set_updated_at
  before update on public.user_data
  for each row execute function public.set_updated_at();
