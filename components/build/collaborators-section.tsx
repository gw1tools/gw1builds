'use client'

/**
 * @fileoverview Build collaborators management section
 * @module components/build/collaborators-section
 *
 * Supports two modes:
 * - 'edit': For existing builds - makes API calls to add/remove collaborators
 * - 'draft': For new builds - stores pending collaborators locally
 *
 * Allows build owners to add/remove collaborators who can edit the build.
 * Shows "Shared with you by @owner" for collaborators viewing (edit mode only).
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { Users, X, Loader2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/ui/user-avatar'
import { UserLink } from '@/components/ui/user-link'
import type { CollaboratorWithUser } from '@/types/database'

/** Maximum collaborators per build */
const MAX_COLLABORATORS = 4

interface SearchUser {
  id: string
  username: string
  avatar_url: string | null
}

/** Pending collaborator for draft mode (before build is created) */
export interface PendingCollaborator {
  id: string
  username: string
  avatar_url: string | null
}

// Edit mode props - for existing builds
interface EditModeProps {
  mode: 'edit'
  buildId: string
  isOwner: boolean
  ownerUsername?: string
  collaborators: CollaboratorWithUser[]
  onCollaboratorAdded: (collaborator: CollaboratorWithUser) => void
  onCollaboratorRemoved: (collaboratorId: string) => void
}

// Draft mode props - for new builds (no API calls)
interface DraftModeProps {
  mode: 'draft'
  pendingCollaborators: PendingCollaborator[]
  onPendingChange: (collaborators: PendingCollaborator[]) => void
}

type CollaboratorsSectionProps = (EditModeProps | DraftModeProps) & {
  className?: string
}

/**
 * Check if props are for edit mode
 */
function isEditMode(props: CollaboratorsSectionProps): props is EditModeProps & { className?: string } {
  return props.mode === 'edit'
}

/**
 * Collaborators management section for build forms
 *
 * @example Edit mode (existing build)
 * <CollaboratorsSection
 *   mode="edit"
 *   buildId={buildId}
 *   isOwner={true}
 *   collaborators={collaborators}
 *   onCollaboratorAdded={handleAdd}
 *   onCollaboratorRemoved={handleRemove}
 * />
 *
 * @example Draft mode (new build)
 * <CollaboratorsSection
 *   mode="draft"
 *   pendingCollaborators={pending}
 *   onPendingChange={setPending}
 * />
 */
export function CollaboratorsSection(props: CollaboratorsSectionProps) {
  const { className } = props

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAdding, setIsAdding] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get existing usernames/ids to filter from search results
  const existingIds = useMemo(
    () =>
      isEditMode(props)
        ? new Set(props.collaborators.map(c => c.user_id))
        : new Set(props.pendingCollaborators.map(c => c.id)),
    [props]
  )

  const currentCount = isEditMode(props)
    ? props.collaborators.length
    : props.pendingCollaborators.length

  // Search users as they type
  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
        const data = await response.json()

        // Filter out users already added
        const filtered = (data.users || []).filter(
          (u: SearchUser) => !existingIds.has(u.id)
        )

        setSearchResults(filtered)
        setShowDropdown(filtered.length > 0)
        setFocusedIndex(-1)
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, existingIds])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showDropdown || searchResults.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, searchResults.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (focusedIndex >= 0 && focusedIndex < searchResults.length) {
          handleAddUser(searchResults[focusedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowDropdown(false)
        setFocusedIndex(-1)
        break
    }
  }

  async function handleAddUser(user: SearchUser) {
    if (isEditMode(props)) {
      // Edit mode: make API call
      setIsAdding(user.id)
      try {
        const response = await fetch(`/api/builds/${props.buildId}/collaborators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username }),
        })

        const data = await response.json()

        if (!response.ok) {
          toast.error(data.error || 'Failed to add collaborator')
          return
        }

        props.onCollaboratorAdded(data.collaborator)
        setQuery('')
        setShowDropdown(false)
        toast.success(`Added ${user.username} as collaborator`)
      } catch {
        toast.error('Failed to add collaborator')
      } finally {
        setIsAdding(null)
      }
    } else {
      // Draft mode: update local state
      const newPending: PendingCollaborator = {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
      }
      props.onPendingChange([...props.pendingCollaborators, newPending])
      setQuery('')
      setShowDropdown(false)
      toast.success(`Added ${user.username}`)
    }
  }

  async function handleRemove(id: string, username: string) {
    if (isEditMode(props)) {
      // Edit mode: make API call
      setRemovingId(id)
      try {
        const response = await fetch(
          `/api/builds/${props.buildId}/collaborators/${id}`,
          { method: 'DELETE' }
        )

        if (!response.ok) {
          const data = await response.json()
          toast.error(data.error || 'Failed to remove collaborator')
          return
        }

        props.onCollaboratorRemoved(id)
        toast.success(`Removed ${username}`)
      } catch {
        toast.error('Failed to remove collaborator')
      } finally {
        setRemovingId(null)
      }
    } else {
      // Draft mode: update local state
      props.onPendingChange(props.pendingCollaborators.filter(c => c.id !== id))
      toast.success(`Removed ${username}`)
    }
  }

  // Edit mode: Collaborator view (not owner) - just show who shared it
  if (isEditMode(props) && !props.isOwner) {
    return (
      <div className={cn('bg-bg-card border border-border rounded-xl p-4', className)}>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Users className="w-4 h-4 text-accent-gold" />
          <span>
            Shared with you by{' '}
            <UserLink username={props.ownerUsername || ''} showAtPrefix className="text-text-primary font-medium" />
          </span>
        </div>
      </div>
    )
  }

  // Get the list of collaborators to display
  const displayList = isEditMode(props)
    ? props.collaborators.map(c => ({
        id: c.id,
        user_id: c.user_id,
        username: c.username,
        avatar_url: c.avatar_url,
      }))
    : props.pendingCollaborators.map(c => ({
        id: c.id,
        user_id: c.id,
        username: c.username,
        avatar_url: c.avatar_url,
      }))

  // Owner view (edit mode) or draft view - full management UI
  return (
    <div className={cn('bg-bg-card border border-border rounded-xl', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-bg-secondary/30">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-accent-gold" />
          <span className="text-sm font-medium text-text-primary">Collaborators</span>
          <span className="text-xs text-text-muted">
            ({currentCount}/{MAX_COLLABORATORS})
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Current collaborators */}
        {displayList.length > 0 && (
          <div className="space-y-2">
            {displayList.map((collab) => {
              const isRemoving = removingId === collab.id
              return (
                <div
                  key={collab.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-bg-secondary/50"
                >
                  <UserAvatar
                    userId={collab.user_id}
                    username={collab.username}
                    avatarUrl={collab.avatar_url}
                    size="sm"
                  />
                  <UserLink
                    username={collab.username}
                    showAtPrefix
                    className="text-sm text-text-primary flex-1 truncate"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemove(collab.id, collab.username)}
                    disabled={isRemoving}
                    className={cn(
                      'p-1.5 rounded-md transition-colors',
                      'text-text-muted hover:text-accent-red hover:bg-accent-red/10',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                    aria-label={`Remove ${collab.username}`}
                  >
                    {isRemoving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Add collaborator search */}
        {currentCount < MAX_COLLABORATORS && (
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && searchResults.length > 0 && setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search users to add..."
                aria-label="Search users"
                aria-expanded={showDropdown}
                aria-autocomplete="list"
                role="combobox"
                className={cn(
                  'w-full h-9 pl-9 pr-3 rounded-lg text-sm',
                  'bg-bg-primary border border-border',
                  'text-text-primary placeholder:text-text-muted',
                  'transition-colors duration-150',
                  'hover:border-border-hover',
                  'focus:outline-none focus:border-accent-gold'
                )}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted animate-spin" />
              )}
            </div>

            {/* Search results dropdown */}
            {showDropdown && (
              <div
                role="listbox"
                className="absolute z-10 w-full mt-1 bg-bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto"
              >
                {searchResults.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    role="option"
                    aria-selected={index === focusedIndex}
                    onClick={() => handleAddUser(user)}
                    disabled={isAdding === user.id}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 text-left',
                      'hover:bg-bg-hover transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      index === focusedIndex && 'bg-bg-hover'
                    )}
                  >
                    <UserAvatar
                      userId={user.id}
                      username={user.username}
                      avatarUrl={user.avatar_url}
                      size="sm"
                    />
                    <span className="text-sm text-text-primary flex-1">
                      @{user.username}
                    </span>
                    {isAdding === user.id ? (
                      <Loader2 className="w-4 h-4 text-text-muted animate-spin" />
                    ) : (
                      <span className="text-xs text-text-muted">Click to add</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Helper text */}
        <p className="text-xs text-text-muted">
          {props.mode === 'draft'
            ? 'Collaborators will be added after you publish the build.'
            : 'Collaborators can edit this build but cannot delete it or manage collaborators.'}
        </p>
      </div>
    </div>
  )
}
