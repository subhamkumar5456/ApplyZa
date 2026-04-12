'use client'

import { ATSScore } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'
import { BarChart3, FileCheck, Briefcase, GraduationCap, Search } from 'lucide-react'

interface ATSScoreCardProps {
  score: ATSScore
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function getScoreGradient(score: number): string {
  if (score >= 80) return 'from-emerald-500 to-green-500'
  if (score >= 60) return 'from-amber-500 to-yellow-500'
  return 'from-red-500 to-orange-500'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Needs Work'
  return 'Poor'
}

const scoreBreakdown = [
  { key: 'keyword_match' as const, label: 'Keyword Match', icon: Search, weight: '35%' },
  { key: 'experience_relevance' as const, label: 'Experience', icon: Briefcase, weight: '30%' },
  { key: 'format_score' as const, label: 'Formatting', icon: FileCheck, weight: '20%' },
  { key: 'education_match' as const, label: 'Education', icon: GraduationCap, weight: '15%' },
]

export function ATSScoreCard({ score }: ATSScoreCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          ATS Compatibility Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <svg className="h-36 w-36 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score.overall / 100) * 251.2} 251.2`}
                className={cn('transition-all duration-1000', getScoreColor(score.overall))}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className={cn('text-3xl font-bold', getScoreColor(score.overall))}>
                {score.overall}
              </span>
              <span className="text-xs text-muted-foreground">{getScoreLabel(score.overall)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {scoreBreakdown.map(({ key, label, icon: Icon, weight }) => (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                  <span className="text-xs text-muted-foreground">({weight})</span>
                </span>
                <span className={cn('font-semibold', getScoreColor(score[key]))}>
                  {score[key]}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full bg-gradient-to-r transition-all duration-700',
                    getScoreGradient(score[key])
                  )}
                  style={{ width: `${score[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
