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
import { PROFESSION_COLORS, MAX_BAR_NAME_LENGTH } from '@/lib/constants'
import type { DecodedTemplate } from '@/lib/gw/decoder'
import type { Skill } from '@/lib/gw/skills'
import { getSkillsByIds } from '@/lib/gw/skills'
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { ProfessionSpinner } from '@/components/ui/profession-spinner'
import type { ProfessionKey } from '@/types/gw1'
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
}

const emptySkillBarData: Partial<SkillBarData> = {
  template: '',
  primary: '',
  secondary: '',
  attributes: {},
  skills: [],
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
}: SkillBarEditorProps) {
  const [loadedSkills, setLoadedSkills] = useState<(Skill | null)[]>([])
  const [isLoadingSkills, setIsLoadingSkills] = useState(false)
  const [showCopied, setShowCopied] = useState(false)
  const [templateCode, setTemplateCode] = useState(data.template)
  const [justDecoded, setJustDecoded] = useState(false)

  // Track last loaded skills to prevent re-fetches
  const lastSkillsRef = useRef<string>('')

  // Sync template code from parent
  useEffect(() => {
    setTemplateCode(data.template)
  }, [data.template])

  // Load skill data when skill IDs change
  useEffect(() => {
    if (!data.skills || data.skills.length === 0) {
      setLoadedSkills([])
      lastSkillsRef.current = ''
      return
    }

    const skillsKey = data.skills.join(',')
    if (skillsKey === lastSkillsRef.current) return

    setIsLoadingSkills(true)
    lastSkillsRef.current = skillsKey

    getSkillsByIds(data.skills)
      .then(skills => setLoadedSkills(skills.map(s => s || null)))
      .catch(err => {
        console.error('Failed to load skills:', err)
        setLoadedSkills([])
      })
      .finally(() => setIsLoadingSkills(false))
  }, [data.skills])

  const handleDecode = useCallback(
    (decoded: DecodedTemplate, code: string) => {
      setTemplateCode(code)
      setJustDecoded(true)
      setTimeout(() => setJustDecoded(false), 600)

      onChange({
        ...data,
        template: code,
        primary: decoded.primary,
        secondary: decoded.secondary,
        attributes: decoded.attributes,
        skills: decoded.skills,
      })
    },
    [onChange, data]
  )

  const handleClear = () => {
    setTemplateCode('')
    onChange({ ...data, ...emptySkillBarData })
    lastSkillsRef.current = ''
  }

  const handleCopyTemplate = async () => {
    if (!templateCode) return
    await navigator.clipboard.writeText(templateCode)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  const hasSkills = data.skills && data.skills.some(s => s !== 0)
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
      <BuildCard active={hasSkills}>
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
                {/* Profession badge - matching build view style */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold w-fit"
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
                {data.attributes && Object.keys(data.attributes).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <div className="text-xs font-medium text-text-secondary mb-2">
                      Attributes
                    </div>
                    <AttributeBar attributes={data.attributes} />
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
