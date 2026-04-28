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

export async function refineResumeToLatex(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  missingKeywords: string[],
): Promise<RefineLatexResult> {
  const suggestions = [ `Ensure the resume targets the requirements in this job description: ${jobDescription.slice(0, 1000)}` ]
  
  const prompt = buildRefinementPrompt(
    resumeText.slice(0, 6000),
    suggestions,
    jobTitle,
    companyName,
    missingKeywords.slice(0, 30)
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

  return validateRefineResult(parsed)
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
