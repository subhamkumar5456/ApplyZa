-- ============================================================
-- Migration: create resume_versions table
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

create table if not exists public.resume_versions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  resume_id     uuid not null references public.resumes(id) on delete cascade,
  analysis_id   uuid references public.analyses(id) on delete set null,
  version_type  text not null check (version_type in ('refined', 'manual')),
  version_label text not null default '',
  latex_content text not null,
  modifications jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- Index: fast lookup by resume + user
create index if not exists resume_versions_resume_user_idx
  on public.resume_versions (resume_id, user_id);

-- Index: fast lookup by analysis for cache checks
create index if not exists resume_versions_analysis_idx
  on public.resume_versions (analysis_id)
  where analysis_id is not null;

-- RLS: users can only see/edit their own rows
alter table public.resume_versions enable row level security;

drop policy if exists "Users can view own versions" on public.resume_versions;
create policy "Users can view own versions"
  on public.resume_versions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own versions" on public.resume_versions;
create policy "Users can insert own versions"
  on public.resume_versions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own versions" on public.resume_versions;
create policy "Users can update own versions"
  on public.resume_versions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own versions" on public.resume_versions;
create policy "Users can delete own versions"
  on public.resume_versions for delete
  using (auth.uid() = user_id);
