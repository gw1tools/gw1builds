'use client'

/**
 * @fileoverview Authentication modal
 *
 * Two steps:
 * 1. Sign-in modal - triggered via openModal()
 * 2. Username modal - auto-shows when user has no username
 */

import {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, Loader2, X } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import {
  validateUsername,
  isReservedUsername,
  USERNAME_MIN,
  USERNAME_MAX,
} from '@/lib/validations/username'
import { MOTION_DURATION, MOTION_EASE } from '@/lib/motion'
import { cn } from '@/lib/utils'

// ============================================================================
// AUTH MODAL CONTEXT
// ============================================================================

interface AuthModalContextValue {
  isOpen: boolean
  openModal: (redirectTo?: string) => void
  closeModal: () => void
  redirectTo: string | null
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(
  undefined
)

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)

  const openModal = useCallback((redirect?: string) => {
    setRedirectTo(redirect || null)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setRedirectTo(null)
  }, [])

  return (
    <AuthModalContext.Provider
      value={{ isOpen, openModal, closeModal, redirectTo }}
    >
      {children}
      <AuthModal open={isOpen} onClose={closeModal} redirectTo={redirectTo} />
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider')
  }
  return context
}

// ============================================================================
// AUTH MODAL COMPONENT
// ============================================================================

function AuthModal({
  open,
  onClose,
  redirectTo,
}: {
  open: boolean
  onClose: () => void
  redirectTo: string | null
}) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const router = useRouter()

  // Determine modal state
  const needsUsername = user && !profile?.username
  const showSignIn = open && !user
  const isOpen = needsUsername || showSignIn
  const canClose = !needsUsername

  // Handle redirect for returning users (already have username)
  // This fires when user completes OAuth and already has a profile
  useEffect(() => {
    if (redirectTo && user && profile?.username && open) {
      onClose()
      router.push(redirectTo)
    }
  }, [redirectTo, user, profile?.username, open, onClose, router])

  // Clean up auth params from URL
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.has('authSuccess') || params.has('authError')) {
      params.delete('authSuccess')
      params.delete('authError')
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [])

  const handleSignOutAndClose = async () => {
    await signOut()
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      canClose={canClose}
      closeOnBackdropClick={canClose}
      closeOnEscape={canClose}
      showCloseButton={canClose}
      showHeader={false}
    >
      {needsUsername ? (
        <UsernameStep
          onSuccess={refreshProfile}
          onCancel={handleSignOutAndClose}
          redirectTo={redirectTo}
        />
      ) : (
        <SignInStep />
      )}
    </Modal>
  )
}

// ============================================================================
// SIGN IN STEP
// ============================================================================

function SignInStep() {
  const { signInWithGoogle, signInWithDiscord, signInWithEmail } = useAuth()
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const reducedMotion = useReducedMotion()

  const handleOAuthSignIn = async (
    provider: 'google' | 'discord',
    signInFn: () => Promise<void>
  ) => {
    setLoadingProvider(provider)
    setError(null)
    try {
      await signInFn()
    } catch (err) {
      console.error('Sign in failed:', err)
      setError('Failed to sign in. Please try again.')
      setLoadingProvider(null)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoadingProvider('email')
    setError(null)

    const { error: emailError } = await signInWithEmail(email.trim())

    if (emailError) {
      setError('Failed to send magic link. Please try again.')
      setLoadingProvider(null)
      return
    }

    setEmailSent(true)
    setLoadingProvider(null)
  }

  // Show confirmation after magic link sent
  if (emailSent) {
    return (
      <div className="p-6 pt-8">
        <motion.div
          className="text-center"
          initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-accent-green/20 flex items-center justify-center">
            <Check className="w-6 h-6 text-accent-green" />
          </div>
          <h2
            id="auth-modal-title"
            className="text-lg font-bold text-text-primary mb-2"
          >
            Check your email
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            We sent a magic link to <strong>{email}</strong>
          </p>
          <p className="text-xs text-text-muted">
            Click the link in your email to sign in. You can close this modal.
          </p>
          <p className="text-[11px] text-text-muted mt-2">
            Not seeing it? Check your spam folder.
          </p>
          <button
            onClick={() => {
              setEmailSent(false)
              setEmail('')
            }}
            className="mt-4 text-xs text-text-muted hover:text-accent-gold underline underline-offset-2"
          >
            Use a different email
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-6 pt-8">
      {/* Header */}
      <motion.div
        className="text-center mb-6"
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
      >
        <h2
          id="auth-modal-title"
          className="text-xl font-bold text-text-primary"
        >
          Sign In
        </h2>
      </motion.div>

      {/* Value proposition */}
      <motion.p
        className="text-sm text-text-secondary text-center mb-6 leading-relaxed"
        initial={reducedMotion ? undefined : { opacity: 0 }}
        animate={reducedMotion ? undefined : { opacity: 1 }}
        transition={{ delay: 0.05 }}
      >
        Create, share, and discover Guild Wars builds.
        <br />
        <span className="text-text-muted">
          Free forever. No ads, no tracking, no spam.
        </span>
      </motion.p>

      {error && (
        <motion.p
          className={cn(
            'mb-4 px-3 py-2 text-sm text-center',
            'bg-accent-red/10 text-accent-red',
            'rounded-[var(--radius-md)] border border-accent-red/20'
          )}
          role="alert"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}

      {/* Email magic link - inline layout */}
      <motion.form
        onSubmit={handleEmailSignIn}
        className="flex items-stretch gap-3"
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Enter your email"
          className={cn(
            'flex-1 min-w-0 px-4 py-3',
            'bg-bg-primary border border-border rounded-[var(--radius-md)]',
            'text-text-primary placeholder:text-text-muted text-base',
            'focus:outline-none focus:border-accent-gold transition-colors'
          )}
          disabled={loadingProvider !== null}
        />
        <Button
          type="submit"
          isLoading={loadingProvider === 'email'}
          disabled={loadingProvider !== null || !email.trim()}
          variant="primary"
          size="lg"
          className="shrink-0 px-6"
        >
          Continue
        </Button>
      </motion.form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted">or continue with</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* OAuth buttons - Google first, Discord second */}
      <motion.div
        className="flex flex-col sm:flex-row gap-3"
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Button
          onClick={() => handleOAuthSignIn('google', signInWithGoogle)}
          isLoading={loadingProvider === 'google'}
          disabled={loadingProvider !== null}
          className="w-full sm:flex-1"
          variant="secondary"
          size="lg"
          leftIcon={
            loadingProvider !== 'google' && <GoogleIconWithBackground />
          }
        >
          Google
        </Button>

        <Button
          onClick={() => handleOAuthSignIn('discord', signInWithDiscord)}
          isLoading={loadingProvider === 'discord'}
          disabled={loadingProvider !== null}
          className="w-full sm:flex-1"
          variant="secondary"
          size="lg"
          leftIcon={loadingProvider !== 'discord' && <DiscordIcon />}
        >
          Discord
        </Button>
      </motion.div>

      {/* Privacy policy footer */}
      <p className="text-[11px] text-text-muted text-center mt-6">
        By signing in, you agree to the{' '}
        <a
          href="/privacy"
          className="text-text-secondary hover:text-accent-gold underline underline-offset-2"
        >
          Privacy Policy
        </a>
      </p>
    </div>
  )
}

// ============================================================================
// USERNAME STEP
// ============================================================================

function UsernameStep({
  onSuccess,
  onCancel,
  redirectTo,
}: {
  onSuccess: () => void
  onCancel: () => void
  redirectTo: string | null
}) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const currentValueRef = useRef<string>('')
  const isMountedRef = useRef(true)
  const reducedMotion = useReducedMotion()

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // Cancel any in-flight request on unmount
      abortControllerRef.current?.abort()
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    setIsAvailable(null)
    currentValueRef.current = value

    // Cancel any pending debounce and in-flight request
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortControllerRef.current?.abort()

    if (!value.trim()) {
      setError(null)
      setIsChecking(false)
      return
    }

    const validation = validateUsername(value)
    if (!validation.valid) {
      setError(validation.error || null)
      setIsChecking(false)
      return
    }

    if (isReservedUsername(value)) {
      setError('This username is reserved')
      setIsChecking(false)
      return
    }

    setError(null)
    setIsChecking(true)
    debounceRef.current = setTimeout(() => checkAvailability(value), 300)
  }

  const checkAvailability = useCallback(async (value: string) => {
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const res = await fetch(
        `/api/auth/username/check?username=${encodeURIComponent(value)}`,
        { signal: abortControllerRef.current.signal }
      )
      const data = await res.json()

      // Don't update state if component unmounted or value changed
      if (!isMountedRef.current || currentValueRef.current !== value) return

      setIsAvailable(data.available)
      if (!data.available) {
        setError(data.error || 'Username is already taken')
      }
    } catch (err) {
      // Ignore abort errors (user typed again before request completed)
      if (err instanceof Error && err.name === 'AbortError') return
      if (!isMountedRef.current) return
      setError('Failed to check availability')
    } finally {
      // Only clear loading if this is still the current value
      if (isMountedRef.current && currentValueRef.current === value) {
        setIsChecking(false)
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = username.trim()
    const validation = validateUsername(trimmed)
    if (!validation.valid) {
      setError(validation.error || 'Invalid username')
      return
    }

    if (isReservedUsername(trimmed)) {
      setError('This username is reserved')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to set username')
        return
      }

      onSuccess()
      if (redirectTo) {
        router.push(redirectTo)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid =
    username.trim() && !error && !isChecking && isAvailable === true

  return (
    <div className="p-6 pt-8">
      {/* Header */}
      <motion.div
        className="text-center mb-5"
        initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
        animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
      >
        <h2
          id="auth-modal-title"
          className="text-lg font-bold text-text-primary mb-1"
        >
          What should we call you?
        </h2>
        <p id="auth-modal-description" className="text-sm text-text-secondary">
          Pick a username
        </p>
      </motion.div>

      <form onSubmit={handleSubmit}>
        {/* Username input */}
        <motion.div
          className="mb-5"
          initial={reducedMotion ? undefined : { opacity: 0, y: 10 }}
          animate={reducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <div className="relative">
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={handleChange}
              placeholder="Your username"
              autoFocus
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={USERNAME_MAX}
              aria-describedby="username-hint username-error"
              aria-invalid={!!error}
              className={cn(
                'w-full px-4 py-3',
                'bg-bg-primary border-2 rounded-[var(--radius-md)]',
                'text-text-primary placeholder:text-text-muted',
                'text-center font-medium',
                'transition-all duration-150',
                'focus:outline-none',
                error
                  ? 'border-accent-red'
                  : isAvailable
                    ? 'border-accent-green'
                    : 'border-border focus:border-accent-gold'
              )}
            />

            {/* Status indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isChecking && (
                <Loader2 className="w-5 h-5 text-text-muted animate-spin" />
              )}
              {!isChecking && error && (
                <X className="w-5 h-5 text-accent-red" aria-hidden="true" />
              )}
              {!isChecking && isAvailable && !error && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                >
                  <Check
                    className="w-5 h-5 text-accent-green"
                    aria-hidden="true"
                  />
                </motion.div>
              )}
            </div>
          </div>

          {/* Error message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                id="username-error"
                className="mt-2 text-sm text-accent-red text-center"
                role="alert"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Hint */}
          <p
            id="username-hint"
            className="mt-2 text-[11px] text-text-muted text-center"
          >
            {USERNAME_MIN}-{USERNAME_MAX} chars, letters, numbers, _ and -
          </p>
        </motion.div>

        {/* Submit button */}
        <Button
          type="submit"
          disabled={!isValid}
          isLoading={isSubmitting}
          className="w-full"
          variant="primary"
          size="lg"
        >
          Continue
        </Button>
      </form>

      {/* Sign out option */}
      <p className="mt-4 text-[11px] text-text-muted text-center">
        Wrong account?{' '}
        <button
          onClick={onCancel}
          className="text-text-secondary hover:text-accent-gold underline underline-offset-2 transition-colors"
        >
          Sign out
        </button>
      </p>
    </div>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================


function GoogleIconWithBackground() {
  return (
    <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shrink-0">
      <svg className="w-3 h-3" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    </div>
  )
}

function DiscordIcon() {
  return (
    <div className="w-5 h-5 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0">
      <svg
        className="w-3 h-3"
        viewBox="0 0 24 24"
        fill="white"
        aria-hidden="true"
      >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    </div>
  )
}
