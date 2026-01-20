/**
 * @fileoverview Inline collaborator list for author attribution
 * @module components/ui/collaborator-list
 *
 * Renders "with User1, User2 & User3" style collaborator lists.
 * Used in build headers alongside author attribution.
 */

import { UserLink } from './user-link'

interface CollaboratorListProps {
  collaborators: Array<{ username: string }>
  className?: string
}

/**
 * Inline collaborator list with proper punctuation
 *
 * @example
 * // "with Alice, Bob & Charlie"
 * <CollaboratorList collaborators={[{username: 'Alice'}, {username: 'Bob'}, {username: 'Charlie'}]} />
 */
export function CollaboratorList({
  collaborators,
  className,
}: CollaboratorListProps): React.ReactNode {
  if (!collaborators || collaborators.length === 0) {
    return null
  }

  return (
    <span className={className}>
      {' '}with{' '}
      {collaborators.map((c, i) => (
        <span key={c.username}>
          {i > 0 && (i === collaborators.length - 1 ? ' & ' : ', ')}
          <UserLink username={c.username} />
        </span>
      ))}
    </span>
  )
}

export type { CollaboratorListProps }
