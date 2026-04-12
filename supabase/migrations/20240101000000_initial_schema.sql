-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- Profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Resumes table
create table public.resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  file_url text not null,
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  parsed_text text,
  parsed_data jsonb,
  embedding vector(1536),
  status text default 'uploaded' check (status in ('uploaded', 'parsing', 'parsed', 'error')) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Analyses table
create table public.analyses (
  id uuid default uuid_generate_v4() primary key,
  resume_id uuid references public.resumes on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  job_title text,
  job_description text,
  company_name text,
  ats_score integer,
  keyword_score integer,
  format_score integer,
  experience_score integer,
  skills_match jsonb,
  missing_keywords text[],
  suggestions jsonb,
  matched_skills text[],
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'error')) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Jobs table (background processing queue)
create table public.jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('parse_resume', 'analyze_match')),
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')) not null,
  payload jsonb not null,
  result jsonb,
  error text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Indexes
create index idx_resumes_user_id on public.resumes(user_id);
create index idx_resumes_status on public.resumes(status);
create index idx_analyses_resume_id on public.analyses(resume_id);
create index idx_analyses_user_id on public.analyses(user_id);
create index idx_jobs_user_id on public.jobs(user_id);
create index idx_jobs_status on public.jobs(status);
create index idx_jobs_type on public.jobs(type);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at_profiles
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_resumes
  before update on public.resumes
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_analyses
  before update on public.analyses
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_jobs
  before update on public.jobs
  for each row execute procedure public.handle_updated_at();
