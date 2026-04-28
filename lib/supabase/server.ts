import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'
import { env } from '@/lib/env'

/**
 * Creates a Supabase client scoped to the current user session (anon key).
 * Uses cookies to read the auth session — suitable for auth checks in Server Components and Route Handlers.
 */
export function createServerSupabaseClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handle cookie setting in read-only contexts
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Handle cookie removal in read-only contexts
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client using the service role key.
 * Bypasses Row-Level Security — use only in trusted server-side code.
 * Does NOT require cookies or a user session.
 */
export function createServiceRoleClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const key = env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      '[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    )
  }

  return createClient<Database>(url, key, {
    auth: {
      // Service role clients should never persist sessions or auto-refresh tokens
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
