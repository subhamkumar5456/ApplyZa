import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth-guard'
import { logger } from '@/lib/logger'

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  try {
    const body = await req.json()
    const { type, payload } = body

    if (!type || !payload) {
      return NextResponse.json({ error: 'Type and payload are required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        user_id: userId,
        type,
        payload,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      logger.error('jobs', 'Failed to create job', error)
      return NextResponse.json({ error: 'Failed to create job' }, { status: 500 })
    }

    return NextResponse.json({ jobId: data.id })
  } catch (err) {
    logger.error('jobs', 'Invalid request', err)
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
})
