'use client'

/**
 * @fileoverview Build creation form component
 * @module app/new/new-build-form
 */

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from 'lucide-react'
import { trackBuildCreated } from '@/lib/analytics'
import { useAuth } from '@/components/providers/auth-provider'
import { useAuthModal } from '@/components/auth/auth-modal'
import { useBuildDraft } from '@/hooks/use-build-draft'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { NotesEditor } from '@/components/editor/notes-editor'
import { BuildTagsSelector } from '@/components/editor/build-tags-selector'
import { Button } from '@/components/ui/button'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'
import { pageTransitionVariants, listContainerVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  MAX_BARS,
  MIN_BARS,
  MAX_NAME_LENGTH,
  MIN_NAME_LENGTH,
  MIN_MEANINGFUL_TEMPLATE_LENGTH,
  MIN_MEANINGFUL_NAME_LENGTH,
  MIN_MEANINGFUL_NOTES_LENGTH,
  MIN_MEANINGFUL_TAG_COUNT,
} from '@/lib/constants'
import { extractTextFromTiptap } from '@/lib/search/text-utils'
import type { SkillBar, TipTapDocument } from '@/types/database'

const EMPTY_SKILL_BAR: SkillBar = {
  name: '',
  hero: null,
  template: '',
  primary: 'Warrior',
  secondary: 'None',
  attributes: {},
  skills: [0, 0, 0, 0, 0, 0, 0, 0],
}

const EMPTY_NOTES: TipTapDocument = {
  type: 'doc',
  content: [],
}

type DraftData = {
  name: string
  bars: SkillBar[]
  notes: TipTapDocument
  tags: string[]
}

/**
 * Check if draft represents meaningful user intent worth saving
 *
 * A draft is considered meaningful if ANY of these conditions are met:
 * 1. Template code is 10+ characters (suggests valid/partial GW1 build code)
 * 2. Name is 5+ characters (team name OR any bar name)
 * 3. Notes contain 20+ characters of actual text
 * 4. 2+ tags selected (suggests intentional choice)
 * 5. Skills have been modified (any non-zero skill ID)
 * 6. Attributes have been set (any attribute with points > 0)
 *
 * This prevents saving drafts from accidental typing or random clicks.
 */
function draftIsMeaningful(data: DraftData): boolean {
  // 1. Check for substantial template codes
  const hasTemplate = data.bars.some(
    b => b.template.trim().length >= MIN_MEANINGFUL_TEMPLATE_LENGTH
  )
  if (hasTemplate) return true

  // 2. Check for substantial names (team name or any bar name)
  if (data.name.trim().length >= MIN_MEANINGFUL_NAME_LENGTH) return true
  const hasBarName = data.bars.some(
    b => b.name.trim().length >= MIN_MEANINGFUL_NAME_LENGTH
  )
  if (hasBarName) return true

  // 3. Check for real notes content
  const notesText = extractTextFromTiptap(data.notes)
  if (notesText.trim().length >= MIN_MEANINGFUL_NOTES_LENGTH) return true

  // 4. Check for multiple tags (intentional selection)
  if (data.tags.length >= MIN_MEANINGFUL_TAG_COUNT) return true

  // 5. Check if any skills have been modified
  const hasSkills = data.bars.some(b => b.skills.some(skillId => skillId > 0))
  if (hasSkills) return true

  // 6. Check if any attributes have been set
  const hasAttributes = data.bars.some(b =>
    Object.values(b.attributes).some(value => value > 0)
  )
  if (hasAttributes) return true

  return false
}

export function NewBuildForm() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { openModal } = useAuthModal()

  const [teamName, setTeamName] = useState('')
  const [bars, setBars] = useState<SkillBar[]>([{ ...EMPTY_SKILL_BAR }])
  const [notes, setNotes] = useState<TipTapDocument>(EMPTY_NOTES)
  const [tags, setTags] = useState<string[]>([])

  const { saveDraft, loadDraft, clearDraft } =
    useBuildDraft<DraftData>('new-build')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const draftChecked = useRef(false)

  const isTeamBuild = bars.length > 1

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      openModal()
    }
  }, [authLoading, user, openModal])

  // Check for draft on mount (once)
  useEffect(() => {
    if (draftChecked.current || authLoading || !user) return
    draftChecked.current = true

    const draft = loadDraft()
    if (draft && draftIsMeaningful(draft)) {
      // Only show prompt if draft differs from current (empty) form
      const currentData = { name: teamName, bars, notes, tags }
      const isDifferent = JSON.stringify(draft) !== JSON.stringify(currentData)
      if (isDifferent) {
        setShowDraftPrompt(true)
      }
    }
  }, [authLoading, user, loadDraft, teamName, bars, notes, tags])

  // Save draft on blur/visibility change
  useEffect(() => {
    if (!user) return

    const currentData = { name: teamName, bars, notes, tags }

    const handleSave = () => {
      if (draftIsMeaningful(currentData)) {
        saveDraft(currentData)
      }
    }

    window.addEventListener('blur', handleSave)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) handleSave()
    })

    return () => {
      window.removeEventListener('blur', handleSave)
      document.removeEventListener('visibilitychange', handleSave)
    }
  }, [teamName, bars, notes, tags, user, saveDraft])

  const restoreDraft = () => {
    const draft = loadDraft()
    if (draft) {
      setTeamName(draft.name)
      setBars(draft.bars)
      setNotes(draft.notes)
      setTags(draft.tags)
      setShowDraftPrompt(false)
    }
  }

  const dismissDraft = () => {
    clearDraft()
    setShowDraftPrompt(false)
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

    // Check if at least one bar has a template
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
      const response = await fetch('/api/builds', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create build')
      }

      // Track build creation
      trackBuildCreated({
        build_id: data.id,
        primary_profession: bars[0]?.primary,
        secondary_profession: bars[0]?.secondary,
        game_mode: tags.find(t =>
          ['PvE', 'PvP', 'GvG', 'HA', 'RA'].includes(t)
        ),
        bar_count: bars.length,
        is_team_build: bars.length > 1,
      })

      // Clear draft and redirect
      clearDraft()
      router.push(`/b/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create build')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center">
        <ProfessionSpinner />
      </div>
    )
  }

  // Don't render form if not authenticated
  if (!user) {
    return (
      <div className="min-h-[calc(100dvh-3.5rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <p className="text-text-secondary">
            Please sign in to create a build
          </p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      className="min-h-[calc(100dvh-3.5rem)] w-full max-w-4xl mx-auto px-4 py-6 sm:py-8"
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
    >
      {/* Header */}
      <h1 className="text-2xl font-bold text-text-primary mb-6">New Build</h1>

      {/* Draft recovery prompt */}
      <AnimatePresence>
        {showDraftPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'mb-6 p-4 rounded-[var(--radius-lg)]',
              'bg-accent-gold/10 border border-accent-gold/20'
            )}
          >
            <p className="text-sm text-text-primary mb-3">
              You have an unsaved draft. Would you like to restore it?
            </p>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" onClick={restoreDraft} noLift>
                Restore Draft
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissDraft} noLift>
                Dismiss
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
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
              className="flex items-center gap-3 pt-2"
            >
              <input
                type="text"
                placeholder="Team build name..."
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                maxLength={MAX_NAME_LENGTH}
                className={cn(
                  'flex-1 h-10 px-3 rounded-lg',
                  'bg-bg-primary border border-border',
                  'text-text-primary placeholder:text-text-muted',
                  'transition-colors duration-150',
                  'hover:border-border-hover',
                  'focus:outline-none focus:border-accent-gold'
                )}
              />
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-gold/15 text-accent-gold whitespace-nowrap">
                {bars.length} builds
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Skill bars */}
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
            noLift
          >
            Add Team Member
          </Button>
        )}

        {/* Notes Editor */}
        <NotesEditor value={notes} onChange={setNotes} />

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:min-w-[200px]"
          >
            {isSubmitting ? 'Publishing...' : 'Publish Build'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={() => router.push('/')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>

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
              <p className="text-text-primary font-medium">
                Creating your build...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unsaved changes warning */}
      {typeof window !== 'undefined' && (
        <BeforeUnloadWarning
          enabled={
            !isSubmitting &&
            (!!teamName || bars.some(b => b.template || b.name))
          }
        />
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
