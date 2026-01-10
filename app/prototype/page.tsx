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
  useFloating,
  offset,
  flip,
  shift,
  useHover,
  useDismiss,
  useInteractions,
  FloatingPortal,
  safePolygon,
  autoUpdate,
} from '@floating-ui/react'
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Swords,
  Shield,
  Wand2,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllSkills, type Skill } from '@/lib/gw/skills'
import { getSkillIconUrlById } from '@/lib/gw/icons'
import { ATTRIBUTES_BY_PROFESSION, PROFESSION_TO_ID, ATTRIBUTE_BY_ID } from '@/lib/constants'
import { PROFESSIONS, type Profession } from '@/types/gw1'
import { loadBuildsForSearch } from '@/lib/actions/search'
import { SpotlightBuildPicker } from '@/components/build/spotlight-build-picker'
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

/** All unique attribute names for search matching */
const ALL_ATTRIBUTES = Object.values(ATTRIBUTE_BY_ID).filter(
  (attr, idx, arr) => attr !== 'No Attribute' && arr.indexOf(attr) === idx
)

/** Common profession abbreviations/nicknames for fuzzy matching */
const PROFESSION_ALIASES: Record<string, string> = {
  'warr': 'Warrior',
  'war': 'Warrior',
  'rang': 'Ranger',
  'monk': 'Monk',
  'mo': 'Monk',
  'nec': 'Necromancer',
  'necro': 'Necromancer',
  'mes': 'Mesmer',
  'mesm': 'Mesmer',
  'ele': 'Elementalist',
  'elem': 'Elementalist',
  'sin': 'Assassin',
  'ass': 'Assassin',
  'rit': 'Ritualist',
  'para': 'Paragon',
  'derv': 'Dervish',
}

const WEAPONS = {
  melee: [
    { id: 'sword', name: 'Sword', type: 'One-Handed', attribute: 'Swordsmanship', profession: 'Warrior' },
    { id: 'axe', name: 'Axe', type: 'One-Handed', attribute: 'Axe Mastery', profession: 'Warrior' },
    { id: 'hammer', name: 'Hammer', type: 'Two-Handed', attribute: 'Hammer Mastery', profession: 'Warrior' },
    { id: 'daggers', name: 'Daggers', type: 'Dual Wield', attribute: 'Dagger Mastery', profession: 'Assassin' },
    { id: 'scythe', name: 'Scythe', type: 'Two-Handed', attribute: 'Scythe Mastery', profession: 'Dervish' },
  ],
  ranged: [
    { id: 'bow', name: 'Bow', type: 'Two-Handed', attribute: 'Marksmanship', profession: 'Ranger' },
    { id: 'flatbow', name: 'Flatbow', type: 'Two-Handed', attribute: 'Marksmanship', profession: 'Ranger' },
    { id: 'hornbow', name: 'Hornbow', type: 'Two-Handed', attribute: 'Marksmanship', profession: 'Ranger' },
    { id: 'longbow', name: 'Longbow', type: 'Two-Handed', attribute: 'Marksmanship', profession: 'Ranger' },
    { id: 'recurve', name: 'Recurve Bow', type: 'Two-Handed', attribute: 'Marksmanship', profession: 'Ranger' },
    { id: 'shortbow', name: 'Shortbow', type: 'Two-Handed', attribute: 'Marksmanship', profession: 'Ranger' },
    { id: 'spear', name: 'Spear', type: 'One-Handed', attribute: 'Spear Mastery', profession: 'Paragon' },
  ],
  caster: [
    { id: 'wand', name: 'Wand', type: 'One-Handed', attribute: 'Various', profession: 'Any' },
    { id: 'staff', name: 'Staff', type: 'Two-Handed', attribute: 'Various', profession: 'Any' },
  ],
  offhand: [
    { id: 'shield', name: 'Shield', type: 'Off-Hand', attribute: 'Strength/Tactics/Command/Motivation', profession: 'Various' },
    { id: 'focus', name: 'Focus Item', type: 'Off-Hand', attribute: 'Various', profession: 'Caster' },
  ],
} as const

type WeaponData = (typeof WEAPONS.melee)[number] | (typeof WEAPONS.ranged)[number] | (typeof WEAPONS.caster)[number] | (typeof WEAPONS.offhand)[number]

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

interface WeaponSet {
  mainHand: WeaponData | null
  offHand: WeaponData | null
}

interface SkillCategoryMatch {
  type: 'profession' | 'attribute'
  name: string
  count: number
  color?: string
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
  const [weaponSets, setWeaponSets] = useState<[WeaponSet, WeaponSet]>([
    { mainHand: null, offHand: null },
    { mainHand: null, offHand: null },
  ])
  const [activeWeaponSet, setActiveWeaponSet] = useState<0 | 1>(0)

  // UI state
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [isSkillPickerOpen, setIsSkillPickerOpen] = useState(false)
  const [isWeaponPickerOpen, setIsWeaponPickerOpen] = useState(false)
  const [weaponSlotType, setWeaponSlotType] = useState<'mainHand' | 'offHand'>('mainHand')
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

  const handleWeaponSlotClick = (slotType: 'mainHand' | 'offHand') => {
    setWeaponSlotType(slotType)
    setIsWeaponPickerOpen(true)
  }

  const handleWeaponSelect = (weapon: WeaponData | null) => {
    setWeaponSets(prev => {
      const newSets = [...prev] as [WeaponSet, WeaponSet]
      newSets[activeWeaponSet] = { ...newSets[activeWeaponSet], [weaponSlotType]: weapon }
      return newSets
    })
    setIsWeaponPickerOpen(false)
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="sticky top-0 z-30 bg-bg-primary/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-text-primary">Build Workbench</h1>
            <span className="text-xs text-text-muted">Prototype v3</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
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
            <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border">
              <span className="text-sm font-medium text-text-primary">
                Attributes
                <span className={cn(
                  'ml-2 text-xs',
                  unusedPoints < 0 ? 'text-accent-red' :
                  unusedPoints === 0 ? 'text-accent-green' : 'text-text-muted'
                )}>
                  ({unusedPoints} unused)
                </span>
              </span>
              <button onClick={handleResetAttributes} className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors" title="Reset">
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-3 space-y-1">
              {attributes.map(attr => (
                <AttributeRow
                  key={attr.name}
                  attribute={attr}
                  canIncrease={unusedPoints >= (getPointCost(attr.rank + 1) - getPointCost(attr.rank))}
                  onIncrement={() => handleAttributeChange(attr.name, 1)}
                  onDecrement={() => handleAttributeChange(attr.name, -1)}
                />
              ))}
            </div>
          </section>
        )}

        <section className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-bg-secondary border-b border-border">
            <span className="text-sm font-medium text-text-primary">Weapons</span>
            <div className="flex gap-1">
              {[0, 1].map(idx => (
                <button
                  key={idx}
                  onClick={() => setActiveWeaponSet(idx as 0 | 1)}
                  className={cn(
                    'px-2 py-0.5 text-xs rounded transition-colors',
                    activeWeaponSet === idx
                      ? 'bg-accent-gold/20 text-accent-gold'
                      : 'bg-bg-hover text-text-muted hover:text-text-secondary'
                  )}
                >
                  Set {idx + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <WeaponSlotButton label="Main Hand" weapon={weaponSets[activeWeaponSet].mainHand} onClick={() => handleWeaponSlotClick('mainHand')} icon={<Swords className="w-5 h-5" />} />
              <WeaponSlotButton label="Off-Hand" weapon={weaponSets[activeWeaponSet].offHand} onClick={() => handleWeaponSlotClick('offHand')} icon={<Shield className="w-5 h-5" />} />
            </div>
          </div>
        </section>

        <section className="bg-bg-card border border-border rounded-lg p-4">
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
        <section className="bg-bg-card border border-border rounded-lg p-4">
          <button
            onClick={() => setIsBuildPickerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-border hover:border-border-hover hover:bg-bg-hover transition-colors group"
          >
            <Search className="w-5 h-5 text-text-muted group-hover:text-text-secondary transition-colors" />
            <span className="text-sm text-text-secondary">Search Builds...</span>
            <kbd className="ml-2 px-2 py-0.5 text-xs bg-bg-secondary text-text-muted rounded hidden sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </section>

        <p className="text-center text-xs text-text-muted">
          Tap any slot to open the picker. Hover skills for details.
        </p>
      </div>

      <SpotlightSkillPicker
        isOpen={isSkillPickerOpen}
        onClose={() => { setIsSkillPickerOpen(false); setActiveSlot(null) }}
        onSelect={handleSkillSelect}
        currentSkills={slots.map(s => s.skill).filter(Boolean) as Skill[]}
        primaryProfession={primaryProfession}
        secondaryProfession={secondaryProfession}
      />

      <SpotlightWeaponPicker
        isOpen={isWeaponPickerOpen}
        onClose={() => setIsWeaponPickerOpen(false)}
        onSelect={handleWeaponSelect}
        slotType={weaponSlotType}
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
          'flex items-center gap-2 px-3 py-2 rounded-lg border transition-all',
          isOpen ? 'border-accent-gold bg-bg-hover' : 'border-border bg-bg-secondary hover:bg-bg-hover'
        )}
      >
        {selected ? (
          <>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selected.color }} />
            <span className="text-sm font-medium text-text-primary">{selected.abbreviation}</span>
          </>
        ) : (
          <span className="text-sm text-text-muted">{placeholder}</span>
        )}
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-0 mt-1 z-40 bg-bg-elevated border border-border rounded-lg shadow-xl overflow-hidden min-w-[160px]"
          >
            {allowNone && (
              <>
                <button
                  onClick={() => { onChange(null); setIsOpen(false) }}
                  className={cn('w-full flex items-center gap-2 px-3 py-2 text-left transition-colors', value === null ? 'bg-bg-hover' : 'hover:bg-bg-hover')}
                >
                  <div className="w-3 h-3 rounded-full border border-dashed border-text-muted" />
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
                    'w-full flex items-center gap-2 px-3 py-2 text-left transition-colors',
                    value === prof.name && 'bg-bg-hover',
                    disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-bg-hover'
                  )}
                >
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: prof.color }} />
                  <span className="text-sm text-text-secondary flex-1">{prof.name}</span>
                  <span className="text-xs text-text-muted">{prof.abbreviation}</span>
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

function AttributeRow({ attribute, canIncrease, onIncrement, onDecrement }: {
  attribute: AttributeValue
  canIncrease: boolean
  onIncrement: () => void
  onDecrement: () => void
}) {
  const { name, rank, isPrimary } = attribute

  return (
    <div className="flex items-center gap-2 py-1">
      <div className="flex-1 min-w-0">
        <span className={cn('text-sm truncate', isPrimary ? 'text-accent-gold font-medium' : 'text-text-secondary')}>
          {name}
        </span>
      </div>
      <div className="flex items-center">
        <button
          onClick={onDecrement}
          disabled={rank === 0}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-l border border-r-0 transition-colors',
            rank === 0 ? 'border-border bg-bg-secondary text-text-muted/30 cursor-not-allowed' : 'border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary active:bg-bg-card'
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </button>
        <div className={cn(
          'w-10 h-7 flex items-center justify-center border-y text-sm font-bold tabular-nums border-border bg-bg-card',
          rank === 0 ? 'text-text-muted' : isPrimary ? 'text-accent-gold' : 'text-text-primary'
        )}>
          {rank}
        </div>
        <button
          onClick={onIncrement}
          disabled={rank === MAX_BASE_RANK || !canIncrease}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded-r border border-l-0 transition-colors',
            rank === MAX_BASE_RANK || !canIncrease ? 'border-border bg-bg-secondary text-text-muted/30 cursor-not-allowed' : 'border-border bg-bg-secondary text-text-muted hover:bg-bg-hover hover:text-text-primary active:bg-bg-card'
          )}
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// WEAPON SLOT BUTTON
// ============================================================================

function WeaponSlotButton({ label, weapon, onClick, icon }: {
  label: string
  weapon: WeaponData | null
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all',
        'border-border bg-bg-secondary hover:bg-bg-hover hover:border-border-hover',
        weapon && 'border-accent-gold/30'
      )}
    >
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', weapon ? 'bg-accent-gold/10 text-accent-gold' : 'bg-bg-card text-text-muted')}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="text-[10px] uppercase tracking-wider text-text-muted">{label}</div>
        <div className="text-sm text-text-primary truncate">{weapon?.name ?? 'Select...'}</div>
      </div>
    </button>
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

// ============================================================================
// SPOTLIGHT SKILL PICKER - GW1-Inspired Grouped View with Sticky Headers
// ============================================================================

/** Group skills by attribute for the grouped view */
interface AttributeGroup {
  attribute: string
  skills: Skill[]
  isCollapsed: boolean
}

function SpotlightSkillPicker({
  isOpen,
  onClose,
  onSelect,
  currentSkills,
  primaryProfession: _primaryProfession,
  secondaryProfession: _secondaryProfession,
}: {
  isOpen: boolean
  onClose: () => void
  onSelect: (skill: Skill) => void
  currentSkills: Skill[]
  primaryProfession: Profession | null
  secondaryProfession: Profession | null
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [activeFilter, setActiveFilter] = useState<{ type: 'profession' | 'attribute'; value: string } | null>(null)
  const [collapsedAttributes, setCollapsedAttributes] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllSkills().then(skills => {
      setAllSkills(skills)
      setIsLoading(false)
    })
  }, [])

  // Reset state when modal opens - standard modal reset pattern
  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect -- modal state reset */
      setQuery('')
      setSelectedIndex(0)
      setActiveFilter(null)
      setCollapsedAttributes(new Set())
      /* eslint-enable react-hooks/set-state-in-effect */
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Get profession color for UI
  const getProfessionColor = useCallback((profName: string) => {
    const prof = PROFESSIONS.find(p => p.name === profName)
    return prof?.color || '#888'
  }, [])

  // Smart search: detect profession and attribute matches
  const smartSearchResults = useMemo(() => {
    if (!isOpen || isLoading) return { categories: [], skills: [], groupedByAttribute: [] as AttributeGroup[] }

    const lowerQuery = query.trim().toLowerCase()

    // If we have a PROFESSION filter, show grouped view
    if (activeFilter?.type === 'profession') {
      const professionSkills = allSkills.filter(skill => skill.profession === activeFilter.value)

      // Further filter by query if there is one
      const filteredSkills = lowerQuery
        ? professionSkills.filter(s => s.name.toLowerCase().includes(lowerQuery))
        : professionSkills

      // Group by attribute
      const attributeMap = new Map<string, Skill[]>()
      filteredSkills.forEach(skill => {
        const attr = skill.attribute || 'No Attribute'
        if (!attributeMap.has(attr)) {
          attributeMap.set(attr, [])
        }
        attributeMap.get(attr)!.push(skill)
      })

      // Get the profession's attribute order
      const profId = PROFESSION_TO_ID[activeFilter.value as keyof typeof PROFESSION_TO_ID]
      const profAttrs = profId ? ATTRIBUTES_BY_PROFESSION[profId] || [] : []

      // Sort attributes: profession attributes first (in order), then others, then No Attribute
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

    // If we have an ATTRIBUTE filter, show flat list
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

    // No filter - show category suggestions and skill matches
    if (lowerQuery === '') return { categories: [], skills: [], groupedByAttribute: [] }

    const categories: SkillCategoryMatch[] = []

    // Check for profession matches (including aliases)
    const matchedProfessionByAlias = PROFESSION_ALIASES[lowerQuery]
    PROFESSIONS.forEach(prof => {
      const nameMatch = prof.name.toLowerCase().startsWith(lowerQuery) || prof.abbreviation.toLowerCase().startsWith(lowerQuery)
      const aliasMatch = matchedProfessionByAlias === prof.name

      if (nameMatch || aliasMatch) {
        const count = allSkills.filter(s => s.profession === prof.name).length
        categories.push({
          type: 'profession',
          name: prof.name,
          count,
          color: prof.color,
        })
      }
    })

    // Check for attribute matches
    ALL_ATTRIBUTES.forEach(attr => {
      if (attr.toLowerCase().includes(lowerQuery)) {
        const count = allSkills.filter(s => s.attribute === attr).length
        categories.push({
          type: 'attribute',
          name: attr,
          count,
        })
      }
    })

    // Get individual skill matches
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

  // Calculate total visible skills for footer
  const totalVisibleSkills = useMemo(() => {
    if (smartSearchResults.groupedByAttribute.length > 0) {
      return smartSearchResults.groupedByAttribute.reduce((sum, g) =>
        sum + (g.isCollapsed ? 0 : g.skills.length), 0
      )
    }
    return smartSearchResults.skills.length
  }, [smartSearchResults])

  // Toggle attribute collapse
  const toggleAttributeCollapse = (attr: string) => {
    setCollapsedAttributes(prev => {
      const next = new Set(prev)
      if (next.has(attr)) {
        next.delete(attr)
      } else {
        next.add(attr)
      }
      return next
    })
  }

  // Drill down to specific attribute
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
      // Auto-select first category if it's a profession/attribute match
      const firstCat = smartSearchResults.categories[0]
      if (firstCat) {
        setActiveFilter({ type: firstCat.type, value: firstCat.name })
        setQuery('')
        setSelectedIndex(0)
      }
    } else if (e.key === 'Backspace' && query === '' && activeFilter) {
      e.preventDefault()
      // Go back: if attribute filter, go to profession filter if we came from one
      setActiveFilter(null)
      setCollapsedAttributes(new Set())
    }
  }, [smartSearchResults, activeFilter, onClose, query])

  const handleCategoryClick = (cat: SkillCategoryMatch) => {
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

  // Check if showing grouped view (profession filter)
  const isGroupedView = activeFilter?.type === 'profession' && smartSearchResults.groupedByAttribute.length > 0

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
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[95%] max-w-xl z-50"
          >
            <div className="bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Search with filter pill */}
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />

                {/* Active filter pill */}
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
                  placeholder={activeFilter ? `Search ${activeFilter.value} skills...` : 'Search skills, professions, attributes...'}
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

              {/* Results */}
              <div ref={listRef} className="max-h-[65vh] overflow-y-auto overscroll-contain">
                {isLoading ? (
                  <div className="p-8 text-center text-text-muted">Loading skills...</div>
                ) : query.trim() === '' && !activeFilter ? (
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
                  /* GW1-Style Grouped View by Attribute */
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
                ) : smartSearchResults.categories.length === 0 && smartSearchResults.skills.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">No results found</div>
                ) : (
                  <div className="p-2">
                    {/* Category matches */}
                    {smartSearchResults.categories.length > 0 && (
                      <div className="mb-2">
                        {smartSearchResults.categories.map((cat, idx) => (
                          <button
                            key={`${cat.type}-${cat.name}`}
                            data-index={idx}
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
                        {smartSearchResults.skills.length > 0 && (
                          <div className="h-px bg-border my-2" />
                        )}
                      </div>
                    )}

                    {/* Skill matches (flat list) */}
                    {smartSearchResults.skills.map((skill, idx) => {
                      const absoluteIndex = smartSearchResults.categories.length + idx
                      return (
                        <SkillResultRowWithTooltip
                          key={skill.id}
                          skill={skill}
                          index={absoluteIndex}
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

// ============================================================================
// GW1-STYLE ATTRIBUTE GROUP SECTION WITH STICKY HEADER
// ============================================================================

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
      {/* Sticky Attribute Header - GW1 Inspired with subtle gradient */}
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-bg-card via-bg-elevated to-bg-card border-y border-border/50">
          <div className="flex items-center">
            {/* Collapse toggle */}
            <button
              onClick={onToggleCollapse}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors flex-1 text-left group"
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

            {/* Drill-down button */}
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

      {/* Skills list - collapsible with staggered animation */}
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

// ============================================================================
// GROUPED SKILL ROW - Enhanced with inline description
// ============================================================================

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
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const disabled = isInBar || eliteBlocked

  // Floating UI for tooltip - with autoUpdate for proper positioning
  const { refs, floatingStyles, context } = useFloating({
    open: isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    placement: 'left-start',
    middleware: [
      offset({ mainAxis: 12, crossAxis: 0 }),
      flip({ fallbackPlacements: ['right-start', 'top', 'bottom'] }),
      shift({ padding: 16 })
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, {
    delay: { open: 400, close: 150 },
    handleClose: safePolygon(),
  })
  const dismiss = useDismiss(context, { outsidePress: true })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss])

  // Truncate description for inline display
  const truncatedDescription = useMemo(() => {
    if (!skill.description) return null
    const maxLength = 80
    if (skill.description.length <= maxLength) return skill.description
    return skill.description.substring(0, maxLength).trim() + '...'
  }, [skill.description])

  const handleClick = () => {
    if (disabled) return
    onSelect()
  }

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <>
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className={cn(
          'group rounded-lg transition-all duration-150 cursor-pointer',
          'border border-transparent',
          disabled
            ? 'opacity-40 cursor-not-allowed'
            : 'hover:bg-bg-hover/80 hover:border-border/50',
          isExpanded && 'bg-bg-card border-border/30'
        )}
      >
        {/* Main row - always visible */}
        <button
          onClick={handleClick}
          disabled={disabled}
          className="w-full flex items-start gap-3 p-2.5 text-left"
        >
          {/* Skill icon with elite glow effect */}
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
            {skill.elite && (
              <div className="absolute inset-0 bg-gradient-to-t from-accent-gold/20 to-transparent" />
            )}
          </div>

          {/* Skill info */}
          <div className="flex-1 min-w-0 pt-0.5">
            {/* Name and stats row */}
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

            {/* Inline description - shows truncated version */}
            {truncatedDescription && (
              <p className="text-xs text-text-muted/80 leading-relaxed mt-1 line-clamp-2">
                {isExpanded ? skill.description : truncatedDescription}
              </p>
            )}
          </div>

          {/* Stats column - GW1 style aligned */}
          <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
            {/* Cost (energy/adrenaline/sacrifice) */}
            <div className="w-11 text-right">
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
              ) : skill.sacrifice > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] text-accent-red">
                  {skill.sacrifice}%
                  <Image src="/icons/tango-sacrifice.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
                </span>
              ) : null}
            </div>

            {/* Cast time */}
            <div className="w-9 text-right">
              {skill.activation > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                  {skill.activation < 1 ? '¼' : skill.activation < 0.75 ? '½' : skill.activation < 2 ? '¾' : skill.activation}
                  <Image src="/icons/tango-activation.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
                </span>
              )}
            </div>

            {/* Recharge */}
            <div className="w-9 text-right">
              {skill.recharge > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-accent-green">
                  {skill.recharge}
                  <Image src="/icons/tango-recharge.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
                </span>
              )}
            </div>
          </div>
        </button>

        {/* Expand/collapse for full description */}
        {skill.description && skill.description.length > 80 && (
          <button
            onClick={handleExpandToggle}
            className="w-full px-2.5 pb-2 pt-0 text-left"
          >
            <span className="text-[10px] text-text-muted/60 hover:text-accent-gold transition-colors">
              {isExpanded ? '− Show less' : '+ Read more'}
            </span>
          </button>
        )}
      </div>

      {/* Floating Tooltip - appears on hover with full details */}
      <FloatingPortal>
        <AnimatePresence>
          {isTooltipOpen && !isExpanded && (
            <motion.div
              // eslint-disable-next-line react-hooks/refs -- callback ref, not .current access
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="z-[100]"
            >
              <SkillTooltipEnhanced skill={skill} />
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  )
}

// ============================================================================
// ENHANCED SKILL TOOLTIP - Rich details panel
// ============================================================================

function SkillTooltipEnhanced({ skill }: { skill: Skill }) {
  return (
    <div className="bg-bg-primary/95 backdrop-blur-sm border border-border/80 rounded-xl p-4 shadow-2xl w-[300px]">
      {/* Header with icon */}
      <div className="flex items-start gap-3 mb-3">
        <div className={cn(
          'w-12 h-12 rounded-lg overflow-hidden flex-shrink-0',
          skill.elite && 'ring-2 ring-accent-gold/50 shadow-[0_0_16px_rgba(232,184,73,0.25)]'
        )}>
          <Image
            src={getSkillIconUrlById(skill.id)}
            alt={skill.name}
            width={48}
            height={48}
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-base leading-tight',
            skill.elite ? 'text-accent-gold' : 'text-text-primary'
          )}>
            {skill.name}
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {skill.profession !== 'None' && <span>{skill.profession}</span>}
            {skill.profession !== 'None' && skill.attribute !== 'No Attribute' && <span className="mx-1.5 opacity-50">•</span>}
            {skill.attribute !== 'No Attribute' && <span className="text-text-secondary">{skill.attribute}</span>}
          </p>
        </div>
      </div>

      {/* Description */}
      {skill.description && (
        <p className="text-sm text-text-secondary leading-relaxed mb-3">
          {skill.description}
        </p>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-4 pt-3 border-t border-border/50">
        {skill.energy > 0 && (
          <div className="flex items-center gap-1.5">
            <Image src="/icons/tango-energy.png" alt="Energy" width={16} height={16} className="opacity-90" unoptimized />
            <span className="text-xs text-accent-blue font-medium">{skill.energy}</span>
          </div>
        )}
        {skill.adrenaline > 0 && (
          <div className="flex items-center gap-1.5">
            <Image src="/icons/tango-adrenaline.png" alt="Adrenaline" width={16} height={16} className="opacity-90" unoptimized />
            <span className="text-xs text-accent-red font-medium">{skill.adrenaline}</span>
          </div>
        )}
        {skill.sacrifice > 0 && (
          <div className="flex items-center gap-1.5">
            <Image src="/icons/tango-sacrifice.png" alt="Sacrifice" width={16} height={16} className="opacity-90" unoptimized />
            <span className="text-xs text-accent-red font-medium">{skill.sacrifice}%</span>
          </div>
        )}
        {skill.activation > 0 && (
          <div className="flex items-center gap-1.5">
            <Image src="/icons/tango-activation.png" alt="Cast time" width={16} height={16} className="opacity-90" unoptimized />
            <span className="text-xs text-text-secondary font-medium">{skill.activation}s</span>
          </div>
        )}
        {skill.recharge > 0 && (
          <div className="flex items-center gap-1.5">
            <Image src="/icons/tango-recharge.png" alt="Recharge" width={16} height={16} className="opacity-90" unoptimized />
            <span className="text-xs text-accent-green font-medium">{skill.recharge}s</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// SKILL RESULT ROW WITH FLOATING TOOLTIP - For search results (non-grouped)
// ============================================================================

function SkillResultRowWithTooltip({
  skill,
  index,
  isSelected,
  isInBar,
  eliteBlocked,
  onSelect,
}: {
  skill: Skill
  index: number
  isSelected: boolean
  isInBar: boolean
  eliteBlocked: boolean
  onSelect: () => void
}) {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false)
  const disabled = isInBar || eliteBlocked

  // Fixed Floating UI with autoUpdate for proper positioning
  const { refs, floatingStyles, context } = useFloating({
    open: isTooltipOpen,
    onOpenChange: setIsTooltipOpen,
    placement: 'left-start',
    middleware: [
      offset({ mainAxis: 12, crossAxis: 0 }),
      flip({ fallbackPlacements: ['right-start', 'top', 'bottom'] }),
      shift({ padding: 16 })
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, {
    delay: { open: 400, close: 150 },
    handleClose: safePolygon(),
  })
  const dismiss = useDismiss(context, { outsidePress: true })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss])

  // Truncate description for inline preview
  const truncatedDescription = useMemo(() => {
    if (!skill.description) return null
    const maxLength = 70
    if (skill.description.length <= maxLength) return skill.description
    return skill.description.substring(0, maxLength).trim() + '...'
  }, [skill.description])

  return (
    <>
      <button
        ref={refs.setReference}
        data-index={index}
        onClick={() => !disabled && onSelect()}
        disabled={disabled}
        {...getReferenceProps()}
        className={cn(
          'w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-all duration-150',
          'border border-transparent',
          isSelected && 'bg-bg-hover/80 border-accent-gold/30 shadow-sm',
          disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-bg-hover/60'
        )}
      >
        {/* Skill icon */}
        <div className={cn(
          'relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0',
          skill.elite && 'ring-1 ring-accent-gold/50 shadow-[0_0_10px_rgba(232,184,73,0.2)]'
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

        {/* Skill info with inline description */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              'text-sm font-medium',
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

          {/* Profession/Attribute line */}
          <div className="text-[11px] text-text-muted/70 mt-0.5">
            {skill.profession !== 'None' && <span>{skill.profession}</span>}
            {skill.profession !== 'None' && skill.attribute !== 'No Attribute' && <span className="mx-1 opacity-50">•</span>}
            {skill.attribute !== 'No Attribute' && <span className="text-text-secondary/80">{skill.attribute}</span>}
          </div>

          {/* Inline description preview */}
          {truncatedDescription && (
            <p className="text-xs text-text-muted/70 leading-relaxed mt-1 line-clamp-1">
              {truncatedDescription}
            </p>
          )}
        </div>

        {/* Stats aligned right */}
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          {skill.energy > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-accent-blue">
              {skill.energy}
              <Image src="/icons/tango-energy.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
            </span>
          )}
          {skill.adrenaline > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
              {skill.adrenaline}
              <Image src="/icons/tango-adrenaline.png" alt="" width={13} height={13} className="opacity-75" unoptimized />
            </span>
          )}
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

      {/* Tooltip - positioned to the left */}
      <FloatingPortal>
        <AnimatePresence>
          {isTooltipOpen && (
            <motion.div
              // eslint-disable-next-line react-hooks/refs -- callback ref, not .current access
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="z-[100]"
            >
              <SkillTooltipEnhanced skill={skill} />
            </motion.div>
          )}
        </AnimatePresence>
      </FloatingPortal>
    </>
  )
}

// ============================================================================
// SPOTLIGHT WEAPON PICKER
// ============================================================================

function SpotlightWeaponPicker({ isOpen, onClose, onSelect, slotType }: {
  isOpen: boolean
  onClose: () => void
  onSelect: (weapon: WeaponData | null) => void
  slotType: 'mainHand' | 'offHand'
}) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens - standard modal reset pattern
  useEffect(() => {
    if (isOpen) {
      /* eslint-disable react-hooks/set-state-in-effect -- modal state reset */
      setQuery('')
      setSelectedIndex(0)
      /* eslint-enable react-hooks/set-state-in-effect */
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  const availableWeapons = useMemo(() => {
    let weapons: WeaponData[]
    if (slotType === 'offHand') {
      weapons = [...WEAPONS.offhand]
    } else {
      weapons = [...WEAPONS.melee, ...WEAPONS.ranged, ...WEAPONS.caster]
    }
    if (query.trim() === '') return weapons
    const lowerQuery = query.toLowerCase()
    return weapons.filter(w =>
      w.name.toLowerCase().includes(lowerQuery) ||
      w.type.toLowerCase().includes(lowerQuery) ||
      w.attribute.toLowerCase().includes(lowerQuery) ||
      w.profession.toLowerCase().includes(lowerQuery)
    )
  }, [slotType, query])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, availableWeapons.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex === 0) {
        onSelect(null)
      } else {
        onSelect(availableWeapons[selectedIndex - 1])
      }
    }
  }, [availableWeapons, selectedIndex, onSelect, onClose])

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
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-50"
          >
            <div className="bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
                  onKeyDown={handleKeyDown}
                  placeholder={`Search ${slotType === 'offHand' ? 'off-hand items' : 'weapons'}...`}
                  className="w-full bg-transparent text-text-primary pl-12 pr-4 py-4 text-lg placeholder:text-text-muted focus:outline-none"
                />
              </div>

              <div className="h-px bg-border" />

              <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-2">
                <button
                  onClick={() => onSelect(null)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedIndex === 0 ? 'bg-bg-hover' : 'hover:bg-bg-hover'
                  )}
                >
                  <div className="w-10 h-10 rounded-lg border-2 border-dashed border-text-muted flex items-center justify-center">
                    <X className="w-4 h-4 text-text-muted" />
                  </div>
                  <span className="text-sm text-text-muted">None</span>
                </button>

                <div className="h-px bg-border my-2" />

                {availableWeapons.map((weapon, index) => (
                  <button
                    key={weapon.id}
                    onClick={() => onSelect(weapon)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      selectedIndex === index + 1 ? 'bg-bg-hover' : 'hover:bg-bg-hover'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                      {weapon.type === 'Off-Hand' ? <Shield className="w-5 h-5" /> :
                       weapon.type === 'Two-Handed' && weapon.attribute === 'Marksmanship' ? <span className="text-lg">🏹</span> :
                       weapon.type === 'One-Handed' && weapon.attribute === 'Various' ? <Wand2 className="w-5 h-5" /> :
                       <Swords className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-text-primary">{weapon.name}</div>
                      <div className="text-xs text-text-muted">{weapon.type} • {weapon.profession}</div>
                    </div>
                    <span className="text-xs text-text-muted">{weapon.attribute.split('/')[0]}</span>
                  </button>
                ))}
              </div>

              <div className="h-px bg-border" />
              <div className="px-4 py-2 text-xs text-text-muted flex justify-between">
                <span>
                  <kbd className="px-1.5 py-0.5 bg-bg-card rounded">↑↓</kbd> navigate
                  {' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">↵</kbd> select
                </span>
                <span>{availableWeapons.length} weapons</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
