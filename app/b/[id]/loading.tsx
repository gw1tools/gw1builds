/**
 * @fileoverview Loading skeleton for build page
 * @module app/b/[id]/loading
 *
 * Displayed by Next.js while the async page component loads.
 * Skeleton matches the page layout to prevent layout shift.
 */

/**
 * Build page loading skeleton
 */
export default function BuildLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-bg-card/50 rounded animate-pulse mb-6" />

      {/* Header card */}
      <div className="bg-bg-card border border-border rounded-xl p-5 shadow-sticky">
        {/* Title */}
        <div className="inline-block mb-4">
          <div className="h-7 w-48 bg-bg-elevated rounded animate-pulse" />
          {/* Underline commented out
          <div
            className="h-2 w-full bg-white/30 animate-pulse mt-1.5"
            style={{ transform: 'skewX(-12deg) rotate(-1deg)' }}
          />
          */}
        </div>
        <div className="h-4 w-24 bg-bg-elevated/50 rounded animate-pulse mb-5" />
        {/* Profession pill and tags */}
        <div className="flex items-center gap-3">
          <div className="h-7 w-40 bg-bg-elevated/50 rounded-full animate-pulse" />
          <div className="w-px h-4 bg-border/30" />
          <div className="h-6 w-14 bg-bg-elevated/30 rounded-full animate-pulse" />
          <div className="h-6 w-12 bg-bg-elevated/30 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Skill bar card */}
      <div className="mt-3 bg-bg-card border border-border rounded-xl p-5 shadow-sticky">
        {/* Skill bar label */}
        <div className="h-3 w-16 bg-bg-elevated/50 rounded animate-pulse mb-4" />

        {/* Skill slots */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-16 h-16 bg-bg-elevated/50 border border-border/30 animate-pulse"
            />
          ))}
        </div>

        {/* Attributes skeleton */}
        <div className="flex gap-4 mt-5">
          <div className="h-6 w-32 bg-bg-elevated/50 rounded animate-pulse" />
          <div className="h-6 w-28 bg-bg-elevated/50 rounded animate-pulse" />
        </div>

        {/* Divider */}
        <div className="my-5 border-t border-dashed border-border/50" />

        {/* Template code skeleton */}
        <div className="h-3 w-28 bg-bg-elevated/50 rounded animate-pulse mb-2" />
        <div className="flex gap-2">
          <div className="flex-1 h-12 bg-bg-primary/50 border border-dashed border-border/30 rounded-lg animate-pulse" />
          <div className="w-12 h-12 bg-bg-elevated/50 border border-border/30 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Notes skeleton */}
      <div className="mt-3 mb-8 bg-bg-card border border-border rounded-xl p-5 shadow-sticky">
        <div className="h-3 w-14 bg-bg-elevated/50 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-bg-elevated/30 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-bg-elevated/30 rounded animate-pulse" />
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <div className="flex gap-4">
          <div className="h-4 w-20 bg-bg-card/50 rounded animate-pulse" />
          <div className="h-4 w-24 bg-bg-card/50 rounded animate-pulse" />
        </div>
        <div className="h-4 w-12 bg-bg-card/50 rounded animate-pulse" />
      </div>
    </div>
  )
}
