'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModificationsListProps {
  modifications: string[]
  className?: string
}

export function ModificationsList({ modifications, className }: ModificationsListProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!modifications || modifications.length === 0) return null

  return (
    <div className={cn('rounded-lg border border-violet-500/20 bg-violet-950/20', className)}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-violet-500/5"
      >
        <Sparkles className="h-4 w-4 flex-shrink-0 text-violet-400" />
        <span className="flex-1 text-sm font-medium text-violet-300">
          AI Modifications
        </span>
        <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-xs font-semibold text-violet-400">
          {modifications.length}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-violet-500/10 px-4 pb-4 pt-3">
          <ul className="space-y-2">
            {modifications.map((mod, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-xs text-slate-300"
              >
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-violet-400" />
                <span>{mod}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
