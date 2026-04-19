'use client'

import dynamic from 'next/dynamic'
import { useRef, useCallback } from 'react'
import { Loader2, Code2 } from 'lucide-react'

// Lazy-load Monaco only when this component is rendered
// (i.e. when user opens the Optimized Resume tab).
// `.then(m => m.default)` is required in Next.js 14 to resolve
// the default export from the ESM @monaco-editor/react package.
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[400px] items-center justify-center bg-[#1e1e1e]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          <p className="text-xs text-slate-500">Loading editor…</p>
        </div>
      </div>
    ),
  },
)

interface LaTeXEditorProps {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  className?: string
}

export function LaTeXEditor({ value, onChange, readOnly = false, className }: LaTeXEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable reference — avoids recreating the function on every render
  const handleChange = useCallback(
    (val: string | undefined) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(val ?? '')
      }, 400)
    },
    [onChange],
  )

  return (
    <div className={`flex flex-col overflow-hidden rounded-lg border border-slate-700/50 ${className ?? ''}`}>
      {/* Editor header */}
      <div className="flex items-center gap-2 border-b border-slate-700/50 bg-[#1e1e1e] px-4 py-2.5">
        <Code2 className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-xs font-medium text-slate-400">LaTeX Editor</span>
        <span className="ml-2 rounded-sm bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
          .tex
        </span>
        {readOnly && (
          <span className="ml-auto rounded-sm bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">
            read-only
          </span>
        )}
      </div>

      {/* Monaco Editor */}
      {/* Monaco has no built-in LaTeX grammar; "plaintext" gives a clean     */}
      {/* editing experience without erroneous syntax-highlighting errors.     */}
      <div className="flex-1">
        <MonacoEditor
          height="600px"
          defaultLanguage="plaintext"
          language="plaintext"
          theme="vs-dark"
          value={value}
          onChange={handleChange}
          options={{
            readOnly,
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            renderLineHighlight: 'all' as const,
            smoothScrolling: true,
            // Valid union: "off" | "on" | "explicit"
            cursorSmoothCaretAnimation: 'on' as const,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  )
}
