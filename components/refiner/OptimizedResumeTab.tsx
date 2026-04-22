'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { LaTeXEditor } from './LaTeXEditor'
import { PDFPreview } from './PDFPreview'
import { ModificationsList } from './ModificationsList'
import { VersionHistory } from './VersionHistory'
import { AnalysisResult } from '@/types/analysis'
import { GenerationState, CompileState, ResumeVersion } from '@/types/refiner'
import {
  RotateCcw,
  RefreshCw,
  Download,
  AlertCircle,
  Sparkles,
  Save,
  Loader2,
  Wand2,
} from 'lucide-react'

import { cleanLatexContent } from '@/lib/latex-utils'
import { cn } from '@/lib/utils'

interface OptimizedResumeTabProps {
  resumeId: string
  analysisId: string | null
  analysisResult: AnalysisResult | null
  jobDescription: string
  jobTitle: string
  companyName?: string
}

export function OptimizedResumeTab({
  resumeId,
  analysisId,
  analysisResult,
  jobDescription,
  jobTitle,
  companyName,
}: OptimizedResumeTabProps) {
  const { toast } = useToast()
  const supabase = createClient()

  // ── State ───────────────────────────────────────────────────
  const [generationState, setGenerationState] = useState<GenerationState>('idle')
  const [compileState, setCompileState] = useState<CompileState>('idle')
  const [latexContent, setLatexContent] = useState('')
  const [modifications, setModifications] = useState<string[]>([])
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [versions, setVersions] = useState<ResumeVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Compile debounce ref (prevents rapid recompile button hits)
  const compileTimerRef = useRef<NodeJS.Timeout | null>(null)

  // ── Helpers: get bearer token ───────────────────────────────
  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
  }, [supabase])

  // ── Load existing versions on mount ────────────────────────
  useEffect(() => {
    if (!resumeId) return
    loadVersions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeId])

  async function loadVersions() {
    setVersionsLoading(true)
    try {
      const token = await getToken()
      if (!token) return

      const res = await fetch(`/api/resume/versions?resumeId=${resumeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const json = await res.json()
        setVersions(json.versions ?? [])
      }
    } catch (e) {
      console.error('[OptimizedResumeTab] loadVersions error:', e)
    } finally {
      setVersionsLoading(false)
    }
  }

  // ── Generate refined resume ─────────────────────────────────
  async function handleGenerate() {
    if (!analysisId) {
      toast({
        title: 'Run ATS analysis first',
        description: 'Please complete the ATS analysis before generating an optimized resume.',
        variant: 'destructive',
      })
      return
    }

    setGenerationState('generating')
    setGenerationError(null)

    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/resume/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeId,
          analysisId,
          jobDescription,
          missingKeywords: analysisResult?.missing_keywords ?? [],
          jobTitle,
          companyName: companyName ?? '',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to generate optimized resume')
      }

      setLatexContent(data.refinedLatex)
      setModifications(data.modifications ?? [])
      setCurrentVersionId(data.versionId)
      setGenerationState('ready')

      if (data.cached) {
        toast({ title: 'Loaded cached version', description: 'Using your previously generated resume.' })
      } else {
        toast({ title: '✨ Resume optimized!', description: 'Edit the LaTeX and compile to preview your PDF.' })
      }

      // Reload version list
      await loadVersions()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setGenerationError(msg)
      setGenerationState('error')
      toast({ title: 'Generation failed', description: msg, variant: 'destructive' })
    }
  }

  async function handleCompile() {
    if (!latexContent.trim()) {
      toast({ title: 'No LaTeX content', description: 'Generate or enter LaTeX first.', variant: 'destructive' })
      return
    }

    const cleanedLatex = cleanLatexContent(latexContent)
    
    if (!cleanedLatex.includes('\\documentclass')) {
      toast({ title: 'Invalid LaTeX', description: 'Missing \\documentclass command.', variant: 'destructive' })
      return
    }

    // Debounce rapid consecutive clicks
    if (compileTimerRef.current) clearTimeout(compileTimerRef.current)
    compileTimerRef.current = setTimeout(async () => {
      setCompileState('compiling')
      setCompileError(null)

      // Revoke old blob URL to prevent memory leak
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)

      try {
        const token = await getToken()
        if (!token) throw new Error('Not authenticated')

        const safeCompany = companyName ? companyName.replace(/[^a-zA-Z0-9-]/g, '-') : ''
        const safeJob = jobTitle ? jobTitle.replace(/[^a-zA-Z0-9-]/g, '-') : 'resume'
        const filename = [safeCompany, safeJob].filter(Boolean).join('_') + '_Resume.pdf'

        console.log('Sending LaTeX:', cleanedLatex)
        const res = await fetch('/api/compile-latex', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latexContent: cleanedLatex, filename }),
        })

        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          console.error('LaTeX Compilation Error:', json)
          throw new Error(json.details ? `${json.error}\n\nDetails: ${json.details}` : (json.error ?? 'Compilation failed'))
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setPdfUrl(url)
        setCompileState('ready')
        toast({ title: 'Compiled successfully!', description: 'Your PDF is ready to preview.' })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Compilation failed'
        setCompileError(msg)
        setCompileState('error')
        toast({ title: 'Compilation failed', description: msg, variant: 'destructive' })
      }
    }, 300)
  }

  // ── Download PDF ────────────────────────────────────────────
  function handleDownload() {
    if (!pdfUrl) {
      toast({ title: 'No PDF to download', description: 'Compile first to generate a PDF.', variant: 'destructive' })
      return
    }
    const safeCompany = companyName ? companyName.replace(/[^a-zA-Z0-9-]/g, '-') : ''
    const safeJob = jobTitle ? jobTitle.replace(/[^a-zA-Z0-9-]/g, '-') : 'resume'
    const filename = [safeCompany, safeJob].filter(Boolean).join('_') + '_Resume.pdf'

    const a = document.createElement('a')
    a.href = pdfUrl
    a.download = filename
    a.click()
  }

  // ── Save version manually ───────────────────────────────────
  async function handleSaveVersion() {
    if (!latexContent.trim()) {
      toast({ title: 'Nothing to save', variant: 'destructive' })
      return
    }
    setIsSaving(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const res = await fetch('/api/resume/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeId,
          analysisId,
          latexContent,
          versionLabel: `Manual edit — ${new Date().toLocaleString()}`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')

      setCurrentVersionId(data.versionId)
      toast({ title: 'Version saved!', description: 'Your edit has been saved.' })
      await loadVersions()
    } catch (err) {
      toast({
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  // ── Load a version from history ─────────────────────────────
  function handleLoadVersion(version: ResumeVersion) {
    setLatexContent(version.latex_content)
    setModifications(version.modifications ?? [])
    setCurrentVersionId(version.id)
    // Reset PDF on version change
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    setPdfUrl(null)
    setCompileState('idle')
    toast({ title: `Loaded: ${version.version_label ?? version.version_type}` })
  }

  // ── Cleanup blob URL on unmount ─────────────────────────────
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Guard: analysis not done ────────────────────────────────
  const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_RESUME_REFINER === 'true'

  if (!featureEnabled) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Sparkles className="h-10 w-10 text-slate-600" />
          <p className="text-sm font-medium text-slate-400">AI Resume Refiner is coming soon</p>
          <p className="text-xs text-slate-600">This feature is not yet enabled.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Top action bar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/60 bg-gradient-to-r from-violet-950/30 to-slate-900/60 p-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-slate-200">AI Resume Optimizer</h3>
          <p className="text-xs text-slate-500">
            {generationState === 'idle'
              ? 'Generate an ATS-optimized LaTeX resume tailored to this job'
              : generationState === 'generating'
              ? 'Generating your optimized resume…'
              : generationState === 'ready'
              ? 'Edit, recompile, and download your optimized PDF resume'
              : 'Generation failed — please try again'}
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generationState === 'generating' || !analysisId}
          size="sm"
          className={cn(
            'gap-2 font-semibold',
            generationState === 'ready'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30',
          )}
        >
          {generationState === 'generating' ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
          ) : generationState === 'ready' ? (
            <><RotateCcw className="h-3.5 w-3.5" /> Regenerate</>
          ) : (
            <><Wand2 className="h-3.5 w-3.5" /> Generate Optimized Resume</>
          )}
        </Button>
      </div>

      {/* ── Generation loading card ─────────────────────────── */}
      {generationState === 'generating' && (
        <Card className="border-violet-800/30 bg-violet-950/10">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-violet-800/30" />
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500" />
              <Wand2 className="absolute inset-0 m-auto h-6 w-6 text-violet-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-violet-300">AI is refining your resume…</p>
              <p className="mt-1 text-xs text-slate-500">
                Analyzing keywords, strengthening phrases, and optimizing for ATS. This takes 15–30 seconds.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Error card ──────────────────────────────────────── */}
      {generationState === 'error' && generationError && (
        <Card className="border-red-900/30 bg-red-950/10">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">Generation failed</p>
              <p className="mt-0.5 text-xs text-slate-500">{generationError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main editor + preview split ─────────────────────── */}
      {generationState === 'ready' && (
        <div className="space-y-4">
          {/* Modifications summary */}
          <ModificationsList modifications={modifications} />

          {/* Split view */}
          <div className="grid gap-4 lg:grid-cols-2">
            <LaTeXEditor
              value={latexContent}
              onChange={setLatexContent}
              className="min-h-[620px]"
            />
            <PDFPreview
              pdfUrl={pdfUrl}
              compileState={compileState}
              compileError={compileError}
              className="min-h-[620px]"
            />
          </div>

          {/* Bottom action bar */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/50 p-3">
            <Button
              onClick={handleCompile}
              disabled={compileState === 'compiling'}
              size="sm"
              className="gap-2 bg-violet-600 hover:bg-violet-500 text-white"
            >
              {compileState === 'compiling' ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Compiling…</>
              ) : (
                <><RefreshCw className="h-3.5 w-3.5" /> Recompile</>
              )}
            </Button>

            <Button
              onClick={handleDownload}
              disabled={!pdfUrl}
              size="sm"
              variant="outline"
              className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Download PDF
            </Button>

            <Button
              onClick={handleSaveVersion}
              disabled={isSaving}
              size="sm"
              variant="outline"
              className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              {isSaving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Save Version</>
              )}
            </Button>

            <p className="ml-auto text-xs text-slate-600">
              {versions.length > 0 ? `${versions.length} saved version${versions.length !== 1 ? 's' : ''}` : ''}
            </p>
          </div>

          {/* Version history */}
          <VersionHistory
            versions={versions}
            currentVersionId={currentVersionId}
            onLoad={handleLoadVersion}
            isLoading={versionsLoading}
          />
        </div>
      )}

      {/* ── No analysis warning ──────────────────────────────── */}
      {!analysisId && generationState === 'idle' && (
        <Card className="border-amber-900/30 bg-amber-950/10">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
            <div>
              <p className="text-sm font-medium text-amber-400">Complete ATS analysis first</p>
              <p className="mt-0.5 text-xs text-slate-500">
                Run the ATS analysis on the Score / Matching / Suggestions tabs, then come back here to generate your optimized resume.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
