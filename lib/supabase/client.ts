import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { SUPABASE_COOKIE_DOMAIN } from './cookies'

let client: SupabaseClient | undefined

/**
 * Get or create a singleton Supabase browser client
 * This ensures the same client instance is used across all components.
 *
 * Cookie domain is set to .gw1builds.com in production so client-side
 * token refreshes stay consistent with server-scoped session cookies
 * and survive navigation between gw1builds.com and tactics.gw1builds.com.
 */
export function createClient() {
  if (client) {
    return client
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    SUPABASE_COOKIE_DOMAIN
      ? { cookieOptions: { domain: SUPABASE_COOKIE_DOMAIN } }
      : undefined
  )

  return client
}
