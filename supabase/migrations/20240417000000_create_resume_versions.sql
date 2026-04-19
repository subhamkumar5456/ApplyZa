-- ============================================================
-- Migration: Create resume_versions table
-- Run in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qadwilkevpgzbyyxyrxi/sql/new
-- ============================================================

-- Create resume_versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id       UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
  analysis_id     UUID REFERENCES public.analyses(id) ON DELETE SET NULL,
  version_type    TEXT NOT NULL CHECK (version_type IN ('original', 'refined', 'manual')),
  latex_content   TEXT NOT NULL,
  modifications   JSONB DEFAULT '[]',
  version_label   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own resume versions" ON public.resume_versions;
CREATE POLICY "Users can view own resume versions"
  ON public.resume_versions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own resume versions" ON public.resume_versions;
CREATE POLICY "Users can insert own resume versions"
  ON public.resume_versions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own resume versions" ON public.resume_versions;
CREATE POLICY "Users can delete own resume versions"
  ON public.resume_versions FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id   ON public.resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_user_id     ON public.resume_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_analysis_id ON public.resume_versions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_type        ON public.resume_versions(version_type);
-- Composite index for cache lookups (resume + analysis + type)
CREATE INDEX IF NOT EXISTS idx_resume_versions_cache
  ON public.resume_versions(resume_id, analysis_id, version_type);
