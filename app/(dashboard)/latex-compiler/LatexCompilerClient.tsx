'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, RefreshCw, Save, Loader2 } from 'lucide-react'
import { LaTeXEditor } from '@/components/refiner/LaTeXEditor'
import { PDFPreview } from '@/components/refiner/PDFPreview'
import { cleanLatexContent, validateLatex, DEFAULT_LATEX_TEMPLATE } from '@/lib/latex-utils'
import { createClient } from '@/lib/supabase/client'
import { WorkflowStepper } from '@/components/workflow-stepper'
import { useEditorShortcuts } from '@/lib/hooks/use-editor-shortcuts'
import { EditorShortcutHints } from '@/components/editor-shortcut-hints'
import { useToast } from '@/lib/hooks/use-toast'

export default function LatexCompilerClient() {
  const { toast } = useToast()
  
  const [latexContent, setLatexContent] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('latex_draft') || DEFAULT_LATEX_TEMPLATE
    }
    return DEFAULT_LATEX_TEMPLATE
  })
  
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compileState, setCompileState] = useState<'idle' | 'compiling' | 'ready' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleCompile = async () => {
    setCompileState('compiling')
    setError(null)

    const cleanedLatex = cleanLatexContent(latexContent)
    const validation = validateLatex(cleanedLatex)
    
    if (!validation.valid) {
      setError(validation.error || 'Invalid LaTeX')
      setCompileState('error')
      toast({ title: 'Invalid LaTeX', description: validation.error, variant: 'destructive' })
      return
    }

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      const res = await fetch('/api/compile-latex', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ latexContent: cleanedLatex }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        const errorMessage = errorData.error || 'Compilation failed'
        setError(errorMessage)
        setCompileState('error')
        toast({ title: 'Compilation failed', description: errorMessage, variant: 'destructive' })
        return
      }

      const blob = await res.blob()
      
      // Clear old blob URL
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
      setCompileState('ready')
      toast({ title: 'Success', description: 'PDF compiled successfully.' })

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error during compilation'
      setError(msg)
      setCompileState('error')
      toast({ title: 'Compilation failed', description: msg, variant: 'destructive' })
    }
  }

  const handleSave = () => {
    localStorage.setItem('latex_draft', latexContent)
    toast({ title: 'Draft Saved', description: 'Your LaTeX draft has been securely saved to your browser.' })
  }

  const handleReset = () => {
    if (confirm('Reset to default template? Unsaved changes will be lost.')) {
      setLatexContent(DEFAULT_LATEX_TEMPLATE)
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
      setCompileState('idle')
      setError(null)
    }
  }

  const handleDownload = () => {
    if (pdfUrl) {
      const a = document.createElement('a')
      a.href = pdfUrl
      a.download = `resume_compiled_${Date.now()}.pdf`
      a.click()
    }
  }

  useEditorShortcuts({
    onSave: handleSave,
    onCompile: () => {
      if (compileState !== 'compiling') handleCompile()
    },
    onDownload: () => {
      if (pdfUrl) handleDownload()
    }
  })

  return (
    <div className="space-y-4">
      <WorkflowStepper currentStep="compile" />
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800/50">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleCompile} 
            disabled={compileState === 'compiling'}
            className="bg-violet-600 hover:bg-violet-500 text-white gap-2"
          >
            {compileState === 'compiling' ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Compiling...</>
            ) : (
              <><RefreshCw className="w-4 h-4" /> Compile PDF</>
            )}
          </Button>
          <Button onClick={handleSave} variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Save className="w-4 h-4" />
            Save Draft
          </Button>
          <Button onClick={handleReset} variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
            <RefreshCw className="w-4 h-4" />
            Reset Template
          </Button>
        </div>
        
        <div className="hidden lg:block ml-auto mr-4">
          <EditorShortcutHints />
        </div>

        {pdfUrl && (
          <Button onClick={handleDownload} variant="outline" className="gap-2 border-slate-700 text-slate-300 hover:bg-slate-800">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Editor + Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LaTeXEditor 
          value={latexContent}
          onChange={setLatexContent}
          className="min-h-[600px] rounded-xl overflow-hidden border border-slate-800/60"
        />
        
        <PDFPreview 
          pdfUrl={pdfUrl}
          compileState={compileState === 'compiling' ? 'compiling' : compileState === 'error' ? 'error' : compileState === 'ready' ? 'ready' : 'idle'}
          compileError={error}
          className="min-h-[600px] rounded-xl overflow-hidden border border-slate-800/60"
        />
      </div>
    </div>
  )
}
