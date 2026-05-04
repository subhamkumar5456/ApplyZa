export interface ResumeContact {
  name: string
  email: string
  phone: string
  location: string
  linkedin: string
  website: string
}

export interface ResumeExperience {
  company: string
  title: string
  location: string
  start_date: string
  end_date: string
  current: boolean
  description: string[]
}

export interface ResumeEducation {
  institution: string
  degree: string
  field: string
  start_date: string
  end_date: string
  gpa: string
}

export interface ResumeCertification {
  name: string
  issuer: string
  date: string
  expiry: string
  url: string
}

export interface ResumeProject {
  name: string
  description: string
  technologies: string[]
  url: string
}

export interface ParsedResume {
  contact: ResumeContact
  summary: string
  experience: ResumeExperience[]
  education: ResumeEducation[]
  skills: string[]
  certifications: ResumeCertification[]
  projects: ResumeProject[]
  languages: string[]
  raw_text: string
}

export interface ResumeUploadPayload {
  file: File
  title: string
}

export interface ResumeWithAnalysis {
  id: string
  title: string
  file_name: string
  file_type: string
  file_size: number
  status: string
  parsed_data: ParsedResume | null
  last_analysis_id: string | null
  created_at: string
  updated_at: string
  analyses: {
    id: string
    ats_score: number | null
    job_title: string | null
    company_name: string | null
    status: string
    created_at: string
  }[]
}

// ─── last_analysis_id architecture types ─────────────────────────────────────

import type { Database } from './database'

/** Raw row from the resumes table (includes last_analysis_id) */
export type ResumeRow = Database['public']['Tables']['resumes']['Row']

/** Raw row from the analyses table */
export type AnalysisRow = Database['public']['Tables']['analyses']['Row']

/**
 * Resume with its last analysis pre-joined via last_analysis_id.
 * Supabase returns the joined row under the "last_analysis" key.
 */
export interface ResumeWithLastAnalysis extends ResumeRow {
  last_analysis: AnalysisRow | null
}

/**
 * Resume with full analysis history (for history / comparison views).
 */
export interface ResumeWithAnalysisHistory extends ResumeRow {
  analyses: AnalysisRow[]
  last_analysis: AnalysisRow | null
}

/** Lightweight DTO surfaced to API consumers */
export interface ResumeDetailsDTO {
  id: string
  title: string
  status: string
  uploaded_at: string
  latest_ats_score: number | null
  latest_analysis_date: string | null
  total_analyses: number
  matched_skills: string[]
  missing_keywords: string[]
}
