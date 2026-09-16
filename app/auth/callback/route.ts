import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isValidEmailDomain } from '@/lib/utils/email-validator'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('redirect') || '/dashboard'

  if (code) {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.user) {
      // Validate against disposable/temporary email addresses
      if (data.user.email) {
        const validation = isValidEmailDomain(data.user.email)
        if (!validation.isValid) {
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent(validation.error || 'Disposable email addresses are not allowed.')}`
          )
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to login with an error message if code exchange failed
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Could not authenticate with Google')}`)
}
