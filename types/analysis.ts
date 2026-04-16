export interface ATSScore {
  overall: number
  keyword_match: number
  format_score: number
  experience_relevance: number
  education_match: number
}

export interface SkillMatch {
  skill: string
  found: boolean
  importance: 'required' | 'preferred' | 'bonus'
}

export interface Suggestion {
  type: 'critical' | 'important' | 'minor'
  category: string
  suggestion: string
  impact: string
}

export interface AnalysisResult {
  ats_score: ATSScore
  skills_match: SkillMatch[]
  matched_skills: string[]
  missing_keywords: string[]
  suggestions: Suggestion[]
  summary: string
  strengths: string[]
  weaknesses: string[]
}

export interface AnalysisRequest {
  resume_id: string
  job_title: string
  job_description: string
  company_name: string
}

export interface JobStatus {
  id: string
  type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result: AnalysisResult | null
  error: string | null
  created_at: string
  updated_at: string
}
