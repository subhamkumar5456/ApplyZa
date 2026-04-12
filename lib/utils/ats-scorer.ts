interface ATSScoreInput {
  resumeText: string
  jobDescription: string
}

interface KeywordAnalysis {
  found: string[]
  missing: string[]
  score: number
}

const COMMON_ATS_KEYWORDS = [
  'managed', 'developed', 'implemented', 'designed', 'led',
  'created', 'improved', 'reduced', 'increased', 'built',
  'delivered', 'achieved', 'collaborated', 'analyzed', 'optimized',
]

const FORMAT_PENALTIES = {
  too_short: -15,
  too_long: -10,
  no_bullet_points: -10,
  no_quantified_achievements: -15,
  missing_contact_info: -20,
  no_skills_section: -10,
}

export function extractKeywords(text: string): string[] {
  const cleaned = text.toLowerCase()
    .replace(/[^a-z0-9\s\-\+\#\.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const words = cleaned.split(' ')

  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'shall', 'can', 'need', 'dare',
    'ought', 'used', 'this', 'that', 'these', 'those', 'i', 'me', 'my',
    'myself', 'we', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him',
    'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'because', 'as', 'until', 'while',
    'about', 'between', 'through', 'during', 'before', 'after', 'above',
    'below', 'up', 'down', 'out', 'off', 'over', 'under', 'again',
    'then', 'once', 'here', 'there', 'also', 'etc', 'including',
  ])

  const keywords = words
    .filter(word => word.length > 2 && !stopWords.has(word))
    .filter((word, index, self) => self.indexOf(word) === index)

  return keywords
}

export function analyzeKeywords(resumeText: string, jobDescription: string): KeywordAnalysis {
  const jdKeywords = extractKeywords(jobDescription)
  const resumeKeywordsSet = new Set(extractKeywords(resumeText))

  const found: string[] = []
  const missing: string[] = []

  for (const keyword of jdKeywords) {
    if (resumeKeywordsSet.has(keyword)) {
      found.push(keyword)
    } else {
      missing.push(keyword)
    }
  }

  const score = jdKeywords.length > 0
    ? Math.round((found.length / jdKeywords.length) * 100)
    : 0

  return { found, missing, score }
}

export function calculateFormatScore(resumeText: string): number {
  let score = 100

  const wordCount = resumeText.split(/\s+/).length

  if (wordCount < 150) {
    score += FORMAT_PENALTIES.too_short
  }
  if (wordCount > 2000) {
    score += FORMAT_PENALTIES.too_long
  }

  const hasBulletPoints = /[•\-\*]\s/.test(resumeText)
  if (!hasBulletPoints) {
    score += FORMAT_PENALTIES.no_bullet_points
  }

  const hasNumbers = /\d+[\%\+]|\$[\d,]+|\d+x/.test(resumeText)
  if (!hasNumbers) {
    score += FORMAT_PENALTIES.no_quantified_achievements
  }

  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(resumeText)
  const hasPhone = /[\d\(\)\-\+\s]{10,}/.test(resumeText)
  if (!hasEmail && !hasPhone) {
    score += FORMAT_PENALTIES.missing_contact_info
  }

  const hasSkillsSection = /skills|technologies|technical|proficiencies/i.test(resumeText)
  if (!hasSkillsSection) {
    score += FORMAT_PENALTIES.no_skills_section
  }

  return Math.max(0, Math.min(100, score))
}

export function calculateATSScore(input: ATSScoreInput): {
  overall: number
  keyword_match: number
  format_score: number
} {
  const keywordAnalysis = analyzeKeywords(input.resumeText, input.jobDescription)
  const formatScore = calculateFormatScore(input.resumeText)

  const overall = Math.round(
    keywordAnalysis.score * 0.55 +
    formatScore * 0.45
  )

  return {
    overall,
    keyword_match: keywordAnalysis.score,
    format_score: formatScore,
  }
}
