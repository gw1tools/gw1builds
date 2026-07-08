import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  DEAD_SESSION_CODES,
  SUPABASE_COOKIE_DOMAIN,
  withSupabaseCookieDomain,
} from './cookies'

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
  // Never clear cookies on /auth/* : the callback route writes the fresh
  // session cookies, and an expiry header for the same cookie name in the
  // same response could clobber them.
  const isAuthRoute = request.nextUrl.pathname.startsWith('/auth/')

  try {
    const { error } = await supabase.auth.getUser()
    if (!isAuthRoute && error?.code && DEAD_SESSION_CODES.has(error.code)) {
      return clearDeadSession(request)
    }
  } catch {
    // supabase-js can throw mid-refresh on a malformed cookie value; treat it
    // like a dead session so the device recovers instead of 500ing forever.
    if (!isAuthRoute) {
      return clearDeadSession(request)
    }
  }

  return supabaseResponse
}

/**
 * Signs the device out by expiring its Supabase session cookies. Without
 * this, a device holding a revoked refresh token retries it on every request
 * forever, hammering the Supabase auth rate limit.
 *
 * Next.js keys middleware Set-Cookie headers by cookie name, so only one
 * expiry per name survives per response — we expire the .gw1builds.com scope
 * (where the client and middleware write session cookies in production).
 * Legacy host-scoped cookies are cleared client-side by AuthProvider, which
 * can hit every scope via document.cookie.
 */
function clearDeadSession(request: NextRequest): NextResponse {
  const authCookieNames = request.cookies
    .getAll()
    .filter(
      cookie =>
        cookie.name.startsWith('sb-') &&
        cookie.name.includes('-auth-token') &&
        // Keep the PKCE verifier so an in-flight OAuth sign-in can complete.
        !cookie.name.includes('code-verifier')
    )
    .map(cookie => cookie.name)

  // Drop the dead cookies from the forwarded request too, so server
  // components rendering this request don't retry the revoked token.
  for (const name of authCookieNames) {
    request.cookies.delete(name)
  }
  const response = NextResponse.next({ request })

  for (const name of authCookieNames) {
    const expired = `${name}=; Path=/; Max-Age=0`
    response.headers.append(
      'set-cookie',
      SUPABASE_COOKIE_DOMAIN
        ? `${expired}; Domain=${SUPABASE_COOKIE_DOMAIN}`
        : expired
    )
  }
  return response
}
