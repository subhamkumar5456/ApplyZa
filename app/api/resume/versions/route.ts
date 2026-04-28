import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth-guard'
import { saveVersion, getVersions } from '@/lib/versions'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

// ============================================================
// GET  /api/resume/versions?resumeId=uuid  — list versions
// POST /api/resume/versions                — save new version
// ============================================================

export const maxDuration = 15

// ── GET: list all versions for a resume ────────────────────
export const GET = withAuth(async (req: NextRequest, userId: string) => {
  if (env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get('resumeId')
  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId query param required' }, { status: 400 })
  }

  try {
    const versions = await getVersions(resumeId, userId);
    return NextResponse.json({ versions });
  } catch (err) {
    logger.error('resume/versions', 'GET versions error', err)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
})

// ── POST: save a manual edit as a new version ─────────────
export const POST = withAuth(async (req: NextRequest, userId: string) => {
  if (env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 })
  }

  let body: {
    resumeId?: string
    analysisId?: string | null
    latexContent?: string
    versionLabel?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { resumeId, analysisId, latexContent, versionLabel } = body

  if (!resumeId || !latexContent) {
    return NextResponse.json(
      { error: 'resumeId and latexContent are required' },
      { status: 400 },
    )
  }

  if (latexContent.length > 50_000) {
    return NextResponse.json({ error: 'LaTeX content too large' }, { status: 413 })
  }

  const supabase = createServerSupabaseClient()

  // Verify the resume belongs to this user before inserting
  const { data: resume } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', userId)
    .single()

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  try {
    const version = await saveVersion({
      userId,
      resumeId,
      analysisId: analysisId ?? null,
      latexContent,
      source: 'manual',
      versionLabel: versionLabel,
    });
    return NextResponse.json({ versionId: version.id }, { status: 201 })
  } catch (err) {
    logger.error('resume/versions', 'POST save version error', err)
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }
})
