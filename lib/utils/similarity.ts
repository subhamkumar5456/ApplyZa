export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)

  if (magnitude === 0) return 0

  return dotProduct / magnitude
}

export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)))
  const union = new Set([...setA, ...setB])

  if (union.size === 0) return 0

  return intersection.size / union.size
}

export function textSimilarity(textA: string, textB: string): number {
  const wordsA = new Set(textA.toLowerCase().split(/\s+/).filter(w => w.length > 2))
  const wordsB = new Set(textB.toLowerCase().split(/\s+/).filter(w => w.length > 2))

  return jaccardSimilarity(wordsA, wordsB)
}

export function normalizeScore(score: number, min: number = 0, max: number = 1): number {
  return Math.round(((score - min) / (max - min)) * 100)
}
