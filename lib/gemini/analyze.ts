import { gemini } from './client'
import { AnalysisResult } from '@/types/analysis'

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) and resume analyst with 15+ years of experience in recruitment and HR. Your task is to analyze how well a candidate's resume matches a specific job description.

Analyze thoroughly and return ONLY a valid JSON object — no markdown, no prose, no code blocks. The JSON must exactly match this structure:

{
  "ats_score": {
    "overall": <integer 0-100>,
    "keyword_match": <integer 0-100>,
    "format_score": <integer 0-100>,
    "experience_relevance": <integer 0-100>,
    "education_match": <integer 0-100>
  },
  "skills_match": [
    {
      "skill": "<skill name>",
      "found": <true|false>,
      "importance": "<required|preferred|bonus>"
    }
  ],
  "matched_skills": ["<skill>", ...],
  "missing_keywords": ["<keyword>", ...],
  "suggestions": [
    {
      "type": "<critical|important|minor>",
      "category": "<keywords|experience|format|education|skills|summary>",
      "suggestion": "<specific actionable suggestion>",
      "impact": "<expected impact if implemented>"
    }
  ],
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength>", ...],
  "weaknesses": ["<area to improve>", ...]
}`

export async function analyzeResumeMatch(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
): Promise<AnalysisResult> {
  const userPrompt = `
Job Title: ${jobTitle}
Company: ${companyName}

=== JOB DESCRIPTION ===
${jobDescription}

=== RESUME TEXT ===
${resumeText.slice(0, 8000)}

Analyze the resume against the job description and return the JSON analysis.`

  const response = await gemini.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT + '\n\n' + userPrompt }] },
    ],
    config: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    }
  })

  const content = response.text
  if (!content) {
    throw new Error('Gemini returned an empty response')
  }

  let cleanContent = content.trim()
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '').trim()
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(cleanContent)
  } catch {
    throw new Error(`Gemini returned invalid JSON: ${cleanContent.slice(0, 200)}`)
  }

  return validateAndNormalizeResult(parsed)
}

function validateAndNormalizeResult(raw: unknown): AnalysisResult {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid analysis result: not an object')
  }

  const r = raw as Record<string, unknown>

  const atsScore = (r.ats_score && typeof r.ats_score === 'object')
    ? r.ats_score as Record<string, unknown>
    : {}

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
            importance: (['required', 'preferred', 'bonus'].includes(String(skill.importance))
              ? skill.importance
              : 'preferred') as 'required' | 'preferred' | 'bonus',
          }
        })
      : [],
    matched_skills: Array.isArray(r.matched_skills) ? r.matched_skills.map(String) : [],
    missing_keywords: Array.isArray(r.missing_keywords) ? r.missing_keywords.map(String) : [],
    suggestions: Array.isArray(r.suggestions)
      ? r.suggestions.map((s: unknown) => {
          const sug = s as Record<string, unknown>
          return {
            type: (['critical', 'important', 'minor'].includes(String(sug.type))
              ? sug.type
              : 'minor') as 'critical' | 'important' | 'minor',
            category: String(sug.category ?? 'general'),
            suggestion: String(sug.suggestion ?? ''),
            impact: String(sug.impact ?? ''),
          }
        })
      : [],
    summary: String(r.summary ?? ''),
    strengths: Array.isArray(r.strengths) ? r.strengths.map(String) : [],
    weaknesses: Array.isArray(r.weaknesses) ? r.weaknesses.map(String) : [],
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}
