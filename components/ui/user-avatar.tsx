'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  userId: string
  username: string | null
  avatarUrl?: string | null
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

const IMAGE_SIZES = {
  sm: 28,
  md: 36,
  lg: 48,
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
 * User avatar showing profile picture or initials fallback
 * Color is deterministically chosen from profession colors based on user ID
 */
export function UserAvatar({
  userId,
  username,
  avatarUrl,
  size = 'md',
  className,
}: UserAvatarProps) {
  const backgroundColor = getAvatarColor(userId)
  const initial = username ? username[0].toUpperCase() : '?'

  // Show profile picture if available
  if (avatarUrl) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden border border-border shrink-0',
          SIZE_CLASSES[size],
          className
        )}
      >
        <Image
          src={avatarUrl}
          alt={username || 'User'}
          width={IMAGE_SIZES[size]}
          height={IMAGE_SIZES[size]}
          className="w-full h-full object-cover"
        />
      </div>
    )
  }

  // Fallback to colored initials
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-bg-primary border border-border shrink-0',
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

export type { UserAvatarProps }
