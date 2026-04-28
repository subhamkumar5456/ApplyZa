import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export type RefinerStatus = 'idle' | 'refining' | 'complete' | 'error';

export function useResumeRefiner() {
  const [status, setStatus] = useState<RefinerStatus>('idle');
  const [latexCode, setLatexCode] = useState<string>('');
  const [atsScore, setAtsScore] = useState<number>(0);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [modifications, setModifications] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const reset = useCallback(() => {
    setStatus('idle');
    setLatexCode('');
    setAtsScore(0);
    setVersionId(null);
    setModifications([]);
    setError(null);
  }, []);

  const refine = useCallback(async (
    resumeId: string, 
    analysisId: string, 
    jobDescription: string, 
    jobTitle: string, 
    companyName: string = '', 
    missingKeywords: string[] = []
  ) => {
    try {
      setStatus('refining');
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const res = await fetch('/api/resume/refine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeId,
          analysisId,
          jobDescription,
          missingKeywords,
          jobTitle,
          companyName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to refine resume');
      }

      setLatexCode(data.refinedLatex);
      setModifications(data.modifications || []);
      setVersionId(data.versionId);
      setStatus('complete');
      
      return data;
    } catch (err: any) {
      setError(err.message || 'Refinement failed');
      setStatus('error');
      throw err;
    }
  }, [supabase]);

  return {
    status,
    latexCode,
    atsScore,
    versionId,
    modifications,
    error,
    refine,
    reset,
    setLatexCode,
    setModifications,
    setStatus,
  };
}
