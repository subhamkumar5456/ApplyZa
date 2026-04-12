import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import OpenAI from 'https://esm.sh/openai@4.28.0'
import { corsHeaders } from '../_shared/cors.ts'

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: Deno.env.get('DEEPSEEK_API_KEY')!,
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let job_id: string | undefined;

  try {
    const body = await req.json()
    job_id = body.job_id

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job_id)
      .eq('type', 'parse_resume')
      .single()

    if (jobError || !job) {
      throw new Error('Job not found')
    }

    await supabase
      .from('jobs')
      .update({ status: 'processing' })
      .eq('id', job_id)

    await supabase
      .from('resumes')
      .update({ status: 'parsing' })
      .eq('id', job.payload.resume_id)

    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('resumes')
      .download(job.payload.file_url.split('/resumes/')[1])

    if (downloadError) {
      throw new Error(`Failed to download file: ${downloadError.message}`)
    }

    const text = await fileData.text()

    const parsePrompt = `You are an expert resume parser. Extract structured information from the following resume text.

Return a JSON object with the following structure:
{
  "contact": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "+1-555-555-5555",
    "location": "City, State",
    "linkedin": "linkedin.com/in/username",
    "website": "website.com"
  },
  "summary": "Professional summary or objective statement",
  "experience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "location": "City, State",
      "start_date": "YYYY-MM",
      "end_date": "YYYY-MM or Present",
      "current": true/false,
      "description": ["Achievement 1", "Achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "gpa": "3.8/4.0"
    }
  ],
  "skills": ["Skill 1", "Skill 2"],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "YYYY-MM",
      "expiry": "YYYY-MM or N/A",
      "url": ""
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "description": "Brief description",
      "technologies": ["Tech 1", "Tech 2"],
      "url": ""
    }
  ],
  "languages": ["English"]
}

Extract ALL information available, leave fields as empty strings if not found.
Return ONLY the JSON object, no additional text.

Resume text:
${text}`

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: parsePrompt }],
      temperature: 0.1,
      max_tokens: 4096,
    })

    const content = completion.choices[0]?.message?.content || '{}'
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
    const jsonString = jsonMatch ? jsonMatch[1] : content
    const parsedData = JSON.parse(jsonString)

    await supabase
      .from('resumes')
      .update({
        parsed_text: text,
        parsed_data: parsedData,
        status: 'parsed',
      })
      .eq('id', job.payload.resume_id)

    await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result: { parsed: true, sections: Object.keys(parsedData) },
      })
      .eq('id', job_id)

    return new Response(
      JSON.stringify({ success: true, resume_id: job.payload.resume_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Parse resume error:', error)

    if (job_id) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        await supabase
          .from('jobs')
          .update({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', job_id)

        const { data: job } = await supabase
          .from('jobs')
          .select('payload')
          .eq('id', job_id)
          .single()

        if (job?.payload?.resume_id) {
          await supabase
            .from('resumes')
            .update({ status: 'error' })
            .eq('id', job.payload.resume_id)
        }
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError)
      }
    }

    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
