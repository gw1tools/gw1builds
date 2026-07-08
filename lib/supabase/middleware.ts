import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_COOKIE_DOMAIN, withSupabaseCookieDomain } from './cookies'

/**
 * Auth error codes meaning the refresh token is permanently revoked (e.g.
 * after a concurrent-refresh race trips Supabase's reuse detection). Unlike
 * rate limits or network errors, these can never succeed on retry.
 */
const DEAD_SESSION_CODES = new Set([
  'refresh_token_already_used',
  'refresh_token_not_found',
])

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
  try {
    const { error } = await supabase.auth.getUser()
    if (error?.code && DEAD_SESSION_CODES.has(error.code)) {
      return clearDeadSession(request)
    }
  } catch {
    // supabase-js can throw mid-refresh on a malformed cookie value; treat it
    // like a dead session so the device recovers instead of 500ing forever.
    return clearDeadSession(request)
  }

  return supabaseResponse
}

/**
 * Signs the device out by expiring every Supabase auth cookie. Without this,
 * a device holding a revoked refresh token retries it on every request
 * forever, hammering the Supabase auth rate limit. Cookies are expired under
 * both scopes they may live under — host and .gw1builds.com — mirroring
 * signOut() in auth-provider.tsx.
 */
function clearDeadSession(request: NextRequest): NextResponse {
  const authCookieNames = request.cookies
    .getAll()
    .filter(
      cookie =>
        cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')
    )
    .map(cookie => cookie.name)

  // Drop the dead cookies from the forwarded request too, so server
  // components rendering this request don't retry the revoked token.
  for (const name of authCookieNames) {
    request.cookies.delete(name)
  }
  const response = NextResponse.next({ request })

  // response.cookies keys Set-Cookie entries by name only, so expiring the
  // same cookie under two domains requires raw header appends.
  for (const name of authCookieNames) {
    const expired = `${name}=; Path=/; Max-Age=0`
    response.headers.append('set-cookie', expired)
    if (SUPABASE_COOKIE_DOMAIN) {
      response.headers.append(
        'set-cookie',
        `${expired}; Domain=${SUPABASE_COOKIE_DOMAIN}`
      )
    }
  }
  return response
}
