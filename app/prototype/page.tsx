'use client'

/**
 * Prototype Page - Build Workbench
 *
 * A full-featured build editor with:
 * - Profession selection (primary/secondary)
 * - Skill bar with spotlight search
 * - Attribute point allocation
 * - Weapon set configuration
 * - Build search with filters (profession, tags, skills)
 *
 * Components:
 * - PrototypePage: Main page layout and state management
 * - ProfessionPicker/ProfessionDropdown: Profession selection UI
 * - SkillSlotButton: Individual skill bar slots
 * - SpotlightSkillPicker: Skill search modal with category filtering
 * - AttributeRow: Individual attribute controls
 * - WeaponSlotButton: Weapon slot display
 * - SpotlightWeaponPicker: Weapon selection modal
 * - SpotlightBuildPicker: Build search modal with filter pills
 *
 * TODO: Database Integration
 * - Load user's saved builds from Supabase
 * - Save new builds to database
 * - Load community builds for search
 * - Replace PvX builds with database builds when available
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Skill } from '@/lib/gw/skills'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { ATTRIBUTES_BY_PROFESSION, PROFESSION_TO_ID } from '@/lib/constants'
import { PROFESSIONS, type Profession, professionToKey } from '@/types/gw1'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { loadBuildsForSearch } from '@/lib/actions/search'
import { SpotlightBuildPicker } from '@/components/build/spotlight-build-picker'
import { SpotlightSkillPicker } from '@/components/editor/skill-picker'
import { EquipmentEditor, type EquipmentSetConfig } from '@/components/equipment/equipment-editor'
import { calculateAttributeBonuses } from '@/lib/gw/equipment/armor'
import { EquipmentTemplateInput } from '@/components/editor/equipment-template-input'
import { type DecodedEquipment, toWeaponConfig } from '@/lib/gw/equipment/template'
import { EMPTY_ARMOR_SET } from '@/types/database'
import Image from 'next/image'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_ATTRIBUTE_POINTS = 200
const MAX_BASE_RANK = 12

function getPointCost(rank: number): number {
  if (rank <= 0) return 0
  if (rank <= 7) return rank
  if (rank <= 11) return 7 + 2 * (rank - 7)
  return 16
}

// ============================================================================
// TYPES
// ============================================================================

interface SkillBarSlot {
  skill: Skill | null
  position: number
}

interface AttributeValue {
  name: string
  rank: number
  isPrimary: boolean
}

// ============================================================================
// MAIN PAGE
// Build workbench with profession selection, skill bar, attributes, and weapons
//
// TODO: Database Integration
// - Load existing build when editing (from URL param or prop)
// - Save build to Supabase on submit
// - Auto-save drafts to localStorage
// - Generate and display template code
// ============================================================================

export default function PrototypePage() {
  // Build state
  const [slots, setSlots] = useState<SkillBarSlot[]>(
    Array.from({ length: 8 }, (_, i) => ({ skill: null, position: i + 1 }))
  )
  const [primaryProfession, setPrimaryProfession] = useState<Profession | null>(null)
  const [secondaryProfession, setSecondaryProfession] = useState<Profession | null>(null)
  const [attributes, setAttributes] = useState<AttributeValue[]>([])
  // Equipment editor state
  const [equipmentConfig, setEquipmentConfig] = useState<EquipmentSetConfig | undefined>()
  const [equipmentCode, setEquipmentCode] = useState('')

  const handleEquipmentDecode = useCallback((decoded: DecodedEquipment) => {
    setEquipmentConfig({
      mainHand: toWeaponConfig(decoded.mainHand),
      offHand: toWeaponConfig(decoded.offHand),
      armor: EMPTY_ARMOR_SET, // TODO: decode armor from template
    })
  }, [])

  // UI state
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false)
  const [isBuildPickerOpen, setIsBuildPickerOpen] = useState(false)

  // Initialize attributes when profession changes - this is derived state initialization
  useEffect(() => {
    const newAttributes: AttributeValue[] = []
    if (primaryProfession) {
      const primaryId = PROFESSION_TO_ID[primaryProfession]
      const primaryAttrs = ATTRIBUTES_BY_PROFESSION[primaryId] || []
      primaryAttrs.forEach((attr, index) => {
        newAttributes.push({ name: attr, rank: 0, isPrimary: index === 0 })
      })
    }
    if (secondaryProfession && secondaryProfession !== primaryProfession) {
      const secondaryId = PROFESSION_TO_ID[secondaryProfession]
      const secondaryAttrs = ATTRIBUTES_BY_PROFESSION[secondaryId] || []
      secondaryAttrs.slice(1).forEach(attr => {
        newAttributes.push({ name: attr, rank: 0, isPrimary: false })
      })
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state from profession selection
    setAttributes(newAttributes)
  }, [primaryProfession, secondaryProfession])

  const totalPointsSpent = useMemo(() => {
    return attributes.reduce((sum, attr) => sum + getPointCost(attr.rank), 0)
  }, [attributes])
  const unusedPoints = MAX_ATTRIBUTE_POINTS - totalPointsSpent

  // Calculate attribute bonuses from armor runes
  const armorConfig = equipmentConfig?.armor
  const attributeBonuses = useMemo(() => {
    if (!armorConfig) return {}
    return calculateAttributeBonuses(armorConfig)
  }, [armorConfig])

  const handleSlotClick = (position: number) => {
    setActiveSlot(position)
    setIsSkillPickerOpen(true)
  }

  const handleSkillSelect = (skill: Skill) => {
    if (activeSlot === null) return
    setSlots(prev => prev.map(slot =>
      slot.position === activeSlot ? { ...slot, skill } : slot
    ))
    setIsSkillPickerOpen(false)
    setActiveSlot(null)
  }

  const handleClearSlot = (position: number) => {
    setSlots(prev => prev.map(slot =>
      slot.position === position ? { ...slot, skill: null } : slot
    ))
  }

  const handleAttributeChange = (attrName: string, delta: number) => {
    setAttributes(prev => prev.map(attr => {
      if (attr.name !== attrName) return attr
      const newRank = Math.max(0, Math.min(MAX_BASE_RANK, attr.rank + delta))
      const costDiff = getPointCost(newRank) - getPointCost(attr.rank)
      if (costDiff > unusedPoints && delta > 0) return attr
      return { ...attr, rank: newRank }
    }))
  }

  const handleResetAttributes = () => {
    setAttributes(prev => prev.map(attr => ({ ...attr, rank: 0 })))
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-semibold text-text-primary">Build Workbench</h1>
            <span className="text-xs text-text-muted">v3</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        <section>
          <ProfessionPicker
            primary={primaryProfession}
            secondary={secondaryProfession}
            onPrimaryChange={setPrimaryProfession}
            onSecondaryChange={setSecondaryProfession}
          />
        </section>

        {primaryProfession && (
          <section className="bg-bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-bg-secondary border-b border-border">
              <span className="text-xs font-medium text-text-primary">
                Attributes
                <span className={cn(
                  'ml-1.5 text-xs',
                  unusedPoints < 0 ? 'text-accent-red' :
                  unusedPoints === 0 ? 'text-accent-green' : 'text-text-muted'
                )}>
                  ({unusedPoints})
                </span>
              </span>
              <button onClick={handleResetAttributes} className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors" title="Reset">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            <div className="p-2 space-y-0.5">
              {attributes.map(attr => (
                <AttributeRow
                  key={attr.name}
                  attribute={attr}
                  runeBonus={attributeBonuses[attr.name] || 0}
                  canIncrease={unusedPoints >= (getPointCost(attr.rank + 1) - getPointCost(attr.rank))}
                  onIncrement={() => handleAttributeChange(attr.name, 1)}
                  onDecrement={() => handleAttributeChange(attr.name, -1)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Equipment (Weapons + Armor) */}
        <section className="bg-bg-card border border-border rounded-lg p-3">
          <div className="mb-2">
            <span className="text-xs font-medium text-accent-gold uppercase tracking-wider">Equipment</span>
          </div>
          <EquipmentEditor
            key={equipmentCode || 'empty'}
            value={equipmentConfig}
            onChange={setEquipmentConfig}
            profession={primaryProfession ? professionToKey(primaryProfession) : undefined}
          />
        </section>

        {/* Equipment Template Input */}
        <section className="bg-bg-card border border-border rounded-lg p-3">
          <div className="mb-2">
            <span className="text-xs font-medium text-accent-gold uppercase tracking-wider">Equipment Code</span>
          </div>
          <EquipmentTemplateInput
            value={equipmentCode}
            onChange={setEquipmentCode}
            onDecode={handleEquipmentDecode}
          />
        </section>

        <section className="bg-bg-card border border-border rounded-lg p-3">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            {slots.map(slot => (
              <SkillSlotButton
                key={slot.position}
                slot={slot}
                isActive={activeSlot === slot.position}
                onClick={() => handleSlotClick(slot.position)}
                onClear={() => handleClearSlot(slot.position)}
              />
            ))}
          </div>
        </section>

        {/* Build Search Trigger */}
        <section>
          <button
            onClick={() => setIsBuildPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-border hover:border-border-hover hover:bg-bg-hover transition-colors group"
          >
            <Search className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors" />
            <span className="text-sm text-text-secondary">Search Builds...</span>
            <kbd className="ml-1.5 px-1.5 py-0.5 text-xs bg-bg-secondary text-text-muted rounded hidden sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </section>
      </div>

      <SpotlightSkillPicker
        isOpen={isSkillPickerOpen}
        onClose={() => { setIsSkillPickerOpen(false); setActiveSlot(null) }}
        onSelect={handleSkillSelect}
        currentSkills={slots.map(s => s.skill).filter(Boolean) as Skill[]}
      />

      <SpotlightBuildPicker
        isOpen={isBuildPickerOpen}
        onClose={() => setIsBuildPickerOpen(false)}
        loadBuilds={loadBuildsForSearch}
        onSelect={(build) => {
          // For now, just log the selection - future: load build into editor
          console.warn('[SpotlightBuildPicker] Selected build:', build.name, build.id)
        }}
      />
    </div>
  )
}

// ============================================================================
// PROFESSION PICKER
// ============================================================================

function ProfessionPicker({ primary, secondary, onPrimaryChange, onSecondaryChange }: {
  primary: Profession | null
  secondary: Profession | null
  onPrimaryChange: (p: Profession | null) => void
  onSecondaryChange: (p: Profession | null) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <ProfessionDropdown value={primary} onChange={onPrimaryChange} exclude={null} placeholder="Primary" />
      <span className="text-text-muted text-xl font-light">/</span>
      <ProfessionDropdown value={secondary} onChange={onSecondaryChange} exclude={primary} placeholder="Secondary" allowNone />
    </div>
  )
}

function ProfessionDropdown({ value, onChange, exclude, placeholder, allowNone = false }: {
  value: Profession | null
  onChange: (p: Profession | null) => void
  exclude: Profession | null
  placeholder: string
  allowNone?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selected = value ? PROFESSIONS.find(p => p.name === value) : null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border transition-all',
          isOpen ? 'border-accent-gold bg-bg-hover' : 'border-border bg-bg-card hover:bg-bg-hover hover:border-border-hover'
        )}
      >
        {selected ? (
          <ProfessionIcon profession={professionToKey(selected.name)} size="sm" />
        ) : (
          <span className="text-sm text-text-muted">{placeholder}</span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 mt-1 z-40 bg-bg-elevated border border-border rounded-md shadow-xl overflow-hidden min-w-[140px]"
          >
            {allowNone && (
              <>
                <button
                  onClick={() => { onChange(null); setIsOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors',
                    value === null ? 'bg-bg-hover' : 'hover:bg-bg-hover'
                  )}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full border border-dashed border-text-muted" />
                  </div>
                  <span className="text-sm text-text-muted">None</span>
                </button>
                <div className="h-px bg-border" />
              </>
            )}
            {PROFESSIONS.map(prof => {
              const disabled = prof.name === exclude
              return (
                <button
                  key={prof.key}
                  onClick={() => { if (!disabled) { onChange(prof.name); setIsOpen(false) } }}
                  disabled={disabled}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors',
                    value === prof.name && 'bg-bg-hover',
                    disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover'
                  )}
                >
                  <ProfessionIcon profession={prof.key} size="sm" />
                  <span className="text-sm text-text-secondary">{prof.name}</span>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// ATTRIBUTE ROW
// ============================================================================

function AttributeRow({ attribute, runeBonus = 0, canIncrease, onIncrement, onDecrement }: {
  attribute: AttributeValue
  runeBonus?: number
  canIncrease: boolean
  onIncrement: () => void
  onDecrement: () => void
}) {
  const { name, rank, isPrimary } = attribute
  const hasBonus = runeBonus > 0

  return (
    <div className="flex items-center gap-1.5 py-0.5">
      <div className="flex-1 min-w-0">
        <span className={cn('text-xs truncate', isPrimary ? 'text-accent-gold font-medium' : 'text-text-secondary')}>
          {name}
        </span>
      </div>
      <div className="flex items-center">
        {hasBonus && (
          <span className="text-accent-green text-xs font-medium tabular-nums mr-1">+{runeBonus}</span>
        )}
        <button
          onClick={onDecrement}
          disabled={rank === 0}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-l border border-r-0 transition-colors',
            rank === 0 ? 'border-border bg-bg-secondary text-text-muted/30 cursor-not-allowed' : 'border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary active:bg-bg-card'
          )}
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <div className={cn(
          'w-8 h-6 flex items-center justify-center border-y text-xs font-bold tabular-nums border-border bg-bg-card',
          rank === 0 ? 'text-text-muted' : isPrimary ? 'text-accent-gold' : 'text-text-primary'
        )}>
          {rank}
        </div>
        <button
          onClick={onIncrement}
          disabled={rank === MAX_BASE_RANK || !canIncrease}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-r border border-l-0 transition-colors',
            rank === MAX_BASE_RANK || !canIncrease ? 'border-border bg-bg-secondary text-text-muted/30 cursor-not-allowed' : 'border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary active:bg-bg-card'
          )}
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// SKILL SLOT BUTTON
// ============================================================================

function SkillSlotButton({ slot, isActive, onClick, onClear }: {
  slot: SkillBarSlot
  isActive: boolean
  onClick: () => void
  onClear: () => void
}) {
  const hasSkill = slot.skill !== null
  const isElite = slot.skill?.elite === true

  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          'w-11 h-11 sm:w-14 sm:h-14 relative flex items-center justify-center',
          'rounded overflow-hidden transition-all duration-100',
          isElite ? 'shadow-sticky-gold' : 'shadow-sticky',
          isActive && 'ring-2 ring-accent-gold ring-offset-1 ring-offset-bg-primary',
          hasSkill ? 'bg-bg-card' : 'bg-black/60 border-2 border-border hover:border-border-hover'
        )}
      >
        {hasSkill ? (
          <Image src={getSkillIconUrlById(slot.skill!.id)} alt={slot.skill!.name} fill className="object-cover" unoptimized />
        ) : (
          <span className="text-text-muted text-lg">+</span>
        )}
      </button>
      {hasSkill && (
        <button
          onClick={e => { e.stopPropagation(); onClear() }}
          className={cn(
            'absolute -top-1 -right-1 w-5 h-5',
            'bg-bg-elevated border border-border rounded-full',
            'flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'hover:bg-accent-red hover:border-accent-red hover:text-white'
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

