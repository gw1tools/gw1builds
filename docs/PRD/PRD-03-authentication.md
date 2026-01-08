# PRD-03: Authentication

## Overview

Implement Google OAuth authentication using Supabase Auth. Users need to be logged in to create and edit builds.

### AI Context

This PRD implements the authentication layer. Key architectural decisions:

1. **OAuth-only** - No password storage, Google handles identity
2. **Server-side session** - Cookies managed by Supabase SSR helpers
3. **Middleware protection** - Protected routes checked at edge
4. **Client context** - React context provides auth state to components

**Security documentation pattern:**
- File headers explain security context and attack surface
- JSDoc includes `@security` tags for sensitive operations
- Comments explain WHY security decisions were made
- Flow diagrams in comments for multi-step processes

**Auth flow diagram:**
```
User clicks "Sign In"
    ↓
signInWithGoogle() → Google OAuth consent screen
    ↓
Google redirects to /auth/callback?code=xxx
    ↓
exchangeCodeForSession(code) → Session cookie set
    ↓
Create/update user profile in database
    ↓
Redirect to original destination
```

## Dependencies

- PRD-00 completed
- PRD-01 completed

## Outcomes

- [ ] Google OAuth configured in Supabase
- [ ] Login/logout flow works
- [ ] User session persists across refreshes
- [ ] Auth state available throughout app
- [ ] User profile created on first login
- [ ] Protected routes redirect to login

---

## Tasks

### Task 3.1: Configure Google OAuth in Supabase

**In Supabase Dashboard:**

1. Go to Authentication → Providers
2. Enable Google provider
3. Get OAuth credentials from Google Cloud Console:
   - Go to https://console.cloud.google.com
   - Create new project or select existing
   - Go to APIs & Services → Credentials
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `https://YOUR_SUPABASE_URL/auth/v1/callback`
4. Copy Client ID and Client Secret to Supabase

**Acceptance Criteria:**
- [ ] Google provider enabled in Supabase
- [ ] OAuth credentials configured
- [ ] Redirect URI set correctly

---

### Task 3.2: Create Auth Callback Route

**Create `app/auth/callback/route.ts`:**

```typescript
/**
 * @fileoverview OAuth callback handler for Google authentication
 * @module app/auth/callback/route
 * 
 * This route handles the OAuth redirect from Google after user consent.
 * It exchanges the authorization code for a session and creates the
 * user profile if this is their first login.
 * 
 * @security
 * - Code exchange happens server-side (code never exposed to client)
 * - Session stored in HTTP-only cookies by Supabase
 * - Redirect URL validated against origin to prevent open redirect
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Handles OAuth callback from Google
 * 
 * Flow:
 * 1. Extract authorization code from query params
 * 2. Exchange code for session (sets cookies)
 * 3. Create user profile if first login
 * 4. Redirect to original destination
 * 
 * @security Uses origin-relative redirect to prevent open redirect attacks
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const supabase = await createClient()
    
    // Exchange authorization code for session
    // This sets HTTP-only session cookies automatically
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.user) {
      // Check if user already has a profile in our users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      // Create profile on first login
      // Uses Google metadata for initial values
      if (!existingUser) {
        await supabase.from('users').insert({
          id: data.user.id,
          google_id: data.user.user_metadata.sub || data.user.id,
          email: data.user.email!,
          display_name: data.user.user_metadata.full_name || data.user.email!.split('@')[0],
          avatar_url: data.user.user_metadata.avatar_url || null,
        })
      }
    }
  }

  // Redirect to original destination (relative to origin for security)
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
```

**Acceptance Criteria:**
- [ ] Callback exchanges code for session
- [ ] User profile created on first login
- [ ] Redirects to original destination

---

### Task 3.3: Create Auth Context Provider

**Create `components/providers/auth-provider.tsx`:**

```typescript
/**
 * @fileoverview Authentication context provider for client components
 * @module components/providers/auth-provider
 * 
 * Provides auth state (user, session, profile) to the entire app via
 * React Context. Handles session initialization, auth state changes,
 * and provides signIn/signOut methods.
 * 
 * Must wrap the app in the root layout to work.
 * 
 * @security
 * - Uses Supabase client-side auth (anon key is safe to expose)
 * - Session tokens stored in HTTP-only cookies (not accessible to JS)
 * - Profile data fetched from database (not trusted from JWT)
 */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session } from '@supabase/supabase-js'
import type { User as DbUser } from '@/types'

/**
 * Auth context value shape
 * 
 * @property user - Supabase auth user (from JWT)
 * @property profile - Our database user record (trusted source)
 * @property session - Current session with tokens
 * @property loading - True while checking initial auth state
 */
interface AuthContextType {
  /** Supabase auth user object */
  user: User | null
  /** User profile from our database */
  profile: DbUser | null
  /** Current session (contains access/refresh tokens) */
  session: Session | null
  /** True while initial auth check in progress */
  loading: boolean
  /** Initiates Google OAuth flow */
  signInWithGoogle: (redirectTo?: string) => Promise<void>
  /** Signs out and clears session */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Provides authentication state to the component tree
 * 
 * Initializes by checking for existing session, then subscribes
 * to auth state changes for the lifetime of the app.
 * 
 * @example
 * // In app/layout.tsx
 * <AuthProvider>
 *   {children}
 * </AuthProvider>
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<DbUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    // Initialize: Check for existing session on mount
    // This handles page refreshes and returning users
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // Subscribe to auth state changes (login, logout, token refresh)
    // This keeps UI in sync across tabs and handles token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(data)
  }

  async function signInWithGoogle(redirectTo?: string) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${redirectTo || '/'}`,
      },
    })
    
    if (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to access authentication state and methods
 * 
 * Must be used within an AuthProvider. Provides user, profile,
 * loading state, and signIn/signOut methods.
 * 
 * @throws {Error} If used outside of AuthProvider
 * 
 * @example
 * function MyComponent() {
 *   const { user, profile, signOut } = useAuth()
 *   if (!user) return <LoginPrompt />
 *   return <div>Welcome, {profile?.display_name}</div>
 * }
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

**Update `app/layout.tsx`:**

```typescript
import { AuthProvider } from '@/components/providers/auth-provider'
import { QueryProvider } from '@/components/providers/query-provider'
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster position="bottom-right" theme="dark" />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

**Acceptance Criteria:**
- [ ] Auth context provides user/profile
- [ ] signInWithGoogle initiates OAuth
- [ ] signOut clears session
- [ ] Auth state updates across app

---

### Task 3.4: Create Login Page

**Create `app/(auth)/login/page.tsx`:**

```typescript
/**
 * @fileoverview Login page with Google OAuth
 * @module app/(auth)/login/page
 * 
 * Simple login page with Google sign-in button. Redirects authenticated
 * users to their intended destination (from ?redirect param).
 * 
 * Uses (auth) route group which has no header/footer.
 */
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

/**
 * Login page component
 * 
 * Handles:
 * - Redirect if already logged in
 * - Google OAuth initiation
 * - Loading states
 */
export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'

  useEffect(() => {
    if (!loading && user) {
      router.push(redirectTo)
    }
  }, [user, loading, redirectTo, router])

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle(redirectTo)
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-gold rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-bg-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Sign in to GW1 Builds
          </h1>
          <p className="text-text-secondary">
            Create and share Guild Wars 1 builds
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="text-center text-text-muted text-sm mt-6">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Login page displays
- [ ] Google button initiates OAuth
- [ ] Redirects after successful login
- [ ] Handles redirect parameter

---

### Task 3.5: Update Header with Auth State

**Update `components/layout/header.tsx`:**

```typescript
/**
 * @fileoverview Site header with navigation and auth state
 * @module components/layout/header
 * 
 * Displays logo, navigation, and auth-dependent UI (sign in button
 * or user avatar dropdown). Sticky positioned at top of viewport.
 */
'use client'

import Link from 'next/link'
import { useAuth } from '@/components/providers/auth-provider'
import { LogOut, User } from 'lucide-react'

/**
 * Site header component
 * 
 * Shows different UI based on auth state:
 * - Loading: Skeleton placeholder
 * - Logged out: "Sign In" button
 * - Logged in: "New Build" button + avatar dropdown
 */
export function Header() {
  const { user, profile, loading, signOut } = useAuth()

  return (
    <header className="border-b border-border bg-bg-secondary sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-accent-gold">
          <div className="w-6 h-6 bg-accent-gold rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-bg-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          GW1<span className="text-text-muted font-medium">Builds</span>
        </Link>
        
        <nav className="flex items-center gap-2">
          <Link 
            href="/" 
            className="text-sm text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors"
          >
            Browse
          </Link>

          {loading ? (
            <div className="w-20 h-8 bg-bg-card rounded-lg animate-pulse" />
          ) : user ? (
            <>
              <Link
                href="/new"
                className="text-sm font-medium px-3 py-1.5 bg-accent-gold text-bg-primary rounded-lg hover:bg-accent-gold-bright transition-colors"
              >
                + New Build
              </Link>

              <div className="relative group">
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-bg-hover transition-colors">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="w-7 h-7 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
                      <User className="w-4 h-4 text-text-muted" />
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="p-3 border-b border-border">
                    <div className="font-medium text-text-primary truncate">
                      {profile?.display_name}
                    </div>
                    <div className="text-xs text-text-muted truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="p-1">
                    <Link
                      href={`/u/${profile?.display_name}`}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Builds
                    </Link>
                    <button
                      onClick={() => signOut()}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-md transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-3 py-1.5 bg-accent-gold text-bg-primary rounded-lg hover:bg-accent-gold-bright transition-colors"
            >
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
```

**Acceptance Criteria:**
- [ ] Shows Sign In when logged out
- [ ] Shows avatar/dropdown when logged in
- [ ] Dropdown has profile link and sign out
- [ ] Loading state while checking auth

---

### Task 3.6: Create Auth Middleware

**Create `middleware.ts`:**

```typescript
/**
 * @fileoverview Edge middleware for auth protection and session refresh
 * @module middleware
 * 
 * Runs on the edge before every request (except static files).
 * Two responsibilities:
 * 1. Refresh session cookies (prevents expiry during active use)
 * 2. Protect routes that require authentication
 * 
 * @security
 * - Runs at edge, before request reaches app
 * - Cannot be bypassed by client-side navigation
 * - Uses pattern matching for protected routes
 * 
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/** Routes that require authentication (supports * wildcard) */
const protectedRoutes = ['/new', '/b/*/edit']

/**
 * Edge middleware function
 * 
 * Flow:
 * 1. Create Supabase client with cookie access
 * 2. Get current session (also refreshes if needed)
 * 3. Check if route is protected
 * 4. Redirect to login if protected + no session
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // getSession() also refreshes the session if needed
  // This keeps users logged in during active use
  const { data: { session } } = await supabase.auth.getSession()

  // Check if current route requires authentication
  // Converts wildcard patterns to regex (e.g., /b/*/edit → /b/[^/]+/edit)
  const isProtected = protectedRoutes.some(route => {
    const pattern = new RegExp(`^${route.replace('*', '[^/]+')}$`)
    return pattern.test(request.nextUrl.pathname)
  })

  // Redirect unauthenticated users to login
  // Preserves original destination for post-login redirect
  if (isProtected && !session) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Acceptance Criteria:**
- [ ] Unauthenticated users redirected from /new
- [ ] Unauthenticated users redirected from /b/*/edit
- [ ] Redirect includes original destination
- [ ] Public routes unaffected

---

### Task 3.7: Create useRequireAuth Hook

**Create `hooks/use-require-auth.ts`:**

```typescript
/**
 * @fileoverview Hook for client-side auth protection
 * @module hooks/use-require-auth
 * 
 * Use this hook in client components that require authentication.
 * Redirects to login if user is not authenticated.
 * 
 * Note: Prefer middleware for route protection. This hook is for
 * cases where you need client-side protection (e.g., dynamic routes
 * that can't be matched by middleware patterns).
 */
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'

/**
 * Requires authentication for a client component
 * 
 * Redirects to login page if user is not authenticated.
 * Includes current path in redirect URL for post-login navigation.
 * 
 * @param redirectTo - Login page path (default: '/login')
 * @returns Auth state for conditional rendering
 * 
 * @example
 * function ProtectedPage() {
 *   const { user, loading, isAuthenticated } = useRequireAuth()
 *   
 *   if (loading) return <Spinner />
 *   if (!isAuthenticated) return null // Redirecting...
 *   
 *   return <div>Protected content for {user.email}</div>
 * }
 */
export function useRequireAuth(redirectTo = '/login') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`${redirectTo}?redirect=${window.location.pathname}`)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading, isAuthenticated: !!user }
}
```

**Acceptance Criteria:**
- [ ] Hook redirects if not authenticated
- [ ] Returns auth state
- [ ] Works on client components

---

## Completion Checklist

- [ ] Google OAuth configured in Supabase
- [ ] Auth callback route handles login
- [ ] Auth context provides state
- [ ] Login page works
- [ ] Header shows auth state
- [ ] Middleware protects routes
- [ ] useRequireAuth hook available
- [ ] Ready for PRD-04
