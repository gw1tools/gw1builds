export const SUPABASE_COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? '.gw1builds.com' : undefined

export function withSupabaseCookieDomain<T extends { domain?: string }>(
  options: T
): T {
  if (!SUPABASE_COOKIE_DOMAIN) return options
  return { ...options, domain: SUPABASE_COOKIE_DOMAIN }
}
