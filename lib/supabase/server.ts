import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { withSupabaseCookieDomain } from './cookies'

/**
 * Creates a Supabase client for server-side operations.
 * Uses the publishable key and handles user session cookies.
 * This client respects Row Level Security (RLS) policies.
 *
 * Cookie domain is set to .gw1builds.com in production for
 * cross-subdomain SSO with tactics.gw1builds.com.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, withSupabaseCookieDomain(options))
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates a Supabase client with admin/service role privileges.
 *
 * CRITICAL SECURITY NOTES:
 * - This client BYPASSES all Row Level Security (RLS) policies
 * - Only use for server-side operations that MUST bypass RLS
 * - NEVER expose this client or its responses directly to the client
 * - Examples: admin reports, data migrations, system-level operations
 *
 * For normal authenticated operations, use createClient() instead.
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    }
  )
}
