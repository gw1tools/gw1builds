'use client'

/**
 * @fileoverview Build edit form component
 * @module app/b/[id]/edit/edit-build-form
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { trackBuildEdited } from '@/lib/analytics'
import { useAuth } from '@/components/providers/auth-provider'
import { useAuthModal } from '@/components/auth/auth-modal'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { NotesEditor } from '@/components/editor/notes-editor'
import { BuildTagsSelector } from '@/components/editor/build-tags-selector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'
import { pageTransitionVariants, listContainerVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  MAX_BARS,
  MIN_BARS,
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
} from '@/lib/constants'
import type {
  SkillBar,
  TipTapDocument,
  BuildWithAuthor,
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
  const { user, loading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  const [isLoading, setIsLoading] = useState(true)
  const [teamName, setTeamName] = useState('')
  const [bars, setBars] = useState<SkillBar[]>([])
  const [notes, setNotes] = useState<TipTapDocument>({
    type: 'doc',
    content: [],
  })
  const [tags, setTags] = useState<string[]>([])

  const [originalData, setOriginalData] = useState<{
    name: string
    bars: SkillBar[]
    notes: TipTapDocument
    tags: string[]
  } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isTeamBuild = bars.length > 1

  // Fetch build data
  useEffect(() => {
    const fetchBuild = async () => {
      if (!user || authLoading) return

      try {
        const response = await fetch(`/api/builds/${buildId}`)

        if (response.status === 401) {
          openModal()
          return
        }

        if (response.status === 403) {
          router.push(`/b/${buildId}`)
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch build')
        }

        const { data } = (await response.json()) as { data: BuildWithAuthor }

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
          })
        }
        setNotes(data.notes)
        setTags(data.tags)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load build')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBuild()
  }, [buildId, user, authLoading, openModal, router])

  const hasChanges = () => {
    if (!originalData) return false
    return (
      teamName !== originalData.name ||
      JSON.stringify(bars) !== JSON.stringify(originalData.bars) ||
      JSON.stringify(notes) !== JSON.stringify(originalData.notes) ||
      JSON.stringify(tags) !== JSON.stringify(originalData.tags)
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

  const validateForm = (): string | null => {
    if (bars.length < MIN_BARS) {
      return 'At least one skill bar is required'
    }

    const hasTemplate = bars.some(b => b.template.trim())
    if (!hasTemplate) {
      return 'At least one skill bar must have a template code'
    }

    // For single builds, the first bar needs a name
    if (!isTeamBuild) {
      if (!bars[0].name.trim()) {
        return 'Build name is required'
      }
      if (bars[0].name.trim().length < MIN_NAME_LENGTH) {
        return `Build name must be at least ${MIN_NAME_LENGTH} characters`
      }
    } else {
      // For team builds, need team name and all bars need names
      if (!teamName.trim()) {
        return 'Team build name is required'
      }
      if (teamName.trim().length < MIN_NAME_LENGTH) {
        return `Team build name must be at least ${MIN_NAME_LENGTH} characters`
      }
      // Check each bar has a name
      for (let i = 0; i < bars.length; i++) {
        if (!bars[i].name.trim()) {
          return `Build ${i + 1} needs a name`
        }
      }
    }

    return null
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
      setOriginalData({ name: teamName, bars, notes, tags })
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
  if (authLoading || isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <ProfessionSpinner />
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
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
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-4">
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
      className="min-h-[calc(100vh-3.5rem)] w-full max-w-4xl mx-auto px-4 py-6 sm:py-8"
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          Edit Build
        </h1>
        <p className="text-sm sm:text-base text-text-secondary">
          Update your build details
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tags - what is this build for? */}
        <BuildTagsSelector value={tags} onChange={setTags} />

        {/* Team build name - only shown for 2+ builds */}
        <AnimatePresence>
          {isTeamBuild && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Input
                label="Team Build Name"
                placeholder="e.g., 7-Hero Mesmerway"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                hint="Give your team composition a name"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill bars */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-3">
            {isTeamBuild
              ? `Team Builds (${bars.length}/${MAX_BARS})`
              : 'Your Build'}
          </label>

          <motion.div
            className="space-y-4"
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
          >
            {bars.map((bar, index) => (
              <SkillBarEditor
                key={index}
                index={index}
                totalBars={bars.length}
                data={bar}
                onChange={bar => updateBar(index, bar)}
                onRemove={
                  bars.length > MIN_BARS ? () => removeBar(index) : undefined
                }
                onMoveUp={() => moveBarUp(index)}
                onMoveDown={() => moveBarDown(index)}
                canRemove={bars.length > MIN_BARS}
              />
            ))}
          </motion.div>

          {/* Add bar button */}
          {bars.length < MAX_BARS && (
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={addBar}
              leftIcon={<Plus className="w-4 h-4" />}
              className="mt-4"
              noLift
            >
              Add another build
            </Button>
          )}
        </div>

        {/* Notes */}
        <NotesEditor value={notes} onChange={setNotes} />

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting || !hasChanges()}
            className="flex-1 sm:flex-initial sm:min-w-[200px]"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.push(`/b/${buildId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            size="lg"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSubmitting}
            leftIcon={<Trash2 className="w-4 h-4" />}
            className="sm:ml-auto"
          >
            Delete
          </Button>
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

      {/* Loading overlay */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <div className="bg-bg-card border-2 border-accent-gold rounded-[var(--radius-lg)] p-6 text-center">
              <ProfessionSpinner className="mx-auto mb-3" />
              <p className="text-text-primary font-medium">Saving changes...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved changes warning */}
      {typeof window !== 'undefined' && (
        <BeforeUnloadWarning enabled={!isSubmitting && hasChanges()} />
      )}
    </motion.div>
  )
}

/**
 * Component that warns user before leaving with unsaved changes
 */
function BeforeUnloadWarning({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [enabled])

  return null
}
