import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { withSupabaseCookieDomain } from './cookies'

/**
 * Refreshes the Supabase session on every request.
 * Cookie domain is set to .gw1builds.com in production for
 * cross-subdomain SSO with tactics.gw1builds.com.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Skip the session refresh for requests with no Supabase auth cookie
  // (anonymous visitors and crawlers). There is no session to refresh, so this
  // avoids a Supabase round-trip on every cached public page hit — which is
  // the bulk of the edge traffic. Signed-in users always carry the cookie and
  // are unaffected.
  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      cookie =>
        cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    )
  if (!hasAuthCookie) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(
              name,
              value,
              withSupabaseCookieDomain(options)
            )
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // IMPORTANT: Always use getUser() to validate the auth token
  // Never trust getSession() inside server code
  await supabase.auth.getUser()

  return supabaseResponse
}
