import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { refineResumeToLatex } from '@/lib/gemini/refine'

// ============================================================
// POST /api/resume/refine
// Generates an AI-refined LaTeX version of a resume.
// Isolated from the ATS pipeline — reads only, never mutates
// the resumes or analyses tables.
// ============================================================

export const maxDuration = 60 // Vercel: allow up to 60s for AI generation

export async function POST(req: NextRequest) {
  // ── Feature flag guard ──────────────────────────────────────
  if (process.env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json(
      { error: 'Feature not available', code: 'FEATURE_DISABLED' },
      { status: 403 },
    )
  }

  // ── Auth ────────────────────────────────────────────────────
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser(token)

  if (authErr || !user) {
    return NextResponse.json({ error: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 })
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: {
    resumeId: string
    analysisId: string
    jobDescription: string
    missingKeywords: string[]
    jobTitle: string
    companyName?: string
  }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { resumeId, analysisId, jobDescription, missingKeywords, jobTitle, companyName } = body

  if (!resumeId || !analysisId || !jobDescription || !jobTitle) {
    return NextResponse.json(
      { error: 'Missing required fields: resumeId, analysisId, jobDescription, jobTitle' },
      { status: 400 },
    )
  }

  // ── Cache check — avoid re-generating existing refined version ──
  const { data: cached } = await supabase
    .from('resume_versions')
    .select('id, latex_content, modifications')
    .eq('resume_id', resumeId)
    .eq('analysis_id', analysisId)
    .eq('version_type', 'refined')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (cached) {
    return NextResponse.json({
      refinedLatex: cached.latex_content,
      modifications: cached.modifications ?? [],
      versionId: cached.id,
      cached: true,
    })
  }

  // ── Fetch resume text ───────────────────────────────────────
  const { data: resume, error: resumeErr } = await supabase
    .from('resumes')
    .select('parsed_text')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single()

  if (resumeErr || !resume) {
    return NextResponse.json(
      { error: 'Resume not found', code: 'RESUME_NOT_FOUND' },
      { status: 404 },
    )
  }

  if (!resume.parsed_text) {
    return NextResponse.json(
      { error: 'Resume has not been parsed yet. Please wait for parsing to complete.' },
      { status: 422 },
    )
  }

  // ── Generate refined LaTeX via Gemini ──────────────────────
  let refinedLatex: string
  let modifications: string[]

  try {
    const result = await refineResumeToLatex(
      resume.parsed_text,
      jobDescription,
      jobTitle,
      companyName ?? '',
      missingKeywords ?? [],
    )
    refinedLatex = result.refinedLatex
    modifications = result.modifications
  } catch (err) {
    console.error('[/api/resume/refine] Gemini error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'AI generation failed',
        code: 'AI_ERROR',
      },
      { status: 502 },
    )
  }

  // ── Persist version ─────────────────────────────────────────
  const { data: version, error: insertErr } = await supabase
    .from('resume_versions')
    .insert({
      user_id: user.id,
      resume_id: resumeId,
      analysis_id: analysisId,
      version_type: 'refined',
      latex_content: refinedLatex,
      modifications: modifications,
      version_label: `AI Refined — ${jobTitle}`,
    })
    .select('id')
    .single()

  if (insertErr || !version) {
    console.error('[/api/resume/refine] Insert error:', insertErr)
    // Still return the result even if saving fails
    return NextResponse.json({
      refinedLatex,
      modifications,
      versionId: null,
      cached: false,
    })
  }

  return NextResponse.json({
    refinedLatex,
    modifications,
    versionId: version.id,
    cached: false,
  })
}
