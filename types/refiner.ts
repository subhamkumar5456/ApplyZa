// ============================================================
// Types for the AI Resume Refiner + LaTeX Editor Module
// Isolated from analysis types — no shared mutation risk.
// ============================================================

export interface ResumeVersion {
  id: string
  user_id: string
  resume_id: string
  analysis_id: string | null
  version_type: 'original' | 'refined' | 'manual'
  latex_content: string
  modifications: string[]
  version_label: string | null
  created_at: string
}

export interface RefineRequest {
  resumeId: string
  analysisId: string
  jobDescription: string
  missingKeywords: string[]
  jobTitle: string
  companyName?: string
}

export interface RefineResponse {
  refinedLatex: string
  modifications: string[]
  versionId: string
  cached: boolean
}

export interface RefineError {
  error: string
  code: 'UNAUTHORIZED' | 'FEATURE_DISABLED' | 'RESUME_NOT_FOUND' | 'AI_ERROR' | 'UNKNOWN'
}

export interface CompileLatexRequest {
  latexContent: string
}

export interface SaveVersionRequest {
  resumeId: string
  analysisId: string | null
  latexContent: string
  versionLabel?: string
}

export interface SaveVersionResponse {
  versionId: string
}

export type GenerationState = 'idle' | 'generating' | 'ready' | 'error'
export type CompileState = 'idle' | 'compiling' | 'ready' | 'error'
