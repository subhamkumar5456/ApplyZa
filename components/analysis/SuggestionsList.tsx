'use client'

import { Suggestion } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { Lightbulb, AlertTriangle, AlertCircle, Info } from 'lucide-react'

interface SuggestionsListProps {
  suggestions: Suggestion[]
}

const typeConfig = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/20',
    borderColor: 'border-red-200 dark:border-red-800',
    badge: 'destructive' as const,
  },
  important: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    badge: 'warning' as const,
  },
  minor: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: 'secondary' as const,
  },
}

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  const criticalSuggestions = suggestions.filter(s => s.type === 'critical')
  const importantSuggestions = suggestions.filter(s => s.type === 'important')
  const minorSuggestions = suggestions.filter(s => s.type === 'minor')

  const sortedSuggestions = [...criticalSuggestions, ...importantSuggestions, ...minorSuggestions]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-brand-400" />
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
          sortedSuggestions.map((suggestion, i) => {
            const config = typeConfig[suggestion.type] ?? typeConfig.minor
            const Icon = config.icon

            return (
              <div
                key={i}
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
                      <h4 className="font-semibold text-sm">{suggestion.suggestion}</h4>
                      <Badge variant={config.badge} className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    </div>
                    {suggestion.impact && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium">Impact: </span>{suggestion.impact}
                      </p>
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
