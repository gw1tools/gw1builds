/**
 * @fileoverview Global error boundary for unhandled errors
 * @module app/error
 *
 * Catches unhandled errors in the application and displays
 * a user-friendly message. Logs error digest for correlation.
 */
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Global error boundary component
 *
 * Next.js automatically renders this when an unhandled error occurs.
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log only the error digest for correlation - full error logged server-side
    if (error.digest) {
      console.error('Error ID:', error.digest)
    }
  }, [error])

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Something went wrong
      </h1>
      <p className="text-text-secondary mb-6">
        An unexpected error occurred. We&apos;ve logged the issue and will look
        into it.
      </p>
      <div className="flex gap-3 justify-center">
        <Button onClick={reset} variant="primary">
          Try again
        </Button>
        <Button href="/" variant="secondary">
          Return home
        </Button>
      </div>
    </div>
  )
}
