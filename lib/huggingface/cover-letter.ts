import { getHfClient } from './client';
import { logger } from '@/lib/logger';
import type { GenerateCoverLetterRequest } from '@/types/cover-letter';

const SYSTEM_PROMPT = `You are an expert career consultant and professional cover letter writer with 15+ years of experience.

Your task is to generate compelling, ATS-optimized cover letters that:
- Naturally incorporate keywords from the job description
- Highlight 2-3 specific, quantifiable achievements from the resume
- Demonstrate genuine interest in the company and role
- Use strong action verbs and concrete examples
- Maintain appropriate professional tone
- Follow standard cover letter structure (opening, body paragraphs, closing)
- Are concise (250-400 words)
- Avoid clichés and generic phrases

CRITICAL RULES:
1. DO NOT fabricate experiences not in the resume
2. DO NOT use overly flowery or salesy language
3. DO show personality while maintaining professionalism
4. DO customize content for the specific company and role`;

interface GenerateCoverLetterParams {
  resumeText: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  tone?: 'professional' | 'enthusiastic' | 'formal';
  format?: 'markdown' | 'latex';
}

/**
 * Generates a tailored cover letter using HuggingFace AI
 */
export async function generateCoverLetter({
  resumeText,
  jobTitle,
  companyName,
  jobDescription,
  tone = 'professional',
  format = 'markdown'
}: GenerateCoverLetterParams): Promise<string> {
  const client = getHfClient();
  
  const toneInstructions = {
    professional: 'Use a balanced, confident professional tone. Be personable but not overly casual.',
    enthusiastic: 'Show genuine excitement about the role while maintaining professionalism. Use energetic language.',
    formal: 'Use traditional formal business language. Be respectful and conservative in tone.'
  };

  const formatInstructions = format === 'latex' 
    ? `
OUTPUT FORMAT: Complete LaTeX document using \\documentclass{letter}

Include:
- Proper document structure with sender and recipient addresses
- Professional formatting with appropriate spacing
- Standard letter commands (\\opening, \\closing, \\signature)

Example structure:
\\documentclass{letter}
\\usepackage{geometry}
\\geometry{margin=1in}
\\signature{[Candidate Name from Resume]}
\\address{[Candidate Address from Resume]}
\\begin{document}
\\begin{letter}{Hiring Manager \\\\ ${companyName} \\\\ [Company Address]}
\\opening{Dear Hiring Manager,}
[Body paragraphs]
\\closing{Sincerely,}
\\end{letter}
\\end{document}
`
    : `
OUTPUT FORMAT: Clean Markdown

Structure:
# [Your Name]
[Contact Information]

[Date]

Hiring Manager
${companyName}
[Address if known]

Dear Hiring Manager,

[Opening paragraph]

[Body paragraph 1]

[Body paragraph 2]

[Closing paragraph]

Sincerely,
[Your Name]
`;

  const userPrompt = `
Generate a ${tone} cover letter for this job application:

**POSITION:** ${jobTitle}
**COMPANY:** ${companyName}

**JOB DESCRIPTION:**
${jobDescription.slice(0, 2000)}

**CANDIDATE'S RESUME:**
${resumeText.slice(0, 3000)}

**TONE GUIDANCE:**
${toneInstructions[tone]}

${formatInstructions}

**REQUIREMENTS:**
1. Extract candidate's name, email, phone from resume for header
2. Reference 2-3 specific achievements from the resume that match job requirements
3. Incorporate 5-7 keywords from job description naturally
4. Show knowledge of ${companyName} (mention their mission/products if inferable)
5. Include a clear call-to-action in closing
6. Keep total length to 250-400 words (excluding header/signature)
7. Use first person ("I", "my") throughout
8. Start with a strong opening that grabs attention

GENERATE THE COMPLETE COVER LETTER NOW:
`;

  try {
    logger.info('COVER_LETTER', 'Starting cover letter generation', {
      jobTitle,
      companyName,
      tone,
      format,
      resumeLength: resumeText.length,
      jdLength: jobDescription.length
    });

    let fullResponse = '';
    const startTime = Date.now();
    
    const stream = client.chatCompletionStream({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      parameters: {
        max_new_tokens: 2500,
        temperature: 0.7,
        top_p: 0.9,
      }
    });

    for await (const chunk of stream) {
      if (chunk.choices?.[0]?.delta?.content) {
        fullResponse += chunk.choices[0].delta.content;
      }
    }

    const duration = Date.now() - startTime;

    if (!fullResponse || fullResponse.length < 100) {
      throw new Error('Generated content too short or empty');
    }

    logger.info('COVER_LETTER', 'Cover letter generated successfully', {
      contentLength: fullResponse.length,
      duration,
      format,
      company: companyName
    });

    return fullResponse.trim();

  } catch (error) {
    logger.error('COVER_LETTER', 'Cover letter generation failed', { 
      error,
      jobTitle,
      companyName,
      format
    });
    
    throw new Error(
      error instanceof Error 
        ? `AI generation failed: ${error.message}` 
        : 'Failed to generate cover letter'
    );
  }
}

/**
 * Validates cover letter request parameters
 */
export function validateCoverLetterRequest(params: GenerateCoverLetterRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!params.resumeId?.trim()) {
    errors.push('Resume ID is required');
  }

  if (!params.jobTitle?.trim()) {
    errors.push('Job title is required');
  } else if (params.jobTitle.length > 255) {
    errors.push('Job title too long (max 255 characters)');
  }

  if (!params.companyName?.trim()) {
    errors.push('Company name is required');
  } else if (params.companyName.length > 255) {
    errors.push('Company name too long (max 255 characters)');
  }

  if (!params.jobDescription?.trim()) {
    errors.push('Job description is required');
  } else if (params.jobDescription.length < 50) {
    errors.push('Job description too short (minimum 50 characters)');
  }

  if (params.tone && !['professional', 'enthusiastic', 'formal'].includes(params.tone)) {
    errors.push('Invalid tone. Must be: professional, enthusiastic, or formal');
  }

  if (params.format && !['markdown', 'latex'].includes(params.format)) {
    errors.push('Invalid format. Must be: markdown or latex');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
