/**
 * @fileoverview Skill Bar Editor
 * @module components/editor/skill-bar-editor
 *
 * Editor card for a single skill bar with magical decode animation.
 */

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronUp, ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PROFESSION_COLORS, MAX_BAR_NAME_LENGTH, MAX_VARIANT_NAME_LENGTH } from '@/lib/constants'
import { sanitizeSingleLine } from '@/lib/validation'
import { useVariantData } from '@/hooks'
import type { DecodedTemplate } from '@/lib/gw/decoder'
import type { Skill } from '@/lib/gw/skills'
import { getSkillsByIds } from '@/lib/gw/skills'
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'
import { PlayerCountControl } from '@/components/ui/player-count-control'
import { VariantTabs } from '@/components/ui/variant-tabs'
import type { ProfessionKey } from '@/types/gw1'
import type { SkillBarVariant } from '@/types/database'
import { BuildCard } from './build-card'
import { TemplateInput } from './template-input'

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
}

const emptySkillBarData: Partial<SkillBarData> = {
  template: '',
  primary: '',
  secondary: '',
  attributes: {},
  skills: [],
  playerCount: 1,
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
}: SkillBarEditorProps) {
  const [loadedSkills, setLoadedSkills] = useState<(Skill | null)[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [templateCode, setTemplateCode] = useState(data.template)
  const [justDecoded, setJustDecoded] = useState(false)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)

  // Track last loaded skills to prevent re-fetches
  const lastSkillsRef = useRef<string>('')

  // Use shared hook for variant data
  const { allVariants, currentVariant, hasVariants } = useVariantData(data, activeVariantIndex)

  // Sync template code from current variant
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync local state with parent prop
    setTemplateCode(currentVariant.template)
  }, [currentVariant.template])

  // Load skill data when skill IDs change (for current variant)
  useEffect(() => {
    const skills = currentVariant.skills
    if (!skills || skills.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async data loading from skills change
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

  // Check if current variant has skills (for showing decoded content)
  const hasSkills = currentVariant.skills && currentVariant.skills.some(s => s !== 0)
  // Check if base bar has skills (for card active state)
  const baseHasSkills = data.skills && data.skills.some(s => s !== 0)
  const isFirst = index === 0
  const isLast = index === totalBars - 1
  const showReorderControls = totalBars > 1

  const primaryColor = PROFESSION_COLORS[data.primary] || PROFESSION_COLORS.None
  const secondaryColor =
    PROFESSION_COLORS[data.secondary] || PROFESSION_COLORS.None

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
        <div className="p-4 pt-6">
          {/* Build name */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Name
            </label>
            <input
              type="text"
              value={data.name}
              onChange={e => onChange({ ...data, name: e.target.value })}
              placeholder="Give this build a name..."
              maxLength={MAX_BAR_NAME_LENGTH}
              className={cn(
                'w-full px-3 py-2 rounded-lg',
                'bg-bg-primary border border-border',
                'text-text-primary placeholder:text-text-muted/50 placeholder:text-sm',
                'focus:outline-none focus:border-accent-gold',
                'transition-colors'
              )}
            />
          </div>

          {/* Variant tabs - show when base has skills or variants exist */}
          {(baseHasSkills || hasVariants) && (
            <div className="mb-3">
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
                <div className="mb-3">
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Variant Name <span className="text-text-muted font-normal">(optional)</span>
                  </label>
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
                      // Sanitize on blur: remove control chars, collapse spaces, trim
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
                    placeholder="e.g., Anti-Caster, Budget..."
                    maxLength={MAX_VARIANT_NAME_LENGTH}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg',
                      'bg-bg-primary border border-border',
                      'text-text-primary placeholder:text-text-muted/50 placeholder:text-sm',
                      'focus:outline-none focus:border-accent-gold',
                      'transition-colors'
                    )}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Template section */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Template Code
            </label>

            {!hasSkills ? (
              /* Empty state - show input */
              <TemplateInput
                value={templateCode}
                onChange={setTemplateCode}
                onDecode={handleDecode}
                label=""
                placeholder="OgVBkpIT..."
              />
            ) : (
              /* Decoded state - show code inline */
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <code className="flex-1 px-2.5 py-1.5 bg-bg-primary/50 border border-border/50 rounded-lg text-xs font-mono text-text-muted truncate">
                  {templateCode}
                </code>
                <button
                  type="button"
                  onClick={handleCopyTemplate}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium',
                    'transition-colors cursor-pointer',
                    showCopied
                      ? 'bg-accent-green/10 text-accent-green'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
                  )}
                >
                  {showCopied ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Decoded content - skills and attributes */}
          <AnimatePresence>
            {hasSkills && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="space-y-3 overflow-hidden"
              >
                {/* Profession badge and player count row */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center justify-between gap-3"
                >
                  {/* Profession badge */}
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold"
                    style={{
                      borderColor: `${primaryColor}40`,
                      backgroundColor: `${primaryColor}12`,
                    }}
                  >
                    <ProfessionIcon
                      profession={data.primary.toLowerCase() as ProfessionKey}
                      size="sm"
                    />
                    <span style={{ color: primaryColor }}>{data.primary}</span>
                    {data.secondary && data.secondary !== 'None' && (
                      <>
                        <span className="text-text-muted/40 mx-0.5">/</span>
                        <ProfessionIcon
                          profession={
                            data.secondary.toLowerCase() as ProfessionKey
                          }
                          size="sm"
                        />
                        <span style={{ color: secondaryColor }}>
                          {data.secondary}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Player count control - always show so single builds can specify multiples */}
                  <PlayerCountControl
                    count={data.playerCount || 1}
                    onChange={count => onChange({ ...data, playerCount: count })}
                    profession={data.primary.toLowerCase() as ProfessionKey}
                    max={
                      totalTeamPlayers !== undefined
                        ? maxTeamPlayers - totalTeamPlayers + (data.playerCount || 1)
                        : maxTeamPlayers
                    }
                  />
                </motion.div>

                {/* Skills */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="text-xs font-medium text-text-secondary mb-2">
                    Skills
                  </div>
                  {isLoadingSkills ? (
                    <div className="flex items-center justify-center py-4">
                      <ProfessionSpinner />
                    </div>
                  ) : (
                    <SkillBar skills={loadedSkills} size="lg" />
                  )}
                </motion.div>

                {/* Attributes */}
                {currentVariant.attributes && Object.keys(currentVariant.attributes).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="text-xs font-medium text-text-secondary mb-2">
                      Attributes
                    </div>
                    <AttributeBar attributes={currentVariant.attributes} />
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </BuildCard>
    </motion.div>
  )
}
