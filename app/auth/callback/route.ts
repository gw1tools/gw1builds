/**
 * @fileoverview OAuth callback handler for Google authentication
 * @module app/auth/callback/route
 *
 * Handles the OAuth redirect from Google after user consent.
 * Exchanges the authorization code for a session and creates
 * the user profile if this is their first login.
 *
 * @security
 * - Code exchange happens server-side (code never exposed to client)
 * - Session stored in HTTP-only cookies by Supabase
 * - Redirect URL validated against origin to prevent open redirect
 * - No sensitive data logged (emails, tokens, etc.)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Validates redirect path to prevent open redirect attacks.
 * Only allows paths that start with / and don't redirect to external sites.
 */
function getSafeRedirectPath(path: string | null): string {
  if (!path) return '/'

  // Decode to prevent encoded bypass attempts
  let decodedPath: string
  try {
    decodedPath = decodeURIComponent(path)
  } catch {
    return '/' // Invalid encoding
  }

  // Must start with single slash, not double (//evil.com)
  if (!decodedPath.startsWith('/') || decodedPath.startsWith('//')) {
    return '/'
  }

  // Block dangerous characters (including newlines that could bypass validation)
  if (
    decodedPath.includes('\\') ||
    decodedPath.includes('@') ||
    decodedPath.includes(':') ||
    decodedPath.includes('\n') ||
    decodedPath.includes('\r') ||
    decodedPath.includes('\t')
  ) {
    return '/'
  }

  return decodedPath
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const next = requestUrl.searchParams.get('next') || '/'

  // Handle OAuth errors (user denied, etc) - don't log description (may contain PII)
  if (error) {
    console.error('OAuth error:', { errorCode: error })
    const redirectUrl = new URL('/', requestUrl.origin)
    redirectUrl.searchParams.set('authError', error)
    return NextResponse.redirect(redirectUrl)
  }

  if (!code) {
    console.error('No authorization code received')
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  const supabase = await createClient()

  // Exchange authorization code for session
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    // Log error code only, not message (may contain sensitive data)
    console.error('Code exchange failed:', { errorCode: exchangeError.code })
    const redirectUrl = new URL('/', requestUrl.origin)
    redirectUrl.searchParams.set('authError', 'exchange_failed')
    return NextResponse.redirect(redirectUrl)
  }

  if (!data.user) {
    console.error('No user returned from code exchange')
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  // Check if user already has a profile in our users table
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, username')
    .eq('id', data.user.id)
    .single()

  // Create profile on first login (username = null, will be set in modal)
  // PGRST116 = "no rows returned" which means user doesn't exist yet
  if (!existingUser && fetchError?.code === 'PGRST116') {
    const { error: insertError } = await supabase.from('users').insert({
      id: data.user.id,
      google_id: data.user.user_metadata.sub || data.user.id,
      username: null,
      avatar_url: data.user.user_metadata.avatar_url || null,
    })

    if (insertError) {
      // Log error code only, not full message
      console.error('Failed to create user profile:', {
        userId: data.user.id,
        errorCode: insertError.code,
      })
      // Continue anyway - user can still use the app, profile will be created on retry
    } else {
      // Note: Using warn level as info is not allowed by linter
      console.warn('[AUDIT] New user profile created:', {
        userId: data.user.id,
      })
    }
  }

  // Validate next URL to prevent open redirect attacks
  const safeNext = getSafeRedirectPath(next)

  // Redirect with authSuccess param to trigger step 2 of modal
  const redirectUrl = new URL(safeNext, requestUrl.origin)
  redirectUrl.searchParams.set('authSuccess', 'true')
  return NextResponse.redirect(redirectUrl)
}
