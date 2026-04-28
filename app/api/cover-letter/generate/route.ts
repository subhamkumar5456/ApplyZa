import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { generateCoverLetter, validateCoverLetterRequest } from '@/lib/huggingface/cover-letter';
import { withAuth } from '@/lib/auth-guard';
import { rateLimit } from '@/lib/rate-limit';
import { RateLimitError } from '@/lib/errors';
import { logger } from '@/lib/logger';
import type { GenerateCoverLetterRequest } from '@/types/cover-letter';

export const runtime = 'nodejs';
export const maxDuration = 60; // AI generation can take time

const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 60000 });

const handler = async (req: NextRequest, userId: string) => {
  // ── Rate Limiting (5 requests/minute per IP) ────────────────
  const ip = req.headers.get('x-forwarded-for') || 'anonymous';
  try {
    await limiter.check(5, ip);
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Too many requests. Please wait a moment and try again.' 
        },
        { status: 429 }
      );
    }
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }

  try {
    const supabase = createServerSupabaseClient();

    // Parse request body
    const body: GenerateCoverLetterRequest = await req.json();
    const {
      resumeId,
      jobId,
      jobTitle,
      companyName,
      jobDescription,
      tone = 'professional',
      format = 'markdown'
    } = body;

    // Validate request
    const validation = validateCoverLetterRequest(body);
    if (!validation.valid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: validation.errors 
        },
        { status: 400 }
      );
    }

    logger.info('COVER_LETTER', 'Cover letter generation requested', {
      userId,
      resumeId,
      jobTitle,
      companyName,
      tone,
      format
    });

    // Fetch resume text (verify ownership via RLS)
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id, parsed_text, file_name')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single();

    if (resumeError || !resume) {
      logger.warn('COVER_LETTER', 'Resume not found or unauthorized', {
        resumeId,
        userId,
        error: resumeError
      });
      return NextResponse.json(
        { success: false, error: 'Resume not found or access denied' },
        { status: 404 }
      );
    }

    if (!resume.parsed_text || resume.parsed_text.length < 100) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Resume text is empty or too short. Please upload a valid resume.' 
        },
        { status: 400 }
      );
    }

    // Generate cover letter using AI
    const content = await generateCoverLetter({
      resumeText: resume.parsed_text,
      jobTitle,
      companyName,
      jobDescription,
      tone,
      format
    });

    // Save to database
    const { data: coverLetter, error: insertError } = await supabase
      .from('cover_letters')
      .insert({
        user_id: userId,
        resume_id: resumeId,
        job_id: jobId || null,
        content,
        job_title: jobTitle,
        company_name: companyName,
        format,
        tone
      })
      .select('id, content, format, created_at')
      .single();

    if (insertError) {
      logger.error('COVER_LETTER', 'Failed to save cover letter to database', { 
        error: insertError,
        userId
      });
      throw new Error('Failed to save cover letter');
    }

    logger.info('COVER_LETTER', 'Cover letter created successfully', {
      id: coverLetter.id,
      userId,
      contentLength: content.length,
      format
    });

    return NextResponse.json({
      success: true,
      data: {
        id: coverLetter.id,
        content: coverLetter.content,
        format: coverLetter.format
      }
    });

  } catch (error) {
    logger.error('COVER_LETTER', 'Cover letter generation endpoint error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred. Please try again.' 
      },
      { status: 500 }
    );
  }
};

export const POST = withAuth(handler);
