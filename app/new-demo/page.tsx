'use client'

/**
 * @fileoverview PROTOTYPE: New build page UX redesign
 *
 * Clean card-based layout for build creation:
 * - Card with header (title, author) and footer (branding, build count)
 * - Each row: [Professions] / [Build Name] / [8 Skills] / [Equipment] / [Remove]
 * - Empty rows show template input OR "Build from scratch" option
 * - Publish modal collects metadata at the end
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  X,
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  Share2,
  Sparkles,
  Search,
  Swords,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { decodeTemplate } from '@/lib/gw/decoder'
import { getAllSkills, getSkillsByIds, type Skill } from '@/lib/gw/skills'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { Button } from '@/components/ui/button'
import {
  ATTRIBUTES_BY_PROFESSION,
  PROFESSION_TO_ID,
  ATTRIBUTE_BY_ID,
} from '@/lib/constants'
import { PROFESSIONS, type Profession, professionToKey } from '@/types/gw1'
import { EquipmentEditor, type EquipmentSetConfig } from '@/components/equipment/equipment-editor'

// ============================================
// CONSTANTS
// ============================================

/** All unique attribute names for search matching */
const ALL_ATTRIBUTES = Object.values(ATTRIBUTE_BY_ID).filter(
  (attr, idx, arr) => attr !== 'No Attribute' && arr.indexOf(attr) === idx
)

/** Common profession abbreviations/nicknames for fuzzy matching */
const PROFESSION_ALIASES: Record<string, string> = {
  warr: 'Warrior',
  war: 'Warrior',
  rang: 'Ranger',
  monk: 'Monk',
  mo: 'Monk',
  nec: 'Necromancer',
  necro: 'Necromancer',
  mes: 'Mesmer',
  mesm: 'Mesmer',
  ele: 'Elementalist',
  elem: 'Elementalist',
  sin: 'Assassin',
  ass: 'Assassin',
  rit: 'Ritualist',
  para: 'Paragon',
  derv: 'Dervish',
}

// ============================================
// TYPES
// ============================================

interface BuildBar {
  id: string
  name: string
  template: string
  primary: Profession | null
  secondary: Profession | null
  attributes: Record<string, number>
  skills: (Skill | null)[]
  equipment?: EquipmentSetConfig
  scratchMode?: boolean // When true, show skill bar even if empty
}

interface SkillCategoryMatch {
  type: 'profession' | 'attribute'
  name: string
  count: number
  color?: string
}

interface AttributeGroup {
  attribute: string
  skills: Skill[]
  isCollapsed: boolean
}

// ============================================
// HELPERS
// ============================================

const EMPTY_SKILLS: (Skill | null)[] = [null, null, null, null, null, null, null, null]

function createEmptyBar(): BuildBar {
  return {
    id: crypto.randomUUID(),
    name: '',
    template: '',
    primary: null,
    secondary: null,
    attributes: {},
    skills: [...EMPTY_SKILLS],
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function NewDemoPage() {
  const [bars, setBars] = useState<BuildBar[]>([createEmptyBar()])
  const [showPublishModal, setShowPublishModal] = useState(false)

  // Skill picker state
  const [skillPickerOpen, setSkillPickerOpen] = useState(false)
  const [activeBarIndex, setActiveBarIndex] = useState<number>(0)
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null)

  const isTeamBuild = bars.length > 1
  const hasAnyContent = bars.some(bar => bar.skills.some(s => s !== null) || bar.template)

  // Skill slot click
  const handleSlotClick = (barIndex: number, slotIndex: number) => {
    setActiveBarIndex(barIndex)
    setActiveSlotIndex(slotIndex)
    setSkillPickerOpen(true)
  }

  // Skill selection
  const handleSkillSelect = (skill: Skill) => {
    if (activeSlotIndex === null) return

    setBars(prev => {
      const newBars = [...prev]
      const bar = { ...newBars[activeBarIndex] }
      const newSkills = [...bar.skills]
      newSkills[activeSlotIndex] = skill

      if (!bar.primary && skill.profession && skill.profession !== 'None') {
        bar.primary = skill.profession as Profession
      }

      bar.skills = newSkills
      bar.template = ''
      newBars[activeBarIndex] = bar
      return newBars
    })

    setSkillPickerOpen(false)
    setActiveSlotIndex(null)
  }

  // Profession change
  const handleProfessionChange = (barIndex: number, type: 'primary' | 'secondary', profession: Profession | null) => {
    setBars(prev => {
      const newBars = [...prev]
      const bar = { ...newBars[barIndex] }
      bar[type] = profession
      bar.template = ''
      newBars[barIndex] = bar
      return newBars
    })
  }

  // Equipment change
  const handleEquipmentChange = (barIndex: number, equipment: EquipmentSetConfig) => {
    setBars(prev => {
      const newBars = [...prev]
      const bar = { ...newBars[barIndex] }
      bar.equipment = equipment
      newBars[barIndex] = bar
      return newBars
    })
  }

  // Clear skill slot
  const handleClearSlot = (barIndex: number, slotIndex: number) => {
    setBars(prev => {
      const newBars = [...prev]
      const bar = { ...newBars[barIndex] }
      const newSkills = [...bar.skills]
      newSkills[slotIndex] = null
      bar.skills = newSkills
      bar.template = ''
      newBars[barIndex] = bar
      return newBars
    })
  }

  // Bar management
  const removeBar = (index: number) => {
    if (bars.length <= 1) return
    setBars(prev => prev.filter((_, i) => i !== index))
  }

  const addBar = () => {
    if (bars.length >= 12) return
    setBars(prev => [...prev, createEmptyBar()])
  }

  // Decode template for a specific bar
  const handleDecodeForBar = useCallback(async (barIndex: number, code: string) => {
    if (!code.trim()) return false

    try {
      const decoded = decodeTemplate(code)
      if (decoded.success) {
        const loadedSkills = await getSkillsByIds(decoded.data.skills)
        setBars(prev => {
          const newBars = [...prev]
          newBars[barIndex] = {
            ...newBars[barIndex],
            template: code,
            primary: decoded.data.primary as Profession,
            secondary: decoded.data.secondary as Profession,
            attributes: decoded.data.attributes,
            skills: loadedSkills.map(s => s || null),
          }
          return newBars
        })
        return true
      }
    } catch {
      // Decode failed
    }
    return false
  }, [])

  // Switch bar to scratch mode (show empty skill bar)
  const handleSwitchToScratch = useCallback((barIndex: number) => {
    setBars(prev => {
      const newBars = [...prev]
      newBars[barIndex] = {
        ...newBars[barIndex],
        template: '',
        primary: null,
        secondary: null,
        attributes: {},
        skills: [...EMPTY_SKILLS],
        scratchMode: true,
      }
      return newBars
    })
  }, [])

  // Update bar name
  const handleNameChange = useCallback((barIndex: number, name: string) => {
    setBars(prev => {
      const newBars = [...prev]
      newBars[barIndex] = { ...newBars[barIndex], name }
      return newBars
    })
  }, [])

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] w-full max-w-4xl mx-auto px-3 py-4 sm:px-6 sm:py-8">
      {/* Card container */}
      <div className="bg-bg-card rounded-xl sm:rounded-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-border">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-text-primary tracking-tight truncate">
                New Team Build
              </h1>
              <p className="text-[10px] sm:text-xs text-text-muted/60 mt-0.5 uppercase tracking-widest">
                by You
              </p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {hasAnyContent && (
                <>
                  {/* Icon-only on mobile */}
                  <button
                    type="button"
                    className="p-2.5 sm:hidden rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
                    aria-label="Share draft"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Share2 className="w-4 h-4" />}
                    className="hidden sm:flex"
                  >
                    Share
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setShowPublishModal(true)}>
                    Publish
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Build rows */}
        <div className="divide-y divide-border/50">
          {bars.map((bar, index) => (
            <BuildBarRow
              key={bar.id}
              bar={bar}
              index={index}
              totalBars={bars.length}
              onSlotClick={(slotIndex) => handleSlotClick(index, slotIndex)}
              onClearSlot={(slotIndex) => handleClearSlot(index, slotIndex)}
              onProfessionChange={(type, prof) => handleProfessionChange(index, type, prof)}
              onNameChange={(name) => handleNameChange(index, name)}
              onEquipmentChange={(equipment) => handleEquipmentChange(index, equipment)}
              onDecodeTemplate={(code) => handleDecodeForBar(index, code)}
              onSwitchToScratch={() => handleSwitchToScratch(index)}
              onRemove={() => removeBar(index)}
              canRemove={bars.length > 1}
            />
          ))}
        </div>

        {/* Add row */}
        {bars.length < 12 && (
          <button
            type="button"
            onClick={addBar}
            className={cn(
              'w-full py-4 text-sm font-medium transition-colors',
              'text-text-muted/50 hover:text-text-muted active:text-text-primary',
              'hover:bg-bg-hover/50 active:bg-bg-hover'
            )}
          >
            + Add build
          </button>
        )}

        {/* Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-border/50 bg-gradient-to-r from-bg-primary/50 via-bg-primary/30 to-bg-primary/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-accent-gold/40 font-semibold tracking-[0.2em] uppercase">
              GW1Builds
            </span>
            <span className="text-[10px] text-text-muted/40 tabular-nums">
              {bars.length} build{bars.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Skill Picker Modal */}
      <SpotlightSkillPicker
        isOpen={skillPickerOpen}
        onClose={() => {
          setSkillPickerOpen(false)
          setActiveSlotIndex(null)
        }}
        onSelect={handleSkillSelect}
        currentSkills={bars[activeBarIndex]?.skills.filter((s): s is Skill => s !== null) || []}
        primaryProfession={bars[activeBarIndex]?.primary || null}
        secondaryProfession={bars[activeBarIndex]?.secondary || null}
        onProfessionSelect={(prof) => handleProfessionChange(activeBarIndex, 'primary', prof)}
      />

      {/* Publish Modal */}
      <AnimatePresence>
        {showPublishModal && (
          <PublishModal
            bars={bars}
            isTeamBuild={isTeamBuild}
            onClose={() => setShowPublishModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// BUILD BAR ROW - Clean card layout matching user's design
// ============================================

interface BuildBarRowProps {
  bar: BuildBar
  index: number
  totalBars: number
  onSlotClick: (slotIndex: number) => void
  onClearSlot: (slotIndex: number) => void
  onProfessionChange: (type: 'primary' | 'secondary', profession: Profession | null) => void
  onNameChange: (name: string) => void
  onEquipmentChange: (equipment: EquipmentSetConfig) => void
  onDecodeTemplate: (code: string) => Promise<boolean>
  onSwitchToScratch: () => void
  onRemove: () => void
  canRemove: boolean
}

function BuildBarRow({
  bar,
  index,
  totalBars,
  onSlotClick,
  onClearSlot,
  onProfessionChange,
  onNameChange,
  onEquipmentChange,
  onDecodeTemplate,
  onSwitchToScratch,
  onRemove,
  canRemove,
}: BuildBarRowProps) {
  const [showEquipment, setShowEquipment] = useState(false)
  const [templateInput, setTemplateInput] = useState('')
  const [isDecoding, setIsDecoding] = useState(false)
  const [decodeError, setDecodeError] = useState(false)
  const [professionMenuOpen, setProfessionMenuOpen] = useState<'primary' | 'secondary' | null>(null)
  const professionMenuRef = useRef<HTMLDivElement>(null)

  const hasContent = bar.skills.some(s => s !== null) || bar.primary !== null
  const hasEquipment = bar.equipment?.mainHand?.item || bar.equipment?.armor
  const isEmpty = !hasContent && !bar.template && !bar.scratchMode

  // Close profession menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (professionMenuRef.current && !professionMenuRef.current.contains(e.target as Node)) {
        setProfessionMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleDecode = async () => {
    if (!templateInput.trim()) return
    setIsDecoding(true)
    setDecodeError(false)
    const success = await onDecodeTemplate(templateInput.trim())
    setIsDecoding(false)
    if (success) {
      setTemplateInput('')
    } else {
      setDecodeError(true)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleDecode()
    }
  }

  const primaryProf = bar.primary ? PROFESSIONS.find(p => p.name === bar.primary) : null
  const secondaryProf = bar.secondary ? PROFESSIONS.find(p => p.name === bar.secondary) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        delay: index * 0.03,
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="group relative"
    >
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {isEmpty ? (
          /* Empty state: Template input + scratch button - responsive */
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Row number + input */}
            <div className="flex items-center gap-3 flex-1">
              <div className={cn(
                'w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0',
                'bg-gradient-to-br from-accent-gold/20 to-accent-gold/5',
                'text-accent-gold/80 border border-accent-gold/20'
              )}>
                {index + 1}
              </div>
              <input
                type="text"
                value={templateInput}
                onChange={e => { setTemplateInput(e.target.value); setDecodeError(false) }}
                onKeyDown={handleKeyDown}
                placeholder="Paste template code..."
                className={cn(
                  'flex-1 min-w-0 px-3 py-2.5 rounded-lg font-mono text-sm',
                  'bg-bg-primary border',
                  decodeError ? 'border-accent-red/50' : 'border-border',
                  'text-text-primary placeholder:text-text-muted/40',
                  'focus:outline-none focus:border-accent-gold',
                  'transition-all'
                )}
              />
            </div>
            {/* Actions - stack on mobile */}
            <div className="flex items-center gap-2 pl-10 sm:pl-0">
              {templateInput && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleDecode}
                  isLoading={isDecoding}
                >
                  Load
                </Button>
              )}
              <span className="text-text-muted/30 text-sm hidden sm:inline">or</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={onSwitchToScratch}
                className="flex-1 sm:flex-none"
              >
                Build from scratch
              </Button>
            </div>
          </div>
        ) : (
          /* Has content: Responsive stacked layout */
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Header row: Professions + Name + Mobile actions */}
            <div className="flex items-center gap-3">
              {/* Profession icons with dropdown */}
              <div ref={professionMenuRef} className="flex items-center gap-1 flex-shrink-0 relative">
                {/* Primary profession */}
                <button
                  type="button"
                  onClick={() => setProfessionMenuOpen(professionMenuOpen === 'primary' ? null : 'primary')}
                  aria-label={primaryProf ? `Primary: ${primaryProf.name}` : 'Select primary profession'}
                  aria-expanded={professionMenuOpen === 'primary'}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50',
                    primaryProf
                      ? 'hover:ring-2 hover:ring-white/20 active:scale-95'
                      : 'bg-bg-hover/50 ring-1 ring-inset ring-white/[0.06] hover:ring-accent-gold/30'
                  )}
                >
                  {primaryProf ? (
                    <ProfessionIcon profession={professionToKey(primaryProf.name)} size="md" />
                  ) : (
                    <span className="text-[9px] text-text-muted/50 font-medium">Pri</span>
                  )}
                </button>

                {/* Slash separator */}
                <span className="text-text-muted/30 text-sm">/</span>

                {/* Secondary profession */}
                <button
                  type="button"
                  onClick={() => setProfessionMenuOpen(professionMenuOpen === 'secondary' ? null : 'secondary')}
                  aria-label={secondaryProf ? `Secondary: ${secondaryProf.name}` : 'Select secondary profession'}
                  aria-expanded={professionMenuOpen === 'secondary'}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50',
                    secondaryProf
                      ? 'hover:ring-2 hover:ring-white/20 active:scale-95'
                      : 'bg-bg-hover/50 ring-1 ring-inset ring-white/[0.06] hover:ring-accent-gold/30'
                  )}
                >
                  {secondaryProf ? (
                    <ProfessionIcon profession={professionToKey(secondaryProf.name)} size="md" />
                  ) : (
                    <span className="text-[9px] text-text-muted/50 font-medium">Sec</span>
                  )}
                </button>

                {/* Profession dropdown */}
                <AnimatePresence>
                  {professionMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="absolute top-full left-0 mt-2 z-50 bg-bg-elevated border border-border rounded-xl shadow-2xl p-2 min-w-[160px]"
                    >
                      {professionMenuOpen === 'secondary' && (
                        <>
                          <button
                            onClick={() => { onProfessionChange('secondary', null); setProfessionMenuOpen(null) }}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left',
                              !bar.secondary ? 'bg-bg-hover' : 'hover:bg-bg-hover active:bg-bg-hover'
                            )}
                          >
                            <div className="w-5 h-5 rounded-full border border-dashed border-text-muted/50" />
                            <span className="text-sm text-text-muted">None</span>
                          </button>
                          <div className="h-px bg-border my-1" />
                        </>
                      )}
                      {PROFESSIONS.map(p => {
                        const exclude = professionMenuOpen === 'primary' ? bar.secondary : bar.primary
                        const disabled = p.name === exclude
                        const selected = professionMenuOpen === 'primary' ? bar.primary === p.name : bar.secondary === p.name
                        return (
                          <button
                            key={p.key}
                            onClick={() => {
                              if (!disabled) {
                                onProfessionChange(professionMenuOpen, p.name)
                                setProfessionMenuOpen(null)
                              }
                            }}
                            disabled={disabled}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-colors',
                              selected && 'bg-bg-hover',
                              disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover active:bg-bg-hover'
                            )}
                          >
                            <ProfessionIcon profession={p.key} size="sm" />
                            <span className="text-sm text-text-secondary">{p.name}</span>
                          </button>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Build name input - grows on mobile */}
              <input
                type="text"
                value={bar.name}
                onChange={e => onNameChange(e.target.value)}
                placeholder={`Build ${index + 1}`}
                className={cn(
                  'flex-1 sm:w-40 sm:flex-none min-w-0 px-2 py-1.5 rounded text-sm bg-transparent',
                  'text-text-primary placeholder:text-text-muted/40',
                  'border border-white/[0.04] hover:border-border focus:border-accent-gold/50',
                  'focus:outline-none transition-colors'
                )}
              />

              {/* Mobile-only actions (right side of header row) */}
              <div className="flex items-center gap-0.5 sm:hidden ml-auto">
                <button
                  type="button"
                  onClick={() => setShowEquipment(!showEquipment)}
                  className={cn(
                    'p-2.5 rounded-lg transition-all',
                    hasEquipment
                      ? 'text-accent-green'
                      : showEquipment
                        ? 'text-accent-gold'
                        : 'text-text-muted/40'
                  )}
                  aria-label="Equipment"
                >
                  {hasEquipment ? <Check className="w-4 h-4" /> : <Swords className="w-4 h-4" />}
                </button>
                {canRemove && (
                  <button
                    type="button"
                    onClick={onRemove}
                    className="p-2.5 rounded-lg text-text-muted/40 active:text-accent-red"
                    aria-label="Remove build"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Skills - 4x2 grid on mobile, single row on desktop */}
            <div className={cn(
              'grid grid-cols-4 gap-1.5 w-fit mx-auto',
              'sm:flex sm:items-center sm:gap-1 sm:flex-1 sm:mx-0'
            )}>
              {bar.skills.map((skill, slotIndex) => (
                <SkillSlotLarge
                  key={slotIndex}
                  skill={skill}
                  slotIndex={slotIndex}
                  onClick={() => onSlotClick(slotIndex)}
                  onClear={() => onClearSlot(slotIndex)}
                />
              ))}
            </div>

            {/* Desktop-only actions */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowEquipment(!showEquipment)}
                className={cn(
                  'p-2 rounded-lg transition-all flex-shrink-0',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50',
                  hasEquipment
                    ? 'text-accent-green bg-accent-green/10'
                    : showEquipment
                      ? 'text-accent-gold bg-accent-gold/10'
                      : 'text-text-muted/40 hover:text-text-muted hover:bg-bg-hover'
                )}
                title="Equipment"
              >
                {hasEquipment ? <Check className="w-4 h-4" /> : <Swords className="w-4 h-4" />}
              </button>

              {canRemove && (
                <button
                  type="button"
                  onClick={onRemove}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    'text-text-muted/30 hover:text-accent-red hover:bg-accent-red/10',
                    'opacity-0 group-hover:opacity-100',
                    'focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-red/50'
                  )}
                  aria-label="Remove build"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Equipment Section (expandable) */}
      <AnimatePresence>
        {showEquipment && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 sm:px-6 sm:pb-4">
              <div className="sm:pl-20 sm:border-l-2 sm:border-border/30 sm:ml-4">
                <EquipmentEditor
                  value={bar.equipment}
                  onChange={onEquipmentChange}
                  profession={bar.primary ? professionToKey(bar.primary) : undefined}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ============================================
// SKILL SLOT (Large, responsive for main row)
// ============================================

function SkillSlotLarge({
  skill,
  slotIndex,
  onClick,
  onClear,
}: {
  skill: Skill | null
  slotIndex: number
  onClick: () => void
  onClear: () => void
}) {
  const hasSkill = skill !== null
  const isElite = skill?.elite === true

  return (
    <div className="relative group/slot">
      <button
        type="button"
        onClick={onClick}
        aria-label={
          hasSkill
            ? `${skill.name}${isElite ? ' (Elite)' : ''}, slot ${slotIndex + 1}`
            : `Empty skill slot ${slotIndex + 1}, tap to add`
        }
        className={cn(
          // Responsive sizing: 48px mobile, 64px desktop (matches build view lg)
          'w-12 h-12 sm:w-16 sm:h-16',
          'relative rounded overflow-hidden transition-all duration-150',
          // Touch feedback on mobile, hover scale on desktop
          'active:scale-95 sm:active:scale-100 sm:hover:scale-105 sm:hover:z-10',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold',
          hasSkill
            ? isElite
              // Enhanced elite glow
              ? 'ring-2 ring-accent-gold shadow-[0_0_20px_rgba(232,184,73,0.4),inset_0_0_8px_rgba(232,184,73,0.2)]'
              : 'ring-1 ring-white/10'
            // Empty slot with subtle gradient
            : 'bg-gradient-to-br from-black/40 to-black/60 ring-1 ring-white/[0.08] active:ring-accent-gold/50 sm:hover:ring-accent-gold/40'
        )}
      >
        {hasSkill ? (
          <Image
            src={getSkillIconUrlById(skill.id)}
            alt={skill.name}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <Plus className="w-3.5 h-3.5 text-text-muted/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group-hover/slot:text-accent-gold/50 transition-colors" />
        )}
      </button>

      {/* Clear button - always visible on mobile, hover on desktop */}
      {hasSkill && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear() }}
          aria-label={`Remove ${skill.name}`}
          className={cn(
            'absolute -top-1 -right-1 w-4 h-4 sm:w-4 sm:h-4',
            'bg-bg-elevated rounded-full border border-border',
            'flex items-center justify-center',
            // Always visible on mobile (no hover), hover reveal on desktop
            'opacity-100 sm:opacity-0 sm:group-hover/slot:opacity-100',
            'transition-opacity',
            'active:bg-accent-red active:border-accent-red active:text-white',
            'sm:hover:bg-accent-red sm:hover:border-accent-red sm:hover:text-white'
          )}
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  )
}

// ============================================
// SPOTLIGHT SKILL PICKER (Full GW1-style from prototype)
// ============================================

function SpotlightSkillPicker({
  isOpen,
  onClose,
  onSelect,
  currentSkills,
  primaryProfession,
  secondaryProfession,
  onProfessionSelect,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (skill: Skill) => void
  currentSkills: Skill[]
  primaryProfession: Profession | null
  secondaryProfession: Profession | null
  onProfessionSelect: (profession: Profession) => void
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [activeFilter, setActiveFilter] = useState<{ type: 'profession' | 'attribute'; value: string } | null>(null)
  const [collapsedAttributes, setCollapsedAttributes] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getAllSkills().then(skills => {
      setAllSkills(skills)
      setIsLoading(false)
    })
  }, [])

  // Reset and auto-filter to profession when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setCollapsedAttributes(new Set())
      // Auto-filter to primary profession if set
      if (primaryProfession) {
        setActiveFilter({ type: 'profession', value: primaryProfession })
      } else {
        setActiveFilter(null)
      }
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen, primaryProfession])

  const getProfessionColor = useCallback((profName: string) => {
    const prof = PROFESSIONS.find(p => p.name === profName)
    return prof?.color || '#888'
  }, [])

  // Smart search results
  const smartSearchResults = useMemo(() => {
    if (!isOpen || isLoading) return { categories: [], skills: [], groupedByAttribute: [] as AttributeGroup[] }

    const lowerQuery = query.trim().toLowerCase()

    // Profession filter - show grouped view
    if (activeFilter?.type === 'profession') {
      const professionSkills = allSkills.filter(skill => skill.profession === activeFilter.value)
      const filteredSkills = lowerQuery
        ? professionSkills.filter(s => s.name.toLowerCase().includes(lowerQuery))
        : professionSkills

      const attributeMap = new Map<string, Skill[]>()
      filteredSkills.forEach(skill => {
        const attr = skill.attribute || 'No Attribute'
        if (!attributeMap.has(attr)) attributeMap.set(attr, [])
        attributeMap.get(attr)!.push(skill)
      })

      const profId = PROFESSION_TO_ID[activeFilter.value as keyof typeof PROFESSION_TO_ID]
      const profAttrs = profId ? ATTRIBUTES_BY_PROFESSION[profId] || [] : []

      const sortedAttrs = Array.from(attributeMap.keys()).sort((a, b) => {
        if (a === 'No Attribute') return 1
        if (b === 'No Attribute') return -1
        const aIdx = profAttrs.indexOf(a)
        const bIdx = profAttrs.indexOf(b)
        if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
        if (aIdx >= 0) return -1
        if (bIdx >= 0) return 1
        return a.localeCompare(b)
      })

      const groupedByAttribute: AttributeGroup[] = sortedAttrs.map(attr => ({
        attribute: attr,
        skills: attributeMap.get(attr)!.sort((a, b) => a.name.localeCompare(b.name)),
        isCollapsed: collapsedAttributes.has(attr),
      }))

      return { categories: [], skills: [], groupedByAttribute }
    }

    // Attribute filter - flat list
    if (activeFilter?.type === 'attribute') {
      const filteredSkills = allSkills.filter(skill => skill.attribute === activeFilter.value)
      const matchedSkills = lowerQuery
        ? filteredSkills.filter(s => s.name.toLowerCase().includes(lowerQuery))
        : filteredSkills

      return {
        categories: [],
        skills: matchedSkills.sort((a, b) => a.name.localeCompare(b.name)),
        groupedByAttribute: [],
      }
    }

    // No filter - search mode
    if (lowerQuery === '') return { categories: [], skills: [], groupedByAttribute: [] }

    const categories: SkillCategoryMatch[] = []

    // Profession matches
    const matchedProfessionByAlias = PROFESSION_ALIASES[lowerQuery]
    PROFESSIONS.forEach(prof => {
      const nameMatch = prof.name.toLowerCase().startsWith(lowerQuery) || prof.abbreviation.toLowerCase().startsWith(lowerQuery)
      const aliasMatch = matchedProfessionByAlias === prof.name

      if (nameMatch || aliasMatch) {
        const count = allSkills.filter(s => s.profession === prof.name).length
        categories.push({ type: 'profession', name: prof.name, count, color: prof.color })
      }
    })

    // Attribute matches
    ALL_ATTRIBUTES.forEach(attr => {
      if (attr.toLowerCase().includes(lowerQuery)) {
        const count = allSkills.filter(s => s.attribute === attr).length
        categories.push({ type: 'attribute', name: attr, count })
      }
    })

    // Skill matches
    const skillMatches = allSkills
      .filter(skill => skill.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery)
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return a.name.localeCompare(b.name)
      })
      .slice(0, 30)

    return { categories, skills: skillMatches, groupedByAttribute: [] }
  }, [query, isOpen, allSkills, isLoading, activeFilter, collapsedAttributes])

  const isSkillInBar = useCallback((skill: Skill) => currentSkills.some(s => s.id === skill.id), [currentSkills])
  const hasEliteInBar = currentSkills.some(s => s.elite)

  const totalVisibleSkills = useMemo(() => {
    if (smartSearchResults.groupedByAttribute.length > 0) {
      return smartSearchResults.groupedByAttribute.reduce((sum, g) =>
        sum + (g.isCollapsed ? 0 : g.skills.length), 0
      )
    }
    return smartSearchResults.skills.length
  }, [smartSearchResults])

  const toggleAttributeCollapse = (attr: string) => {
    setCollapsedAttributes(prev => {
      const next = new Set(prev)
      if (next.has(attr)) next.delete(attr)
      else next.add(attr)
      return next
    })
  }

  const drillDownToAttribute = (attr: string) => {
    setActiveFilter({ type: 'attribute', value: attr })
    setQuery('')
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (activeFilter) {
        setActiveFilter(null)
        setSelectedIndex(0)
        setCollapsedAttributes(new Set())
      } else {
        onClose()
      }
    } else if (e.key === 'Enter' && query.trim() !== '' && !activeFilter) {
      e.preventDefault()
      const firstCat = smartSearchResults.categories[0]
      if (firstCat) {
        setActiveFilter({ type: firstCat.type, value: firstCat.name })
        setQuery('')
        setSelectedIndex(0)
      }
    } else if (e.key === 'Backspace' && query === '' && activeFilter) {
      e.preventDefault()
      setActiveFilter(null)
      setCollapsedAttributes(new Set())
    }
  }, [smartSearchResults, activeFilter, onClose, query])

  const handleCategoryClick = (cat: SkillCategoryMatch) => {
    // If clicking a profession and no primary is set, also set it
    if (cat.type === 'profession' && !primaryProfession) {
      onProfessionSelect(cat.name as Profession)
    }
    setActiveFilter({ type: cat.type, value: cat.name })
    setQuery('')
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  const clearFilter = () => {
    setActiveFilter(null)
    setQuery('')
    setSelectedIndex(0)
    setCollapsedAttributes(new Set())
    inputRef.current?.focus()
  }

  const isGroupedView = activeFilter?.type === 'profession' && smartSearchResults.groupedByAttribute.length > 0
  const needsProfession = !primaryProfession

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'fixed z-50',
              // Mobile: full screen with safe area insets
              'inset-x-0 bottom-0 top-0 sm:inset-auto',
              'sm:top-[10%] sm:left-1/2 sm:-translate-x-1/2 sm:w-[95%] sm:max-w-xl'
            )}
          >
            <div className={cn(
              'bg-bg-elevated border-border shadow-2xl overflow-hidden h-full flex flex-col',
              // Mobile: no rounded corners, full height
              'sm:border sm:rounded-xl sm:h-auto'
            )}>
              {/* Mobile header with close button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border sm:hidden">
                <h2 className="text-base font-semibold text-text-primary">Select Skill</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 -mr-2 rounded-lg text-text-muted hover:text-text-primary"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profession selection prompt if needed */}
              {needsProfession && !activeFilter && (
                <div className="p-4 bg-accent-gold/10 border-b border-accent-gold/20">
                  <p className="text-sm text-accent-gold mb-3">Select a profession to browse skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {PROFESSIONS.map(prof => (
                      <button
                        key={prof.key}
                        type="button"
                        onClick={() => {
                          onProfessionSelect(prof.name)
                          setActiveFilter({ type: 'profession', value: prof.name })
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-border hover:border-accent-gold transition-colors"
                      >
                        <ProfessionIcon profession={prof.key} size="sm" />
                        <span className="text-sm text-text-secondary">{prof.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search with filter pill */}
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />

                {activeFilter && (
                  <button
                    onClick={clearFilter}
                    className={cn(
                      'ml-12 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
                      activeFilter.type === 'profession'
                        ? 'bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30'
                        : 'bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30'
                    )}
                  >
                    {activeFilter.type === 'profession' ? (
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getProfessionColor(activeFilter.value) }} />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    {activeFilter.value}
                    <X className="w-3 h-3" />
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeFilter ? 'Search...' : 'Search skills, professions, attributes...'}
                  className={cn(
                    'flex-1 bg-transparent text-text-primary py-4 pr-10 text-lg placeholder:text-text-muted focus:outline-none',
                    activeFilter ? 'pl-2' : 'pl-12'
                  )}
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-4 text-text-muted hover:text-text-primary">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Results - flex-1 on mobile to fill remaining space */}
              <div className="flex-1 overflow-y-auto overscroll-contain sm:max-h-[65vh]">
                {isLoading ? (
                  <div className="p-8 text-center text-text-muted">Loading skills...</div>
                ) : query.trim() === '' && !activeFilter && !needsProfession ? (
                  <div className="p-6 text-center">
                    <div className="text-text-muted mb-3">Try searching for:</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['warrior', 'mesmer', 'healing', 'fire magic', 'energy surge'].map(hint => (
                        <button
                          key={hint}
                          onClick={() => setQuery(hint)}
                          className="px-3 py-1.5 text-sm bg-bg-card hover:bg-bg-hover text-text-secondary rounded-lg transition-colors"
                        >
                          {hint}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isGroupedView ? (
                  <div className="relative">
                    {smartSearchResults.groupedByAttribute.map((group) => (
                      <AttributeGroupSection
                        key={group.attribute}
                        group={group}
                        onToggleCollapse={() => toggleAttributeCollapse(group.attribute)}
                        onDrillDown={() => drillDownToAttribute(group.attribute)}
                        onSelectSkill={onSelect}
                        isSkillInBar={isSkillInBar}
                        hasEliteInBar={hasEliteInBar}
                      />
                    ))}
                  </div>
                ) : smartSearchResults.categories.length === 0 && smartSearchResults.skills.length === 0 && !needsProfession ? (
                  <div className="p-8 text-center text-text-muted">No results found</div>
                ) : (
                  <div className="p-2">
                    {smartSearchResults.categories.length > 0 && (
                      <div className="mb-2">
                        {smartSearchResults.categories.map((cat, idx) => (
                          <button
                            key={`${cat.type}-${cat.name}`}
                            onClick={() => handleCategoryClick(cat)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all',
                              selectedIndex === idx ? 'bg-bg-hover ring-1 ring-accent-gold/50' : 'hover:bg-bg-hover'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              cat.type === 'profession' ? 'bg-accent-gold/10' : 'bg-accent-purple/10'
                            )}>
                              {cat.type === 'profession' ? (
                                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: cat.color }} />
                              ) : (
                                <Sparkles className="w-5 h-5 text-accent-purple" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-text-primary">{cat.name}</div>
                              <div className="text-xs text-text-muted">
                                {cat.type === 'profession' ? 'Profession' : 'Attribute'} • {cat.count} skills
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          </button>
                        ))}
                        {smartSearchResults.skills.length > 0 && <div className="h-px bg-border my-2" />}
                      </div>
                    )}

                    {smartSearchResults.skills.map((skill, idx) => {
                      const absoluteIndex = smartSearchResults.categories.length + idx
                      return (
                        <SkillResultRow
                          key={skill.id}
                          skill={skill}
                          isSelected={selectedIndex === absoluteIndex}
                          isInBar={isSkillInBar(skill)}
                          eliteBlocked={skill.elite && hasEliteInBar && !isSkillInBar(skill)}
                          onSelect={() => onSelect(skill)}
                        />
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="h-px bg-border" />
              <div className="px-4 py-2 text-xs text-text-muted flex justify-between">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-bg-card rounded">↵</kbd> select
                  {activeFilter && (
                    <>{' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">⌫</kbd> back</>
                  )}
                  {' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">esc</kbd> close
                </span>
                <span>
                  {isGroupedView
                    ? `${totalVisibleSkills} skills in ${smartSearchResults.groupedByAttribute.length} attributes`
                    : activeFilter
                      ? `${smartSearchResults.skills.length} ${activeFilter.value} skills`
                      : smartSearchResults.categories.length + smartSearchResults.skills.length > 0
                        ? `${smartSearchResults.categories.length + smartSearchResults.skills.length} results`
                        : ''
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============================================
// ATTRIBUTE GROUP SECTION (GW1-style)
// ============================================

function AttributeGroupSection({
  group,
  onToggleCollapse,
  onDrillDown,
  onSelectSkill,
  isSkillInBar,
  hasEliteInBar,
}: {
  group: AttributeGroup
  onToggleCollapse: () => void
  onDrillDown: () => void
  onSelectSkill: (skill: Skill) => void
  isSkillInBar: (skill: Skill) => boolean
  hasEliteInBar: boolean
}) {
  return (
    <div className="relative">
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-bg-card via-bg-elevated to-bg-card border-y border-border/50">
          <div className="flex items-center">
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors flex-1 text-left"
            >
              <ChevronDown
                className={cn(
                  'w-3.5 h-3.5 text-text-muted transition-transform duration-200',
                  group.isCollapsed && '-rotate-90'
                )}
              />
              <span className="font-semibold text-sm text-text-primary tracking-wide">
                {group.attribute}
              </span>
              <span className="text-xs text-text-muted/70 tabular-nums">
                ({group.skills.length})
              </span>
            </button>

            <button
              onClick={onDrillDown}
              className="px-4 py-2.5 text-text-muted/50 hover:text-accent-gold transition-colors"
              title={`Filter to ${group.attribute} only`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!group.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="py-1 px-2 space-y-0.5">
              {group.skills.map((skill, idx) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                >
                  <GroupedSkillRow
                    skill={skill}
                    isInBar={isSkillInBar(skill)}
                    eliteBlocked={skill.elite && hasEliteInBar && !isSkillInBar(skill)}
                    onSelect={() => onSelectSkill(skill)}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// GROUPED SKILL ROW
// ============================================

function GroupedSkillRow({
  skill,
  isInBar,
  eliteBlocked,
  onSelect,
}: {
  skill: Skill
  isInBar: boolean
  eliteBlocked: boolean
  onSelect: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const disabled = isInBar || eliteBlocked

  const truncatedDescription = useMemo(() => {
    if (!skill.description) return null
    const maxLength = 80
    if (skill.description.length <= maxLength) return skill.description
    return skill.description.substring(0, maxLength).trim() + '...'
  }, [skill.description])

  return (
    <div
      className={cn(
        'group rounded-lg transition-all duration-150 cursor-pointer',
        'border border-transparent',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-bg-hover/80 hover:border-border/50',
        isExpanded && 'bg-bg-card border-border/30'
      )}
    >
      <button
        onClick={() => !disabled && onSelect()}
        disabled={disabled}
        className="w-full flex items-start gap-3 p-2.5 text-left"
      >
        <div className={cn(
          'relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 transition-transform duration-150',
          'group-hover:scale-105',
          skill.elite && 'ring-1 ring-accent-gold/60 shadow-[0_0_12px_rgba(232,184,73,0.3)]'
        )}>
          <Image
            src={getSkillIconUrlById(skill.id)}
            alt={skill.name}
            width={40}
            height={40}
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-medium truncate',
              skill.elite ? 'text-accent-gold' : 'text-text-primary'
            )}>
              {skill.name}
            </span>
            {skill.elite && (
              <span className="text-[9px] uppercase tracking-widest text-accent-gold/60 font-semibold px-1.5 py-0.5 bg-accent-gold/10 rounded">
                Elite
              </span>
            )}
            {isInBar && (
              <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium px-1.5 py-0.5 bg-bg-card rounded">
                Equipped
              </span>
            )}
          </div>

          {truncatedDescription && (
            <p className="text-xs text-text-muted/80 leading-relaxed mt-1 line-clamp-2">
              {isExpanded ? skill.description : truncatedDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          {skill.adrenaline > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
              {skill.adrenaline}
              <Image src="/icons/tango-adrenaline.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
            </span>
          ) : skill.energy > 0 ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-accent-blue">
              {skill.energy}
              <Image src="/icons/tango-energy.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
            </span>
          ) : null}

          {skill.activation > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
              {skill.activation < 1 ? '¼' : skill.activation}
              <Image src="/icons/tango-activation.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
            </span>
          )}

          {skill.recharge > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-accent-green">
              {skill.recharge}
              <Image src="/icons/tango-recharge.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
            </span>
          )}
        </div>
      </button>

      {skill.description && skill.description.length > 80 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded) }}
          className="w-full px-2.5 pb-2 pt-0 text-left"
        >
          <span className="text-[10px] text-text-muted/60 hover:text-accent-gold transition-colors">
            {isExpanded ? '− Show less' : '+ Read more'}
          </span>
        </button>
      )}
    </div>
  )
}

// ============================================
// SKILL RESULT ROW (for search results)
// ============================================

function SkillResultRow({
  skill,
  isSelected,
  isInBar,
  eliteBlocked,
  onSelect,
}: {
  skill: Skill
  isSelected: boolean
  isInBar: boolean
  eliteBlocked: boolean
  onSelect: () => void
}) {
  const disabled = isInBar || eliteBlocked

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors',
        isSelected && 'bg-bg-hover ring-1 ring-accent-gold/30',
        disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bg-hover'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded overflow-hidden flex-shrink-0',
        skill.elite && 'ring-1 ring-accent-gold'
      )}>
        <Image
          src={getSkillIconUrlById(skill.id)}
          alt={skill.name}
          width={40}
          height={40}
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-sm font-medium',
            skill.elite ? 'text-accent-gold' : 'text-text-primary'
          )}>
            {skill.name}
          </span>
          {skill.elite && (
            <span className="text-[9px] uppercase text-accent-gold/60 px-1.5 py-0.5 bg-accent-gold/10 rounded">
              Elite
            </span>
          )}
          {isInBar && (
            <span className="text-[9px] uppercase text-text-muted px-1.5 py-0.5 bg-bg-card rounded">
              Equipped
            </span>
          )}
        </div>
        <p className="text-xs text-text-muted truncate">
          {skill.profession} · {skill.attribute || 'No Attribute'}
        </p>
      </div>
      {skill.energy > 0 && (
        <span className="text-xs text-accent-blue">{skill.energy}e</span>
      )}
    </button>
  )
}

// ============================================
// PUBLISH MODAL
// ============================================

function PublishModal({
  bars,
  isTeamBuild,
  onClose,
}: {
  bars: BuildBar[]
  isTeamBuild: boolean
  onClose: () => void
}) {
  const [teamName, setTeamName] = useState('')
  const [barNames, setBarNames] = useState<string[]>(bars.map(() => ''))
  const [tags, setTags] = useState<string[]>([])
  const [notes, setNotes] = useState('')

  const updateBarName = (index: number, name: string) => {
    setBarNames(prev => {
      const next = [...prev]
      next[index] = name
      return next
    })
  }

  const toggleTag = (tag: string) => {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const gameModes = ['PvE', 'PvP', 'General']
  const characteristics = ['Support', 'Damage', 'Control', 'Utility', 'Farm', 'Solo', 'Beginner']

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm',
        // Center on desktop, bottom sheet style on mobile
        'flex items-end sm:items-center justify-center sm:p-4'
      )}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={e => e.stopPropagation()}
        className={cn(
          'w-full bg-bg-card border-border shadow-2xl overflow-hidden',
          // Mobile: rounded top, max height with scroll
          'max-h-[90vh] rounded-t-2xl border-t',
          // Desktop: centered card with full border
          'sm:max-w-lg sm:max-h-[85vh] sm:rounded-xl sm:border'
        )}
      >
        {/* Mobile drag indicator */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-text-muted/20" />
        </div>

        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 bg-bg-card border-b border-border">
          <h2 className="text-base sm:text-lg font-semibold text-text-primary">
            Publish {isTeamBuild ? 'Team Build' : 'Build'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 -mr-1 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {isTeamBuild ? 'Team Name' : 'Build Name'}
              <span className="text-accent-red ml-1">*</span>
            </label>
            {isTeamBuild ? (
              <>
                <input
                  type="text"
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g., 7 Hero Beginner Team"
                  className={cn(
                    'w-full px-3 py-2 rounded-lg mb-3',
                    'bg-bg-primary border border-border',
                    'text-text-primary placeholder:text-text-muted/50',
                    'focus:outline-none focus:border-accent-gold'
                  )}
                />
                <p className="text-xs text-text-muted mb-2">Individual build names:</p>
                <div className="space-y-2">
                  {bars.map((bar, i) => (
                    <div key={bar.id} className="flex items-center gap-2">
                      {bar.primary && (
                        <ProfessionIcon
                          profession={professionToKey(bar.primary)}
                          size="sm"
                        />
                      )}
                      <input
                        type="text"
                        value={barNames[i]}
                        onChange={e => updateBarName(i, e.target.value)}
                        placeholder={`Build ${i + 1} name...`}
                        className={cn(
                          'flex-1 px-2.5 py-1.5 rounded-lg text-sm',
                          'bg-bg-primary border border-border',
                          'text-text-primary placeholder:text-text-muted/50',
                          'focus:outline-none focus:border-accent-gold'
                        )}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <input
                type="text"
                value={barNames[0]}
                onChange={e => updateBarName(0, e.target.value)}
                placeholder="e.g., Obsidian Flesh Tank"
                className={cn(
                  'w-full px-3 py-2 rounded-lg',
                  'bg-bg-primary border border-border',
                  'text-text-primary placeholder:text-text-muted/50',
                  'focus:outline-none focus:border-accent-gold'
                )}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Tags
              <span className="text-accent-red ml-1">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {gameModes.map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => toggleTag(mode)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                    tags.includes(mode)
                      ? 'bg-accent-gold/15 border-accent-gold text-accent-gold'
                      : 'bg-bg-primary border-border text-text-secondary hover:border-border-hover'
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {characteristics.map(char => (
                <button
                  key={char}
                  type="button"
                  onClick={() => toggleTag(char)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors',
                    tags.includes(char)
                      ? 'bg-accent-gold/15 border-accent-gold text-accent-gold'
                      : 'bg-bg-primary border-border text-text-muted hover:border-border-hover hover:text-text-secondary'
                  )}
                >
                  {char}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Notes
              <span className="text-text-muted font-normal ml-1">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Strategy, usage tips, alternative skills..."
              rows={4}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm',
                'bg-bg-primary border border-border',
                'text-text-primary placeholder:text-text-muted/50',
                'focus:outline-none focus:border-accent-gold',
                'resize-none'
              )}
            />
          </div>
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-2 sm:gap-3 px-4 py-4 sm:px-5 bg-bg-card border-t border-border">
          <Button variant="ghost" onClick={onClose} className="flex-1 sm:flex-none">
            Cancel
          </Button>
          <Button variant="primary" className="flex-1 sm:flex-none">
            Publish Build
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
