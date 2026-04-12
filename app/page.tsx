import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  FileText,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b glass">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Applyza</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent dark:from-violet-950/20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-r from-violet-200/30 to-indigo-200/30 dark:from-violet-900/20 dark:to-indigo-900/20 blur-3xl" />
          </div>
          <div className="container text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium mb-6 bg-white/50 dark:bg-gray-950/50 backdrop-blur">
              <Zap className="h-3.5 w-3.5 mr-2 text-violet-600" />
              AI-Powered Resume Optimization
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Land Your Dream Job with
              <span className="block gradient-text">AI-Optimized Resumes</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Upload your resume, paste a job description, and get instant ATS scoring,
              keyword matching, and actionable improvement suggestions powered by GPT-4.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-base px-8">
                <Link href="/signup">
                  Start Optimizing Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-base px-8">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-muted/30">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              Everything You Need to <span className="gradient-text">Beat the ATS</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 mb-4">
                  <FileText className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Resume Parsing</h3>
                <p className="text-sm text-muted-foreground">
                  Upload PDF or DOCX files. Our AI extracts and structures your experience,
                  skills, education, and more with high accuracy.
                </p>
              </div>
              <div className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 mb-4">
                  <BarChart3 className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">ATS Score Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get detailed ATS compatibility scores with breakdowns for keywords,
                  formatting, experience relevance, and education match.
                </p>
              </div>
              <div className="group rounded-xl border bg-card p-8 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 mb-4">
                  <Lightbulb className="h-6 w-6 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Suggestions</h3>
                <p className="text-sm text-muted-foreground">
                  Receive actionable, prioritized suggestions to improve your resume
                  with specific text rewrites and keyword additions.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">
              How It <span className="gradient-text">Works</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: '1', title: 'Upload Resume', desc: 'Upload your resume in PDF or DOCX format.' },
                { step: '2', title: 'Add Job Description', desc: 'Paste the job description you\'re targeting.' },
                { step: '3', title: 'Get AI Insights', desc: 'Receive your ATS score, matches, and improvements.' },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-lg mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-600">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Optimize Your Resume?
            </h2>
            <p className="text-violet-100 mb-8 max-w-lg mx-auto">
              Join thousands of job seekers who have improved their resumes with Applyza.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-base px-8">
              <Link href="/signup">
                Get Started for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <span className="text-sm font-semibold gradient-text">Applyza</span>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Applyza. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
