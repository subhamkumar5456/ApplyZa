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
import { OptimizedResumeTab } from '@/components/refiner/OptimizedResumeTab'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { AnalysisSkeleton } from '@/components/skeletons/analysis-skeleton'
import { WorkflowStepper } from '@/components/workflow-stepper'
import { useToast } from '@/lib/hooks/use-toast'
import { useResumeAnalysis } from '@/lib/hooks/use-resume-analysis'
import { AnalysisResult } from '@/types/analysis'
import { ArrowLeft, Loader2, Sparkles, BarChart3, Target, Lightbulb, Wand2, FileText } from 'lucide-react'
import { CoverLetterTab } from '@/components/refiner/CoverLetterTab'

export default function AnalyzePage() {
  const router = useRouter()
  const params = useParams()
  const resumeId = params.id as string
  const supabase = createClient()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('score')
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [existingAnalyses, setExistingAnalyses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    status: analysisStatus,
    result: analysisResult,
    error: analysisError,
    analysisId: activeAnalysisId,
    analyze,
    reset,
    setResult: setAnalysisResult,
    setAnalysisId: setActiveAnalysisId,
    setStatus: setAnalysisStatus,
  } = useResumeAnalysis()

  // Set existing analyses if any (still loaded on mount)

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

    try {
      await analyze(resumeId, jobDescription, jobTitle, companyName);
      toast({ title: 'Analysis started', description: 'This may take a minute...' })
    } catch (err) {
      toast({
        title: 'Failed to start analysis',
        description: err instanceof Error ? err.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle analysis completion toast
  useEffect(() => {
    if (analysisStatus === 'complete') {
      toast({ title: 'Analysis complete!' })
    } else if (analysisStatus === 'error' && analysisError) {
      toast({ title: 'Analysis failed', description: analysisError, variant: 'destructive' })
    }
  }, [analysisStatus, analysisError, toast])

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
            <span className="sr-only">Back to Resume</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyze Resume</h1>
          <p className="text-muted-foreground text-sm">
            Compare your resume against a job description
          </p>
        </div>
      </div>

      <WorkflowStepper 
        currentStep={!analysisResult ? 'analyze' : activeTab === 'optimized' ? 'refine' : 'analyze'} 
        resumeId={resumeId}
      />

      {!analysisResult && analysisStatus !== 'analyzing' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
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
                  disabled={analysisStatus !== 'idle'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="e.g., Google"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={analysisStatus !== 'idle'}
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
                disabled={analysisStatus !== 'idle'}
                className="min-h-[200px]"
              />
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analysisStatus !== 'idle' || !jobTitle || !companyName || !jobDescription}
              className="w-full bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-600/20 transition-all"
              size="lg"
            >
              {analysisStatus !== 'idle' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4 text-white/80" /> Analyze Match</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {analysisStatus === 'analyzing' && !analysisResult && (
        <div className="py-8">
          <div className="flex items-center justify-center gap-2 mb-8">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted-foreground">
              Analyzing your resume... This may take up to a minute.
            </span>
          </div>
          <AnalysisSkeleton />
        </div>
      )}

      {analysisResult && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
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
            <TabsTrigger value="optimized" className="gap-1">
              <Wand2 className="h-3 w-3" />
              <span className="hidden sm:inline">Optimized</span>
              <span className="sm:hidden">AI</span>
            </TabsTrigger>
            <TabsTrigger value="cover-letter" className="gap-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Cover Letter</span>
              <span className="sm:hidden">Letter</span>
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

          <TabsContent value="optimized" className="mt-4">
            <OptimizedResumeTab
              resumeId={resumeId}
              analysisId={activeAnalysisId}
              analysisResult={analysisResult}
              jobDescription={jobDescription}
              jobTitle={jobTitle}
              companyName={companyName}
            />
          </TabsContent>

          <TabsContent value="cover-letter" className="mt-4">
            <CoverLetterTab
              resumeId={resumeId}
              jobId={activeAnalysisId || undefined}
              initialJobTitle={jobTitle}
              initialCompany={companyName}
              initialJobDescription={jobDescription}
            />
          </TabsContent>
        </Tabs>
      )}

      {existingAnalyses.length > 0 && !analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Previous Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingAnalyses.map((analysis) => (
                <button
                  key={analysis.id}
                  onClick={() => {
                    setAnalysisResult({
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
                      summary: analysis.summary || '',
                      strengths: analysis.strengths || [],
                      weaknesses: analysis.weaknesses || [],
                    })
                    // Restore context for the Refiner module
                    setActiveAnalysisId(analysis.id)
                    setAnalysisStatus('complete')
                    setJobDescription(analysis.job_description || '')
                    setJobTitle(analysis.job_title || '')
                    setCompanyName(analysis.company_name || '')
                  }}
                  className="w-full flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-muted/50 text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 border border-brand-500/20">
                    <span className="text-sm font-bold text-brand-400">
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
