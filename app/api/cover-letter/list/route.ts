import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

async function handler(req: NextRequest, userId: string) {
  try {
    const supabase = createServerSupabaseClient();
    
    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('cover_letters')
      .select('id, job_title, company_name, format, tone, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (resumeId) {
      query = query.eq('resume_id', resumeId);
    }

    const { data: coverLetters, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: coverLetters
    });

  } catch (error) {
    logger.error('COVER_LETTER', 'Failed to fetch cover letters', { error, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover letters' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
