'use client'

/**
 * @fileoverview Build edit form component
 * @module app/b/[id]/edit/edit-build-form
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Users } from 'lucide-react'
import { trackBuildEdited } from '@/lib/analytics'
import { useAuth } from '@/components/providers/auth-provider'
import { useAuthModal } from '@/components/auth/auth-modal'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { NotesEditor } from '@/components/editor/notes-editor'
import { TagsSection } from '@/components/editor/tags-section'
import { TeamSummary } from '@/components/editor/team-summary'
import { PrivacyToggle } from '@/components/editor/privacy-toggle'
import { CollaboratorsModal } from '@/components/editor/collaborators-modal'
import { Button } from '@/components/ui/button'
import { OverflowMenu } from '@/components/ui/overflow-menu'
import { SubmitOverlay } from '@/components/ui/submit-overlay'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'
import { pageTransitionVariants, listContainerVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  MAX_BARS,
  MIN_BARS,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_BAR_NAME_LENGTH,
  MAX_TEAM_PLAYERS,
} from '@/lib/constants'
import type {
  SkillBar,
  TipTapDocument,
  BuildWithAuthor,
  CollaboratorWithUser,
} from '@/types/database'

const EMPTY_SKILL_BAR: SkillBar = {
  name: '',
  hero: null,
  template: '',
  primary: 'Warrior',
  secondary: 'None',
  attributes: {},
  skills: [0, 0, 0, 0, 0, 0, 0, 0],
}

interface EditBuildFormProps {
  buildId: string
}

export function EditBuildForm({ buildId }: EditBuildFormProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { openModal } = useAuthModal()

  const [isLoading, setIsLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [bars, setBars] = useState<SkillBar[]>([])
  const [notes, setNotes] = useState<TipTapDocument>({
    type: 'doc',
    content: [],
  })
  const [tags, setTags] = useState<string[]>([])
  const [isPrivate, setIsPrivate] = useState(false)

  const [originalData, setOriginalData] = useState<{
    name: string
    bars: SkillBar[]
    notes: TipTapDocument
    tags: string[]
    is_private: boolean
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    teamName?: boolean
    barNames?: number[] // indices of bars with missing/invalid names
  }>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  const [barsWithInvalidSkills, setBarsWithInvalidSkills] = useState<Set<number>>(new Set())

  // Collaborator state
  const [collaborators, setCollaborators] = useState<CollaboratorWithUser[]>([])
  const [isOwner, setIsOwner] = useState(false)
  const [ownerUsername, setOwnerUsername] = useState<string | undefined>()

  // Compute total players across all bars for validation
  const totalTeamPlayers = bars.reduce(
    (sum, bar) => sum + (bar.playerCount || 1),
    0
  )

  // Team build if multiple bars OR single bar with multiple players
  const isTeamBuild = bars.length > 1 || totalTeamPlayers > 1

  // Fetch build data and collaborators
  useEffect(() => {
    const fetchBuild = async () => {
      if (!user) return

      try {
        // Fetch build and collaborators in parallel
        const [buildResponse, collabResponse] = await Promise.all([
          fetch(`/api/builds/${buildId}`),
          fetch(`/api/builds/${buildId}/collaborators`),
        ])

        if (buildResponse.status === 401) {
          openModal()
          return
        }

        if (buildResponse.status === 403) {
          router.push(`/b/${buildId}`)
          return
        }

        if (!buildResponse.ok) {
          throw new Error('Failed to fetch build')
        }

        const { data, isOwner: ownerFlag } = (await buildResponse.json()) as {
          data: BuildWithAuthor
          isOwner: boolean
        }

        // Set ownership info
        setIsOwner(ownerFlag)
        setOwnerUsername(data.author?.username ?? undefined)

        // Fetch collaborators if response was ok
        if (collabResponse.ok) {
          const collabData = await collabResponse.json()
          setCollaborators(collabData.collaborators || [])
        }

        // For single builds, the build name was stored as the first bar's name
        // For team builds, team name is stored as build name
        if (data.bars.length === 1) {
          // Single build: bar name = build name
          const updatedBars = [{ ...data.bars[0], name: data.name }]
          setBars(updatedBars)
          setTeamName('')
          setOriginalData({
            name: '',
            bars: updatedBars,
            notes: data.notes,
            tags: data.tags,
            is_private: data.is_private ?? false,
          })
        } else {
          // Team build: keep names as-is
          setBars(data.bars)
          setTeamName(data.name)
          setOriginalData({
            name: data.name,
            bars: data.bars,
            notes: data.notes,
            tags: data.tags,
            is_private: data.is_private ?? false,
          })
        }
        setNotes(data.notes)
        setTags(data.tags)
        setIsPrivate(data.is_private ?? false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load build')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBuild()
  }, [buildId, user, openModal, router])

  const hasChanges = () => {
    if (!originalData) return false
    return (
      teamName !== originalData.name ||
      JSON.stringify(bars) !== JSON.stringify(originalData.bars) ||
      JSON.stringify(notes) !== JSON.stringify(originalData.notes) ||
      JSON.stringify(tags) !== JSON.stringify(originalData.tags) ||
      isPrivate !== originalData.is_private
    )
  }

  const addBar = () => {
    if (bars.length < MAX_BARS) {
      setBars([...bars, { ...EMPTY_SKILL_BAR }])
    }
  }

  const removeBar = (index: number) => {
    if (bars.length > MIN_BARS) {
      setBars(bars.filter((_, i) => i !== index))
      // Adjust fieldErrors.barNames indices after removal
      if (fieldErrors.barNames?.length) {
        setFieldErrors(prev => ({
          ...prev,
          barNames: prev.barNames
            ?.filter(i => i !== index) // Remove the deleted bar's error
            .map(i => (i > index ? i - 1 : i)), // Shift indices down
        }))
      }
      // Adjust barsWithInvalidSkills indices after removal
      setBarsWithInvalidSkills(prev => {
        const next = new Set<number>()
        for (const i of prev) {
          if (i < index) next.add(i)
          else if (i > index) next.add(i - 1)
          // Skip i === index (removed bar)
        }
        return next
      })
    }
  }

  const updateBar = (index: number, bar: SkillBar) => {
    const newBars = [...bars]
    newBars[index] = bar
    setBars(newBars)
  }

  const moveBarUp = (index: number) => {
    if (index <= 0) return
    const newBars = [...bars]
    ;[newBars[index - 1], newBars[index]] = [newBars[index], newBars[index - 1]]
    setBars(newBars)
  }

  const moveBarDown = (index: number) => {
    if (index >= bars.length - 1) return
    const newBars = [...bars]
    ;[newBars[index], newBars[index + 1]] = [newBars[index + 1], newBars[index]]
    setBars(newBars)
  }

  const handleCollaboratorAdded = (collaborator: CollaboratorWithUser) => {
    setCollaborators(prev => [...prev, collaborator])
  }

  const handleCollaboratorRemoved = (collaboratorId: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== collaboratorId))
  }

  const validateForm = (): string | null => {
    const newFieldErrors: typeof fieldErrors = {}
    let errorMessage: string | null = null

    if (bars.length < MIN_BARS) {
      return 'At least one skill bar is required'
    }

    const hasTemplate = bars.some(b => b.template.trim())
    if (!hasTemplate) {
      return 'At least one skill bar must have a template code'
    }

    // For single builds, the first bar needs a name
    if (!isTeamBuild) {
      const barName = bars[0].name.trim()
      if (!barName) {
        newFieldErrors.barNames = [0]
        errorMessage = 'Build name is required'
      } else if (barName.length < MIN_NAME_LENGTH) {
        newFieldErrors.barNames = [0]
        errorMessage = `Build name must be at least ${MIN_NAME_LENGTH} characters`
      } else if (barName.length > MAX_BAR_NAME_LENGTH) {
        newFieldErrors.barNames = [0]
        errorMessage = `Build name must be at most ${MAX_BAR_NAME_LENGTH} characters`
      }
    } else {
      // For team builds, need team name and all bars need names
      const trimmedTeamName = teamName.trim()
      if (!trimmedTeamName) {
        newFieldErrors.teamName = true
        errorMessage = 'Team build name is required'
      } else if (trimmedTeamName.length < MIN_NAME_LENGTH) {
        newFieldErrors.teamName = true
        errorMessage = `Team build name must be at least ${MIN_NAME_LENGTH} characters`
      } else if (trimmedTeamName.length > MAX_NAME_LENGTH) {
        newFieldErrors.teamName = true
        errorMessage = `Team build name must be at most ${MAX_NAME_LENGTH} characters`
      }

      // Check each bar has a valid name
      const barsWithInvalidNames: number[] = []
      for (let i = 0; i < bars.length; i++) {
        const barName = bars[i].name.trim()
        if (!barName || barName.length < MIN_NAME_LENGTH) {
          barsWithInvalidNames.push(i)
        }
      }
      if (barsWithInvalidNames.length > 0) {
        newFieldErrors.barNames = barsWithInvalidNames
        if (!errorMessage) {
          const barName = bars[barsWithInvalidNames[0]].name.trim()
          errorMessage = !barName
            ? `Build ${barsWithInvalidNames[0] + 1} needs a name`
            : `Build ${barsWithInvalidNames[0] + 1} name must be at least ${MIN_NAME_LENGTH} characters`
        }
      }
    }

    // Validate total player count (applies to all builds)
    const totalPlayers = bars.reduce(
      (sum, bar) => sum + (bar.playerCount || 1),
      0
    )
    if (totalPlayers > MAX_TEAM_PLAYERS) {
      errorMessage = `Total players (${totalPlayers}) exceeds maximum of ${MAX_TEAM_PLAYERS}`
    }

    // Check for invalid skills (skills that don't match profession)
    if (barsWithInvalidSkills.size > 0) {
      const firstInvalidBar = Math.min(...barsWithInvalidSkills)
      errorMessage = errorMessage || `Build ${firstInvalidBar + 1} has skills that don't match its professions`
    }

    setFieldErrors(newFieldErrors)
    return errorMessage
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      openModal()
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError(null)

    // For single builds, use the bar name as the build name
    const buildName = isTeamBuild ? teamName.trim() : bars[0].name.trim()

    try {
      const response = await fetch(`/api/builds/${buildId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: buildName,
          bars,
          notes,
          tags,
          is_private: isPrivate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update build')
      }

      // Track build edit
      trackBuildEdited({
        build_id: buildId,
        primary_profession: bars[0]?.primary,
        secondary_profession: bars[0]?.secondary,
        game_mode: tags.find(t =>
          ['PvE', 'PvP', 'GvG', 'HA', 'RA'].includes(t)
        ),
        bar_count: bars.length,
        is_team_build: bars.length > 1,
      })

      // Update original data and redirect
      setOriginalData({ name: teamName, bars, notes, tags, is_private: isPrivate })
      router.push(`/b/${buildId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update build')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!user) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/builds/${buildId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete build')
      }

      // Redirect to profile or builds page
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete build')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  // Show loading while fetching
  if (isLoading) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center">
        <ProfessionSpinner />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-text-secondary">
            Please sign in to edit this build
          </p>
        </div>
      </div>
    )
  }

  // Show error if failed to load
  if (error && !originalData) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-accent-red mb-4">{error}</p>
          <Button onClick={() => router.push(`/b/${buildId}`)}>
            Back to Build
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-[calc(100dvh-3.5rem)] w-full max-w-3xl mx-auto px-4 py-6 sm:py-8"
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <h1 className="text-2xl font-bold text-text-primary mb-6">Edit Build</h1>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        onKeyDown={e => {
          // Never submit form via Enter - only via submit button click
          if (e.key === 'Enter') {
            e.preventDefault()
          }
        }}
        className="space-y-5"
      >
        {/* Skill bars - primary content */}
        <motion.div
          className="space-y-4"
          variants={listContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {bars.map((bar, index) => (
            <div key={index} id={`skill-bar-${index}`}>
              <SkillBarEditor
                index={index}
                totalBars={bars.length}
                data={bar}
                onChange={updatedBar => {
                  updateBar(index, updatedBar)
                  // Clear bar name error when user starts typing
                  if (fieldErrors.barNames?.includes(index) && updatedBar.name !== bar.name) {
                    setFieldErrors(prev => ({
                      ...prev,
                      barNames: prev.barNames?.filter(i => i !== index),
                    }))
                  }
                  // Clear template error when a template is added
                  if (updatedBar.template && updatedBar.template !== bar.template && error) {
                    setError(null)
                  }
                }}
                onRemove={
                  bars.length > MIN_BARS ? () => removeBar(index) : undefined
                }
                onMoveUp={() => moveBarUp(index)}
                onMoveDown={() => moveBarDown(index)}
                canRemove={bars.length > MIN_BARS}
                totalTeamPlayers={totalTeamPlayers}
                maxTeamPlayers={MAX_TEAM_PLAYERS}
                nameError={fieldErrors.barNames?.includes(index)}
                onValidationChange={(hasErrors) => {
                  setBarsWithInvalidSkills(prev => {
                    const next = new Set(prev)
                    if (hasErrors) {
                      next.add(index)
                    } else {
                      next.delete(index)
                    }
                    return next
                  })
                }}
              />
            </div>
          ))}
        </motion.div>

        {/* Add bar button */}
        {bars.length < MAX_BARS && (
          <div className="flex justify-center">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={addBar}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Team Member
            </Button>
          </div>
        )}

        {/* Team summary - name input + overview (appears for team builds) */}
        <TeamSummary
          bars={bars}
          teamName={teamName}
          onTeamNameChange={name => {
            setTeamName(name)
            // Clear team name error when user starts typing
            if (fieldErrors.teamName) {
              setFieldErrors(prev => ({ ...prev, teamName: false }))
            }
          }}
          hasError={fieldErrors.teamName}
        />

        {/* Notes Editor */}
        <div>
          <h3 className="text-sm font-medium text-text-secondary mb-2">Notes</h3>
          <NotesEditor value={notes} onChange={setNotes} />
        </div>

        {/* Tags Section - collapsible */}
        <TagsSection value={tags} onChange={setTags} />

        {/* Privacy Toggle - only owner can change */}
        {isOwner && (
          <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        {/* Mobile: Save full-width, then Cancel + ... row */}
        {/* Desktop: All three in one row, right-aligned */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting || !hasChanges()}
            className="w-full sm:w-auto sm:min-w-[200px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>

          {/* Secondary actions - row on mobile, inline on desktop */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => router.push(`/b/${buildId}`)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>

            {isOwner && (
              <OverflowMenu
                disabled={isSubmitting}
                items={[
                  {
                    label: collaborators.length > 0
                      ? `Collaborators (${collaborators.length})`
                      : 'Add Collaborators...',
                    icon: <Users className="w-4 h-4" />,
                    onClick: () => setShowCollaboratorsModal(true),
                  },
                  {
                    label: 'Delete Build',
                    icon: <Trash2 className="w-4 h-4" />,
                    onClick: () => setShowDeleteConfirm(true),
                    variant: 'danger' as const,
                  },
                ]}
              />
            )}
          </div>
        </div>
      </form>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className={cn(
                'bg-bg-card border-2 border-accent-red',
                'rounded-[var(--radius-lg)] p-6 max-w-md w-full'
              )}
            >
              <h2 className="text-xl font-bold text-text-primary mb-2">
                Delete Build?
              </h2>
              <p className="text-text-secondary mb-6">
                This action cannot be undone. Your build will be permanently
                deleted.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={handleDelete}
                  isLoading={isDeleting}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collaborators Modal */}
      <CollaboratorsModal
        mode="edit"
        isOpen={showCollaboratorsModal}
        onClose={() => setShowCollaboratorsModal(false)}
        buildId={buildId}
        isOwner={isOwner}
        ownerUsername={ownerUsername}
        collaborators={collaborators}
        onCollaboratorAdded={handleCollaboratorAdded}
        onCollaboratorRemoved={handleCollaboratorRemoved}
      />

      {/* Loading overlay */}
      <SubmitOverlay isVisible={isSubmitting} message="Saving changes..." />
    </motion.div>
  )
}
