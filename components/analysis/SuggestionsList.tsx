'use client'

import { Suggestion } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { Lightbulb, AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface SuggestionsListProps {
  suggestions: Suggestion[]
}

const severityConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    badge: 'destructive' as const,
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badge: 'warning' as const,
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: 'secondary' as const,
  },
}

const categoryLabels: Record<string, string> = {
  content: 'Content',
  format: 'Formatting',
  keywords: 'Keywords',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
}

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  const criticalSuggestions = suggestions.filter(s => s.severity === 'critical')
  const warningSuggestions = suggestions.filter(s => s.severity === 'warning')
  const infoSuggestions = suggestions.filter(s => s.severity === 'info')

  const sortedSuggestions = [...criticalSuggestions, ...warningSuggestions, ...infoSuggestions]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-violet-600" />
          Improvement Suggestions
          <Badge variant="secondary" className="ml-auto">
            {suggestions.length} suggestions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No suggestions at this time.</p>
          </div>
        ) : (
          sortedSuggestions.map((suggestion) => {
            const config = severityConfig[suggestion.severity]
            const Icon = config.icon

            return (
              <div
                key={suggestion.id}
                className={cn(
                  'rounded-lg border p-4 transition-all hover:shadow-sm',
                  config.bgColor,
                  config.borderColor
                )}
              >
                <div className="flex items-start gap-3">
                  <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.color)} />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                      <Badge variant={config.badge} className="text-xs">
                        {suggestion.severity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {categoryLabels[suggestion.category] || suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.description}</p>

                    {suggestion.current_text && suggestion.suggested_text && (
                      <div className="space-y-2 mt-3">
                        <div className="rounded-md bg-red-100/50 dark:bg-red-900/20 p-2.5 border border-red-200/50 dark:border-red-800/50">
                          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Current:</p>
                          <p className="text-xs text-red-600 dark:text-red-300">{suggestion.current_text}</p>
                        </div>
                        <div className="rounded-md bg-emerald-100/50 dark:bg-emerald-900/20 p-2.5 border border-emerald-200/50 dark:border-emerald-800/50">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Suggested:</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-300">{suggestion.suggested_text}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
