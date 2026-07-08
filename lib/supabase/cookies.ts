export const SUPABASE_COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? '.gw1builds.com' : undefined

/**
 * Auth error codes meaning the refresh token is permanently revoked (e.g.
 * after a concurrent-refresh race trips Supabase's reuse detection). Unlike
 * rate limits or network errors, these can never succeed on retry — the only
 * recovery is deleting the session cookies and signing in again.
 */
export const DEAD_SESSION_CODES = new Set([
  'refresh_token_already_used',
  'refresh_token_not_found',
])

export function withSupabaseCookieDomain<T extends { domain?: string }>(
  options: T
): T {
  if (!SUPABASE_COOKIE_DOMAIN) return options
  return { ...options, domain: SUPABASE_COOKIE_DOMAIN }
}
