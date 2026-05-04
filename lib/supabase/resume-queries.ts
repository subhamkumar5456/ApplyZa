/**
 * resume-queries.ts
 *
 * Centralised Supabase query helpers for resume + analysis data.
 * All helpers leverage the `last_analysis_id` FK for efficient single-join
 * fetches, avoiding the old pattern of sorting analyses and taking limit(1).
 */

import { createServerSupabaseClient } from './server'
import type { ResumeWithLastAnalysis } from '@/types/resume'

// ─── Single resume + its latest analysis ─────────────────────────────────────

/**
 * Fetches one resume together with its most recent analysis in a single query.
 * Uses the `last_analysis_id` FK – O(1) index lookup, no sort needed.
 */
export async function getResumeWithAnalysis(
  resumeId: string,
  userId: string,
): Promise<ResumeWithLastAnalysis | null> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('resumes')
    .select(`
      *,
      last_analysis:analyses!last_analysis_id (*)
    `)
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[resume-queries] getResumeWithAnalysis error:', error.message)
    return null
  }

  return data as unknown as ResumeWithLastAnalysis
}

// ─── All user resumes + their latest analyses ─────────────────────────────────

/**
 * Fetches all resumes for a user, each with its most recent analysis joined.
 * One query – replaces N+1 patterns.
 */
export async function getUserResumesWithAnalysis(
  userId: string,
): Promise<ResumeWithLastAnalysis[]> {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from('resumes')
    .select(`
      *,
      last_analysis:analyses!last_analysis_id (*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[resume-queries] getUserResumesWithAnalysis error:', error.message)
    return []
  }

  return (data as unknown as ResumeWithLastAnalysis[]) ?? []
}

// ─── Full analysis history for a resume ──────────────────────────────────────

/**
 * Fetches the complete analysis history for a resume.
 * Verifies ownership before returning data.
 */
export async function getResumeAnalysisHistory(
  resumeId: string,
  userId: string,
  limit = 50,
) {
  const supabase = createServerSupabaseClient()

  // Ownership check
  const { data: resume } = await supabase
    .from('resumes')
    .select('user_id')
    .eq('id', resumeId)
    .single()

  if (resume?.user_id !== userId) {
    return []
  }

  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[resume-queries] getResumeAnalysisHistory error:', error.message)
    return []
  }

  return data ?? []
}

// ─── Dashboard statistics ─────────────────────────────────────────────────────

/**
 * Returns aggregate stats for the dashboard.
 * Resumes are fetched with last_analysis joined (no extra sorting queries).
 */
export async function getDashboardStats(userId: string) {
  const supabase = createServerSupabaseClient()

  const [resumesResult, analysesResult, coverLettersResult] = await Promise.all([
    supabase
      .from('resumes')
      .select(
        'id, status, last_analysis:analyses!last_analysis_id(ats_score)',
        { count: 'exact' },
      )
      .eq('user_id', userId),

    supabase
      .from('analyses')
      .select('ats_score', { count: 'exact' })
      .eq('user_id', userId),

    supabase
      .from('cover_letters')
      .select('id', { count: 'exact' })
      .eq('user_id', userId),
  ])

  const scores = (analysesResult.data ?? [])
    .map((a) => a.ats_score as number | null)
    .filter((s): s is number => s != null)

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 0

  return {
    totalResumes: resumesResult.count ?? 0,
    totalAnalyses: analysesResult.count ?? 0,
    totalCoverLetters: coverLettersResult.count ?? 0,
    averageScore,
    resumes: (resumesResult.data ?? []) as unknown as ResumeWithLastAnalysis[],
  }
}
