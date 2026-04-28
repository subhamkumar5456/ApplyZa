import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AnalysisResult } from '@/types/analysis';

type AnalysisStatus = 'idle' | 'uploading' | 'parsing' | 'analyzing' | 'complete' | 'error';

export function useResumeAnalysis() {
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const supabase = createClient();

  // ── Dev Mode: Auto-cleanup stale failed jobs ──────────────
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      const cleanup = async () => {
        const fiveMinutesAgo = new Date(
          Date.now() - 5 * 60 * 1000
        ).toISOString();
        
        const { error } = await supabase
          .from('jobs')
          .delete()
          .eq('status', 'failed')
          .lt('created_at', fiveMinutesAgo);
        
        if (!error) {
          console.log('[Dev] Auto-cleaned old failed jobs');
        }
      };
      cleanup();
    }
  }, [supabase]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setResult(null);
    setError(null);
    setAnalysisId(null);
  }, []);

  const analyze = useCallback(async (
    resumeId: string, 
    jobDescription: string, 
    jobTitle: string, 
    companyName: string = ''
  ) => {
    try {
      setStatus('analyzing');
      setProgress(45); // Assuming already uploaded and parsed
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'analyze_match',
          payload: {
            resume_id: resumeId,
            job_title: jobTitle,
            company_name: companyName,
            job_description: jobDescription,
          },
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to start analysis job');
      }

      setProgress(70);

      const { jobId } = await res.json();
      
      // Trigger processing in background
      fetch('/api/jobs/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      }).catch((e) => console.error('Failed to trigger background process', e));

      // Poll for completion
      const pollInterval = setInterval(async () => {
        const { data: job, error: jobError } = await supabase
          .from('jobs')
          .select('status, result, error')
          .eq('id', jobId)
          .single();

        if (jobError) {
          clearInterval(pollInterval);
          throw new Error('Failed to poll job status');
        }

        if (job.status === 'completed') {
          clearInterval(pollInterval);
          
          // Get the analysis
          const { data: analysis } = await supabase
            .from('analyses')
            .select('*')
            .eq('job_id', jobId)
            .single();
            
          if (analysis) {
            setResult(analysis.result as unknown as AnalysisResult);
            setAnalysisId(analysis.id);
            setProgress(100);
            setStatus('complete');
          }
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          
          const errorMsg = job.error || 'Job failed';
          
          // ── Dev Mode: Log full error details ─────────────────
          if (process.env.NODE_ENV === 'development') {
            console.error('[Analysis] [DEV] Job failed:', {
              jobId: job.id,
              error: errorMsg,
              job: job,
            });
          }
          
          // ── User-friendly error messages ─────────────────────
          if (errorMsg.toLowerCase().includes('quota exceeded') || 
              errorMsg.toLowerCase().includes('free-tier limit')) {
            throw new Error(
              'Analysis temporarily unavailable due to high demand. ' +
              'Please wait a moment and try again.'
            );
          }
          
          if (errorMsg.toLowerCase().includes('invalid') || errorMsg.toLowerCase().includes('expired')) {
            throw new Error(
              'API configuration error. Please contact support or check your Dev API keys.'
            );
          }
          
          if (errorMsg.toLowerCase().includes('high demand') || 
              errorMsg.toLowerCase().includes('503')) {
            throw new Error(
              'The AI service is experiencing high demand. ' +
              'Please try again in a moment.'
            );
          }
          
          // Fallback
          throw new Error(
            `Analysis failed: ${errorMsg.slice(0, 150)}` +
            `${errorMsg.length > 150 ? '...' : ''}`
          );
        }
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Analysis failed');
      setStatus('error');
    }
  }, [supabase]);

  return {
    status,
    progress,
    result,
    error,
    analysisId,
    analyze,
    reset,
    setResult,
    setAnalysisId,
    setStatus,
  };
}
