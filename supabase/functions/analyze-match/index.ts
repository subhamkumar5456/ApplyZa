import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

import { corsHeaders } from '../_shared/cors.ts'

// ✅ Environment variables
const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: Deno.env.get('DEEPSEEK_API_KEY')!,
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// ✅ Create client ONCE (performance improvement)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let job_id: string | undefined

  try {
    const body = await req.json()
    job_id = body.job_id

    if (!job_id) {
      throw new Error('job_id is required')
    }

    // 🔹 Fetch job
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('type', 'analyze_match')
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    // 🔹 Update job status
    await supabase
      .from('jobs')
      .update({ status: 'processing' })
      .eq('id', job_id)

    const { resume_id, job_title, job_description, company_name } = job.payload as {
      resume_id: string
      job_title: string
      job_description: string
      company_name: string
    }

    // 🔹 Fetch resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('parsed_text, parsed_data')
      .eq('id', resume_id)
      .single()

    if (resumeError || !resume) {
      throw new Error('Resume not found')
    }

    const resumeText =
      resume.parsed_text || JSON.stringify(resume.parsed_data)

    // 🔥 AI Prompt
    const analysisPrompt = `You are an expert ATS analyst and career coach. Analyze the given resume against the job description and provide a comprehensive evaluation.

Resume Text:
${resumeText}

Job Title: ${job_title}
Company: ${company_name}
Job Description:
${job_description}

Provide your analysis as a JSON object with this structure:
{
  "ats_score": {
    "overall": 0-100,
    "keyword_match": 0-100,
    "format_score": 0-100,
    "experience_relevance": 0-100,
    "education_match": 0-100
  },
  "skills_match": [
    {
      "skill": "Skill name from JD",
      "found": true,
      "context": "Where/how it appears or why missing",
      "importance": "required|preferred|nice-to-have"
    }
  ],
  "matched_skills": [],
  "missing_keywords": [],
  "suggestions": [],
  "summary": "",
  "strengths": [],
  "weaknesses": []
}

Scoring Guidelines:
- keyword_match: 35%
- experience_relevance: 30%
- format_score: 20%
- education_match: 15%
- overall: weighted average

Strictly return ONLY valid JSON. No markdown, no explanation.`

    // 🔥 Call AI
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            'You must return ONLY valid JSON. No markdown, no explanation.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4096,
    })

    // 🔥 Validate response
    if (!completion.choices?.length) {
      throw new Error('No response from AI')
    }

    const content = completion.choices[0].message?.content

    if (!content) {
      throw new Error('Empty AI response')
    }

    // 🔥 Extract JSON safely
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/)
    const jsonString = jsonMatch ? jsonMatch[1] : content.trim()

    let analysisResult

    try {
      analysisResult = JSON.parse(jsonString)
    } catch (e) {
      console.error('JSON parse error:', jsonString)
      throw new Error('AI returned invalid JSON')
    }

    // 🔹 Save analysis
    const { data: analysis, error: insertError } = await supabase
      .from('analyses')
      .insert({
        resume_id,
        user_id: job.user_id,
        job_title,
        job_description,
        company_name,
        ats_score: analysisResult.ats_score?.overall || 0,
        keyword_score: analysisResult.ats_score?.keyword_match || 0,
        format_score: analysisResult.ats_score?.format_score || 0,
        experience_score:
          analysisResult.ats_score?.experience_relevance || 0,
        skills_match: analysisResult.skills_match || [],
        missing_keywords: analysisResult.missing_keywords || [],
        suggestions: analysisResult.suggestions || [],
        matched_skills: analysisResult.matched_skills || [],
        status: 'completed',
      })
      .select('id')
      .single()

    if (insertError) {
      throw new Error(`Failed to save analysis: ${insertError.message}`)
    }

    // 🔹 Update job success
    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result: analysisResult,
      })
      .eq('id', job_id)

    return new Response(
      JSON.stringify({ success: true, analysis_id: analysis.id }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  } catch (error) {
    console.error('Analyze match error:', error)

    // 🔥 Fail-safe job update
    if (job_id) {
      try {
        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            error:
              error instanceof Error
                ? error.message
                : 'Unknown error',
          })
          .eq('id', job_id)
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})