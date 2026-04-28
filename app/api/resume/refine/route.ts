import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { refineResumeToLatex } from '@/lib/huggingface/refine'
import { withAuth } from '@/lib/auth-guard'
import { rateLimit } from '@/lib/rate-limit'
import { RateLimitError } from '@/lib/errors'
import { saveVersion } from '@/lib/versions'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

// ============================================================
// POST /api/resume/refine
// Generates an AI-refined LaTeX version of a resume.
// Isolated from the ATS pipeline — reads only, never mutates
// the resumes or analyses tables.
// ============================================================

export const maxDuration = 60 // Vercel: allow up to 60s for AI generation

const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 60000 })

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  // ── Feature flag guard ──────────────────────────────────────
  if (env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json(
      { error: 'Feature not available', code: 'FEATURE_DISABLED' },
      { status: 403 },
    )
  }

  // ── Rate Limiting (5 requests/minute per IP) ────────────────
  const ip = req.headers.get('x-forwarded-for') || 'anonymous'
  try {
    await limiter.check(5, ip)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message, retryAfter: 60 },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  const supabase = createServerSupabaseClient()

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
    .eq('user_id', userId)
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
    .eq('user_id', userId)
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
    logger.error('resume/refine', 'Hugging Face error', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'AI generation failed',
        code: 'AI_ERROR',
      },
      { status: 502 },
    )
  }

  // ── Persist version ─────────────────────────────────────────
  let versionId = null;
  try {
    const version = await saveVersion({
      userId,
      resumeId,
      analysisId,
      latexContent: refinedLatex,
      source: 'ai_refined',
      jobTitle,
      company: companyName,
      modifications,
    });
    versionId = version.id;
  } catch (insertErr) {
    logger.error('resume/refine', 'Insert error', insertErr)
  }

  return NextResponse.json({
    refinedLatex,
    modifications,
    versionId,
    cached: false,
  })
})
