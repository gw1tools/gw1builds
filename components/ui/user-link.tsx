/**
 * @fileoverview Reusable username link component
 * @module components/ui/user-link
 *
 * Links to user's public profile page at /u/[username].
 * Styled as inline text that fits naturally in sentences.
 */

import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface UserLinkProps {
  /** Username to link to (without @) */
  username: string
  /** Show @ prefix before username */
  showAtPrefix?: boolean
  /** Additional CSS classes */
  className?: string
}

/**
 * Inline link to a user's public profile
 *
 * @example
 * // Basic usage
 * <UserLink username="GuildMaster" />
 *
 * @example
 * // With @ prefix (for mentions)
 * <UserLink username="GuildMaster" showAtPrefix />
 *
 * @example
 * // In a sentence
 * <p>Created by <UserLink username="GuildMaster" /></p>
 */
export function UserLink({
  username,
  showAtPrefix = false,
  className,
}: UserLinkProps): React.ReactNode {
  if (!username) {
    return null
  }

  return (
    <Link
      href={`/u/${encodeURIComponent(username)}`}
      className={cn(
        'text-text-secondary hover:text-accent-gold transition-colors',
        className
      )}
    >
      {showAtPrefix ? '@' : ''}{username}
    </Link>
  )
}
