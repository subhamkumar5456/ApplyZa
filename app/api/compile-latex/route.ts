import { NextRequest, NextResponse } from 'next/server'
import { sanitizeLatex } from '@/lib/sanitize-latex'
import { CompilationError, RateLimitError } from '@/lib/errors'
import { rateLimit } from '@/lib/rate-limit'
import { withAuth } from '@/lib/auth-guard'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

// ============================================================
// POST /api/compile-latex
// Sends sanitised LaTeX to a cloud compile API and returns
// the PDF binary blob. No Docker required — uses LaTeX.Online.
// ============================================================

export const maxDuration = 30

// LaTeX compilation endpoints
const LATEX_API_URL = env.LATEX_COMPILE_API_URL ?? 'https://texlive.net/cgi-bin/latexcgi'

const limiter = rateLimit({ uniqueTokenPerInterval: 500, interval: 60000 })

export const POST = withAuth(async (req: NextRequest, userId: string) => {
  // ── Feature flag guard ──────────────────────────────────────
  if (env.ENABLE_RESUME_REFINER !== 'true') {
    return NextResponse.json({ error: 'Feature not available' }, { status: 403 })
  }

  // ── Rate Limiting (10 requests/minute per IP) ─────────────────
  const ip = req.headers.get('x-forwarded-for') || 'anonymous'
  try {
    await limiter.check(10, ip)
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message, retryAfter: 60 },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }

  // ── Parse body ──────────────────────────────────────────────
  let body: { latexContent?: string; filename?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { latexContent, filename } = body
  if (!latexContent || typeof latexContent !== 'string') {
    return NextResponse.json({ error: 'latexContent is required' }, { status: 400 })
  }

  // ── Security: sanitise before compilation ──────────────────
  let safeLatex = ''
  try {
    safeLatex = sanitizeLatex(latexContent)
  } catch (err: any) {
    if (err instanceof CompilationError) {
      console.warn('[compile-latex] Rejected unsafe input:', err.message)
      return NextResponse.json(
        { error: `Invalid LaTeX content: ${err.message}` },
        { status: 422 },
      )
    }
    return NextResponse.json({ error: 'Sanitization error' }, { status: 500 })
  }

  // ── Compile via cloud API ───────────────────────────────────
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000) // 25s timeout

  let pdfResponse: Response
  let isPdf = false
  let logDetails = ''

  try {
    const isLocalCompile =
      LATEX_API_URL.includes('localhost') ||
      LATEX_API_URL.includes('127.0.0.1') ||
      LATEX_API_URL.includes('latex-compiler')

    if (isLocalCompile) {
      // Local secure service expects JSON Payload
      pdfResponse = await fetch(LATEX_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode: safeLatex }),
        signal: controller.signal,
      })
      isPdf = pdfResponse.ok
    } else if (LATEX_API_URL.includes('texlive.net')) {
      const formData = new FormData()
      formData.append('filecontents[]', safeLatex)
      formData.append('filename[]', 'document.tex')
      formData.append('engine', 'pdflatex')
      formData.append('return', 'pdf')

      pdfResponse = await fetch(LATEX_API_URL, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      
      const contentType = pdfResponse.headers.get('content-type') || ''
      isPdf = contentType.includes('application/pdf')
      
      if (!isPdf) {
        logDetails = await pdfResponse.text()
      }
    } else {
      /**
       * LaTeX.Online requires GET requests for direct text compilation.
       */
      const encodedText = encodeURIComponent(safeLatex)
      const url = `${LATEX_API_URL}?text=${encodedText}`
      
      pdfResponse = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      })
      isPdf = pdfResponse.ok
    }
  } catch (err: any) {
    clearTimeout(timeout)
    if (err?.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Compilation timed out. Check your LaTeX for infinite loops.' },
        { status: 504 },
      )
    }
    logger.error('compile-latex', 'Fetch error', err)
    return NextResponse.json(
      { error: 'Failed to reach LaTeX compilation service' },
      { status: 502 },
    )
  }

  clearTimeout(timeout)

  if (!isPdf) {
    let details = logDetails
    if (!details) {
      try {
        // Attempt to parse JSON error (used by local compiler service)
        const errorData = await pdfResponse.clone().json()
        details = errorData.logs || errorData.error || JSON.stringify(errorData)
      } catch {
        // Fallback to text (used by latexonline)
        details = await pdfResponse.text().catch(() => 'Unknown error')
      }
    }

    logger.error('compile-latex', 'API error details', details.slice(0, 500))
    return NextResponse.json(
      {
        error: 'LaTeX compilation failed. Check your LaTeX syntax.',
        details: details.slice(0, 1500), // increased slice to see more logs
      },
      { status: 422 },
    )
  }

  // ── Stream PDF back to client ───────────────────────────────
  const pdfBuffer = await pdfResponse.arrayBuffer()
  const safeFilename = (filename || 'refined-resume.pdf').replace(/[^a-zA-Z0-9_.-]/g, '_')

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${safeFilename}"`,
      'Cache-Control': 'no-store',
    },
  })
})
