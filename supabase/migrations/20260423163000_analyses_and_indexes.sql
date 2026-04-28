-- Create analyses table if it does not exist
CREATE TABLE IF NOT EXISTS public.analyses (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resume_id       UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  job_title       TEXT,
  company         TEXT,
  ats_score       INTEGER CHECK (ats_score BETWEEN 0 AND 100),
  missing_keywords TEXT[],
  strengths       TEXT[],
  improvements    JSONB,
  full_result     JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- For fetching latest analysis per resume efficiently
CREATE INDEX IF NOT EXISTS idx_analyses_resume_id 
  ON public.analyses(resume_id, created_at DESC);
ANALYZE public.analyses;

-- For dashboard queries fetching all user analyses
CREATE INDEX IF NOT EXISTS idx_analyses_user_id
  ON public.analyses(user_id, created_at DESC);
ANALYZE public.analyses;

-- Enable RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- Users can only access their own analyses
DROP POLICY IF EXISTS "Users can only access their own analyses" ON public.analyses;
CREATE POLICY "Users can only access their own analyses"
  ON public.analyses FOR ALL USING (auth.uid() = user_id);
