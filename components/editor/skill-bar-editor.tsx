/**
 * @fileoverview Skill Bar Editor
 * @module components/editor/skill-bar-editor
 *
 * Editor card for a single skill bar with:
 * - Template code paste (existing)
 * - Click-to-add skill picker (new)
 */

'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  useFloating,
  offset,
  flip,
  shift,
  useClick,
  useDismiss,
  useInteractions,
  FloatingPortal,
  autoUpdate,
} from '@floating-ui/react'
import { X, ChevronUp, ChevronDown, Copy, Check, Plus, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { modalOverlayVariants, modalContentVariants } from '@/lib/motion'
import { MAX_BAR_NAME_LENGTH, MAX_VARIANT_NAME_LENGTH, PROFESSION_COLORS } from '@/lib/constants'
import { sanitizeSingleLine } from '@/lib/validation'
import { useVariantData } from '@/hooks'
import { encodeTemplate, decodeTemplate, type DecodedTemplate } from '@/lib/gw/decoder'
import type { Skill } from '@/lib/gw/skills'
import { getSkillsByIds } from '@/lib/gw/skills'
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { Input } from '@/components/ui/input'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'
import { ProfessionPicker } from '@/components/ui/profession-picker'
import { VariantTabs } from '@/components/ui/variant-tabs'
import { type Profession } from '@/types/gw1'
import type { SkillBarVariant } from '@/types/database'
import { BuildCard } from './build-card'
import { SpotlightSkillPicker } from './skill-picker'

export interface SkillBarData {
  name: string
  hero: string | null
  template: string
  primary: string
  secondary: string
  attributes: Record<string, number>
  skills: number[]
  playerCount?: number
  variants?: SkillBarVariant[]
}

export interface SkillBarEditorProps {
  index: number
  totalBars: number
  data: SkillBarData
  onChange: (data: SkillBarData) => void
  onRemove?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canRemove?: boolean
  className?: string
  /** Total players across all bars (for validation) */
  totalTeamPlayers?: number
  /** Maximum team size */
  maxTeamPlayers?: number
  /** Callback when validation state changes (true = has errors) */
  onValidationChange?: (hasErrors: boolean) => void
}

const emptySkillBarData: Partial<SkillBarData> = {
  template: '',
  primary: '',
  secondary: '',
  attributes: {},
  skills: [],
  playerCount: 1,
}

/** Increment/decrement button for team copies */
function TeamCopiesControl({
  count,
  onChange,
  totalTeamPlayers,
  maxTeamPlayers = 12,
}: {
  count: number
  onChange: (count: number) => void
  totalTeamPlayers?: number
  maxTeamPlayers?: number
}): React.ReactElement {
  const canDecrement = count > 1
  const maxAllowed = totalTeamPlayers !== undefined
    ? maxTeamPlayers - totalTeamPlayers + count
    : maxTeamPlayers
  const canIncrement = count < maxAllowed

  const stepperButtonClass = (enabled: boolean): string =>
    cn(
      'w-7 h-7 rounded-md flex items-center justify-center border transition-colors',
      enabled
        ? 'border-border text-text-secondary hover:text-text-primary hover:border-border-hover hover:bg-bg-hover cursor-pointer'
        : 'border-border/50 text-text-muted/30 cursor-not-allowed'
    )

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
      <Users className="w-4 h-4 text-text-muted shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">Team copies</div>
        <div className="text-xs text-text-muted">Players running this build</div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onChange(count - 1)}
          disabled={!canDecrement}
          className={stepperButtonClass(canDecrement)}
        >
          <span className="text-base leading-none">−</span>
        </button>
        <div className="w-8 text-center text-sm font-bold text-text-primary tabular-nums">
          {count}
        </div>
        <button
          type="button"
          onClick={() => onChange(count + 1)}
          disabled={!canIncrement}
          className={stepperButtonClass(canIncrement)}
        >
          <span className="text-base leading-none">+</span>
        </button>
      </div>
    </div>
  )
}

/** Styled pill containing primary/secondary profession pickers */
function ProfessionPickerPill({
  primary,
  secondary,
  onPrimaryChange,
  onSecondaryChange,
}: {
  primary: string
  secondary: string | null
  onPrimaryChange: (profession: string) => void
  onSecondaryChange: (profession: string) => void
}): React.ReactElement {
  const profColor = PROFESSION_COLORS[primary] || PROFESSION_COLORS.Warrior

  return (
    <div
      className="inline-flex items-center rounded-full border px-2 py-1"
      style={{
        borderColor: `${profColor}40`,
        backgroundColor: `${profColor}12`,
      }}
    >
      {/* Mobile: abbreviations */}
      <div className="contents sm:hidden">
        <ProfessionPicker
          value={primary}
          onChange={onPrimaryChange}
          exclude={secondary}
          placeholder="W"
          size="sm"
        />
        <span className="text-text-muted/40 mx-1">/</span>
        <ProfessionPicker
          value={secondary}
          onChange={onSecondaryChange}
          exclude={primary}
          allowNone
          placeholder="Any"
          size="sm"
        />
      </div>
      {/* Desktop: full names */}
      <div className="hidden sm:contents">
        <ProfessionPicker
          value={primary}
          onChange={onPrimaryChange}
          exclude={secondary}
          placeholder="Warrior"
          showFullName
          size="sm"
        />
        <span className="text-text-muted/40 mx-1">/</span>
        <ProfessionPicker
          value={secondary}
          onChange={onSecondaryChange}
          exclude={primary}
          allowNone
          placeholder="Any"
          showFullName
          size="sm"
        />
      </div>
    </div>
  )
}

export function SkillBarEditor({
  index,
  totalBars,
  data,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  canRemove = false,
  className,
  totalTeamPlayers,
  maxTeamPlayers = 12,
  onValidationChange,
}: SkillBarEditorProps) {
  const [loadedSkills, setLoadedSkills] = useState<(Skill | null)[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [templateCode, setTemplateCode] = useState(data.template)
  const [justDecoded, setJustDecoded] = useState(false)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)

  // Skill picker state
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null)

  // Settings dropdown state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Clear confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const { refs: settingsRefs, floatingStyles: settingsFloatingStyles, context: settingsContext } = useFloating({
    open: isSettingsOpen,
    onOpenChange: setIsSettingsOpen,
    placement: 'bottom-end',
    strategy: 'fixed',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })
  const settingsClick = useClick(settingsContext)
  const settingsDismiss = useDismiss(settingsContext)
  const { getReferenceProps: getSettingsReferenceProps, getFloatingProps: getSettingsFloatingProps } = useInteractions([settingsClick, settingsDismiss])

  // Track last loaded skills to prevent re-fetches
  const lastSkillsRef = useRef<string>('')

  // Use shared hook for variant data
  const { allVariants, currentVariant, hasVariants } = useVariantData(data, activeVariantIndex)

  // Sync template code from current variant
  useEffect(() => {
     
    setTemplateCode(currentVariant.template)
  }, [currentVariant.template])

  // Load skill data when skill IDs change (for current variant)
  useEffect(() => {
    const skills = currentVariant.skills
    if (!skills || skills.length === 0) {
       
      setLoadedSkills([])
      lastSkillsRef.current = ''
      return
    }

    const skillsKey = `${activeVariantIndex}:${skills.join(',')}`
    if (skillsKey === lastSkillsRef.current) return

    setIsLoadingSkills(true)
    lastSkillsRef.current = skillsKey

    getSkillsByIds(skills)
      .then(loadedSkills => setLoadedSkills(loadedSkills.map(s => s || null)))
      .catch(err => {
        console.error('Failed to load skills:', err)
        setLoadedSkills([])
      })
      .finally(() => setIsLoadingSkills(false))
  }, [currentVariant.skills, activeVariantIndex])

  const handleDecode = useCallback(
    (decoded: DecodedTemplate, code: string) => {
      setTemplateCode(code)
      setJustDecoded(true)
      setTimeout(() => setJustDecoded(false), 600)

      if (activeVariantIndex === 0) {
        // Update base bar
        onChange({
          ...data,
          template: code,
          primary: decoded.primary,
          secondary: decoded.secondary,
          attributes: decoded.attributes,
          skills: decoded.skills,
        })
      } else {
        // Update variant
        const newVariants = [...(data.variants || [])]
        newVariants[activeVariantIndex - 1] = {
          ...newVariants[activeVariantIndex - 1],
          template: code,
          attributes: decoded.attributes,
          skills: decoded.skills,
        }
        onChange({ ...data, variants: newVariants })
      }
    },
    [onChange, data, activeVariantIndex]
  )

  const handleClear = () => {
    setTemplateCode('')
    if (activeVariantIndex === 0) {
      onChange({ ...data, ...emptySkillBarData })
    } else {
      // Clear variant data but keep it in the list
      const newVariants = [...(data.variants || [])]
      newVariants[activeVariantIndex - 1] = {
        ...newVariants[activeVariantIndex - 1],
        template: '',
        skills: [],
        attributes: {},
      }
      onChange({ ...data, variants: newVariants })
    }
    lastSkillsRef.current = ''
  }

  const handleAddVariant = () => {
    // Copy current variant as starting point
    const newVariant: SkillBarVariant = {
      template: currentVariant.template,
      skills: [...currentVariant.skills],
      attributes: { ...currentVariant.attributes },
    }
    const newVariants = [...(data.variants || []), newVariant]
    onChange({ ...data, variants: newVariants })
    // Switch to new variant
    setActiveVariantIndex(newVariants.length)
  }

  const handleDeleteVariant = (variantIndex: number) => {
    if (variantIndex === 0) return // Can't delete base
    const newVariants = [...(data.variants || [])]
    newVariants.splice(variantIndex - 1, 1)
    onChange({ ...data, variants: newVariants.length > 0 ? newVariants : undefined })
    // If we deleted the active variant, go back to default
    if (activeVariantIndex >= variantIndex) {
      setActiveVariantIndex(Math.max(0, activeVariantIndex - 1))
    }
  }

  const handleCopyTemplate = async () => {
    if (!templateCode) return
    await navigator.clipboard.writeText(templateCode)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  // Skill picker handlers
  const handleSkillSlotClick = useCallback((slotIndex: number) => {
    setActiveSlotIndex(slotIndex)
    setIsPickerOpen(true)
  }, [])

  const handleSkillSelect = useCallback(
    (skill: Skill) => {
      if (activeSlotIndex === null) return

      // Create new skills array (ensure 8 slots)
      const currentSkills = currentVariant.skills.length === 8
        ? currentVariant.skills
        : Array(8).fill(0)
      const newSkills = [...currentSkills]
      newSkills[activeSlotIndex] = skill.id

      // Auto-set primary profession if not set
      const newPrimary = data.primary || skill.profession

      // Generate new template code from skills
      const newTemplate = encodeTemplate(
        newPrimary,
        data.secondary || 'None',
        currentVariant.attributes || {},
        newSkills
      ) || ''

      if (activeVariantIndex === 0) {
        // Update base bar
        onChange({
          ...data,
          skills: newSkills,
          primary: newPrimary,
          template: newTemplate,
        })
      } else {
        // Update variant
        const newVariants = [...(data.variants || [])]
        newVariants[activeVariantIndex - 1] = {
          ...newVariants[activeVariantIndex - 1],
          skills: newSkills,
          template: newTemplate,
        }
        onChange({ ...data, variants: newVariants })
      }

      // Update local template code state
      setTemplateCode(newTemplate)

      // Close picker
      setIsPickerOpen(false)
      setActiveSlotIndex(null)
    },
    [activeSlotIndex, activeVariantIndex, currentVariant.skills, currentVariant.attributes, data, onChange]
  )

  const handlePickerClose = useCallback(() => {
    setIsPickerOpen(false)
    setActiveSlotIndex(null)
  }, [])

  // Check if current variant has skills (for showing decoded content)
  const hasSkills = currentVariant.skills && currentVariant.skills.some(s => s !== 0)
  // Check if base bar has skills (for card active state)
  const baseHasSkills = data.skills && data.skills.some(s => s !== 0)
  const isFirst = index === 0
  const isLast = index === totalBars - 1
  const showReorderControls = totalBars > 1

  // Validate skills against current professions
  const invalidSkillIndices = useMemo(() => {
    if (!loadedSkills.length || (!data.primary && !data.secondary)) return []

    const validProfessions = new Set<string>(['No Profession'])
    if (data.primary) validProfessions.add(data.primary)
    if (data.secondary && data.secondary !== 'None') validProfessions.add(data.secondary)

    return loadedSkills
      .map((skill, index) => (skill?.profession && !validProfessions.has(skill.profession) ? index : -1))
      .filter(index => index !== -1)
  }, [loadedSkills, data.primary, data.secondary])

  // Notify parent of validation changes
  useEffect(() => {
    onValidationChange?.(invalidSkillIndices.length > 0)
  }, [invalidSkillIndices.length, onValidationChange])

  // Profession change handlers
  const handlePrimaryChange = useCallback((profession: string) => {
    const newTemplate = encodeTemplate(
      profession,
      data.secondary || 'None',
      currentVariant.attributes || {},
      currentVariant.skills || []
    ) || ''

    onChange({
      ...data,
      primary: profession,
      template: newTemplate,
    })
    setTemplateCode(newTemplate)
  }, [data, currentVariant.attributes, currentVariant.skills, onChange])

  const handleSecondaryChange = useCallback((profession: string) => {
    const newTemplate = encodeTemplate(
      data.primary || 'None',
      profession,
      currentVariant.attributes || {},
      currentVariant.skills || []
    ) || ''

    onChange({
      ...data,
      secondary: profession,
      template: newTemplate,
    })
    setTemplateCode(newTemplate)
  }, [data, currentVariant.attributes, currentVariant.skills, onChange])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      <BuildCard active={baseHasSkills}>
        {/* Number badge */}
        <div className="absolute -top-2 -left-2 z-10">
          <motion.div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              'text-sm font-bold shadow-lg',
              hasSkills
                ? 'bg-accent-gold text-bg-primary ring-2 ring-accent-gold/30'
                : 'bg-bg-card text-text-secondary border-2 border-border'
            )}
            animate={justDecoded ? { scale: [1, 1.2, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            {index + 1}
          </motion.div>
        </div>

        {/* Controls - top right */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-0.5">
          {showReorderControls && (
            <>
              {!isFirst && onMoveUp && (
                <button
                  type="button"
                  onClick={onMoveUp}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover cursor-pointer transition-colors"
                  aria-label="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
              {!isLast && onMoveDown && (
                <button
                  type="button"
                  onClick={onMoveDown}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover cursor-pointer transition-colors"
                  aria-label="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          {canRemove && onRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 cursor-pointer transition-colors"
              aria-label="Remove"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pt-10 sm:p-6 sm:pt-12">
          {/* Row 1: Build name */}
          <div className="w-full mb-4">
            <Input
              value={data.name}
              onChange={e => onChange({ ...data, name: e.target.value })}
              placeholder="Build name..."
              maxLength={MAX_BAR_NAME_LENGTH}
            />
          </div>

          {/* Row 2: Professions + Settings */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {/* Profession pickers - pill container */}
            <ProfessionPickerPill
              primary={data.primary || 'Warrior'}
              secondary={data.secondary && data.secondary !== 'None' ? data.secondary : null}
              onPrimaryChange={handlePrimaryChange}
              onSecondaryChange={handleSecondaryChange}
            />

            {/* Right side: badge + settings */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Team copies badge (when > 1) */}
              {(data.playerCount || 1) > 1 && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-bg-hover text-xs text-text-secondary">
                  <Users className="w-3 h-3" />
                  <span>×{data.playerCount}</span>
                </div>
              )}

              {/* Settings dropdown trigger */}
              <button
                ref={settingsRefs.setReference}
                type="button"
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-1.5 sm:px-2.5 rounded-lg text-xs',
                  'border border-border transition-colors cursor-pointer',
                  'text-text-muted hover:text-text-secondary hover:border-border-hover hover:bg-bg-hover',
                  isSettingsOpen && 'bg-bg-hover text-text-secondary border-border-hover'
                )}
                {...getSettingsReferenceProps()}
                aria-label="Build options"
              >
                <Settings className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Options</span>
              </button>

              {/* Settings dropdown */}
              {isSettingsOpen && (
                <FloatingPortal>
                  <div
                    // eslint-disable-next-line react-hooks/refs -- Floating UI pattern uses callback ref
                    ref={settingsRefs.setFloating}
                    style={settingsFloatingStyles}
                    className="z-50"
                    {...getSettingsFloatingProps()}
                  >
                    <div className="bg-bg-elevated border border-border rounded-xl shadow-xl overflow-hidden min-w-[240px] p-2">
                      {/* Add variant option */}
                      <button
                        type="button"
                        onClick={() => {
                          handleAddVariant()
                          setIsSettingsOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-hover transition-colors text-left cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-text-muted shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-text-primary">Add skill variant</div>
                          <div className="text-xs text-text-muted">Alternative skill loadout</div>
                        </div>
                      </button>

                      {/* Team copies control */}
                      <TeamCopiesControl
                        count={data.playerCount || 1}
                        onChange={count => onChange({ ...data, playerCount: count })}
                        totalTeamPlayers={totalTeamPlayers}
                        maxTeamPlayers={maxTeamPlayers}
                      />
                    </div>
                  </div>
                </FloatingPortal>
              )}
            </div>
          </div>

          {/* Variants row - only shown when variants exist */}
          {hasVariants && (
            <div className="mb-6">
              <VariantTabs
                variants={allVariants}
                activeIndex={activeVariantIndex}
                onChange={setActiveVariantIndex}
                editable
                onAdd={handleAddVariant}
                onDelete={handleDeleteVariant}
              />
            </div>
          )}

          {/* Variant name input - only for non-default variants */}
          <AnimatePresence>
            {activeVariantIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  value={data.variants?.[activeVariantIndex - 1]?.name || ''}
                  onChange={e => {
                    const newVariants = [...(data.variants || [])]
                    newVariants[activeVariantIndex - 1] = {
                      ...newVariants[activeVariantIndex - 1],
                      name: e.target.value || undefined,
                    }
                    onChange({ ...data, variants: newVariants })
                  }}
                  onBlur={e => {
                    const sanitized = sanitizeSingleLine(e.target.value)
                    if (sanitized !== e.target.value) {
                      const newVariants = [...(data.variants || [])]
                      newVariants[activeVariantIndex - 1] = {
                        ...newVariants[activeVariantIndex - 1],
                        name: sanitized || undefined,
                      }
                      onChange({ ...data, variants: newVariants })
                    }
                  }}
                  placeholder="Variant name..."
                  maxLength={MAX_VARIANT_NAME_LENGTH}
                  className={cn(
                    'w-full px-3 py-1.5 mb-6 rounded-lg text-sm',
                    'bg-transparent border border-border/60',
                    'text-text-primary placeholder:text-text-muted/40',
                    'focus:outline-none focus:border-border-hover',
                    'transition-colors'
                  )}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skills section - the hero */}
          <div className="mb-6">
            {isLoadingSkills ? (
              <div className="flex items-center justify-center py-8">
                <ProfessionSpinner />
              </div>
            ) : (
              <SkillBar
                skills={hasSkills ? loadedSkills : Array(8).fill(null)}
                size="lg"
                editable
                onSkillClick={handleSkillSlotClick}
                activeSlot={activeSlotIndex}
                invalidSlots={invalidSkillIndices}
                emptyVariant="editor"
              />
            )}
          </div>

          {/* Attributes - subtle, only when exist */}
          <AnimatePresence>
            {hasSkills && currentVariant.attributes && Object.keys(currentVariant.attributes).length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden mb-6"
              >
                <AttributeBar attributes={currentVariant.attributes} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="border-t border-dashed border-border/40 mb-5" />

          {/* Template Code */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={templateCode}
              onChange={e => setTemplateCode(e.target.value)}
              onBlur={() => {
                if (templateCode.trim()) {
                  const result = decodeTemplate(templateCode.trim())
                  if (result.success) {
                    handleDecode(result.data, templateCode.trim())
                  }
                }
              }}
              onPaste={e => {
                const pasted = e.clipboardData.getData('text')
                if (pasted) {
                  const result = decodeTemplate(pasted.trim())
                  if (result.success) {
                    handleDecode(result.data, pasted.trim())
                  }
                }
              }}
              placeholder="Paste template code..."
              className={cn(
                'flex-1 h-9 px-3 rounded-lg text-sm font-mono',
                'bg-bg-primary/50 text-text-secondary placeholder:text-text-muted/50',
                'border border-border/50',
                'focus:outline-none focus:border-border',
                'transition-colors'
              )}
            />
            {templateCode && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className={cn(
                    'p-2 rounded-lg transition-colors cursor-pointer',
                    showCopied
                      ? 'text-accent-green bg-accent-green/10'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  )}
                  title="Copy"
                >
                  {showCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="p-2 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                  title="Clear"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Validation warning - bottom of card */}
          {invalidSkillIndices.length > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 text-xs text-accent-red/80"
            >
              {invalidSkillIndices.length} invalid skill{invalidSkillIndices.length > 1 ? 's' : ''} — change profession or remove
            </motion.p>
          )}
        </div>
      </BuildCard>

      {/* Skill Picker Modal */}
      <SpotlightSkillPicker
        isOpen={isPickerOpen}
        onClose={handlePickerClose}
        onSelect={handleSkillSelect}
        currentSkills={loadedSkills.filter((s): s is Skill => s !== null)}
        primaryProfession={(data.primary || null) as Profession | null}
        secondaryProfession={
          data.secondary && data.secondary !== 'None'
            ? (data.secondary as Profession)
            : null
        }
      />

      {/* Clear Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />

            {/* Modal */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-confirm-title"
              className="relative z-10 w-full max-w-xs bg-bg-card border border-border rounded-xl shadow-lg"
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-4">
                <h3 id="clear-confirm-title" className="text-sm font-semibold text-text-primary mb-2">
                  Clear build?
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  This will remove all skills and reset the template code.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-text-secondary bg-bg-secondary border border-border rounded-lg hover:bg-bg-hover transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleClear()
                      setShowClearConfirm(false)
                    }}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-accent-red rounded-lg hover:bg-accent-red/90 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
