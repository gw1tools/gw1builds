/**
 * @fileoverview 404 page for missing builds
 * @module app/b/[id]/not-found
 *
 * Displayed when getBuildById returns null. Provides friendly
 * message and navigation back to build listing.
 */
import Link from 'next/link'

/**
 * Build not found page
 *
 * Next.js automatically renders this when notFound() is called
 * from the page component.
 */
export default function BuildNotFound() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Build not found
      </h1>
      <p className="text-text-secondary mb-6">
        This build may have been deleted or never existed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg-primary rounded-lg font-medium hover:bg-accent-gold-bright transition-colors"
      >
        Browse builds
      </Link>
    </div>
  )
}
