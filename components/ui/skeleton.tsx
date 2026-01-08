'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use shimmer animation instead of pulse */
  shimmer?: boolean
}

/**
 * Loading skeleton placeholder
 *
 * @example
 * <Skeleton className="h-8 w-32" />
 * <Skeleton className="h-4 w-full" shimmer />
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, shimmer = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg bg-bg-card',
          shimmer ? 'animate-shimmer' : 'animate-pulse-subtle',
          className
        )}
        {...props}
      />
    )
  }
)

Skeleton.displayName = 'Skeleton'

/**
 * Skeleton for a skill bar (8 slots)
 */
export function SkillBarSkeleton({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  }

  return (
    <div className="flex gap-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className={cn(sizes[size], 'rounded-lg')} />
      ))}
    </div>
  )
}

/**
 * Skeleton for a build card
 */
export function BuildCardSkeleton() {
  return (
    <div className="w-full p-4 rounded-xl border border-border bg-bg-card">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-4 w-16 shrink-0" />
      </div>

      {/* Skill bar */}
      <div className="mb-3">
        <SkillBarSkeleton size="sm" />
      </div>

      {/* Tags */}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>
    </div>
  )
}

/**
 * Skeleton for full build page
 */
export function BuildPageSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-32 mb-6" />

      {/* Header */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Skill bar card */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
        <Skeleton className="h-3 w-20 mb-4" />
        <SkillBarSkeleton size="lg" />
        <div className="flex gap-3 mt-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>

      {/* Template */}
      <div className="flex gap-2 mb-8">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}
