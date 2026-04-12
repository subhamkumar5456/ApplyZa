'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ResumeWithAnalysis } from '@/types/resume'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { FileText, BarChart3, Eye, Trash2 } from 'lucide-react'

interface ResumeCardProps {
  resume: ResumeWithAnalysis
}

export function ResumeCard({ resume }: ResumeCardProps) {
  const latestAnalysis = resume.analyses?.[0]
  const timeAgo = formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })

  return (
    <Card className="group hover:shadow-md transition-all duration-200 hover:border-violet-200 dark:hover:border-violet-800">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30">
              <FileText className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight line-clamp-1">{resume.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{timeAgo}</p>
            </div>
          </div>
          <StatusBadge status={resume.status} />
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{resume.file_name}</span>
          <span>{(resume.file_size / 1024).toFixed(0)} KB</span>
        </div>
        {latestAnalysis && latestAnalysis.ats_score !== null && (
          <div className="mt-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-violet-600" />
            <div className="flex-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium">ATS Score</span>
                <span className="font-semibold text-violet-600">{latestAnalysis.ats_score}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
                  style={{ width: `${latestAnalysis.ats_score}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/resumes/${resume.id}`}>
            <Eye className="mr-1 h-3 w-3" />
            View
          </Link>
        </Button>
        <Button variant="outline" size="sm" className="flex-1" asChild>
          <Link href={`/resumes/${resume.id}/analyze`}>
            <BarChart3 className="mr-1 h-3 w-3" />
            Analyze
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
