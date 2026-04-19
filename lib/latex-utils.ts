export const DEFAULT_LATEX_TEMPLATE = `\\documentclass[a4paper,10pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{a4paper, margin=1in}

\\begin{document}

\\title{My Professional Resume}
\\author{John Doe}
\\date{\\today}
\\maketitle

\\section{Education}
\\textbf{University of Excellence} \\hfill 2018 -- 2022 \\\\
B.S. in Computer Science

\\section{Experience}
\\textbf{Tech Innovators Inc.} -- Software Engineer \\hfill 2022 -- Present \\\\
- Developed robust web applications. \\\\
- Improved system performance by 30\\%.

\\end{document}
`;

export const cleanLatexContent = (content: string): string => {
  let cleaned = content.trim();
  
  // Remove markdown code fences
  cleaned = cleaned.replace(/^```latex\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/i, '');
  cleaned = cleaned.replace(/```\s*$/g, '');
  
  // Remove markdown bold/italic
  cleaned = cleaned.replace(/^\*\*.*?\*\*:?\s*/gm, '');
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  
  // Remove any leading prose/instructions
  const docStart = cleaned.indexOf('\\documentclass');
  if (docStart > 0) {
    cleaned = cleaned.substring(docStart);
  }
  
  return cleaned.trim();
};

export const validateLatex = (content: string): { valid: boolean; error?: string } => {
  if (!content.trim()) {
    return { valid: false, error: 'LaTeX content is empty' };
  }
  
  if (!content.includes('\\documentclass')) {
    return { valid: false, error: 'Missing \\documentclass command' };
  }
  
  if (!content.includes('\\begin{document}') || !content.includes('\\end{document}')) {
    return { valid: false, error: 'Missing \\begin{document} or \\end{document}' };
  }
  
  return { valid: true };
};
