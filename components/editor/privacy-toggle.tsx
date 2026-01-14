'use client'

/**
 * @fileoverview Privacy toggle component for build visibility settings
 * @module components/editor/privacy-toggle
 */

import { Lock, Globe } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'

export interface PrivacyToggleProps {
  isPrivate: boolean
  onChange: (value: boolean) => void
  className?: string
}

export function PrivacyToggle({
  isPrivate,
  onChange,
  className,
}: PrivacyToggleProps) {
  return (
    <div
      role="group"
      onClick={(e) => {
        // Only toggle if clicking the container, not the toggle itself
        if ((e.target as HTMLElement).closest('button[role="switch"]')) return
        onChange(!isPrivate)
      }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200',
        isPrivate
          ? 'bg-accent-gold/10 border border-accent-gold/30'
          : 'bg-bg-card/50 border border-transparent hover:border-border',
        className
      )}
    >
      <Toggle
        checked={isPrivate}
        onChange={onChange}
        label={isPrivate ? 'Build is private' : 'Build is public'}
      />
      {isPrivate ? (
        <Lock className="w-4 h-4 text-accent-gold" />
      ) : (
        <Globe className="w-4 h-4 text-text-muted" />
      )}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            'text-sm font-medium',
            isPrivate ? 'text-accent-gold' : 'text-text-secondary'
          )}
        >
          {isPrivate ? 'Private' : 'Public'}
        </span>
        <p className="text-xs text-text-muted mt-0.5">
          {isPrivate
            ? 'Only you and people with the link can view this build'
            : 'Anyone can discover and view this build'}
        </p>
      </div>
    </div>
  )
}
