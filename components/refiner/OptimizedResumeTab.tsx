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
import { EditorSkeleton } from '@/components/skeletons/editor-skeleton'
import { useLatexCompiler } from '@/lib/hooks/use-latex-compiler'
import { useResumeRefiner } from '@/lib/hooks/use-resume-refiner'
import { useEditorShortcuts } from '@/lib/hooks/use-editor-shortcuts'
import { EditorShortcutHints } from '@/components/editor-shortcut-hints'
import { env } from '@/lib/env'

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

  // ── Custom Hooks ────────────────────────────────────────────
  const { 
    state: compileState, 
    pdfUrl, 
    compilationError, 
    compile, 
    download, 
    setPdfUrl,
    setState: setCompileState
  } = useLatexCompiler()

  const {
    status: refinerStatus,
    latexCode,
    setLatexCode: setLatexContent,
    modifications,
    error: refinerError,
    refine,
    setModifications,
    setStatus: setRefinerStatus,
  } = useResumeRefiner()

  // ── Component State ─────────────────────────────────────────
  const [currentVersionId, setCurrentVersionId] = useState<string | null>(null)
  const [versions, setVersions] = useState<ResumeVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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

    try {
      const data = await refine(
        resumeId,
        analysisId,
        jobDescription,
        jobTitle,
        companyName,
        analysisResult?.missing_keywords ?? []
      );
      
      setCurrentVersionId(data.versionId);
      
      if (data.cached) {
        toast({ title: 'Loaded cached version', description: 'Using your previously generated resume.' })
      } else {
        toast({ title: '✨ Resume optimized!', description: 'Edit the LaTeX and compile to preview your PDF.' })
      }

      await loadVersions()
    } catch (err) {
      toast({ title: 'Generation failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' })
    }
  }

  const handleCompile = () => compile(latexCode, jobTitle ? `${jobTitle}_Resume.pdf` : 'Resume.pdf');

  // ── Download PDF ────────────────────────────────────────────
  const handleDownload = () => download(jobTitle ? `${jobTitle}_Resume.pdf` : 'Resume.pdf');

  // ── Save version manually ───────────────────────────────────
  async function handleSaveVersion() {
    if (!latexCode.trim()) {
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
          latexContent: latexCode,
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

  useEditorShortcuts({
    onSave: () => {
      if (!isSaving && refinerStatus === 'complete') handleSaveVersion()
    },
    onCompile: () => {
      if (compileState !== 'compiling' && refinerStatus === 'complete') handleCompile()
    },
    onDownload: () => {
      if (pdfUrl && refinerStatus === 'complete') handleDownload()
    }
  })

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
  const featureEnabled = env.NEXT_PUBLIC_ENABLE_RESUME_REFINER === 'true'

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
            {refinerStatus === 'idle'
              ? 'Generate an ATS-optimized LaTeX resume tailored to this job'
              : refinerStatus === 'refining'
              ? 'Generating your optimized resume…'
              : refinerStatus === 'complete'
              ? 'Edit, recompile, and download your optimized PDF resume'
              : 'Generation failed — please try again'}
          </p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={refinerStatus === 'refining' || !analysisId}
          size="sm"
          className={cn(
            'gap-2 font-semibold',
            refinerStatus === 'complete'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
              : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-900/30',
          )}
        >
          {refinerStatus === 'refining' ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</>
          ) : refinerStatus === 'complete' ? (
            <><RotateCcw className="h-3.5 w-3.5" /> Regenerate</>
          ) : (
            <><Wand2 className="h-3.5 w-3.5" /> Generate Optimized Resume</>
          )}
        </Button>
      </div>

      {/* ── Generation loading skeleton ─────────────────────────── */}
      {refinerStatus === 'refining' && (
        <div className="space-y-4" aria-live="polite" aria-busy="true">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-violet-400" aria-hidden="true" />
            <p className="text-sm font-semibold text-violet-300">AI is refining your resume…</p>
          </div>
          <EditorSkeleton />
        </div>
      )}

      {/* ── Error card ──────────────────────────────────────── */}
      {refinerStatus === 'error' && refinerError && (
        <Card className="border-red-900/30 bg-red-950/10" aria-live="assertive">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-red-400">Generation failed</p>
              <p className="mt-0.5 text-xs text-slate-500">{refinerError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Main editor + preview split ─────────────────────── */}
      {refinerStatus === 'complete' && (
        <section className="space-y-4" aria-label="Optimized Resume Editor">
          {/* Modifications summary */}
          <ModificationsList modifications={modifications} />

          {/* Split view */}
          <div className="grid gap-4 lg:grid-cols-2">
            <LaTeXEditor
              value={latexCode}
              onChange={setLatexContent}
              className="min-h-[620px]"
            />
            <PDFPreview
              pdfUrl={pdfUrl}
              compileState={compileState}
              compileError={compilationError}
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

            <div className="hidden lg:block">
              <EditorShortcutHints />
            </div>

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
        </section>
      )}

      {/* ── No analysis warning ──────────────────────────────── */}
      {!analysisId && refinerStatus === 'idle' && (
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
