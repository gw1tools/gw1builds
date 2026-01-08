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
  useSyncExternalStore,
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
import {
  validateUsername,
  isReservedUsername,
  USERNAME_MIN,
  USERNAME_MAX,
} from '@/lib/validations/username'
import {
  modalOverlayVariants,
  modalContentVariants,
  listItemVariants,
  MOTION_DURATION,
  MOTION_EASE,
} from '@/lib/motion'
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

// Hook to detect if we're on client after hydration
// Uses useSyncExternalStore for proper SSR support without hydration mismatch
const emptySubscribe = () => () => {}
function useIsClient() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // Client value
    () => false // Server value
  )
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const isClient = useIsClient()

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
      {isClient && (
        <AuthModal open={isOpen} onClose={closeModal} redirectTo={redirectTo} />
      )}
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
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()

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

  // Focus trap
  useEffect(() => {
    if (!isOpen) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const focusFirst = () => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      focusable?.[0]?.focus()
    }

    const timer = setTimeout(focusFirst, 100)

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !modalRef.current) return

      const focusable = modalRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleTab)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleTab)
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    if (!isOpen || !canClose) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, canClose, onClose])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleBackdropClick = () => {
    if (canClose) onClose()
  }

  const handleSignOutAndClose = async () => {
    await signOut()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={reducedMotion ? undefined : modalOverlayVariants}
          initial={reducedMotion ? undefined : 'hidden'}
          animate={reducedMotion ? undefined : 'visible'}
          exit={reducedMotion ? undefined : 'exit'}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Modal Card */}
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            aria-describedby="auth-modal-description"
            className={cn(
              'relative z-10 w-full max-w-md',
              'bg-bg-card',
              'border border-border',
              'rounded-xl',
              'max-h-[90vh] overflow-y-auto',
              'shadow-xl'
            )}
            variants={reducedMotion ? undefined : modalContentVariants}
            initial={reducedMotion ? undefined : 'hidden'}
            animate={reducedMotion ? undefined : 'visible'}
            exit={reducedMotion ? undefined : 'exit'}
          >
            {/* Close button */}
            {canClose && (
              <motion.button
                onClick={onClose}
                aria-label="Close modal"
                className={cn(
                  'absolute top-3 right-3 p-2 rounded-[var(--radius-md)]',
                  'text-text-muted hover:text-text-primary',
                  'hover:bg-bg-hover transition-colors z-10'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}

            {needsUsername ? (
              <UsernameStep
                onSuccess={refreshProfile}
                onCancel={handleSignOutAndClose}
                redirectTo={redirectTo}
              />
            ) : (
              <SignInStep />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// SIGN IN STEP
// ============================================================================

function SignInStep() {
  const { signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reducedMotion = useReducedMotion()

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      console.error('Sign in failed:', err)
      setError('Failed to sign in. Please try again.')
      setIsLoading(false)
    }
  }

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
          Sign in to Contribute
        </h2>
      </motion.div>

      {/* Simple bullet points */}
      <motion.div
        className="space-y-2 mb-6"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05, delayChildren: 0.1 },
          },
        }}
      >
        <Benefit>Create, edit and delete your builds anytime</Benefit>
        <Benefit>Star builds to store them, report builds to flag them</Benefit>
        <Benefit>
          We don&apos;t store your email, we&apos;ll never spam you
        </Benefit>
        <Benefit>No paywalls, no ads, no tracking</Benefit>
      </motion.div>

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

      {/* Google sign-in button */}
      <Button
        onClick={handleSignIn}
        isLoading={isLoading}
        className="w-full"
        variant="primary"
        size="lg"
        leftIcon={!isLoading && <GoogleIconWithBackground />}
      >
        Continue with Google
      </Button>

      {/* Privacy policy link */}
      <p className="text-[11px] text-text-muted text-center mt-4">
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

  const isValid = username.trim() && !error && !isChecking && isAvailable === true

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

function Benefit({ children }: { children: React.ReactNode }) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      className="flex items-center gap-2.5 text-sm text-text-secondary"
      variants={reducedMotion ? undefined : listItemVariants}
    >
      <div className="w-1.5 h-1.5 rounded-full bg-accent-gold shrink-0" />
      <span>{children}</span>
    </motion.div>
  )
}

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
