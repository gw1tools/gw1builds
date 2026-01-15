'use client'

/**
 * @fileoverview Read-only equipment display for build detail page
 * @module components/build/equipment-display
 *
 * Collapsible section showing weapon sets and armor configuration.
 * Uses card-based layout matching the editor style.
 */

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Sword, Shield as ShieldIcon, Shirt, Copy, Check } from 'lucide-react'
import { Modal, ModalBody } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import {
  type Equipment,
  type ArmorSetConfig,
} from '@/types/database'
import { buildWeaponName } from '@/components/equipment/equipment-editor'
import { getWeaponEffects } from '@/components/equipment/weapon-summary'
import {
  getRuneById,
  getInsigniaById,
} from '@/lib/gw/equipment/armor'
import { formatRuneLabel, formatInsigniaLabel } from '@/components/equipment/armor-picker-modal'
import {
  encodeArmorItems,
  encodeEquipmentTemplate,
  type EquipmentToEncode,
} from '@/lib/gw/equipment/template'

export interface EquipmentDisplayProps {
  equipment: Equipment
  /** Unique identifier for this equipment display (used for expand events) */
  equipmentId?: string
  className?: string
}

/** Check if equipment has any configuration */
export function hasEquipment(equipment: Equipment | undefined): boolean {
  if (!equipment) return false

  const hasWeapons = equipment.weaponSets.some(
    set => set.mainHand.item || set.offHand.item
  )
  if (hasWeapons) return true

  const { head, chest, hands, legs, feet } = equipment.armor
  return [head, chest, hands, legs, feet].some(slot => slot.runeId || slot.insigniaId)
}

/** Generate armor summary text */
function getArmorSummary(armor: ArmorSetConfig): string | null {
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

  if (runeCounts.size === 0 && insigniaCounts.size === 0) return null

  function formatCounts(counts: Map<string, number>): string | null {
    if (counts.size === 0) return null
    if (counts.size === 1 && [...counts.values()][0] === 5) {
      return `Full ${[...counts.keys()][0]}`
    }
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    return sorted.map(([name, count]) => count > 1 ? `${count}x ${name}` : name).join(', ')
  }

  const runeSummary = formatCounts(runeCounts)
  const insigniaSummary = formatCounts(insigniaCounts)
  return [runeSummary, insigniaSummary].filter(Boolean).join(' · ')
}

/** Check if a weapon set has any weapons configured */
function hasWeaponsInSet(set: Equipment['weaponSets'][0]): boolean {
  return !!(set.mainHand.item || set.offHand.item)
}

/** Generate equipment template code */
function generateTemplateCode(equipment: Equipment, setIndex: number): string | null {
  const currentSet = equipment.weaponSets[setIndex]
  const items: EquipmentToEncode[] = []

  // Add main hand if configured
  if (currentSet?.mainHand.item) {
    const modIds = [
      currentSet.mainHand.prefix?.id,
      currentSet.mainHand.suffix?.id,
      currentSet.mainHand.inscription?.id,
    ].filter((id): id is number => id != null)

    items.push({
      itemId: currentSet.mainHand.item.id,
      modifierIds: modIds,
    })

    // Add off-hand if configured and main hand is not two-handed
    if (currentSet.offHand.item && !currentSet.mainHand.item.twoHanded) {
      const offModIds = [
        currentSet.offHand.prefix?.id,
        currentSet.offHand.suffix?.id,
        currentSet.offHand.inscription?.id,
      ].filter((id): id is number => id != null)
      items.push({
        itemId: currentSet.offHand.item.id,
        modifierIds: offModIds,
      })
    }
  }

  // Add armor items
  if (equipment.armor) {
    items.push(...encodeArmorItems(equipment.armor))
  }

  // Return null if no items to encode
  if (items.length === 0) return null

  return encodeEquipmentTemplate(items)
}

/** Equipment card - read-only version of editor's EquipmentSlot */
function EquipmentCard({
  icon: Icon,
  label,
  title,
  subtitle,
  effects,
  onClick,
  showDetailsHint,
  titleBold = true,
}: {
  icon: typeof Sword
  label: string
  title: string
  subtitle?: string
  effects?: string[]
  onClick?: () => void
  showDetailsHint?: boolean
  titleBold?: boolean
}) {
  const Wrapper = onClick ? 'button' : 'div'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl border bg-bg-elevated border-border-hover',
        onClick && 'cursor-pointer hover:border-accent-gold/50 transition-colors'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border/30">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-bg-secondary text-text-secondary">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium uppercase tracking-wide text-text-primary">
          {label}
        </span>
        {showDetailsHint && (
          <span className="text-xs text-text-muted ml-auto">Click for details</span>
        )}
      </div>

      {/* Content */}
      <div className="px-3.5 py-3">
        <div className={cn(
          'text-sm text-text-primary leading-snug',
          titleBold && 'font-medium'
        )}>
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-accent-gold mt-0.5">
            {subtitle}
          </div>
        )}
        {effects && effects.length > 0 && (
          <div className="mt-1.5 space-y-0.5">
            {effects.map((effect, i) => (
              <div key={i} className="text-xs text-text-secondary leading-snug">
                {effect}
              </div>
            ))}
          </div>
        )}
      </div>
    </Wrapper>
  )
}

/** Armor detail modal - shows what each slot's rune/insignia does */
function ArmorDetailModal({
  isOpen,
  onClose,
  armor,
}: {
  isOpen: boolean
  onClose: () => void
  armor: ArmorSetConfig
}) {
  const slots = ['head', 'chest', 'hands', 'legs', 'feet'] as const
  const slotLabels: Record<typeof slots[number], string> = {
    head: 'Head',
    chest: 'Chest',
    hands: 'Hands',
    legs: 'Legs',
    feet: 'Feet',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Armor Details">
      <ModalBody className="space-y-3">
        {slots.map(slot => {
          const slotConfig = armor[slot]
          const rune = slotConfig.runeId ? getRuneById(slotConfig.runeId) : null
          const insignia = slotConfig.insigniaId ? getInsigniaById(slotConfig.insigniaId) : null
          const headAttr = slot === 'head' ? armor.headAttribute : null

          const hasContent = headAttr || rune || insignia
          if (!hasContent) return null

          return (
            <div key={slot} className="border border-border/60 rounded-lg p-3">
              <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
                {slotLabels[slot]}
              </div>
              <div className="space-y-1.5">
                {headAttr && (
                  <div>
                    <span className="text-sm text-accent-gold font-medium">+1 {headAttr}</span>
                    <span className="text-xs text-text-muted ml-2">Headpiece bonus</span>
                  </div>
                )}
                {rune && (
                  <div>
                    <span className="text-sm text-text-primary font-medium">{formatRuneLabel(rune)}</span>
                    <div className="text-xs text-text-secondary mt-0.5">{rune.effect}</div>
                  </div>
                )}
                {insignia && (
                  <div>
                    <span className="text-sm text-text-primary font-medium">{formatInsigniaLabel(insignia)}</span>
                    <div className="text-xs text-text-secondary mt-0.5">
                      {insignia.slotEffects?.[slot] || insignia.effect}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </ModalBody>
    </Modal>
  )
}

export function EquipmentDisplay({ equipment, equipmentId, className }: EquipmentDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeSetIndex, setActiveSetIndex] = useState(0)
  const [showCopied, setShowCopied] = useState(false)
  const [showArmorModal, setShowArmorModal] = useState(false)

  // Listen for expand events from team overview
  useEffect(() => {
    if (!equipmentId) return

    function handleExpandEquipment(e: Event): void {
      const event = e as CustomEvent<{ equipmentId: string }>
      if (event.detail.equipmentId === equipmentId) {
        setIsExpanded(true)
      }
    }

    window.addEventListener('expand-equipment', handleExpandEquipment)
    return () => window.removeEventListener('expand-equipment', handleExpandEquipment)
  }, [equipmentId])

  // Filter to only show weapon sets that have weapons configured, with their original indices
  const configuredSets = useMemo(() => {
    return equipment.weaponSets
      .map((set, index) => ({ set, originalIndex: index }))
      .filter(({ set }) => hasWeaponsInSet(set))
  }, [equipment.weaponSets])

  const hasMultipleSets = configuredSets.length > 1
  const currentSetData = configuredSets[activeSetIndex] ?? configuredSets[0]
  const currentSet = currentSetData?.set ?? equipment.weaponSets[0]
  const currentOriginalIndex = currentSetData?.originalIndex ?? 0

  const mainHandName = currentSet?.mainHand.item ? buildWeaponName(currentSet.mainHand) : null
  const mainHandEffects = currentSet?.mainHand.item ? getWeaponEffects(currentSet.mainHand) : []
  const offHandName = currentSet?.offHand.item ? buildWeaponName(currentSet.offHand) : null
  const offHandEffects = currentSet?.offHand.item ? getWeaponEffects(currentSet.offHand) : []
  const isTwoHanded = currentSet?.mainHand.item?.twoHanded ?? false

  const armorSummary = getArmorSummary(equipment.armor)
  const templateCode = useMemo(
    () => generateTemplateCode(equipment, currentOriginalIndex),
    [equipment, currentOriginalIndex]
  )

  const handleCopy = async () => {
    if (!templateCode) return
    await navigator.clipboard.writeText(templateCode)
    setShowCopied(true)
    setTimeout(() => setShowCopied(false), 2000)
  }

  return (
    <div className={className}>
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 py-2 text-left transition-colors cursor-pointer',
          'text-text-secondary hover:text-text-primary'
        )}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight className="w-4 h-4" />
        </motion.div>
        <span className="text-sm font-medium">Equipment</span>
        {/* Green indicator showing equipment is configured */}
        <span className="w-2 h-2 rounded-full bg-accent-green" />
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-2 space-y-4">
              {/* Equipment template code - same style as skill template code */}
              {templateCode && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className={cn(
                    'group w-full flex items-center justify-between gap-3',
                    'transition-colors duration-150 cursor-pointer'
                  )}
                >
                  <code
                    className={cn(
                      'font-mono text-xs tracking-wide truncate',
                      'px-3 py-2 rounded-lg',
                      'bg-bg-secondary border border-border',
                      'transition-all duration-150',
                      'group-hover:border-border-hover group-hover:bg-bg-hover/50',
                      showCopied ? 'text-accent-green border-accent-green/50 bg-accent-green/5' : 'text-text-secondary'
                    )}
                  >
                    {templateCode}
                  </code>
                  <span
                    className={cn(
                      'shrink-0 flex items-center gap-1 text-[11px] font-medium',
                      'transition-colors duration-150',
                      showCopied
                        ? 'text-accent-green'
                        : 'text-text-muted group-hover:text-text-secondary'
                    )}
                  >
                    {showCopied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </span>
                </button>
              )}

              {/* Equipment grid: Weapons (with tabs) | Armor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left column: Tabs + Weapons side by side */}
                <div className="flex items-start">
                  {/* Vertical set tabs - connected style */}
                  {hasMultipleSets && (
                    <div className="flex flex-col shrink-0 mr-3">
                      {configuredSets.map(({ set, originalIndex }, index) => {
                        const isActive = index === activeSetIndex
                        const label = set.name || `Set ${originalIndex + 1}`
                        const isFirst = index === 0
                        const isLast = index === configuredSets.length - 1

                        return (
                          <button
                            key={originalIndex}
                            type="button"
                            onClick={() => setActiveSetIndex(index)}
                            className={cn(
                              'px-3 py-2 text-xs font-medium transition-colors cursor-pointer',
                              'border-x border-t',
                              // Bottom border only on last tab
                              isLast && 'border-b',
                              // Border radius: top on first, bottom on last
                              isFirst && 'rounded-t-lg',
                              isLast && 'rounded-b-lg',
                              // Colors
                              isActive
                                ? 'bg-bg-elevated border-border-hover text-accent-gold'
                                : 'bg-bg-secondary border-border text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                            )}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Weapon cards stacked vertically */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {mainHandName && (
                      <EquipmentCard
                        icon={Sword}
                        label="Main Hand"
                        title={mainHandName}
                        subtitle={currentSet?.mainHand.item?.attribute}
                        effects={mainHandEffects}
                      />
                    )}

                    {/* Off-Hand (only if not two-handed) */}
                    {!isTwoHanded && offHandName && (
                      <EquipmentCard
                        icon={ShieldIcon}
                        label="Off-Hand"
                        title={offHandName}
                        subtitle={currentSet?.offHand.item?.attribute}
                        effects={offHandEffects}
                      />
                    )}
                  </div>
                </div>

                {/* Right column: Armor */}
                <div>
                  {armorSummary && (
                    <EquipmentCard
                      icon={Shirt}
                      label="Armor"
                      title={armorSummary}
                      titleBold={false}
                      showDetailsHint
                      onClick={() => setShowArmorModal(true)}
                    />
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Armor detail modal */}
      <ArmorDetailModal
        isOpen={showArmorModal}
        onClose={() => setShowArmorModal(false)}
        armor={equipment.armor}
      />
    </div>
  )
}
