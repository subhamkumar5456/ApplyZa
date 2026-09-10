import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, BarChart3, TrendingUp, Sparkles } from 'lucide-react'
import { ResumeActions } from '@/components/resume/ResumeActions'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: resumes } = await supabase
    .from('resumes')
    .select(`
      id,
      title,
      status,
      created_at,
      last_analysis:analyses!last_analysis_id (
        id,
        ats_score,
        job_title,
        company_name,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const [
    { count: totalResumes },
    { count: totalAnalyses },
  ] = await Promise.all([
    supabase
      .from('resumes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('analyses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
  ])

  // Derive latest ATS score from the most-recently-updated resume's last_analysis
  const latestAnalysis = resumes?.find((r: any) => r.last_analysis?.ats_score != null)?.last_analysis as { ats_score: number } | null | undefined

  const { count: totalCoverLetters } = await supabase
    .from('cover_letters')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)


  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, <span className="gradient-text">{userName}</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your resume optimization progress.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResumes || 0}</div>
            <p className="text-xs text-muted-foreground">uploaded resumes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Analyses Run</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyses || 0}</div>
            <p className="text-xs text-muted-foreground">total analyses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest ATS Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestAnalysis?.ats_score ? `${latestAnalysis.ats_score}%` : '—'}
            </div>
            <p className="text-xs text-muted-foreground">most recent score</p>
          </CardContent>
        </Card>
        <Card className="border border-brand-500/20 bg-brand-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
            <FileText className="h-4 w-4 text-brand-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoverLetters || 0}</div>
            <Button size="sm" asChild className="mt-2 w-full bg-brand-600 hover:bg-brand-500">
              <Link href="/dashboard/cover-letters">
                Generate New
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Resumes</CardTitle>
              <CardDescription>Your recently uploaded resumes</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/resumes">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!resumes || resumes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No resumes uploaded yet. Upload your first resume to get started.
              </p>
              <Button asChild className="bg-brand-600 hover:bg-brand-500">
                <Link href="/resumes/new">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First Resume
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {resumes.map((resume: any) => (
                <div
                  key={resume.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
                >
                  <Link href={`/resumes/${resume.id}`} className="flex items-center gap-4 flex-1 min-w-0 pr-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 border border-brand-500/20">
                      <FileText className="h-5 w-5 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{resume.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(resume.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      resume.status === 'parsed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      resume.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {resume.status}
                    </span>
                    <ResumeActions resumeId={resume.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
