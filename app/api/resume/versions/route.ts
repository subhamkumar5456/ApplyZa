import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ============================================================
// GET  /api/resume/versions?resumeId=uuid  — list versions
// POST /api/resume/versions                — save new version
// ============================================================

export const maxDuration = 15

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function getUserFromRequest(req: NextRequest) {
  const supabase = getSupabase()
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user } } = await supabase.auth.getUser(token)
  return user ?? null
}

// ── GET: list all versions for a resume ────────────────────
export async function GET(req: NextRequest) {
  if (process.env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 })
  }

  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const resumeId = searchParams.get('resumeId')
  if (!resumeId) {
    return NextResponse.json({ error: 'resumeId query param required' }, { status: 400 })
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('resume_versions')
    .select('id, version_type, version_label, modifications, analysis_id, created_at')
    .eq('resume_id', resumeId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[/api/resume/versions GET]', error)
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }

  return NextResponse.json({ versions: data ?? [] })
}

// ── POST: save a manual edit as a new version ─────────────
export async function POST(req: NextRequest) {
  if (process.env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 })
  }

  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  const supabase = getSupabase()

  // Verify the resume belongs to this user before inserting
  const { data: resume } = await supabase
    .from('resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single()

  if (!resume) {
    return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
  }

  const { data: version, error: insertErr } = await supabase
    .from('resume_versions')
    .insert({
      user_id: user.id,
      resume_id: resumeId,
      analysis_id: analysisId ?? null,
      version_type: 'manual',
      latex_content: latexContent,
      modifications: [],
      version_label: versionLabel ?? `Manual edit — ${new Date().toLocaleString()}`,
    })
    .select('id')
    .single()

  if (insertErr || !version) {
    console.error('[/api/resume/versions POST]', insertErr)
    return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
  }

  return NextResponse.json({ versionId: version.id }, { status: 201 })
}
