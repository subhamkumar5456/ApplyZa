import { HfInference } from '@huggingface/inference'
import { env } from '@/lib/env'

// ── Multi-key rotation ────────────────────────────────────────
// Reads HUGGINGFACE_API_KEY_1, HUGGINGFACE_API_KEY_2 … HUGGINGFACE_API_KEY_N
// and falls back to HUGGINGFACE_API_KEY if none are found.
function loadApiKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 10; i++) {
    const k = process.env[`HUGGINGFACE_API_KEY_${i}`]
    if (k) keys.push(k)
  }
  // Fallback: single-key setup
  if (env.HUGGINGFACE_API_KEY && !keys.includes(env.HUGGINGFACE_API_KEY)) {
    keys.push(env.HUGGINGFACE_API_KEY)
  }
  return keys
}

const API_KEYS = loadApiKeys()

if (API_KEYS.length === 0) {
  // We'll log a warning instead of throwing if we're in transition, 
  // but for the final version it should probably throw.
  console.warn(
    '[HuggingFace] Missing API key(s). Set HUGGINGFACE_API_KEY in .env.local',
  )
}

console.log(`[HuggingFace] Loaded ${API_KEYS.length} API key(s)`)

let currentKeyIndex = 0

/**
 * Returns a HuggingFace client for the current key.
 */
export function getHfClient(): HfInference {
  if (API_KEYS.length === 0) {
    throw new Error('No Hugging Face API keys available.')
  }
  return new HfInference(API_KEYS[currentKeyIndex])
}

/**
 * Rotate to the next available API key.
 * Returns `true` if a new key is available, `false` if all keys are exhausted.
 */
export function rotateHfApiKey(): boolean {
  if (currentKeyIndex < API_KEYS.length - 1) {
    currentKeyIndex++
    console.warn(
      `[HuggingFace] Rotating to key ${currentKeyIndex + 1}/${API_KEYS.length}`
    )
    return true
  }
  // Reset to first key
  console.warn('[HuggingFace] All keys exhausted, resetting to key 1')
  currentKeyIndex = 0
  return false
}

export const hf = API_KEYS.length > 0 ? new HfInference(API_KEYS[0]) : null

export function getCurrentHfKeyIndex(): number {
  return currentKeyIndex
}

export function getTotalHfKeys(): number {
  return API_KEYS.length
}
