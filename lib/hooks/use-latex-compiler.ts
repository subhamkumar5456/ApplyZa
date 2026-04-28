import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cleanLatexContent, validateLatex } from '@/lib/latex-utils';
import { CompileState } from '@/types/refiner';

export function useLatexCompiler() {
  const [state, setState] = useState<CompileState>('idle');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compilationError, setCompilationError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>('');
  const supabase = createClient();

  const compileTimerRef = useRef<NodeJS.Timeout | null>(null);

  const compile = useCallback(async (latexCode: string, filename: string = 'resume.pdf') => {
    if (!latexCode.trim()) {
      setCompilationError('No LaTeX content to compile');
      return;
    }

    const cleanedLatex = cleanLatexContent(latexCode);
    const validation = validateLatex(cleanedLatex);

    if (!validation.valid) {
      setCompilationError(validation.error || 'Invalid LaTeX syntax');
      return;
    }

    if (compileTimerRef.current) clearTimeout(compileTimerRef.current);

    return new Promise<void>((resolve, reject) => {
      compileTimerRef.current = setTimeout(async () => {
        setState('compiling');
        setCompilationError(null);
        setLogs('');

        try {
          const { data: { session } } = await supabase.auth.getSession();
          const token = session?.access_token;

          const res = await fetch('/api/compile-latex', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ latexContent: cleanedLatex, filename }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setLogs(data.details || '');
            throw new Error(data.error || 'Compilation failed');
          }

          const blob = await res.blob();
          
          if (pdfUrl) URL.revokeObjectURL(pdfUrl);
          
          const url = URL.createObjectURL(blob);
          setPdfUrl(url);
          setState('ready');
          resolve();
        } catch (err: any) {
          const msg = err instanceof Error ? err.message : 'Unknown compilation error';
          setCompilationError(msg);
          setState('error');
          reject(err);
        } finally {
          // Finished
        }
      }, 300);
    });
  }, [pdfUrl, supabase.auth]);

  const download = useCallback((filename: string = 'resume.pdf') => {
    if (!pdfUrl) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = filename;
    a.click();
  }, [pdfUrl]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  return {
    state,
    pdfUrl,
    compilationError,
    logs,
    compile,
    download,
    setPdfUrl,
    setState,
  };
}
