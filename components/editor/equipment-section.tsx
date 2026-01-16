/**
 * @fileoverview Collapsible Equipment Section
 * @module components/editor/equipment-section
 *
 * Collapsible section for equipment configuration in SkillBarEditor.
 * - Collapsed by default with "Add Equipment (optional)" trigger
 * - When expanded: template code input + manual configuration
 * - Supports multiple weapon sets (like GW1's F1-F4)
 * - When configured: shows "Equipment configured" indicator
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, X, Check, Sword, Shield, Copy, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type Equipment,
  type WeaponSet,
  type WeaponConfig,
  type ArmorSetConfig,
  EMPTY_EQUIPMENT,
  EMPTY_WEAPON_SET,
  EMPTY_WEAPON_CONFIG,
  EMPTY_ARMOR_SET,
  MAX_WEAPON_SETS,
} from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'
import {
  decodeArmorSet,
  encodeFullEquipment,
  toWeaponConfig,
  type EquipmentToEncode,
  type DecodedEquipment,
} from '@/lib/gw/equipment/template'
import { WeaponPickerModal } from '@/components/equipment/weapon-picker-modal'
import { getWeaponEffects } from '@/components/equipment/weapon-summary'
import { ArmorPickerModal } from '@/components/equipment/armor-picker-modal'
import { buildWeaponName } from '@/components/equipment/equipment-editor'
import { getRuneById, getInsigniaById } from '@/lib/gw/equipment/armor'
import type { InvalidEquipmentItem } from '@/lib/gw/equipment/validation'
import { formatRuneLabel, formatInsigniaLabel } from '@/components/equipment/armor-picker-modal'
import { TemplateInput } from '@/components/editor/template-input'
import { getProfessionForAttribute } from '@/lib/gw/attributes'
import { ProfessionIcon } from '@/components/ui/profession-icon'

export interface EquipmentSectionProps {
  value?: Equipment
  onChange: (equipment: Equipment | undefined) => void
  profession?: ProfessionKey
  /** Invalid equipment items (runes/insignias that don't match profession) */
  invalidItems?: InvalidEquipmentItem[]
  className?: string
}

type ActiveSlot = 'mainHand' | 'offHand' | 'armor' | null

function hasEquipment(equipment: Equipment | undefined): boolean {
  if (!equipment) return false

  const hasWeapons = equipment.weaponSets.some(
    set => set.mainHand.item || set.offHand.item
  )
  if (hasWeapons) return true

  // Check for headpiece attribute
  if (equipment.armor.headAttribute) return true

  const { head, chest, hands, legs, feet } = equipment.armor
  return [head, chest, hands, legs, feet].some(slot => slot.runeId || slot.insigniaId)
}

/** Returns [runeSummary, insigniaSummary] for PvX-style display */
function getArmorSummary(armor: ArmorSetConfig): [string | null, string | null] {
  const slots = ['head', 'chest', 'hands', 'legs', 'feet'] as const
  const runeCounts = new Map<string, number>()
  const insigniaCounts = new Map<string, number>()

  for (const slot of slots) {
    const slotConfig = armor[slot]
    if (slotConfig.runeId) {
      const rune = getRuneById(slotConfig.runeId)
      if (rune) {
        const name = formatRuneLabel(rune)
        runeCounts.set(name, (runeCounts.get(name) || 0) + 1)
      }
    }
    if (slotConfig.insigniaId) {
      const insignia = getInsigniaById(slotConfig.insigniaId)
      if (insignia) {
        const name = formatInsigniaLabel(insignia)
        insigniaCounts.set(name, (insigniaCounts.get(name) || 0) + 1)
      }
    }
  }

  function formatCounts(counts: Map<string, number>, prefix?: string): string | null {
    if (counts.size === 0) return null
    // Full set = all 5 slots same
    if (counts.size === 1 && [...counts.values()][0] === 5) {
      return `${prefix || ''}5x ${[...counts.keys()][0]}`
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    return sorted.map(([name, count]) => count > 1 ? `${count}x ${name}` : name).join(', ')
  }

  return [formatCounts(runeCounts), formatCounts(insigniaCounts)]
}

function EquipmentSlot({
  icon: Icon,
  label,
  isConfigured,
  hasError = false,
  title,
  subtitle,
  effects,
  emptyText,
  disabled,
  onClick,
  topContent,
}: {
  icon: typeof Sword
  label: string
  isConfigured: boolean
  hasError?: boolean
  title?: string
  /** Subtitle shown below title (e.g., insignias for armor) */
  subtitle?: string
  effects?: string[]
  emptyText: string
  disabled?: boolean
  onClick: () => void
  /** Content shown above the title (e.g., headpiece bonus) */
  topContent?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full text-left rounded-xl border transition-colors duration-150',
        disabled && 'opacity-40 cursor-not-allowed',
        !disabled && 'cursor-pointer',
        hasError
          ? 'bg-accent-red/5 border-accent-red/50 hover:border-accent-red'
          : isConfigured
            ? 'bg-bg-elevated border-border-hover hover:border-accent-gold/50'
            : 'bg-bg-secondary border-border/40 hover:border-border-hover'
      )}
    >
      {/* Header row with icon and label */}
      <div className={cn(
        'flex items-center gap-2 px-3.5 py-2.5',
        isConfigured && 'border-b border-border/30'
      )}>
        <div className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg',
          hasError
            ? 'bg-accent-red/15 text-accent-red'
            : isConfigured
              ? 'bg-accent-gold/15 text-accent-gold'
              : 'bg-bg-card text-text-muted'
        )}>
          <Icon className="w-4 h-4" />
        </div>
        <span className={cn(
          'text-xs font-medium uppercase tracking-wide',
          isConfigured ? 'text-text-primary' : 'text-text-secondary'
        )}>
          {label}
        </span>
      </div>

      {/* Content area */}
      <div className="px-3.5 py-3">
        {isConfigured && (title || topContent) ? (
          <>
            {topContent && (
              <div className="mb-1.5">{topContent}</div>
            )}
            {title && (
              <div className="text-sm font-medium text-text-primary leading-snug">
                {title}
              </div>
            )}
            {subtitle && (
              <div className="text-xs text-text-secondary mt-0.5">
                {subtitle}
              </div>
            )}
            {effects && effects.length > 0 && (
              <div className="mt-1.5">
                {effects.map((effect, i) => (
                  <div key={i} className="text-xs text-text-secondary leading-snug">
                    {effect}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={cn(
            'text-sm text-text-muted',
            disabled && 'opacity-60'
          )}>
            {disabled ? '(Two-handed equipped)' : emptyText}
          </div>
        )}
      </div>
    </button>
  )
}

/** Weapon set tabs - vertical list */
/**
 * Vertical weapon set tabs - always visible on left side
 * Shows Set 1 by default, add button creates Set 2, 3, 4
 * Tabs are visually connected with shared borders
 */
function WeaponSetTabs({
  sets,
  activeIndex,
  onChange,
  onAdd,
  onDelete,
}: {
  sets: WeaponSet[]
  activeIndex: number
  onChange: (index: number) => void
  onAdd: () => void
  onDelete: (index: number) => void
}) {
  const canAdd = sets.length < MAX_WEAPON_SETS
  const canDelete = sets.length > 1

  return (
    <div className="flex flex-col shrink-0 mr-3">
      {sets.map((set, index) => {
        const isActive = index === activeIndex
        const label = set.name || `Set ${index + 1}`
        const isFirst = index === 0
        const isLast = index === sets.length - 1

        return (
          <div key={index} className="group relative">
            <button
              type="button"
              onClick={() => onChange(index)}
              className={cn(
                'w-full py-2 text-xs font-medium transition-colors cursor-pointer',
                'border-x border-t',
                // Add bottom border only on last tab when no add button
                isLast ? (canAdd ? '' : 'border-b') : '',
                // Border radius: top on first, bottom on last (only if no add button)
                isFirst && 'rounded-t-lg',
                isLast && !canAdd && 'rounded-b-lg',
                // Padding: more on right when delete button present
                canDelete ? 'pl-3 pr-7' : 'px-3',
                // Colors
                isActive
                  ? 'bg-bg-elevated border-border-hover text-accent-gold'
                  : 'bg-bg-secondary border-border text-text-muted hover:text-text-secondary hover:bg-bg-hover'
              )}
            >
              {label}
            </button>

            {canDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(index)
                }}
                className={cn(
                  'absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors cursor-pointer',
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  'text-text-muted hover:text-accent-red hover:bg-accent-red/10'
                )}
                aria-label={`Delete ${label}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )
      })}

      {canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className={cn(
            'px-3 py-1.5 text-xs transition-colors cursor-pointer',
            'border border-dashed border-border rounded-b-lg',
            // Remove top border to connect with last tab
            sets.length > 0 && 'border-t-0',
            'text-text-muted hover:text-accent-gold hover:bg-accent-gold/5'
          )}
        >
          <Plus className="w-3.5 h-3.5 mx-auto" />
        </button>
      )}
    </div>
  )
}

export function EquipmentSection({
  value,
  onChange,
  profession,
  invalidItems = [],
  className,
}: EquipmentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [templateCode, setTemplateCode] = useState('')
  const [activeSlot, setActiveSlot] = useState<ActiveSlot>(null)
  const [showCopied, setShowCopied] = useState(false)
  const [activeSetIndex, setActiveSetIndex] = useState(0)

  const isConfigured = hasEquipment(value)

  const weaponSets = value?.weaponSets ?? [{ ...EMPTY_WEAPON_SET }]
  const currentSet = weaponSets[activeSetIndex] ?? weaponSets[0]
  const isTwoHanded = currentSet.mainHand.item?.twoHanded ?? false

  const mainHandName = currentSet.mainHand.item ? buildWeaponName(currentSet.mainHand) : undefined
  const mainHandEffects = currentSet.mainHand.item ? getWeaponEffects(currentSet.mainHand) : undefined
  const offHandName = currentSet.offHand.item ? buildWeaponName(currentSet.offHand) : undefined
  const offHandEffects = currentSet.offHand.item ? getWeaponEffects(currentSet.offHand) : undefined

  const [runeSummary, insigniaSummary] = value?.armor ? getArmorSummary(value.armor) : [null, null]
  const headAttribute = value?.armor?.headAttribute
  const hasArmor = !!(runeSummary || insigniaSummary || headAttribute)

  const generatedCode = useMemo(() => {
    if (!currentSet.mainHand.item) return null

    const modIds = [
      currentSet.mainHand.prefix?.id,
      currentSet.mainHand.suffix?.id,
      currentSet.mainHand.inscription?.id,
    ].filter((id): id is number => id != null)

    const mainHand: EquipmentToEncode = {
      itemId: currentSet.mainHand.item.id,
      modifierIds: modIds,
    }

    let offHandItem: EquipmentToEncode | undefined
    if (currentSet.offHand.item && !isTwoHanded) {
      const offModIds = [
        currentSet.offHand.prefix?.id,
        currentSet.offHand.suffix?.id,
        currentSet.offHand.inscription?.id,
      ].filter((id): id is number => id != null)
      offHandItem = {
        itemId: currentSet.offHand.item.id,
        modifierIds: offModIds,
      }
    }

    return encodeFullEquipment(mainHand, offHandItem, value?.armor)
  }, [currentSet, isTwoHanded, value?.armor])

  const handleDecode = useCallback((decoded: DecodedEquipment, code: string) => {
    const newSet: WeaponSet = {
      mainHand: decoded.mainHand ? toWeaponConfig(decoded.mainHand) : { ...EMPTY_WEAPON_CONFIG },
      offHand: decoded.offHand ? toWeaponConfig(decoded.offHand) : { ...EMPTY_WEAPON_CONFIG },
    }

    const current = value || { ...EMPTY_EQUIPMENT }
    const newSets = [...current.weaponSets]
    newSets[activeSetIndex] = newSet

    // Only update armor if it's currently empty (don't overwrite existing armor config)
    const hasExistingArmor = [
      current.armor.head,
      current.armor.chest,
      current.armor.hands,
      current.armor.legs,
      current.armor.feet,
    ].some(slot => slot.runeId || slot.insigniaId)

    const decodedArmor = hasExistingArmor ? null : decodeArmorSet(code)

    onChange({
      weaponSets: newSets,
      armor: decodedArmor || current.armor,
    })
    setTemplateCode(code)
  }, [onChange, value, activeSetIndex])

  const handleWeaponChange = useCallback((slot: 'mainHand' | 'offHand', weapon: WeaponConfig) => {
    const current = value || { ...EMPTY_EQUIPMENT }
    const newSets = [...current.weaponSets]
    const currentSetData = { ...newSets[activeSetIndex] }

    currentSetData[slot] = weapon

    // Clear off-hand if main-hand becomes two-handed
    if (slot === 'mainHand' && weapon.item?.twoHanded) {
      currentSetData.offHand = { ...EMPTY_WEAPON_CONFIG }
    }

    newSets[activeSetIndex] = currentSetData
    onChange({ ...current, weaponSets: newSets })
  }, [value, onChange, activeSetIndex])

  const handleArmorChange = useCallback((armor: ArmorSetConfig) => {
    const current = value || { ...EMPTY_EQUIPMENT }
    onChange({ ...current, armor })
  }, [value, onChange])

  const handleAddSet = useCallback(() => {
    const current = value || { ...EMPTY_EQUIPMENT }
    if (current.weaponSets.length >= MAX_WEAPON_SETS) return

    const newSets = [...current.weaponSets, { ...EMPTY_WEAPON_SET }]
    onChange({ ...current, weaponSets: newSets })
    setActiveSetIndex(newSets.length - 1)
  }, [value, onChange])

  const handleDeleteSet = useCallback((index: number) => {
    const current = value || { ...EMPTY_EQUIPMENT }
    if (current.weaponSets.length <= 1) return

    const newSets = current.weaponSets.filter((_, i) => i !== index)
    onChange({ ...current, weaponSets: newSets })

    // Adjust active index if needed
    if (activeSetIndex >= newSets.length) {
      setActiveSetIndex(newSets.length - 1)
    } else if (activeSetIndex > index) {
      setActiveSetIndex(activeSetIndex - 1)
    }
  }, [value, onChange, activeSetIndex])

  const handleClear = useCallback(() => {
    onChange(undefined)
    setTemplateCode('')
    setIsExpanded(false)
    setActiveSetIndex(0)
  }, [onChange])

  const handleCopyTemplate = useCallback(async () => {
    const code = generatedCode || templateCode
    if (!code) return
    await navigator.clipboard.writeText(code)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }, [generatedCode, templateCode])

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'group w-full flex items-center gap-2.5 py-2 transition-colors text-left cursor-pointer',
          isConfigured
            ? 'text-text-primary'
            : 'text-text-muted hover:text-text-secondary'
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <span className="text-sm">
          {isConfigured ? 'Equipment configured' : 'Add Equipment'}
        </span>
        {!isConfigured && (
          <span className="text-xs text-text-muted/50">(optional)</span>
        )}
        {isConfigured && (
          <span className="w-2 h-2 rounded-full bg-accent-green" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-5">
              <TemplateInput
                value={generatedCode || templateCode}
                onChange={setTemplateCode}
                variant="equipment"
                onDecodeEquipment={handleDecode}
                className="flex-1"
              />
              {(generatedCode || templateCode) && (
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
                    onClick={handleClear}
                    className="p-2 rounded-lg text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors cursor-pointer"
                    title="Clear equipment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {!isConfigured && (
              <div className="flex items-center gap-4 mb-5">
                <div className="flex-1 border-t border-border/40" />
                <span className="text-[11px] text-text-muted/70 uppercase tracking-wider">or configure manually</span>
                <div className="flex-1 border-t border-border/40" />
              </div>
            )}

            {/* Equipment grid: Weapons (with tabs) | Armor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left column: Tabs + Weapons side by side */}
              <div className="flex items-start">
                {/* Vertical set tabs - always visible */}
                <WeaponSetTabs
                  sets={weaponSets}
                  activeIndex={activeSetIndex}
                  onChange={setActiveSetIndex}
                  onAdd={handleAddSet}
                  onDelete={handleDeleteSet}
                />

                {/* Weapon cards stacked vertically */}
                <div className="flex-1 min-w-0 space-y-3">
                  <EquipmentSlot
                    icon={Sword}
                    label="Main Hand"
                    isConfigured={!!mainHandName}
                    title={mainHandName ?? undefined}
                    subtitle={currentSet.mainHand.item?.attribute ?? undefined}
                    effects={mainHandEffects}
                    emptyText="Select weapon"
                    onClick={() => setActiveSlot('mainHand')}
                  />
                  <EquipmentSlot
                    icon={Shield}
                    label="Off-Hand"
                    isConfigured={!!offHandName}
                    title={offHandName ?? undefined}
                    subtitle={currentSet.offHand.item?.attribute ?? undefined}
                    effects={offHandEffects}
                    emptyText="Select off-hand"
                    disabled={isTwoHanded}
                    onClick={() => setActiveSlot('offHand')}
                  />
                </div>
              </div>

              {/* Right column: Armor */}
              <div>
                <EquipmentSlot
                  icon={Shield}
                  label="Armor"
                  isConfigured={hasArmor}
                  hasError={invalidItems.length > 0}
                  title={runeSummary ?? undefined}
                  subtitle={insigniaSummary ?? undefined}
                  emptyText="Configure runes & insignias"
                  onClick={() => setActiveSlot('armor')}
                  topContent={headAttribute && (
                    <div className="flex items-center gap-1.5 text-sm text-accent-gold">
                      {getProfessionForAttribute(headAttribute) && (
                        <ProfessionIcon
                          profession={getProfessionForAttribute(headAttribute)!}
                          size="sm"
                        />
                      )}
                      <span>+1 {headAttribute}</span>
                    </div>
                  )}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(activeSlot === 'mainHand' || activeSlot === 'offHand') && (
        <WeaponPickerModal
          isOpen={true}
          onClose={() => setActiveSlot(null)}
          slot={activeSlot}
          value={currentSet[activeSlot]}
          onChange={(weapon) => handleWeaponChange(activeSlot, weapon)}
        />
      )}

      {activeSlot === 'armor' && (
        <ArmorPickerModal
          isOpen={true}
          onClose={() => setActiveSlot(null)}
          value={value?.armor || EMPTY_ARMOR_SET}
          onChange={handleArmorChange}
          profession={profession}
          invalidItems={invalidItems}
        />
      )}
    </div>
  )
}
