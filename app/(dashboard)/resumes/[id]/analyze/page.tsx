'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ATSScoreCard } from '@/components/analysis/ATSScoreCard'
import { MatchingResults } from '@/components/analysis/MatchingResults'
import { SuggestionsList } from '@/components/analysis/SuggestionsList'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useToast } from '@/lib/hooks/use-toast'
import { useJobStatus } from '@/lib/hooks/use-job-status'
import { AnalysisResult } from '@/types/analysis'
import { ArrowLeft, Loader2, Sparkles, BarChart3, Target, Lightbulb } from 'lucide-react'

export default function AnalyzePage() {
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [existingAnalyses, setExistingAnalyses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()
  const resumeId = params.id as string

  const { status: jobStatus } = useJobStatus({
    jobId,
    onComplete: (result) => {
      setAnalysisResult(result.result as AnalysisResult)
      setJobId(null)
      toast({ title: 'Analysis complete!' })
    },
    onError: (error) => {
      toast({ title: 'Analysis failed', description: error, variant: 'destructive' })
      setJobId(null)
    },
  })

  useEffect(() => {
    async function loadData() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: analyses } = await supabase
        .from('analyses')
        .select('*')
        .eq('resume_id', resumeId)
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (analyses) {
        setExistingAnalyses(analyses)
      }
      setIsLoading(false)
    }

    loadData()
  }, [resumeId, supabase, router])

  const handleAnalyze = async () => {
    if (!jobTitle || !jobDescription || !companyName) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      })
      return
    }

    if (jobDescription.length < 50) {
      toast({
        title: 'Job description too short',
        description: 'Please provide a more detailed job description (at least 50 characters).',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    setAnalysisResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Unauthorized')

      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          user_id: session.user.id,
          type: 'analyze_match',
          status: 'pending',
          payload: {
            resume_id: resumeId,
            job_title: jobTitle,
            job_description: jobDescription,
            company_name: companyName,
          },
        })
        .select('id')
        .single()

      if (error) throw error

      setJobId(job.id)

      // Trigger the AI processor — non-blocking, polling handles the result
      fetch('/api/jobs/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id }),
      }).catch((err) => console.error('[Analyze] Failed to trigger processor:', err))

      toast({ title: 'Analysis started', description: 'This may take a minute...' })
    } catch (err) {
      toast({
        title: 'Failed to start analysis',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Loading..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/resumes/${resumeId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyze Resume</h1>
          <p className="text-muted-foreground text-sm">
            Compare your resume against a job description
          </p>
        </div>
      </div>

      {!analysisResult && !jobId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-600" />
              Job Description
            </CardTitle>
            <CardDescription>
              Paste the job description to analyze how well your resume matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  placeholder="e.g., Senior Software Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[200px]"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={isSubmitting || !jobTitle || !companyName || !jobDescription}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
              size="lg"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting Analysis...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" /> Analyze Match</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {jobId && !analysisResult && (
        <Card>
          <CardContent className="py-16 text-center">
            <LoadingSpinner size="lg" text="Analyzing your resume... This may take up to a minute." />
            <p className="text-xs text-muted-foreground mt-4">
              Status: {jobStatus?.status || 'starting'}
            </p>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <Tabs defaultValue="score" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="score" className="gap-1">
              <BarChart3 className="h-3 w-3" />
              ATS Score
            </TabsTrigger>
            <TabsTrigger value="matching" className="gap-1">
              <Target className="h-3 w-3" />
              Matching
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="gap-1">
              <Lightbulb className="h-3 w-3" />
              Suggestions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="score" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <ATSScoreCard score={analysisResult.ats_score} />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                  {analysisResult.strengths.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-600 mb-2">Strengths</h4>
                      <ul className="space-y-1">
                        {analysisResult.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">✓</span> {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysisResult.weaknesses.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-red-600 mb-2">Areas to Improve</h4>
                      <ul className="space-y-1">
                        {analysisResult.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-500 mt-1">✗</span> {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="matching" className="mt-4">
            <MatchingResults
              skills={analysisResult.skills_match}
              matchedSkills={analysisResult.matched_skills}
              missingKeywords={analysisResult.missing_keywords}
            />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-4">
            <SuggestionsList suggestions={analysisResult.suggestions} />
          </TabsContent>
        </Tabs>
      )}

      {existingAnalyses.length > 0 && !analysisResult && !jobId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => setAnalysisResult({
                    ats_score: {
                      overall: analysis.ats_score || 0,
                      keyword_match: analysis.keyword_score || 0,
                      format_score: analysis.format_score || 0,
                      experience_relevance: analysis.experience_score || 0,
                      education_match: 0,
                    },
                    skills_match: analysis.skills_match || [],
                    matched_skills: analysis.matched_skills || [],
                    missing_keywords: analysis.missing_keywords || [],
                    suggestions: analysis.suggestions || [],
                    summary: '',
                    strengths: [],
                    weaknesses: [],
                  })}
                  className="w-full flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30">
                    <span className="text-sm font-bold text-violet-600">
                      {analysis.ats_score || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{analysis.job_title} at {analysis.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
