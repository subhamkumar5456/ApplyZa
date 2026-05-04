-- =====================================================
-- Migration: Add last_analysis_id to resumes table
-- Purpose: Direct reference to most recent analysis for performance
-- =====================================================

-- Add last_analysis_id column with foreign key constraint
ALTER TABLE public.resumes
ADD COLUMN IF NOT EXISTS last_analysis_id UUID REFERENCES public.analyses(id) ON DELETE SET NULL;

-- Add index for fast lookups on the new FK column
CREATE INDEX IF NOT EXISTS idx_resumes_last_analysis_id ON public.resumes(last_analysis_id);

-- Ensure analyses table has index on resume_id (may already exist from prior migration)
CREATE INDEX IF NOT EXISTS idx_analyses_resume_id ON public.analyses(resume_id);

-- Composite index for combined query performance (most-recent lookup per resume)
CREATE INDEX IF NOT EXISTS idx_analyses_resume_created ON public.analyses(resume_id, created_at DESC);

-- Backfill existing resumes with their latest analysis id
UPDATE public.resumes r
SET last_analysis_id = (
  SELECT a.id
  FROM public.analyses a
  WHERE a.resume_id = r.id
  ORDER BY a.created_at DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM public.analyses a WHERE a.resume_id = r.id
);

-- Add descriptive comment for documentation
COMMENT ON COLUMN public.resumes.last_analysis_id IS
  'References the most recent analysis for this resume. Updated automatically when a new analysis completes.';

-- ─── Integrity trigger ───────────────────────────────────────────────────────
-- Prevents setting last_analysis_id to an analysis that belongs to a different resume.

CREATE OR REPLACE FUNCTION prevent_manual_last_analysis_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow NULL (e.g. when the referenced analysis is deleted via ON DELETE SET NULL)
  IF NEW.last_analysis_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verify the analysis actually belongs to this resume
  IF NOT EXISTS (
    SELECT 1
    FROM public.analyses
    WHERE id = NEW.last_analysis_id
      AND resume_id = NEW.id
  ) THEN
    RAISE EXCEPTION 'last_analysis_id must reference an analysis belonging to this resume';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_last_analysis_integrity ON public.resumes;
CREATE TRIGGER ensure_last_analysis_integrity
  BEFORE UPDATE OF last_analysis_id ON public.resumes
  FOR EACH ROW
  EXECUTE FUNCTION prevent_manual_last_analysis_update();

-- ─── Helper function ─────────────────────────────────────────────────────────
-- Convenience function to fetch a resume joined with its latest analysis in one call.

CREATE OR REPLACE FUNCTION get_resume_with_analysis(resume_uuid UUID)
RETURNS TABLE (
  resume_id     UUID,
  title         TEXT,
  file_name     TEXT,
  status        TEXT,
  created_at    TIMESTAMPTZ,
  analysis_ats_score        INTEGER,
  analysis_keyword_score    INTEGER,
  analysis_format_score     INTEGER,
  analysis_matched_skills   JSONB,
  analysis_missing_keywords JSONB,
  analysis_date             TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.file_name,
    r.status,
    r.created_at,
    a.ats_score,
    a.keyword_score,
    a.format_score,
    a.matched_skills,
    a.missing_keywords,
    a.created_at
  FROM public.resumes r
  LEFT JOIN public.analyses a ON r.last_analysis_id = a.id
  WHERE r.id = resume_uuid;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_resume_with_analysis IS
  'Fetches a resume together with its most recent analysis in a single query via last_analysis_id.';
