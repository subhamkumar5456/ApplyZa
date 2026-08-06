// ─── Shared constants ─────────────────────────────────────────────────────────

/**
 * Packages that are either XeLaTeX-only or not available on the
 * texlive.net pdflatex service. The AI must never emit these.
 */
const FORBIDDEN_PACKAGES = [
  'fontspec',
  'fontawesome',
  'fontawesome5',
  'fontawesome5pro',
  'minted',
  'tcolorbox',
  'mdframed',
  'tikz',
  'pgf',
  'pgfplots',
  'biblatex',
  'biber',
  'luatexja',
  'polyglossia',
  'unicode-math',
  'mathspec',
  'realscripts',
  'microtype',   // can cause issues in some configurations
  'luacode',
  'lmodern',     // causes issues with 9pt
  'libertine',
  'palatino',
  'times',
  'helvet',
  'avant',
  'courier',
  'newcent',
  'charter',
  'mathpazo',
  'mathptmx',
] as const;

/**
 * Safe packages that are reliably available on texlive.net pdflatex.
 */
const SAFE_PACKAGES = [
  'geometry',
  'parskip',
  'enumitem',
  'titlesec',
  'array',
  'xcolor',
  'hyperref',
  'multicol',
  'tabularx',
  'booktabs',
  'setspace',
  'fancyhdr',
  'lastpage',
  'url',
  'graphicx',
  'amsmath',
  'amssymb',
  'ragged2e',
  'calc',
  'ifthen',
  'etoolbox',
] as const;

const FORBIDDEN_PACKAGES_BLOCK = `
<FORBIDDEN-PACKAGES>
NEVER use any of these packages — they are either XeLaTeX-only or unavailable on the pdflatex compiler:
${FORBIDDEN_PACKAGES.map(p => `  - ${p}`).join('\n')}
If you need icons, use plain Unicode characters or text symbols instead.
If you need custom fonts, DO NOT set a custom font at all — use the default Computer Modern or Latin Modern.
NEVER emit \\setmainfont, \\setsansfont, \\setmonofont — these are XeLaTeX commands that will crash pdflatex.
</FORBIDDEN-PACKAGES>

<SAFE-PACKAGES>
Only use packages from this approved list:
${SAFE_PACKAGES.map(p => `  - ${p}`).join('\n')}
</SAFE-PACKAGES>`;

const LATEX_STRUCTURAL_RULES = `
<LATEX-STRUCTURAL-RULES>
1. ALWAYS start with \\documentclass (the very first line of the document).
2. ALWAYS include \\begin{document} and \\end{document}.
3. NEVER use \\usepackage{inputenc} together with fontspec — pick one encoding approach only.
4. If you use \\href{}{}, you MUST include \\usepackage{hyperref} in the preamble.
5. If you use \\setlist, you MUST include \\usepackage{enumitem} in the preamble.
6. If you use \\titlespacing or \\titleformat, you MUST include \\usepackage{titlesec} in the preamble.
7. If you use tabularx, you MUST include \\usepackage{tabularx} in the preamble.
8. NEVER leave unmatched curly braces. Every { must have a matching }.
9. NEVER use \\& inside a tabular column definition — only inside cell content.
10. Special characters that MUST be escaped in LaTeX text: & → \\&, % → \\%, $ → \\$, # → \\#, _ → \\_, { → \\{, } → \\}.
11. NEVER use bare & outside of tabular/tabularx environments.
12. NEVER use \\\\ (double backslash line break) outside of tabular environments or the center environment unless inside a paragraph.
13. For email links use \\href{mailto:email}{email}, for URLs use \\href{https://...}{display text}.
14. Test every environment: every \\begin{X} must have \\end{X}.
</LATEX-STRUCTURAL-RULES>`;

// ─── Prompt builders ──────────────────────────────────────────────────────────

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
</ONE-PAGE-CONSTRAINT>` : `
<MULTI-PAGE-CONSTRAINT>
The resume may span multiple pages. Use comfortable spacing.
- Use \\documentclass[10pt,a4paper]{article}
- Set margins to 0.6in on all sides: \\usepackage[margin=0.6in]{geometry}
- Use \\linespread{1.0}
- Keep formatting clean and consistent across pages.
</MULTI-PAGE-CONSTRAINT>`;

  const prescribedPreamble = pageConstraint === 'one-page' ? `
<REQUIRED-PREAMBLE>
Your LaTeX document MUST start with EXACTLY this preamble (copy it verbatim, then add the \\begin{document} after):
\\documentclass[9pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.4in]{geometry}
\\usepackage{parskip}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,linkcolor=blue,urlcolor=blue,hidelinks}
\\setlength{\\parskip}{0pt}
\\setlength{\\parindent}{0pt}
\\linespread{0.9}
\\setlist[itemize]{noitemsep,topsep=0pt,partopsep=0pt,parsep=0pt,leftmargin=*}
\\setlist[enumerate]{noitemsep,topsep=0pt,partopsep=0pt,parsep=0pt,leftmargin=*}
\\titlespacing{\\section}{0pt}{4pt}{2pt}
\\titlespacing{\\subsection}{0pt}{3pt}{1pt}
</REQUIRED-PREAMBLE>` : `
<REQUIRED-PREAMBLE>
Your LaTeX document MUST start with EXACTLY this preamble (copy it verbatim, then add the \\begin{document} after):
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{parskip}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,linkcolor=blue,urlcolor=blue,hidelinks}
\\setlength{\\parskip}{2pt}
\\setlength{\\parindent}{0pt}
\\linespread{1.0}
\\setlist[itemize]{noitemsep,topsep=2pt,partopsep=0pt,parsep=0pt,leftmargin=*}
\\setlist[enumerate]{noitemsep,topsep=2pt,partopsep=0pt,parsep=0pt,leftmargin=*}
</REQUIRED-PREAMBLE>`;

  return `You are a professional resume writer, ATS optimization expert, and LaTeX engineer. Your task is to refine a candidate's resume and return a completely formatted, valid LaTeX document wrapped in JSON.
${FORBIDDEN_PACKAGES_BLOCK}
${LATEX_STRUCTURAL_RULES}

<RULES>
1. DO NOT change: education institutions, degrees, dates, company names, or job titles.
2. DO NOT fabricate new projects, roles, metrics, or achievements.
3. DO NOT remove any section or existing bullet point — you may only improve its phrasing.
4. Incorporate the provided suggestions and naturally weave in missing keywords where they factually apply based on the candidate's existing experience.
5. Create a modern, premium, clean, and ATS-friendly LaTeX resume. Use standard paragraph formatting and avoid rigid 'tabular' or 'tabularx' environments for long flowing text.
6. Output your response ONLY as a JSON object matching the exact schema below.
7. NEVER add extra blank lines, \\vspace, \\bigskip, \\medskip, or \\smallskip commands unless absolutely necessary.
8. CRITICAL — JSON ESCAPING: The LaTeX code goes inside a JSON string value. You MUST escape ALL backslashes as \\\\ (double backslash) and ALL double-quotes as \\". Newlines in the LaTeX must be written as \\n. Failure to do this will break JSON parsing.
</RULES>
${onePageRules}
${prescribedPreamble}

<SCHEMA>
{
  "refinedLatex": "<complete valid LaTeX document — ALL backslashes doubled as \\\\\\\\ inside this JSON string>",
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
  return `You are an expert Resume Writer and LaTeX Engineer using pdflatex. Your task is to generate a professional LaTeX resume based on the provided text.
${FORBIDDEN_PACKAGES_BLOCK}
${LATEX_STRUCTURAL_RULES}

<RULES>
1. Never fabricate experience, metrics, or skills.
2. Only format existing content, never invent new content.
3. Return ONLY pure LaTeX code — no markdown, no code fences, no explanation. Start with \\documentclass and end with \\end{document}.
4. Use a professional, clean, single-column design.
5. Use ONLY packages from the SAFE-PACKAGES list above.
6. The document must compile successfully with pdflatex on the first attempt.
</RULES>

<REQUIRED-PREAMBLE>
Your LaTeX document MUST start with EXACTLY this preamble (copy it verbatim):
\\documentclass[10pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{parskip}
\\usepackage{enumitem}
\\usepackage{titlesec}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\hypersetup{colorlinks=true,linkcolor=blue,urlcolor=blue,hidelinks}
\\definecolor{sectioncolor}{HTML}{2b2b2b}
\\titleformat{\\section}{\\large\\bfseries\\color{sectioncolor}}{}{0em}{}[\\titlerule]
\\titleformat{\\subsection}{\\normalsize\\bfseries}{}{0em}{}
\\titlespacing{\\section}{0pt}{6pt}{3pt}
\\titlespacing{\\subsection}{0pt}{4pt}{2pt}
\\setlength{\\parskip}{2pt}
\\setlength{\\parindent}{0pt}
\\setlist[itemize]{noitemsep,topsep=2pt,partopsep=0pt,parsep=0pt,leftmargin=*}
\\setlist[enumerate]{noitemsep,topsep=2pt,partopsep=0pt,parsep=0pt,leftmargin=*}
</REQUIRED-PREAMBLE>

<SECTION-FORMATTING-GUIDE>
Use \\section*{Section Name} for main sections (Skills, Education, Experience, Projects, etc.)
Use \\subsection*{Sub Title} for entries within sections (job titles, project names, etc.)
For dates and locations, use \\hfill to push content to the right on the same line.
For contact info in the header, use \\begin{center} with \\href{} links separated by $\\vert$.
</SECTION-FORMATTING-GUIDE>

<INPUT>
TARGET JOB TITLE: ${jobTitle}
TARGET COMPANY: ${company}

RESUME TEXT:
${resumeText}
</INPUT>

Output ONLY the raw LaTeX code starting with \\documentclass. No markdown. No code fences. No explanations.`;
}
