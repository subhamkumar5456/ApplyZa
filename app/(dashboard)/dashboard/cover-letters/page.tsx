import { Metadata } from 'next';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CoverLetterTab } from '@/components/refiner/CoverLetterTab';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, ArrowLeft, Upload } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Cover Letter Generator | ApplyZa',
  description: 'Generate AI-powered, ATS-optimized cover letters tailored to your job applications',
};

export default async function CoverLettersPage() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's resumes
  const { data: resumes, error } = await supabase
    .from('resumes')
    .select('id, file_name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // If no resumes found, show upload prompt
  if (!resumes || resumes.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2 text-slate-100">Cover Letter Generator</h1>
          <p className="text-muted-foreground">
            Create personalized, ATS-optimized cover letters using AI
          </p>
        </div>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader className="text-center pb-8 pt-12">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center">
              <Upload className="h-8 w-8 text-slate-400" />
            </div>
            <CardTitle className="text-2xl text-slate-100">No Resume Found</CardTitle>
            <CardDescription className="text-base mt-2 text-slate-400">
              Upload a resume first to start generating cover letters
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-12">
            <Link href="/dashboard/resumes">
              <Button size="lg" className="bg-violet-600 hover:bg-violet-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use the most recent resume by default
  const defaultResume = resumes[0];

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-400 hover:text-slate-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-slate-100">
              <FileText className="h-8 w-8 text-violet-500" />
              Cover Letter Generator
            </h1>
            <p className="text-muted-foreground">
              Create personalized, ATS-optimized cover letters using AI
            </p>
          </div>
          
          {/* Resume Selector (if multiple resumes) */}
          {resumes.length > 1 && (
            <div className="text-sm text-slate-400">
              Using: <span className="font-medium text-slate-200">{defaultResume.file_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-slate-200">Tailored Content</h3>
                <p className="text-sm text-slate-400">
                  Each cover letter is customized to match the job description
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-slate-200">ATS Optimized</h3>
                <p className="text-sm text-slate-400">
                  Includes keywords to pass applicant tracking systems
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-slate-200">AI Powered</h3>
                <p className="text-sm text-slate-400">
                  Advanced AI generates professional content in seconds
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cover Letter Generator Component */}
      <CoverLetterTab 
        resumeId={defaultResume.id}
      />
    </div>
  );
}
