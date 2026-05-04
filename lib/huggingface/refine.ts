import { getHfClient, rotateHfApiKey } from './client'
import { buildRefinementPrompt } from '../prompts'
import { withRetry } from '../retry'
import { HuggingFaceError } from '../errors'
import { env } from '@/lib/env'

const isDev = env.NODE_ENV === 'development'
const MODEL_ID = 'Qwen/Qwen2.5-72B-Instruct'

export interface RefineLatexResult {
  refinedLatex: string
  modifications: string[]
}

/**
 * Estimates whether the original resume text fits on a single page.
 * ~3 500 characters is a reliable upper bound for a dense single-page resume.
 */
function estimatePageCount(text: string): 'one-page' | 'multi-page' {
  return text.trim().length <= 4000 ? 'one-page' : 'multi-page';
}

/**
 * Post-processes AI-generated LaTeX to enforce compact spacing settings.
 * Even if the model ignores the prescribed preamble, these transformations
 * patch the most common culprits that cause overflow to a second page.
 */
function enforceCompactLatex(latex: string, pageConstraint: 'one-page' | 'multi-page'): string {
  if (pageConstraint !== 'one-page') return latex;

  // 1. Force font size to 9pt (patch \documentclass[...]{article})
  let patched = latex.replace(
    /\\documentclass\[([^\]]*?)\]{article}/,
    (_, opts) => {
      // Remove any existing pt size option and set 9pt
      const cleanOpts = opts
        .split(',')
        .map((o: string) => o.trim())
        .filter((o: string) => !o.match(/^\d+pt$/))
        .join(',');
      return `\\documentclass[9pt${cleanOpts ? ',' + cleanOpts : ''}]{article}`;
    }
  );

  // 2. Force tight geometry — replace any \usepackage[...]{geometry} line
  patched = patched.replace(
    /\\usepackage(\[[^\]]*\])?\{geometry\}/g,
    '\\usepackage[margin=0.4in]{geometry}'
  );

  // 3. Inject compact spacing commands right before \begin{document} if they're absent
  const compactBlock = [
    '\\setlength{\\parskip}{0pt}',
    '\\setlength{\\parindent}{0pt}',
    '\\linespread{0.9}',
    '\\setlist[itemize]{noitemsep,topsep=0pt,partopsep=0pt,parsep=0pt,leftmargin=*}',
    '\\setlist[enumerate]{noitemsep,topsep=0pt,partopsep=0pt,parsep=0pt,leftmargin=*}',
    '\\titlespacing{\\section}{0pt}{4pt}{2pt}',
    '\\titlespacing{\\subsection}{0pt}{3pt}{1pt}',
  ];

  for (const cmd of compactBlock) {
    const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // If not already present, inject before \begin{document}
    if (!new RegExp(escaped).test(patched)) {
      patched = patched.replace('\\begin{document}', `${cmd}\n\\begin{document}`);
    }
  }

  // 4. Remove rogue vertical spacing commands
  patched = patched
    .replace(/\\vspace\*?\{[^}]+\}/g, '')
    .replace(/\\bigskip/g, '')
    .replace(/\\medskip/g, '')
    .replace(/\\smallskip/g, '')
    // Remove named vertical gap spacers in optional args of \\\\ e.g. \\[0.5em]
    .replace(/\\\\\[\d*\.?\d+(?:em|ex|pt|mm|cm)\]/g, '\\\\');

  return patched;
}

export async function refineResumeToLatex(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  missingKeywords: string[],
): Promise<RefineLatexResult> {
  const pageConstraint = estimatePageCount(resumeText);
  const suggestions = [ `Ensure the resume targets the requirements in this job description: ${jobDescription.slice(0, 1000)}` ]
  
  const prompt = buildRefinementPrompt(
    resumeText.slice(0, 6000),
    suggestions,
    jobTitle,
    companyName,
    missingKeywords.slice(0, 30),
    pageConstraint,
  )

  const response = await withRetry(
    async () => {
      try {
        const client = getHfClient()
        const result = await client.chatCompletion({
          model: MODEL_ID,
          messages: [
            { role: 'user', content: prompt }
          ],
          parameters: {
            max_new_tokens: 8192,
            temperature: 0.3,
          },
        })
        return result.choices[0].message.content
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error
            ? err.message.toLowerCase()
            : String(err).toLowerCase()

        if (isDev) {
          console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
          console.error("[Refiner-HF] [DEV] FULL ERROR OBJECT:")
          console.error(err)
          console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        }

        const isQuotaError =
          errMsg.includes('too many requests') ||
          errMsg.includes('429') ||
          errMsg.includes('rate limit') ||
          errMsg.includes('loading')

        const isInvalidKeyError = 
          errMsg.includes('authorization') ||
          errMsg.includes('401')

        if (isInvalidKeyError) {
          const rotated = rotateHfApiKey()
          if (rotated) {
            throw new HuggingFaceError('API Key rotated. Retrying...', true)
          }
          throw new HuggingFaceError('Invalid or expired Hugging Face API key.', false)
        }

        if (isQuotaError) {
          const rotated = rotateHfApiKey()
          if (rotated) {
            throw new HuggingFaceError('API Key rotated. Retrying...', true)
          }
          throw new HuggingFaceError('Hugging Face quota exceeded.', false)
        }

        if (
          errMsg.includes('loading') ||
          errMsg.includes('503') ||
          errMsg.includes('unavailable') ||
          errMsg.includes('http error') ||
          errMsg.includes('inference error')
        ) {
          throw new HuggingFaceError('The AI model is currently loading or experiencing provider issues.', true)
        }

        throw new HuggingFaceError(errMsg, false)
      }
    },
    { 
      maxAttempts: isDev ? 5 : 3, 
      baseDelay: isDev ? 1000 : 2000, 
      maxDelay: 10000 
    }
  )

  if (!response) {
    throw new HuggingFaceError('Hugging Face returned an empty response', false)
  }

  let clean = response.trim()
  const jsonMatch = clean.match(/```json\s*([\s\S]*?)\s*```/) || clean.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    clean = jsonMatch[1].trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(clean)
  } catch {
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      try {
        parsed = JSON.parse(clean.slice(start, end + 1))
      } catch {
        throw new HuggingFaceError(`Hugging Face returned invalid JSON: ${clean.slice(0, 300)}`, false)
      }
    } else {
      throw new HuggingFaceError(`Hugging Face returned invalid JSON: ${clean.slice(0, 300)}`, false)
    }
  }

  const result = validateRefineResult(parsed)
  result.refinedLatex = enforceCompactLatex(result.refinedLatex, pageConstraint)
  return result
}

function validateRefineResult(raw: unknown): RefineLatexResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid refine result: not an object')
  }
  const r = raw as Record<string, unknown>

  if (typeof r.refinedLatex !== 'string' || r.refinedLatex.trim() === '') {
    throw new Error('Hugging Face returned empty or missing refinedLatex field')
  }

  if (!r.refinedLatex.includes('\\documentclass') && !r.refinedLatex.includes('\\begin')) {
    // Some models might skip the preamble if not explicitly told, but the prompt should handle it.
    // If it's missing, it's a failure.
    throw new Error('Hugging Face response does not appear to be valid LaTeX')
  }

  return {
    refinedLatex: r.refinedLatex,
    modifications: Array.isArray(r.modifications) ? r.modifications.map(String) : [],
  }
}
