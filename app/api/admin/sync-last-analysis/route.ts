import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for large datasets

/**
 * POST /api/admin/sync-last-analysis
 *
 * Admin-only endpoint that backfills `last_analysis_id` for every resume that
 * has at least one analysis. Run this if data ever gets out of sync (e.g.
 * after a migration or a partial failure).
 *
 * Auth: requires `Authorization: Bearer <ADMIN_SECRET_KEY>` header.
 */
export async function POST(req: NextRequest) {
  // ── Auth check ─────────────────────────────────────────────────────────────
  const adminSecret = process.env.ADMIN_SECRET_KEY
  const authHeader = req.headers.get('authorization')

  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceRoleClient()

  // ── Fetch all resume IDs ────────────────────────────────────────────────────
  const { data: resumes, error: resumesError } = await db
    .from('resumes')
    .select('id')

  if (resumesError) {
    logger.error('admin/sync-last-analysis', `Failed to fetch resumes: ${resumesError.message}`)
    return NextResponse.json({ success: false, error: 'Failed to fetch resumes' }, { status: 500 })
  }

  let updated = 0
  let skipped = 0
  let failed = 0

  for (const resume of resumes ?? []) {
    try {
      // Find the most-recent analysis for this resume
      const { data: latestAnalysis } = await db
        .from('analyses')
        .select('id')
        .eq('resume_id', resume.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!latestAnalysis) {
        skipped++
        continue
      }

      const { error: updateError } = await db
        .from('resumes')
        .update({ last_analysis_id: latestAnalysis.id })
        .eq('id', resume.id)

      if (updateError) {
        failed++
        logger.error('admin/sync-last-analysis', `Failed to update resume ${resume.id}: ${updateError.message}`)
      } else {
        updated++
      }
    } catch (err) {
      failed++
      logger.error('admin/sync-last-analysis', `Error processing resume ${resume.id}: ${err}`)
    }
  }

  const total = resumes?.length ?? 0
  logger.info('admin/sync-last-analysis', `Done — total: ${total}, updated: ${updated}, skipped: ${skipped}, failed: ${failed}`)

  return NextResponse.json({
    success: true,
    data: { total, updated, skipped, failed },
  })
}
