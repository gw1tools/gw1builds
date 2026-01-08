'use client'

import { cn } from '@/lib/utils'

interface UserAvatarProps {
  userId: string
  username: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Profession colors from design system - deterministically chosen based on user ID
const AVATAR_COLORS = [
  'var(--color-warrior)',
  'var(--color-ranger)',
  'var(--color-monk)',
  'var(--color-necromancer)',
  'var(--color-mesmer)',
  'var(--color-elementalist)',
  'var(--color-assassin)',
  'var(--color-ritualist)',
  'var(--color-paragon)',
  'var(--color-dervish)',
]

const SIZE_CLASSES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
}

/**
 * Simple hash function to convert string to number
 * Used to deterministically select avatar color from user ID
 */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) >>> 0 // Force 32-bit unsigned
  }
  return hash
}

/**
 * Get avatar color based on user ID
 * Same user ID always returns same color
 */
function getAvatarColor(userId: string): string {
  const hash = hashString(userId)
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/**
 * User avatar showing first letter of username with colored background
 * Color is deterministically chosen from profession colors based on user ID
 */
export function UserAvatar({
  userId,
  username,
  size = 'md',
  className,
}: UserAvatarProps) {
  const backgroundColor = getAvatarColor(userId)
  const initial = username ? username[0].toUpperCase() : '?'

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-bg-primary border border-border',
        'transition-all duration-150',
        'hover:scale-105 hover:border-border-hover hover:shadow-md',
        SIZE_CLASSES[size],
        className
      )}
      style={{ backgroundColor }}
    >
      {initial}
    </div>
  )
}
