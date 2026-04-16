'use client'

import { SkillMatch } from '@/types/analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import { CheckCircle2, XCircle, Target } from 'lucide-react'

interface MatchingResultsProps {
  skills: SkillMatch[]
  matchedSkills: string[]
  missingKeywords: string[]
}

export function MatchingResults({ skills, matchedSkills, missingKeywords }: MatchingResultsProps) {
  const foundSkills = skills.filter(s => s.found)
  const missingSkills = skills.filter(s => !s.found)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-violet-600" />
            Skills Match
            <Badge variant="secondary" className="ml-auto">
              {foundSkills.length}/{skills.length} matched
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {skills.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No skills to analyze</p>
          ) : (
            <div className="space-y-3">
              {skills.map((skill, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                    skill.found ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                  )}
                >
                  {skill.found ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{skill.skill}</span>
                      <Badge
                        variant={skill.importance === 'required' ? 'destructive' : skill.importance === 'preferred' ? 'warning' : 'secondary'}
                        className="text-xs"
                      >
                        {skill.importance}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Matched Keywords ({matchedSkills.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {matchedSkills.map((skill, i) => (
                <Badge key={i} variant="success" className="text-xs">{skill}</Badge>
              ))}
              {matchedSkills.length === 0 && (
                <p className="text-xs text-muted-foreground">No matches found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Missing Keywords ({missingKeywords.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map((keyword, i) => (
                <Badge key={i} variant="destructive" className="text-xs">{keyword}</Badge>
              ))}
              {missingKeywords.length === 0 && (
                <p className="text-xs text-muted-foreground">No missing keywords</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
