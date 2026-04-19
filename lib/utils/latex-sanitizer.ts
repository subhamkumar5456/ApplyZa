// ============================================================
// LaTeX Input Sanitizer
// Runs server-side before forwarding to the compile API.
// Strips dangerous commands that could be used for:
//   - Shell escape / code execution
//   - Path traversal / file reads
//   - Arbitrary writes to the filesystem
// ============================================================

/** Maximum allowed LaTeX content length (characters) */
export const MAX_LATEX_LENGTH = 50_000

/** Patterns that are unconditionally stripped from LaTeX input */
const DANGEROUS_PATTERNS: RegExp[] = [
  // Shell escape
  /\\write18\s*\{[^}]*\}/gi,
  /\\immediate\s*\\write18\s*\{[^}]*\}/gi,
  /\\ShellEscape\s*\{[^}]*\}/gi,
  /--(shell-escape|enable-write18|enable-pipes)/gi,

  // Arbitrary file input that traverses paths
  /\\input\s*\{[^}]*\.\.[^}]*\}/gi,
  /\\include\s*\{[^}]*\.\.[^}]*\}/gi,

  // File writes and opens
  /\\openout\s+\S+\s*=\s*\S+/gi,
  /\\closeout\s+\S+/gi,
  /\\newwrite\s*\\\w+/gi,
  /\\immediate\s*\\openout/gi,
  /\\immediate\s*\\closeout/gi,

  // URL / external resource fetching (some packages)
  /\\url\s*\{[^}]*file:\/\//gi,
  /\\href\s*\{file:\/\//gi,
]

export interface SanitizeResult {
  safe: boolean
  content: string
  /** Detected violation reason, if any */
  reason?: string
}

/**
 * Sanitises a LaTeX string before compilation.
 * Returns { safe: false, reason } if the input is rejected outright,
 * or { safe: true, content } with dangerous snippets stripped.
 */
export function sanitizeLatex(input: string): SanitizeResult {
  if (typeof input !== 'string') {
    return { safe: false, content: '', reason: 'Input must be a string' }
  }

  if (input.length > MAX_LATEX_LENGTH) {
    return {
      safe: false,
      content: '',
      reason: `Input exceeds maximum length of ${MAX_LATEX_LENGTH} characters`,
    }
  }

  // Hard-fail if shell-escape is attempted in any form
  if (/\\write18|ShellEscape|shell-escape|enable-write18/i.test(input)) {
    return {
      safe: false,
      content: '',
      reason: 'Detected forbidden shell escape command',
    }
  }

  let sanitized = input
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  return { safe: true, content: sanitized }
}
