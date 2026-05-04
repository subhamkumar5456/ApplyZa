export function buildAnalysisPrompt(resumeText: string, jobDescription: string, jobTitle: string, companyName: string = ''): string {
  return `You are an expert ATS (Applicant Tracking System) and Senior Technical Recruiter. Your task is to analyze a candidate's resume against a specific job description.

<RULES>
1. Never fabricate experience, metrics, or skills.
2. Only evaluate existing content, never invent new content.
3. Be highly critical and objective.
4. Output your response ONLY as a JSON object matching the exact schema below.
</RULES>

<SCHEMA>
{
  "ats_score": {
    "overall": number (0-100),
    "keyword_match": number (0-100),
    "format_score": number (0-100),
    "experience_relevance": number (0-100)
  },
  "summary": "String explaining the overall fit",
  "missing_keywords": ["keyword1", "keyword2"],
  "strengths": ["strength1", "strength2"],
  "improvements": [
    {
      "section": "String",
      "current": "String",
      "suggested": "String",
      "impact": "String",
      "reason": "String"
    }
  ],
  "keyword_density": {
    "found": ["keyword1", "keyword2"],
    "missing_critical": ["keyword3"],
    "missing_nice_to_have": ["keyword4"]
  }
}
</SCHEMA>

<INPUT>
JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

JOB DESCRIPTION:
${jobDescription}

RESUME TEXT:
${resumeText}
</INPUT>

Respond with the JSON object only. No markdown. No code fences.`;
}

export function buildRefinementPrompt(
  resumeText: string,
  suggestions: string[],
  jobTitle: string,
  companyName: string = '',
  missingKeywords: string[] = [],
  pageConstraint: 'one-page' | 'multi-page' = 'one-page',
): string {
  const onePageRules = pageConstraint === 'one-page' ? `
<ONE-PAGE-CONSTRAINT>
The original resume fits on ONE page. You MUST keep the output to exactly ONE page.
To achieve this:
- Use \\documentclass[9pt,a4paper]{article} — do NOT go above 10pt.
- Set margins to 0.4in on all sides: \\usepackage[margin=0.4in]{geometry}
- Set \\setlength{\\parskip}{0pt} and \\setlength{\\parindent}{0pt}
- Set \\linespread{0.9} (never above 1.0)
- For itemize: \\setlist[itemize]{noitemsep,topsep=0pt,partopsep=0pt,parsep=0pt,leftmargin=*}
- For section titles use \\titlespacing{\\section}{0pt}{4pt}{2pt} and \\titlespacing{\\subsection}{0pt}{3pt}{1pt}
- Do NOT insert blank lines (\\vspace, \\bigskip, \\medskip, \\smallskip) anywhere.
- Do NOT use \\\\[Xem] vertical spacers.
- Keep bullet points concise — trim wordy phrases, never remove the core meaning.
- Do NOT add any section that was not in the original resume.
</ONE-PAGE-CONSTRAINT>` : ``;

  const prescribedPreamble = pageConstraint === 'one-page' ? `
<REQUIRED-PREAMBLE>
Your LaTeX document MUST start with exactly this preamble (you may add extra packages after the geometry line but must not override the spacing packages):
\\documentclass[9pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.4in]{geometry}
\\usepackage{parskip}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\setlength{\\parskip}{0pt}
\\setlength{\\parindent}{0pt}
\\linespread{0.9}
\\setlist[itemize]{noitemsep,topsep=0pt,partopsep=0pt,parsep=0pt,leftmargin=*}
\\titlespacing{\\section}{0pt}{4pt}{2pt}
\\titlespacing{\\subsection}{0pt}{3pt}{1pt}
</REQUIRED-PREAMBLE>` : ``;

  return `You are a professional resume writer, ATS optimization expert, and LaTeX designer. Your task is to refine a candidate's resume and return a completely formatted, stunning LaTeX document.

<RULES>
1. DO NOT change: education institutions, degrees, dates, company names, or job titles.
2. DO NOT fabricate new projects, roles, metrics, or achievements.
3. DO NOT remove any section or existing bullet point — you may only improve its phrasing.
4. Incorporate the provided suggestions and naturally weave in missing keywords where they factually apply based on the candidate's existing experience.
5. Create a modern, premium, clean, and ATS-friendly LaTeX resume. Use standard paragraph formatting and avoid rigid 'tabular' or 'tabularx' environments for long flowing text.
6. Output your response ONLY as a JSON object matching the exact schema below.
7. NEVER add extra blank lines, \\vspace, \\bigskip, \\medskip, or \\smallskip commands unless absolutely necessary.
</RULES>
${onePageRules}
${prescribedPreamble}

<SCHEMA>
{
  "refinedLatex": "<complete valid LaTeX document>",
  "modifications": ["<specific change 1>", "<specific change 2>"]
}
</SCHEMA>

<INPUT>
TARGET JOB TITLE: ${jobTitle}
TARGET COMPANY: ${companyName}
MISSING KEYWORDS TO INCORPORATE: ${missingKeywords.join(', ')}

SUGGESTIONS TO APPLY:
${suggestions.join('\n')}

CURRENT RESUME TEXT:
${resumeText}
</INPUT>

Respond with the JSON object only. No markdown. No code fences.`;
}

export function buildLatexGenerationPrompt(resumeText: string, jobTitle: string, company: string): string {
  return `You are an expert Resume Writer and LaTeX Engineer. Your task is to generate a professional LaTeX resume based on the provided text.

<RULES>
1. Never fabricate experience, metrics, or skills.
2. Only format existing content, never invent new content.
3. Return pure LaTeX code that compiles correctly. Do NOT use markdown code fences.
4. Use a professional, clean, single-column design.
</RULES>

<INPUT>
TARGET JOB TITLE: ${jobTitle}
TARGET COMPANY: ${company}

RESUME TEXT:
${resumeText}
</INPUT>

Respond with the pure LaTeX code only. No markdown. No code fences.`;
}
