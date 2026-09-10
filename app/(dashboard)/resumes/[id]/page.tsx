import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResumeViewer } from '@/components/resume/ResumeViewer'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ParsedResume } from '@/types/resume'
import { ArrowLeft, Edit, BarChart3, FileText, Calendar, HardDrive } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ResumeDetailPageProps {
  params: { id: string }
}

export default async function ResumeDetailPage({ params }: ResumeDetailPageProps) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: resume } = await supabase
    .from('resumes')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!resume) {
    notFound()
  }

  const parsedData = resume.parsed_data as ParsedResume | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/resumes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{resume.title}</h1>
            <StatusBadge status={resume.status} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {resume.file_name}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {(resume.file_size / 1024).toFixed(0)} KB
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(resume.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/resumes/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button asChild className="bg-brand-600 hover:bg-brand-500 text-white font-semibold">
            <Link href={`/resumes/${params.id}/analyze`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Analyze
            </Link>
          </Button>
        </div>
      </div>

      {parsedData ? (
        <ResumeViewer data={parsedData} />
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            {resume.status === 'parsing' ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Your resume is being parsed. This usually takes 15-30 seconds.
                </p>
              </>
            ) : resume.status === 'error' ? (
              <>
                <p className="text-sm text-destructive font-medium mb-2">Parsing failed</p>
                <p className="text-sm text-muted-foreground">
                  We couldn&apos;t parse your resume. Please try uploading again.
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Resume data is not yet available.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
