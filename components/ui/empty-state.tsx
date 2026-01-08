'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Icon or emoji to display */
  icon?: React.ReactNode
  /** Main heading */
  title: string
  /** Description text */
  description?: string
  /** Action button/link */
  action?: React.ReactNode
}

/**
 * Empty state messaging component
 *
 * @example
 * <EmptyState
 *   icon="🔍"
 *   title="No builds found"
 *   description="Try adjusting your search filters"
 *   action={<Button>Clear filters</Button>}
 * />
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { className, icon, title, description, action, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center text-center py-12 px-4',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="text-5xl mb-4" aria-hidden="true">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-text-primary mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-text-muted max-w-sm mb-4">
            {description}
          </p>
        )}
        {action && <div>{action}</div>}
      </div>
    )
  }
)

EmptyState.displayName = 'EmptyState'

/**
 * Preset empty states for common scenarios
 */
export function NoBuildsFound({ onReset }: { onReset?: () => void }) {
  return (
    <EmptyState
      icon="🔍"
      title="No builds found"
      description="Try adjusting your search or filters to find what you're looking for."
      action={
        onReset && (
          <button
            onClick={onReset}
            className="text-sm text-accent-gold hover:text-accent-gold-bright transition-colors"
          >
            Clear filters
          </button>
        )
      }
    />
  )
}

export function NoBuildsSaved() {
  return (
    <EmptyState
      icon="⭐"
      title="No saved builds"
      description="Star builds you like to save them here for quick access."
    />
  )
}

export function NoBuildsCreated() {
  return (
    <EmptyState
      icon="📝"
      title="No builds yet"
      description="Create your first build to share it with the community."
    />
  )
}

export function BuildNotFound() {
  return (
    <EmptyState
      icon="😕"
      title="Build not found"
      description="This build may have been deleted or never existed."
    />
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="⚠️"
      title="Something went wrong"
      description={message || "We couldn't load this content. Please try again."}
      action={
        onRetry && (
          <button
            onClick={onRetry}
            className="text-sm text-accent-gold hover:text-accent-gold-bright transition-colors"
          >
            Try again
          </button>
        )
      }
    />
  )
}
