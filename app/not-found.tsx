/**
 * @fileoverview Global 404 page for missing routes
 * @module app/not-found
 *
 * Displayed when user navigates to a route that doesn't exist.
 * Provides friendly message and navigation back to homepage.
 */
import { Button } from '@/components/ui'

/**
 * Global not found page
 *
 * Next.js automatically renders this for any unmatched routes.
 */
export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Page not found
      </h1>
      <p className="text-text-secondary mb-6">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button href="/" variant="primary">
        Return home
      </Button>
    </div>
  )
}
