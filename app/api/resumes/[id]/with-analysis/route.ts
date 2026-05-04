import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth-guard'
import { getResumeWithAnalysis } from '@/lib/supabase/resume-queries'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/resumes/[id]/with-analysis
 *
 * Returns a resume together with its most recent analysis in one query
 * by leveraging the `last_analysis_id` FK reference.
 */
const handler = withAuth(
  async (
    _req: NextRequest,
    userId: string,
    { params }: { params: { id: string } },
  ) => {
    const { id } = params

    if (!id) {
      return NextResponse.json({ success: false, error: 'Resume ID is required' }, { status: 400 })
    }

    const resume = await getResumeWithAnalysis(id, userId)

    if (!resume) {
      return NextResponse.json(
        { success: false, error: 'Resume not found' },
        { status: 404 },
      )
    }

    return NextResponse.json({ success: true, data: resume })
  },
)

export { handler as GET }
