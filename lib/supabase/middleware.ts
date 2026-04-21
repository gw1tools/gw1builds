import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? '.gw1builds.com' : undefined

/**
 * Refreshes the Supabase session on every request.
 * Cookie domain is set to .gw1builds.com in production for
 * cross-subdomain SSO with tactics.gw1builds.com.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
            })
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
