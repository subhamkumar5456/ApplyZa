import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/auth-guard';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

async function getHandler(
  req: NextRequest,
  userId: string,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const supabase = createServerSupabaseClient();
    
    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !coverLetter) {
      return NextResponse.json(
        { success: false, error: 'Cover letter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: coverLetter
    });

  } catch (error) {
    logger.error('COVER_LETTER', 'Failed to fetch cover letter', { error, id, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cover letter' },
      { status: 500 }
    );
  }
}

async function updateHandler(
  req: NextRequest,
  userId: string,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const supabase = createServerSupabaseClient();
    
    const body = await req.json();
    const { content } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid content' },
        { status: 400 }
      );
    }

    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .update({ content })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !coverLetter) {
      return NextResponse.json(
        { success: false, error: 'Failed to update cover letter' },
        { status: 500 }
      );
    }

    logger.info('COVER_LETTER', 'Cover letter updated', {
      id,
      userId
    });

    return NextResponse.json({
      success: true,
      data: coverLetter
    });

  } catch (error) {
    logger.error('COVER_LETTER', 'Failed to update cover letter', { error, id, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to update cover letter' },
      { status: 500 }
    );
  }
}

async function deleteHandler(
  req: NextRequest,
  userId: string,
  context: { params: { id: string } }
) {
  const { id } = context.params;
  try {
    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    logger.info('COVER_LETTER', 'Cover letter deleted', {
      id,
      userId
    });

    return NextResponse.json({
      success: true,
      message: 'Cover letter deleted'
    });

  } catch (error) {
    logger.error('COVER_LETTER', 'Failed to delete cover letter', { error, id, userId });
    return NextResponse.json(
      { success: false, error: 'Failed to delete cover letter' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(updateHandler);
export const DELETE = withAuth(deleteHandler);
