import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ message: 'Job ID is required' }, { status: 400 })
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .single()

    if (error || !job) {
      return NextResponse.json({ message: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: job.id,
      type: job.type,
      status: job.status,
      result: job.result,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
    })
  } catch (error) {
    console.error('Job status error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
