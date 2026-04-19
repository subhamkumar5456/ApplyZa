import { getGeminiClient, rotateApiKey } from './client'

// ============================================================
// AI Resume Refiner — Gemini Service
// ISOLATED from analyze.ts. No shared state, no side effects
// on the existing ATS pipeline.
// ============================================================

const REFINE_SYSTEM_PROMPT = `You are a professional resume writer and ATS optimization expert with 15+ years of experience. Your task is to refine a candidate's resume in LaTeX format.

STRICT RULES — you MUST follow these absolutely:
1. DO NOT change: education institutions, degrees, dates, company names, or job titles
2. DO NOT fabricate new projects, roles, metrics, or achievements
3. DO NOT invent numbers or statistics
4. DO NOT add technologies or skills the candidate has not listed
5. DO NOT remove any section or existing bullet point — you may only improve its phrasing

WHAT YOU SHOULD DO:
- Strengthen weak action verbs (e.g., "worked on" → "engineered", "helped with" → "collaborated to deliver")
- Improve clarity and impact of existing bullet points
- Quantify impact where the existing text implies scale but lacks precision (use relative terms like "significantly improved" if no number exists)
- Naturally integrate the provided missing keywords into existing bullet points or the skills section
- Improve ATS compatibility through keyword density and formatting
- Preserve all LaTeX structure, environments, and commands
- DO NOT use dangerous or complex external LaTeX macros like \write18, \input, \include, or URL file fetching. Keep the document completely self-contained.
- Return ONLY valid LaTeX — no markdown, no explanation, no code fences

OUTPUT FORMAT:
Return a JSON object with exactly this shape:
{
  "refinedLatex": "<complete valid LaTeX document>",
  "modifications": ["<specific change 1>", "<specific change 2>", ...]
}`

export interface RefineLatexResult {
  refinedLatex: string
  modifications: string[]
}

export async function refineResumeToLatex(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  missingKeywords: string[],
): Promise<RefineLatexResult> {
  const userPrompt = `
Job Title: ${jobTitle}
Company: ${companyName}

=== JOB DESCRIPTION ===
${jobDescription.slice(0, 4000)}

=== MISSING KEYWORDS TO INTEGRATE ===
${missingKeywords.slice(0, 30).join(', ')}

=== CURRENT RESUME TEXT ===
${resumeText.slice(0, 6000)}

Now generate the refined LaTeX resume following the strict rules above. Return only valid JSON.`

  let response
  let attempt = 0
  const maxRetries = 3

  while (attempt < maxRetries) {
    try {
      response = await getGeminiClient().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: REFINE_SYSTEM_PROMPT + '\n\n' + userPrompt }],
          },
        ],
        config: {
          temperature: 0.3,
          maxOutputTokens: 16384,
          responseMimeType: 'application/json',
        },
      })
      break
    } catch (err: any) {
      attempt++
      const errMsg =
        err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err))

      const isQuotaExceeded =
        err?.status === 429 ||
        errMsg.includes('429') ||
        errMsg.includes('RESOURCE_EXHAUSTED') ||
        errMsg.includes('quota')

      if (isQuotaExceeded) {
        // Try rotating to the next API key before giving up
        const rotated = rotateApiKey()
        if (rotated) {
          console.warn(`[Refiner] Quota exceeded — retrying with next API key (attempt ${attempt}/${maxRetries})…`)
          continue
        }
        // All keys exhausted
        throw new Error(
          'AI quota exceeded. All API keys have reached their free-tier limit for today. Please try again tomorrow or upgrade your Gemini API plan.',
        )
      }

      const isOverloaded =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('high demand')

      if (isOverloaded && attempt < maxRetries) {
        console.warn(
          `[Refiner] Gemini overloaded. Retrying ${attempt}/${maxRetries} in ${attempt * 4}s…`,
        )
        await new Promise((resolve) => setTimeout(resolve, attempt * 4000))
        continue
      }
      if (isOverloaded) {
        throw new Error(
          'AI model is under high demand. Please wait a minute and try again.',
        )
      }
      throw err
    }
  }

  if (!response) {
    throw new Error('Failed to get a response from Gemini after multiple retries.')
  }

  const content = response.text
  if (!content) {
    throw new Error('Gemini returned an empty response')
  }

  // Strip potential markdown fences
  let clean = content.trim()
  if (clean.startsWith('```json')) {
    clean = clean.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  } else if (clean.startsWith('```')) {
    clean = clean.replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(clean)
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${clean.slice(0, 300)}`)
  }

  return validateRefineResult(parsed)
}

function validateRefineResult(raw: unknown): RefineLatexResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid refine result: not an object')
  }
  const r = raw as Record<string, unknown>

  if (typeof r.refinedLatex !== 'string' || r.refinedLatex.trim() === '') {
    throw new Error('Gemini returned empty or missing refinedLatex field')
  }

  if (!r.refinedLatex.includes('\\documentclass') && !r.refinedLatex.includes('\\begin')) {
    throw new Error('Gemini response does not appear to be valid LaTeX')
  }

  return {
    refinedLatex: r.refinedLatex,
    modifications: Array.isArray(r.modifications) ? r.modifications.map(String) : [],
  }
}
