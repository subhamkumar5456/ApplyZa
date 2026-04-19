import { GoogleGenAI } from '@google/genai'

// ── Multi-key rotation ────────────────────────────────────────
// Reads GEMINI_API_KEY_1, GEMINI_API_KEY_2 … GEMINI_API_KEY_N
// and falls back to the legacy GEMINI_API_KEY if none are found.
function loadApiKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  // Fallback: legacy single-key setup
  if (keys.length === 0 && process.env.GEMINI_API_KEY) {
    keys.push(process.env.GEMINI_API_KEY)
  }
  return keys
}

const API_KEYS = loadApiKeys()

if (API_KEYS.length === 0) {
  throw new Error(
    'Missing Gemini API key(s). Set GEMINI_API_KEY or GEMINI_API_KEY_1, GEMINI_API_KEY_2, … in .env.local',
  )
}

let currentKeyIndex = 0

/**
 * Returns a GoogleGenAI client for the current key, then rotates
 * to the next key so the next quota-exhausted call picks a fresh one.
 */
export function getGeminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] })
}

/**
 * Rotate to the next available API key.
 * Returns `true` if a new key is available, `false` if all keys are exhausted.
 */
export function rotateApiKey(): boolean {
  if (currentKeyIndex < API_KEYS.length - 1) {
    currentKeyIndex++
    console.warn(
      `[Gemini] API key ${currentKeyIndex}/${API_KEYS.length} quota hit — rotating to next key.`,
    )
    return true
  }
  return false
}

// Legacy single-client export kept for backward compatibility
export const gemini = new GoogleGenAI({ apiKey: API_KEYS[0] })
