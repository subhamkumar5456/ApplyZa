'use client'

import { ResumeVersion } from '@/types/refiner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDistanceToNow } from 'date-fns'
import { History, FileCode2, Wand2, Pencil, ChevronRight } from 'lucide-react'
import { VersionListSkeleton } from '@/components/skeletons/version-list-skeleton'
import { cn } from '@/lib/utils'

interface VersionHistoryProps {
  versions: ResumeVersion[]
  currentVersionId: string | null
  onLoad: (version: ResumeVersion) => void
  isLoading?: boolean
}

const versionIcons = {
  refined: Wand2,
  manual: Pencil,
  original: FileCode2,
}

const versionColors = {
  refined: 'text-violet-500 bg-violet-500/10',
  manual: 'text-blue-500 bg-blue-500/10',
  original: 'text-emerald-500 bg-emerald-500/10',
}

const versionLabels = {
  refined: 'AI Refined',
  manual: 'Manual Edit',
  original: 'Original',
}

export function VersionHistory({
  versions,
  currentVersionId,
  onLoad,
  isLoading = false,
}: VersionHistoryProps) {
  if (versions.length === 0) return null

  return (
    <Card className="border-slate-800/50 bg-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-300">
          <History className="h-4 w-4 text-violet-400" />
          Version History
          <span className="ml-auto rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
            {versions.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5 pt-0">
        {isLoading ? (
          <VersionListSkeleton />
        ) : (
          versions.map((v) => {
            const Icon = versionIcons[v.version_type] ?? FileCode2
            const colorClass = versionColors[v.version_type] ?? 'text-slate-400 bg-slate-800'
            const isCurrent = v.id === currentVersionId

            return (
              <button
                key={v.id}
                onClick={() => onLoad(v)}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all',
                  isCurrent
                    ? 'bg-violet-600/20 ring-1 ring-violet-500/50'
                    : 'hover:bg-slate-800/60',
                )}
              >
                <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md', colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-200">
                    {v.version_label ?? versionLabels[v.version_type]}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                  </p>
                </div>
                {isCurrent ? (
                  <span className="flex-shrink-0 rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-violet-400">
                    Active
                  </span>
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
                )}
              </button>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
