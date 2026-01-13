'use client'

/**
 * @fileoverview Authentication context provider
 *
 * Receives initial user/profile from server layout (no loading flash).
 * Only subscribes to auth changes for sign in/out events.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { SITE_URL } from '@/lib/constants'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@/types/database'

interface AuthContextValue {
  user: SupabaseUser | null
  profile: User | null
  signInWithGoogle: () => Promise<void>
  signInWithDiscord: () => Promise<void>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// Singleton Supabase client at module level
const supabase = createClient()

interface AuthProviderProps {
  children: ReactNode
  initialUser: SupabaseUser | null
  initialProfile: User | null
}

export function AuthProvider({
  children,
  initialUser,
  initialProfile,
}: AuthProviderProps) {
  // Initialize with server-provided data (no async fetch needed)
  const [user, setUser] = useState<SupabaseUser | null>(initialUser)
  const [profile, setProfile] = useState<User | null>(initialProfile)
  // No loading state - we have initial data from server

  // Subscribe to auth state changes (sign in/out only)
  // IMPORTANT: Never use async/await inside onAuthStateChange - it causes deadlocks
  // See: https://github.com/supabase/supabase/issues/35754
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Only handle actual auth events
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED'
      ) {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          // Use .then() instead of await to avoid deadlock
          // Wrap in Promise.resolve to ensure .catch() is available
          Promise.resolve(
            supabase
              .from('users')
              .select('*')
              .eq('id', currentUser.id)
              .single()
          )
            .then(({ data: profileData }) => {
              setProfile(profileData)
            })
            .catch((error) => {
              console.error('Failed to fetch profile:', error)
              setProfile(null)
            })
        } else {
          setProfile(null)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signInWithOAuth = useCallback(
    async (provider: 'google' | 'discord') => {
      // Include search params so shared URLs are preserved through OAuth
      const nextPath = window.location.pathname + window.location.search
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      })

      if (error) {
        console.error('Sign in error:', error)
        throw error
      }
    },
    []
  )

  const signInWithGoogle = useCallback(
    () => signInWithOAuth('google'),
    [signInWithOAuth]
  )

  const signInWithDiscord = useCallback(
    () => signInWithOAuth('discord'),
    [signInWithOAuth]
  )

  const signInWithEmail = useCallback(
    async (email: string): Promise<{ error: Error | null }> => {
      // Include search params so shared URLs are preserved through magic link
      const nextPath = window.location.pathname + window.location.search
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      })

      if (error) {
        console.error('Magic link error:', error)
        return { error }
      }

      return { error: null }
    },
    []
  )

  const signOut = useCallback(async () => {
    // Brief delay to show logout spinner (feels more intentional)
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Clear all Supabase auth cookies directly
    // This bypasses the Supabase client which can deadlock
    // See: https://github.com/supabase/supabase/issues/35754
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const cookieName = cookie.split('=')[0].trim()
      if (cookieName.startsWith('sb-') && cookieName.includes('-auth-token')) {
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`
        document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`
      }
    }

    // Clear local state (this triggers re-render)
    setUser(null)
    setProfile(null)

    // Redirect to home
    window.location.href = '/'
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    setProfile(profileData)
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        signInWithGoogle,
        signInWithDiscord,
        signInWithEmail,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
