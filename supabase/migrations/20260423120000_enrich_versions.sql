-- Migration: Enrich resume_versions with metadata

-- Add new columns if they don't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'version_label') THEN
    ALTER TABLE resume_versions ADD COLUMN version_label TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'source') THEN
    ALTER TABLE resume_versions ADD COLUMN source TEXT DEFAULT 'manual' CHECK (source IN ('manual','ai_refined','ai_generated','template'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'job_title') THEN
    ALTER TABLE resume_versions ADD COLUMN job_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'company') THEN
    ALTER TABLE resume_versions ADD COLUMN company TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'ats_score') THEN
    ALTER TABLE resume_versions ADD COLUMN ats_score INTEGER CHECK (ats_score BETWEEN 0 AND 100);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'diff_summary') THEN
    ALTER TABLE resume_versions ADD COLUMN diff_summary TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resume_versions' AND column_name = 'is_favorite') THEN
    ALTER TABLE resume_versions ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id_created ON resume_versions(resume_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id_source_created ON resume_versions(resume_id, source, created_at DESC);

-- Analyze the table to update statistics
ANALYZE resume_versions;
