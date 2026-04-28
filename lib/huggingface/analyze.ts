import { getHfClient, rotateHfApiKey } from './client'
import { AnalysisResult } from '@/types/analysis'
import { buildAnalysisPrompt } from '../prompts'
import { withRetry } from '../retry'
import { HuggingFaceError } from '../errors'
import { env } from '@/lib/env'

const isDev = env.NODE_ENV === 'development'
// Model choice: Qwen/Qwen2.5-72B-Instruct is highly reliable and excellent at JSON.
const MODEL_ID = 'Qwen/Qwen2.5-72B-Instruct'

export async function analyzeResumeMatch(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
): Promise<AnalysisResult> {

  const prompt = buildAnalysisPrompt(
    resumeText,
    jobDescription,
    jobTitle,
    companyName
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
            max_new_tokens: 4096,
            temperature: 0.2,
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
          console.error("[HuggingFace] [DEV] FULL ERROR OBJECT:")
          console.error(err)
          console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        }

        const isQuotaError =
          errMsg.includes('too many requests') ||
          errMsg.includes('429') ||
          errMsg.includes('rate limit') ||
          errMsg.includes('loading') // HF often returns "Model is loading" which should be retried

        const isInvalidKeyError = 
          errMsg.includes('authorization') ||
          errMsg.includes('invalid api key') ||
          errMsg.includes('401')

        if (isInvalidKeyError) {
          const rotated = rotateHfApiKey()
          if (rotated) {
            throw new HuggingFaceError('API Key rotated due to invalidation. Retrying...', true)
          }
          throw new HuggingFaceError('Invalid or expired Hugging Face API key.', false)
        }

        if (isQuotaError) {
          const rotated = rotateHfApiKey()
          if (rotated) {
            throw new HuggingFaceError('API Key rotated due to rate limit. Retrying...', true)
          }
          throw new HuggingFaceError('Hugging Face quota exceeded.', false)
        }

        // ✅ Service unavailable / loading / Provider errors
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

  let cleanContent = response.trim()

  // Extract JSON if wrapped in markdown
  const jsonMatch = cleanContent.match(/```json\s*([\s\S]*?)\s*```/) || cleanContent.match(/```\s*([\s\S]*?)\s*```/)
  if (jsonMatch) {
    cleanContent = jsonMatch[1].trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanContent)
  } catch {
    // Fallback: try to find the first '{' and last '}'
    const start = cleanContent.indexOf('{')
    const end = cleanContent.lastIndexOf('}')
    if (start !== -1 && end !== -1) {
      try {
        parsed = JSON.parse(cleanContent.slice(start, end + 1))
      } catch {
        throw new HuggingFaceError(`Hugging Face returned invalid JSON: ${cleanContent.slice(0, 200)}`, false)
      }
    } else {
      throw new HuggingFaceError(`Hugging Face returned invalid JSON: ${cleanContent.slice(0, 200)}`, false)
    }
  }

  return validateAndNormalizeResult(parsed)
}

function validateAndNormalizeResult(raw: unknown): AnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid analysis result: not an object')
  }

  const r = raw as Record<string, unknown>

  const atsScore =
    r.ats_score && typeof r.ats_score === 'object'
      ? (r.ats_score as Record<string, unknown>)
      : {}

  const improvements = Array.isArray(r.improvements)
    ? r.improvements
    : []

  return {
    ats_score: {
      overall: clamp(Number(atsScore.overall ?? 0)),
      keyword_match: clamp(Number(atsScore.keyword_match ?? 0)),
      format_score: clamp(Number(atsScore.format_score ?? 0)),
      experience_relevance: clamp(Number(atsScore.experience_relevance ?? 0)),
      education_match: clamp(Number(atsScore.education_match ?? 0)),
    },

    skills_match: Array.isArray(r.skills_match)
      ? r.skills_match.map((s: unknown) => {
          const skill = s as Record<string, unknown>
          return {
            skill: String(skill.skill ?? ''),
            found: Boolean(skill.found),
            importance:
              ['required', 'preferred', 'bonus'].includes(
                String(skill.importance)
              )
                ? (skill.importance as 'required' | 'preferred' | 'bonus')
                : 'preferred',
          }
        })
      : [],

    matched_skills: Array.isArray(r.matched_skills)
      ? r.matched_skills.map(String)
      : [],

    missing_keywords: Array.isArray(r.missing_keywords)
      ? r.missing_keywords.map(String)
      : [],

    suggestions: improvements.map((s: unknown) => {
      const sug = s as Record<string, unknown>
      return {
        type: 'important' as const,
        category: String(sug.section ?? 'general'),
        suggestion: String(sug.suggested ?? ''),
        impact: String(sug.impact ?? 'Medium'),
      }
    }),

    summary: String(r.summary ?? ''),
    strengths: Array.isArray(r.strengths)
      ? r.strengths.map(String)
      : [],

    weaknesses: Array.isArray(r.weaknesses)
      ? r.weaknesses.map(String)
      : [],
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
