'use client'

/**
 * @fileoverview Build creation form component
 * @module app/new/new-build-form
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Share2, Users } from 'lucide-react'
import { trackBuildCreated } from '@/lib/analytics'
import { useAuth } from '@/components/providers/auth-provider'
import { useAuthModal } from '@/components/auth/auth-modal'
import { useBuildDraft } from '@/hooks/use-build-draft'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { TeamSummary } from '@/components/editor/team-summary'
import { NotesEditor } from '@/components/editor/notes-editor'
import { TagsSection } from '@/components/editor/tags-section'
import { PrivacyToggle } from '@/components/editor/privacy-toggle'
import { CollaboratorsModal, type PendingCollaborator } from '@/components/editor/collaborators-modal'
import { Button } from '@/components/ui/button'
import { OverflowMenu } from '@/components/ui/overflow-menu'
import { SubmitOverlay } from '@/components/ui/submit-overlay'
import { pageTransitionVariants, listContainerVariants } from '@/lib/motion'
import { cn } from '@/lib/utils'
import {
  MAX_BARS,
  MIN_BARS,
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_BAR_NAME_LENGTH,
  MIN_MEANINGFUL_TEMPLATE_LENGTH,
  MIN_MEANINGFUL_NAME_LENGTH,
  MIN_MEANINGFUL_NOTES_LENGTH,
  MIN_MEANINGFUL_TAG_COUNT,
  MAX_TEAM_PLAYERS,
} from '@/lib/constants'
import { extractTextFromTiptap } from '@/lib/search/text-utils'
import { encodeShareableUrl, decodeShareableUrl } from '@/lib/share'
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

// Stored in localStorage to survive OAuth page reload
const PENDING_PUBLISH_KEY = 'gw1builds:pendingPublish'

type DraftData = {
  name: string
  bars: SkillBar[]
  notes: TipTapDocument
  tags: string[]
  is_private?: boolean
  collaborators?: PendingCollaborator[]
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
  const { user, profile } = useAuth()
  const { openModal } = useAuthModal()

  const [teamName, setTeamName] = useState('')
  const [bars, setBars] = useState<SkillBar[]>([{ ...EMPTY_SKILL_BAR }])
  const [notes, setNotes] = useState<TipTapDocument>(EMPTY_NOTES)
  const [tags, setTags] = useState<string[]>([])
  const [isPrivate, setIsPrivate] = useState(false)
  const [pendingCollaborators, setPendingCollaborators] = useState<PendingCollaborator[]>([])

  const { saveDraft, loadDraft, clearDraft } =
    useBuildDraft<DraftData>('new-build')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    teamName?: boolean
    barNames?: number[] // indices of bars with missing names
  }>({})
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false)
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false)
  const [barsWithInvalidSkills, setBarsWithInvalidSkills] = useState<Set<number>>(new Set())
  const draftChecked = useRef(false)
  const urlChecked = useRef(false)
  const formRef = useRef<HTMLFormElement>(null)

  const totalTeamPlayers = bars.reduce((sum, bar) => sum + (bar.playerCount || 1), 0)
  const isTeamBuild = bars.length > 1 || totalTeamPlayers > 1

  // Helper to populate form from draft data
  const applyDraft = (draft: DraftData) => {
    setTeamName(draft.name)
    setBars(draft.bars)
    setNotes(draft.notes)
    setTags(draft.tags)
    setIsPrivate(draft.is_private ?? false)
    setPendingCollaborators(draft.collaborators ?? [])
    setShowDraftPrompt(false)
  }

  // Load shared build from URL params (once on mount)
  useEffect(() => {
    if (urlChecked.current) return
    urlChecked.current = true

    const shared = decodeShareableUrl(new URLSearchParams(window.location.search))
    if (shared) {
      setTeamName(shared.name)
      setBars(shared.bars)
      setTags(shared.tags)
      setShowDraftPrompt(false)
      window.history.replaceState({}, '', '/new')
    }
  }, [])

  // Check for saved draft on mount (once)
  useEffect(() => {
    if (draftChecked.current) return
    draftChecked.current = true

    const draft = loadDraft()
    if (!draft || !draftIsMeaningful(draft)) return

    const currentData = { name: teamName, bars, notes, tags, is_private: isPrivate }
    if (JSON.stringify(draft) !== JSON.stringify(currentData)) {
      setShowDraftPrompt(true)
    }
  }, [loadDraft, teamName, bars, notes, tags, isPrivate])

  // Handle pending publish after OAuth callback - wait for username to be set
  useEffect(() => {
    if (!user || !profile?.username) return

    const pendingPublish = localStorage.getItem(PENDING_PUBLISH_KEY)
    if (!pendingPublish) return

    localStorage.removeItem(PENDING_PUBLISH_KEY)

    const draft = loadDraft()
    if (draft && draftIsMeaningful(draft)) {
      applyDraft(draft)
      setShouldAutoSubmit(true)
    }
  }, [user, profile?.username, loadDraft])

  // Auto-submit when flag is set (after draft is restored)
  useEffect(() => {
    if (!shouldAutoSubmit) return
    setShouldAutoSubmit(false)
    formRef.current?.requestSubmit()
  }, [shouldAutoSubmit])

  // Save draft on blur/visibility change
  useEffect(() => {
    const currentData = {
      name: teamName,
      bars,
      notes,
      tags,
      is_private: isPrivate,
      collaborators: pendingCollaborators,
    }

    const handleSave = () => {
      if (draftIsMeaningful(currentData)) {
        saveDraft(currentData)
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden) handleSave()
    }

    window.addEventListener('blur', handleSave)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('blur', handleSave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [teamName, bars, notes, tags, isPrivate, pendingCollaborators, saveDraft])

  const restoreDraft = () => {
    const draft = loadDraft()
    if (draft) applyDraft(draft)
  }

  const dismissDraft = () => {
    clearDraft()
    setShowDraftPrompt(false)
  }

  const handleShareDraft = useCallback(async () => {
    setError(null)
    const buildName = isTeamBuild ? teamName.trim() : bars[0]?.name.trim() || ''
    const { url, truncated, truncationMessage } = encodeShareableUrl(buildName, bars, tags)

    try {
      await navigator.clipboard.writeText(url)
      const message = truncated && truncationMessage
        ? `Link copied! (${truncationMessage})`
        : 'Link copied to clipboard!'
      setShareMessage(message)
      setTimeout(() => setShareMessage(null), 3000)
    } catch {
      setError('Failed to copy link. Please copy manually from the address bar.')
    }
  }, [isTeamBuild, teamName, bars, tags])

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

  const validateForm = (): string | null => {
    const newFieldErrors: typeof fieldErrors = {}
    let errorMessage: string | null = null

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

    // Validate BEFORE auth check so users see errors immediately
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    // Auth-on-save: if not signed in, save draft and open auth modal
    if (!user) {
      const currentData = {
        name: teamName,
        bars,
        notes,
        tags,
        is_private: isPrivate,
        collaborators: pendingCollaborators,
      }
      if (draftIsMeaningful(currentData)) {
        saveDraft(currentData)
      }
      // Set pending publish flag in localStorage (survives OAuth page reload)
      localStorage.setItem(PENDING_PUBLISH_KEY, 'true')
      openModal()
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
          is_private: isPrivate,
          collaborators: pendingCollaborators.map(c => c.username),
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

  return (
    <motion.div
      className="min-h-[calc(100dvh-3.5rem)] w-full max-w-3xl mx-auto px-4 py-6 sm:py-8"
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
      <form
        ref={formRef}
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

        {/* Team summary - name input + overview (appears after adding team members) */}
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

        {/* Privacy Toggle */}
        <PrivacyToggle isPrivate={isPrivate} onChange={setIsPrivate} />

        {/* Error message */}
        {error && (
          <div className="p-3 rounded-lg bg-accent-red/10 border border-accent-red/20">
            <p className="text-sm text-accent-red">{error}</p>
          </div>
        )}

        {/* Share success message */}
        <AnimatePresence>
          {shareMessage && (
            <motion.div
              role="status"
              aria-live="polite"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-lg bg-accent-green/10 border border-accent-green/20"
            >
              <p className="text-sm text-accent-green">{shareMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action buttons */}
        {/* Mobile: Publish full-width, then Cancel + ... row */}
        {/* Desktop: All three in one row, right-aligned */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:min-w-[200px]"
          >
            {isSubmitting
              ? 'Publishing...'
              : user
                ? 'Publish Build'
                : 'Sign in to Publish'}
          </Button>

          {/* Secondary actions - row on mobile, inline on desktop */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => router.push('/')}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>

            <OverflowMenu
              disabled={isSubmitting}
              items={[
                {
                  label: 'Share Draft',
                  icon: <Share2 className="w-4 h-4" />,
                  onClick: handleShareDraft,
                },
                ...(user
                  ? [
                      {
                        label: pendingCollaborators.length > 0
                          ? `Collaborators (${pendingCollaborators.length})`
                          : 'Add Collaborators...',
                        icon: <Users className="w-4 h-4" />,
                        onClick: () => setShowCollaboratorsModal(true),
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        </div>
      </form>

      {/* Collaborators Modal */}
      <CollaboratorsModal
        mode="draft"
        isOpen={showCollaboratorsModal}
        onClose={() => setShowCollaboratorsModal(false)}
        pendingCollaborators={pendingCollaborators}
        onPendingChange={setPendingCollaborators}
      />

      {/* Loading overlay */}
      <SubmitOverlay isVisible={isSubmitting} message="Creating your build..." />

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
