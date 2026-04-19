'use client'

import { FileText, Loader2, AlertCircle } from 'lucide-react'
import { CompileState } from '@/types/refiner'
import { cn } from '@/lib/utils'

interface PDFPreviewProps {
  pdfUrl: string | null
  compileState: CompileState
  compileError: string | null
  className?: string
}

export function PDFPreview({ pdfUrl, compileState, compileError, className }: PDFPreviewProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-lg border border-slate-700/50 bg-slate-900/80',
        className,
      )}
    >
      {/* Header bar */}
      <div className="flex items-center gap-2 border-b border-slate-700/50 bg-slate-900 px-4 py-2.5">
        <FileText className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-400">PDF Preview</span>
        {compileState === 'ready' && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Compiled
          </span>
        )}
      </div>

      {/* Preview area */}
      <div className="relative flex-1">
        {/* Idle state — no PDF yet */}
        {compileState === 'idle' && !pdfUrl && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800">
              <FileText className="h-8 w-8 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">No preview yet</p>
              <p className="mt-1 text-xs text-slate-600">
                Click <span className="font-mono text-violet-400">Recompile</span> to generate a PDF preview
              </p>
            </div>
          </div>
        )}

        {/* Compiling overlay */}
        {compileState === 'compiling' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-slate-900/90 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            <p className="text-sm font-medium text-slate-300">Compiling LaTeX…</p>
            <p className="text-xs text-slate-500">This usually takes 5–15 seconds</p>
          </div>
        )}

        {/* Error state */}
        {compileState === 'error' && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-950/50">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Compilation failed</p>
              <p className="mt-2 max-w-xs text-xs text-slate-500">
                {compileError ?? 'Check your LaTeX syntax and try again'}
              </p>
            </div>
          </div>
        )}

        {/* PDF iframe */}
        {pdfUrl && (
          <iframe
            src={pdfUrl}
            title="Refined Resume PDF Preview"
            className={cn(
              'h-full min-h-[600px] w-full border-0',
              compileState === 'compiling' && 'opacity-30',
            )}
          />
        )}
      </div>
    </div>
  )
}
