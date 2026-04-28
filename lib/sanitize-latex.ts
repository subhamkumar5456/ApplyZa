import { CompilationError } from './errors';

const DANGEROUS_PATTERNS: RegExp[] = [
  // TeX hex char bypass sequences (\^^XX patterns)
  /\\\^\^[0-9a-fA-F]{2}/g,
  
  // Shell escape and execution
  /\\write18\b/g,
  /\\immediate\b/g,
  
  // File operations and external inputs
  /\\input\s*\{[^}]*\}/g,
  /\\input\s*\|/g, // pipe inputs
  /\\openin\b/g,
  /\\openout\b/g,
  /\\read\b/g,
  /\\write\b/g,
  /\\newwrite\b/g,
  /\\newread\b/g,
  
  // Low-level TeX operations that can be abused
  /\\catcode\b/g,
  /\\@@input\b/g,
  /\\csname[\s\S]*?\\endcsname/g,
  
  // Includes and verbatim
  /\\include\s*\{[^}]*\}/g,
  /\\verbatiminput\b/g,
  
  // LuaTeX execution
  /\\directlua\b/g,
  /\\latelua\b/g,
  /\\luaexec\b/g,
  
  // URL fetching local files
  /\\url\s*\{[^}]*file:\/\/[^}]*\}/gi,
  
  // Dangerous packages
  /\\usepackage(\[[^\]]*\])?\s*\{[^}]*(shellesc|os|pdftexcmds)[^}]*\}/g,
];

export function sanitizeLatex(code: string): string {
  if (code.length > 50000) {
    throw new CompilationError('Document exceeds 50,000 characters');
  }

  let sanitized = code;
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '%BLOCKED_COMMAND');
  }

  return sanitized;
}
