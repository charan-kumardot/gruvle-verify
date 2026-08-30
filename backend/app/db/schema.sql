-- Gruvle Verify — Supabase schema. Run in the Supabase SQL editor, or via
-- `supabase db push` if you adopt the CLI later. Idempotent (safe to re-run).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- verifications: one row per verification run. Claims/evidence/sources are
-- stored as JSONB rather than fully normalized — this is document-shaped data
-- produced once by the pipeline and read as a whole by the report UI; normalizing
-- it would add joins with no query benefit this product currently needs.
-- ---------------------------------------------------------------------------
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_type text not null,
  input_raw text not null,
  user_question text,
  mode text not null,
  title text not null default '',
  verdict text not null,
  risk_level text,
  confidence jsonb not null default '{}'::jsonb,
  summary text not null default '',
  claims jsonb not null default '[]'::jsonb,
  evidence jsonb not null default '[]'::jsonb,
  sources jsonb not null default '[]'::jsonb,
  contradictions jsonb not null default '[]'::jsonb,
  open_questions jsonb not null default '[]'::jsonb,
  next_actions jsonb not null default '[]'::jsonb,
  degraded_providers jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  notes text,
  saved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists verifications_user_id_idx on public.verifications(user_id);
create index if not exists verifications_created_at_idx on public.verifications(created_at desc);
create index if not exists verifications_verdict_idx on public.verifications(verdict);
create index if not exists verifications_saved_idx on public.verifications(saved) where saved;

alter table public.verifications enable row level security;

drop policy if exists "verifications_select_own" on public.verifications;
create policy "verifications_select_own" on public.verifications
  for select using (auth.uid() = user_id);

drop policy if exists "verifications_insert_own" on public.verifications;
create policy "verifications_insert_own" on public.verifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "verifications_update_own" on public.verifications;
create policy "verifications_update_own" on public.verifications
  for update using (auth.uid() = user_id);

drop policy if exists "verifications_delete_own" on public.verifications;
create policy "verifications_delete_own" on public.verifications
  for delete using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists verifications_set_updated_at on public.verifications;
create trigger verifications_set_updated_at
  before update on public.verifications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- profiles: onboarding answers. One row per user, created on first onboarding
-- submission (or skip).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  verification_interests text[] not null default '{}',
  usual_verification_method text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- watchlist_items: entities/claims a user wants to re-check over time.
-- ---------------------------------------------------------------------------
create table if not exists public.watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  verification_id uuid references public.verifications(id) on delete set null,
  label text not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.watchlist_items enable row level security;

drop policy if exists "watchlist_all_own" on public.watchlist_items;
create policy "watchlist_all_own" on public.watchlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
