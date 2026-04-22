export const DEFAULT_LATEX_TEMPLATE = `\\documentclass[9pt,a4paper]{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=0.35in]{geometry}
\\usepackage{parskip}
\\usepackage{enumitem}
\\usepackage{array}
\\usepackage{xcolor}
\\usepackage{hyperref}
\\hypersetup{
    colorlinks=true,
    linkcolor=blue,
    filecolor=magenta,      
    urlcolor=blue,
}

% Custom colors
\\definecolor{primary}{HTML}{2b2b2b}
\\definecolor{secondary}{HTML}{414141}

% Compact section formatting
\\usepackage{titlesec}
\\titleformat{\\section}
  {\\small\\bfseries\\color{primary}}
  {}
  {0em}
  {}[\\titlerule]

\\titleformat{\\subsection}
  {\\small\\bfseries\\color{secondary}}
  {}
  {0em}
  {}

% Ultra-compact spacing
\\setlist[itemize]{noitemsep, topsep=0pt, leftmargin=*, partopsep=0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\parindent}{0pt}
\\linespread{0.9}

\\begin{document}

\\begin{center}
    {\\Large\\bfseries Subham Kumar}\\\\[0.1em]
    \\href{mailto:subhamkumar5456@gmail.com}{subhamkumar5456@gmail.com} $\\vert$ 
    +91 6299102243 $\\vert$ 
    \\href{https://github.com/subhamkumar5456}{github.com/subhamkumar5456}
\\end{center}

\\section*{Professional Summary}
Results-driven Computer Science undergraduate proficient in Python, C++ and SQL. Engineered and optimized software solutions with a focus on performance and reliability, improving processing efficiency in team-based environments. Adept at problem-solving and debugging, with strong collaboration skills and a passion for learning and applying emerging technologies.

\\section*{Projects}
\\subsection*{Voice Assistant using Python}
\\begin{itemize}
    \\item Developed a voice-controlled assistant with Python and speech recognition libraries, enabling users to execute system commands via voice input.
    \\item Automated routine tasks (e.g., launching apps, playing audio), reducing manual effort and increasing productivity.
\\end{itemize}

\\subsection*{SQL Database Management System}
\\begin{itemize}
    \\item Engineered a relational database schema and implemented SQL joins, indexes, and stored procedures to support efficient data storage and retrieval.
    \\item Optimized query performance by up to 40\\%, ensuring faster data access and scalability.
\\end{itemize}

\\subsection*{BookNexus – Full-Stack Book Marketplace Application (Team Project)}
\\begin{itemize} 
  \\item Collaborated with a team of 3 members to develop a complete web application using React, Node.js, and MongoDB where users can buy books, rent them weekly/monthly, or exchange books 
  with others.
  \\item Contributed to building user authentication system, admin panel for managing books and orders, user dashboard, and responsive UI design; worked on frontend development using React/Next.js and integrated REST APIs to connect with backend.
  \\item  Implemented search and filter functionality, designed database schema with 5 collections, and assisted in payment integration; deployed the full-stack application online using MongoDB Atlas 
  for database hosting.
\\end{itemize}

\\section*{Skills}
\\begin{tabular}{@{}ll@{}}
    \\textbf{Languages:} & Python, C++, SQL, Javascript \\\\
    \\textbf{Tools:} & Git, GitHub, VS Code, MySQL, HTML5, CSS,Javascript \\\\
    \\textbf{Concepts:} & Data Structures, Algorithms, OOP, STL, Query Optimization, API Handling \\\\
    \\textbf{Soft Skills:} & Adaptability, Leadership, Critical Thinking, Team Management \\\\
\\end{tabular}

\\section*{Education}
\\subsection*{B.Tech in Computer Science \\& Engineering}
\\textit{Lakshmi Narain College of Technology and Science}\\\\
CGPA: 7.42 \\hfill Bhopal, Madhya Pradesh\\\\
2022--Present

\\subsection*{Senior Secondary (12th Grade)}
\\textit{Oxford Public School}\\\\
Percentage: 64.4\\% \\hfill Ranchi, Jharkhand\\\\
2022

\\subsection*{Secondary (10th Grade)}
\\textit{Oxford Public School}\\\\
Percentage: 83.2\\% \\hfill Ranchi, Jharkhand\\\\
2020

\\section*{Certifications}
\\begin{itemize}
    \\item Foundations of Cybersecurity - Google via Coursera
    \\item Python Essentials 1 - Cisco Networking Academy
    \\item Python Essentials 2 - Cisco Networking Academy
    \\item Introduction to Cybersecurity - Cisco Networking Academy
    \\item CCNA: Introduction to Networks - Cisco Networking Academy
    \\item CCNA: Switching, Routing, and Wireless Essentials - Cisco Networking Academy
    \\item CCNA: Enterprise Networking, Security, and Automation - Cisco Networking Academy
\\end{itemize}

\\section*{Extracurricular \\& Achievements}
\\begin{itemize}
    \\item Active participant in national-level hackathons and coding contests
    \\item Presented tech solutions at inter-college project showcases
\\end{itemize}

\\end{document}`;

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
