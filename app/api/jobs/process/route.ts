import { createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { analyzeResumeMatch } from '@/lib/gemini/analyze'
import { AnalysisResult } from '@/types/analysis'
import mammoth from 'mammoth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Allow up to 5 minutes for the AI call
export const maxDuration = 300

const isDev = process.env.NODE_ENV === 'development'

// ─── Timeout helper ───────────────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    promise.then(
      (v) => { clearTimeout(timer); resolve(v) },
      (e) => { clearTimeout(timer); reject(e) },
    )
  })
}

export async function POST(request: NextRequest) {
  let jobId: string
  try {
    const body = await request.json()
    jobId = body?.jobId
    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const db = createServiceRoleClient()

  // Fetch the job
  const { data: job, error: jobFetchError } = await db
    .from('jobs')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobFetchError || !job) {
    console.error('[Process] Job not found:', jobId)
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  // Guard against re-processing — but allow retrying jobs stuck in "processing"
  // for more than 5 minutes (they likely crashed)
  if (job.status === 'completed') {
    return NextResponse.json({ message: 'Job already completed' })
  }

  if (job.status === 'processing') {
    const updatedAt = new Date(job.updated_at as string).getTime()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    if (updatedAt > fiveMinutesAgo) {
      return NextResponse.json({ message: 'Job is already being processed' })
    }
    // Otherwise fall through — the previous attempt likely crashed
    console.log(`[Process] Job ${jobId} was stuck in processing, retrying`)
  }

  // Mark as processing
  await db.from('jobs').update({ status: 'processing', updated_at: new Date().toISOString() }).eq('id', jobId)
  console.log(`[Process] Job ${jobId} type=${job.type} — started`)

  try {
    if (job.type === 'analyze_match') {
      await processAnalyzeMatch(db, job)
    } else if (job.type === 'parse_resume') {
      await processParseResume(db, job)
    } else {
      throw new Error(`Unknown job type: ${job.type}`)
    }

    console.log(`[Process] Job ${jobId} completed`)
    return NextResponse.json({ success: true, jobId })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Process] Job ${jobId} failed:`, message)

    await db
      .from('jobs')
      .update({
        status: 'failed',
        error: message,
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    return NextResponse.json(
      { error: 'Job processing failed', ...(isDev && { detail: message }) },
      { status: 500 }
    )
  }
}

// ─── analyze_match ────────────────────────────────────────────────────────────

async function processAnalyzeMatch(
  db: ReturnType<typeof createServiceRoleClient>,
  job: Record<string, unknown>,
) {
  const payload = job.payload as {
    resume_id: string
    job_title: string
    job_description: string
    company_name: string
  }
  const { resume_id, job_title, job_description, company_name } = payload

  if (!resume_id || !job_title || !job_description || !company_name) {
    throw new Error('Missing required payload fields for analyze_match')
  }

  // Fetch resume
  const { data: resume, error: resumeError } = await db
    .from('resumes')
    .select('file_url, file_type, parsed_text, user_id')
    .eq('id', resume_id)
    .single()

  if (resumeError || !resume) {
    throw new Error(`Resume not found: ${resume_id}`)
  }

  const userId = resume.user_id as string

  // Use cached parsed_text if available, otherwise download + extract
  let resumeText = (resume.parsed_text as string | null) ?? ''

  if (!resumeText) {
    console.log(`[Process] Downloading resume file from storage`)
    const fileBuffer = await withTimeout(
      downloadFromStorage(db, resume.file_url as string),
      30_000,
      'Resume download',
    )
    console.log(`[Process] Downloaded ${fileBuffer.length} bytes, extracting text...`)

    resumeText = await withTimeout(
      extractTextFromBuffer(fileBuffer, resume.file_type as string),
      60_000,
      'Text extraction',
    )
    console.log(`[Process] Extracted ${resumeText.length} chars of text`)

    // Cache for future use
    await db
      .from('resumes')
      .update({ parsed_text: resumeText, updated_at: new Date().toISOString() })
      .eq('id', resume_id)
  }

  if (!resumeText.trim()) {
    throw new Error('Could not extract text from resume file')
  }

  console.log(`[Process] Calling Gemini (${resumeText.length} chars)`)
  const analysisResult: AnalysisResult = await withTimeout(
    analyzeResumeMatch(resumeText, job_description, job_title, company_name),
    120_000,
    'Gemini analysis',
  )

  // Serialize to plain JSON-safe object for Supabase JSONB columns
  const resultJson = JSON.parse(JSON.stringify(analysisResult)) as Record<string, unknown>

  // Save to analyses table
  const { data: analysis, error: analysisError } = await db
    .from('analyses')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      user_id: userId,
      resume_id,
      job_id: job.id as string,
      job_title,
      company_name,
      job_description,
      status: 'completed',
      ats_score: analysisResult.ats_score.overall,
      keyword_score: analysisResult.ats_score.keyword_match,
      format_score: analysisResult.ats_score.format_score,
      experience_score: analysisResult.ats_score.experience_relevance,
      skills_match: analysisResult.skills_match as unknown as import('@/types/database').Json,
      matched_skills: analysisResult.matched_skills as unknown as import('@/types/database').Json,
      missing_keywords: analysisResult.missing_keywords as unknown as import('@/types/database').Json,
      suggestions: analysisResult.suggestions as unknown as import('@/types/database').Json,
      strengths: analysisResult.strengths as unknown as import('@/types/database').Json,
      weaknesses: analysisResult.weaknesses as unknown as import('@/types/database').Json,
      summary: analysisResult.summary,
      result: resultJson as unknown as import('@/types/database').Json,
    } as any)
    .select('id')
    .single()

  if (analysisError) {
    throw new Error(`Failed to save analysis: ${analysisError.message}`)
  }

  console.log(`[Process] Analysis saved: ${analysis.id}`)

  // Mark job completed with result embedded for polling
  const resultJson2 = JSON.parse(JSON.stringify(analysisResult)) as import('@/types/database').Json
  await db
    .from('jobs')
    .update({
      status: 'completed',
      result: resultJson2,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id as string)
}

// ─── parse_resume ─────────────────────────────────────────────────────────────

async function processParseResume(
  db: ReturnType<typeof createServiceRoleClient>,
  job: Record<string, unknown>,
) {
  const payload = job.payload as { resume_id: string; file_url: string; file_type: string }
  const { resume_id, file_url, file_type } = payload

  if (!resume_id || !file_url || !file_type) {
    throw new Error('Missing required payload fields for parse_resume')
  }

  console.log(`[Process] Downloading resume for parsing`)
  const fileBuffer = await withTimeout(
    downloadFromStorage(db, file_url),
    30_000,
    'Resume download',
  )
  const parsedText = await withTimeout(
    extractTextFromBuffer(fileBuffer, file_type),
    60_000,
    'Text extraction',
  )

  await db
    .from('resumes')
    .update({
      parsed_text: parsedText,
      status: 'parsed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', resume_id)

  console.log(`[Process] Resume parsed, ${parsedText.length} chars`)

  await db
    .from('jobs')
    .update({
      status: 'completed',
      result: { parsed_text_length: parsedText.length } as unknown as import('@/types/database').Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id as string)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function downloadFromStorage(
  db: ReturnType<typeof createServiceRoleClient>,
  fileUrl: string,
): Promise<Buffer> {
  const url = new URL(fileUrl)
  const pathParts = url.pathname.split('/storage/v1/object/public/resumes/')
  if (pathParts.length < 2) {
    throw new Error(`Cannot parse storage path from URL: ${fileUrl}`)
  }
  const storagePath = decodeURIComponent(pathParts[1])

  const { data, error } = await db.storage.from('resumes').download(storagePath)
  if (error || !data) {
    throw new Error(`Failed to download file from storage: ${error?.message}`)
  }

  const arrayBuffer = await data.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// ─── Text Extraction (pdf-parse + mammoth) ──────────────────────────────────

async function extractTextFromBuffer(
  buffer: Buffer,
  fileType: string,
): Promise<string> {
  if (fileType === 'application/pdf') {
    try {
      // pdf-parse uses CommonJS internally, use dynamic require for Node.js runtime
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pdfParse = require('pdf-parse/lib/pdf-parse.js')
      const result = await pdfParse(buffer)
      const text = (result.text || '').trim()
      if (!text) {
        throw new Error('PDF parsed but no text content was extracted')
      }
      return text
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`PDF text extraction failed: ${msg}`)
    }
  }

  if (
    fileType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value.trim()
  }

  throw new Error(`Unsupported file type for text extraction: ${fileType}`)
}
