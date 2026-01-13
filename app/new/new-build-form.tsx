'use client'

/**
 * @fileoverview Build creation form component
 * @module app/new/new-build-form
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Share2, Lock } from 'lucide-react'
import { trackBuildCreated } from '@/lib/analytics'
import { useAuth } from '@/components/providers/auth-provider'
import { useAuthModal } from '@/components/auth/auth-modal'
import { useBuildDraft } from '@/hooks/use-build-draft'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { TeamSummary } from '@/components/editor/team-summary'
import { NotesEditor } from '@/components/editor/notes-editor'
import { BuildTagsSelector } from '@/components/editor/build-tags-selector'
import { Button } from '@/components/ui/button'
import { Toggle } from '@/components/ui/toggle'
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

  const { saveDraft, loadDraft, clearDraft } =
    useBuildDraft<DraftData>('new-build')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDraftPrompt, setShowDraftPrompt] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [shouldAutoSubmit, setShouldAutoSubmit] = useState(false)
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
    const currentData = { name: teamName, bars, notes, tags, is_private: isPrivate }

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
  }, [teamName, bars, notes, tags, isPrivate, saveDraft])

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

    // Validate total player count (applies to all builds)
    const totalPlayers = bars.reduce(
      (sum, bar) => sum + (bar.playerCount || 1),
      0
    )
    if (totalPlayers > MAX_TEAM_PLAYERS) {
      return `Total players (${totalPlayers}) exceeds maximum of ${MAX_TEAM_PLAYERS}`
    }

    return null
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
      const currentData = { name: teamName, bars, notes, tags, is_private: isPrivate }
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
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
        {/* Tags - what is this build for? */}
        <BuildTagsSelector value={tags} onChange={setTags} />

        {/* Privacy Toggle */}
        <div
          role="group"
          onClick={(e) => {
            // Only toggle if clicking the container, not the toggle itself
            if ((e.target as HTMLElement).closest('button[role="switch"]')) return
            setIsPrivate(!isPrivate)
          }}
          className="flex items-center justify-between py-3 px-4 bg-bg-secondary rounded-lg border border-border hover:border-border-hover transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-text-muted" />
            <div>
              <span className="text-sm font-medium text-text-primary">Private Build</span>
              <p className="text-xs text-text-muted mt-0.5">
                Only visible to you and people with the link
              </p>
            </div>
          </div>
          <Toggle
            checked={isPrivate}
            onChange={setIsPrivate}
            label="Toggle private build"
          />
        </div>

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
                {totalTeamPlayers} players
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Team summary - overview for collaborators */}
        <TeamSummary bars={bars} />

        {/* Skill bars */}
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
                onChange={bar => updateBar(index, bar)}
                onRemove={
                  bars.length > MIN_BARS ? () => removeBar(index) : undefined
                }
                onMoveUp={() => moveBarUp(index)}
                onMoveDown={() => moveBarDown(index)}
                canRemove={bars.length > MIN_BARS}
                totalTeamPlayers={totalTeamPlayers}
                maxTeamPlayers={MAX_TEAM_PLAYERS}
              />
            </div>
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
        <div className="flex flex-wrap gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="flex-1 sm:flex-initial sm:min-w-[200px]"
          >
            {isSubmitting
              ? 'Publishing...'
              : user
                ? 'Publish Build'
                : 'Sign in to Publish'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={handleShareDraft}
            disabled={isSubmitting}
            leftIcon={<Share2 className="w-4 h-4" />}
          >
            Share Draft
          </Button>

          <Button
            type="button"
            variant="ghost"
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
