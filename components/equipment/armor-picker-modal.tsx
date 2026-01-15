'use client'

/**
 * Armor Picker Modal
 *
 * Tabbed slot-by-slot editor for armor runes and insignias.
 * Each slot (Head, Chest, Hands, Legs, Feet) has Rune/Insignia tabs.
 * Auto-advances to Insignia tab after selecting a rune.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import {
  type ArmorSlot,
  type Rune,
  getRuneById,
  getInsigniaById,
  VIGOR_RUNES,
  UNIVERSAL_RUNES,
  ABSORPTION_RUNES,
  ATTRIBUTE_RUNES_BY_PROFESSION,
  UNIVERSAL_INSIGNIAS,
  INSIGNIAS_BY_PROFESSION,
} from '@/lib/gw/equipment/armor'
import type { ArmorSetConfig, ArmorSlotConfig } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'
import { validateArmorForProfession, type InvalidEquipmentItem } from '@/lib/gw/equipment/validation'
import { PROFESSION_TO_ID, ATTRIBUTES_BY_PROFESSION } from '@/lib/constants'

// ============================================================================
// TYPES
// ============================================================================

export interface ArmorPickerModalProps {
  isOpen: boolean
  onClose: () => void
  value: ArmorSetConfig
  onChange: (config: ArmorSetConfig) => void
  profession?: ProfessionKey
  /** Invalid equipment items for highlighting */
  invalidItems?: InvalidEquipmentItem[]
}

const SLOTS: { key: ArmorSlot; label: string }[] = [
  { key: 'head', label: 'Head' },
  { key: 'chest', label: 'Chest' },
  { key: 'hands', label: 'Hands' },
  { key: 'legs', label: 'Legs' },
  { key: 'feet', label: 'Feet' },
]

type SlotTab = 'headpiece' | 'rune' | 'insignia'

// ============================================================================
// LABEL FORMATTING HELPERS
// ============================================================================

function getTierLabel(tier: string | null | undefined): string {
  switch (tier) {
    case 'superior': return 'Superior'
    case 'major': return 'Major'
    default: return 'Minor'
  }
}

/** Format rune name for display (tier + category/attribute) */
export function formatRuneLabel(rune: Rune): string {
  const tier = getTierLabel(rune.tier)

  switch (rune.category) {
    case 'vigor':
      return `${tier} Vigor`
    case 'vitae':
      return 'Vitae'
    case 'attunement':
      return 'Attunement'
    case 'absorption':
      return `${tier} Absorption`
    case 'attribute':
      return rune.attribute ? `${tier} ${rune.attribute}` : rune.name.replace('Rune of ', '')
    default:
      return rune.name.replace('Rune of ', '')
  }
}

/** Format insignia name for display (without "Insignia" suffix) */
export function formatInsigniaLabel(insignia: { name: string }): string {
  return insignia.name.replace(' Insignia', '')
}

// ============================================================================
// CLEAR BUTTON (reusable for all tabs)
// ============================================================================

function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full mt-2 px-3 py-1.5 text-[11px] text-text-muted hover:text-text-secondary border border-border/40 hover:border-border rounded-lg transition-colors cursor-pointer"
    >
      {label}
    </button>
  )
}

// ============================================================================
// SELECTION CHIP (shows current selection with X to clear)
// ============================================================================

function SelectionChip({
  label,
  onClear,
  invalid = false,
}: {
  label: string
  onClear: () => void
  invalid?: boolean
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border',
      invalid
        ? 'bg-accent-red/15 text-accent-red border-accent-red/30'
        : 'bg-accent-gold/15 text-accent-gold border-accent-gold/30'
    )}>
      <span className="truncate max-w-[100px]">{label}</span>
      {/* Using span instead of button to avoid nested button hydration error */}
      <span
        role="button"
        tabIndex={0}
        aria-label={`Remove ${label}`}
        onClick={(e) => {
          e.stopPropagation()
          onClear()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            onClear()
          }
        }}
        className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" aria-hidden="true" />
      </span>
    </span>
  )
}

// ============================================================================
// TAB BAR
// ============================================================================

function TabButton({
  label,
  isActive,
  isSelected,
  onClick,
}: {
  label: string
  isActive: boolean
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-[12px] font-medium transition-all cursor-pointer',
        isActive
          ? 'bg-bg-elevated text-text-primary shadow-sm'
          : 'text-text-muted hover:text-text-secondary'
      )}
    >
      <span>{label}</span>
      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-accent-gold" />}
    </button>
  )
}

function TabBar({
  activeTab,
  onTabChange,
  headpieceSelected,
  runeSelected,
  insigniaSelected,
  isHeadSlot = false,
}: {
  activeTab: SlotTab
  onTabChange: (tab: SlotTab) => void
  headpieceSelected?: boolean
  runeSelected: boolean
  insigniaSelected: boolean
  isHeadSlot?: boolean
}) {
  return (
    <div className="flex gap-1 p-1 bg-bg-secondary rounded-lg">
      {isHeadSlot && (
        <TabButton
          label="Headpiece"
          isActive={activeTab === 'headpiece'}
          isSelected={!!headpieceSelected}
          onClick={() => onTabChange('headpiece')}
        />
      )}
      <TabButton
        label="Rune"
        isActive={activeTab === 'rune'}
        isSelected={runeSelected}
        onClick={() => onTabChange('rune')}
      />
      <TabButton
        label="Insignia"
        isActive={activeTab === 'insignia'}
        isSelected={insigniaSelected}
        onClick={() => onTabChange('insignia')}
      />
    </div>
  )
}

// ============================================================================
// RUNE OPTION ROW
// ============================================================================

function RuneRow({
  label,
  runes,
  selectedRuneId,
  onSelect,
  disabled,
  disabledReason,
  infoText,
}: {
  label: string
  runes: Rune[]
  selectedRuneId: number | null
  onSelect: (runeId: number | null) => void
  disabled?: boolean
  disabledReason?: string
  infoText?: string
}) {
  const sortedRunes = useMemo(() => {
    if (runes.length === 1) return runes
    const tierOrder: Record<string, number> = { minor: 0, major: 1, superior: 2 }
    return [...runes].sort((a, b) => (tierOrder[a.tier || ''] || 0) - (tierOrder[b.tier || ''] || 0))
  }, [runes])

  const isSelected = runes.some(r => r.id === selectedRuneId)
  const isSingleRune = runes.length === 1

  return (
    <div className={cn(
      'px-3 py-2 rounded-lg border transition-all',
      disabled
        ? 'opacity-40 border-border/30'
        : isSelected
          ? 'border-accent-gold/60 bg-accent-gold/10'
          : 'border-border/50 hover:border-border'
    )}>
      {/* Top row: Name + Buttons */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'flex-1 text-[13px] font-medium',
          disabled ? 'text-text-muted' : isSelected ? 'text-accent-gold' : 'text-text-primary'
        )}>
          {label}
        </span>

        {/* Desktop: show info text inline */}
        {infoText && !disabled && (
          <span className={cn(
            'text-[11px] hidden sm:inline',
            isSelected ? 'text-accent-gold/70' : 'text-text-muted'
          )}>{infoText}</span>
        )}

        {disabled ? (
          <span className="text-[10px] text-text-muted/60 italic">{disabledReason}</span>
        ) : isSingleRune ? (
          <button
            type="button"
            onClick={() => onSelect(selectedRuneId === runes[0].id ? null : runes[0].id)}
            className={cn(
              'px-3 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer',
              selectedRuneId === runes[0].id
                ? 'bg-accent-gold text-black'
                : 'bg-bg-secondary hover:bg-bg-hover text-text-secondary'
            )}
          >
            {selectedRuneId === runes[0].id ? 'Equipped' : 'Equip'}
          </button>
        ) : (
          <div className="flex gap-0.5">
            {sortedRunes.map((r) => {
              const isThisSelected = selectedRuneId === r.id
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelect(isThisSelected ? null : r.id)}
                  className={cn(
                    'px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer',
                    isThisSelected
                      ? 'bg-accent-gold text-black'
                      : 'bg-bg-secondary hover:bg-bg-hover text-text-secondary'
                  )}
                >
                  {getTierLabel(r.tier)}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Mobile: show info text on second line */}
      {infoText && !disabled && (
        <div className={cn(
          'text-[11px] mt-1 sm:hidden',
          isSelected ? 'text-accent-gold/70' : 'text-text-muted'
        )}>{infoText}</div>
      )}
    </div>
  )
}

// ============================================================================
// INSIGNIA OPTION BUTTON
// ============================================================================

function InsigniaRow({
  label,
  effect,
  selected,
  onClick,
}: {
  label: string
  effect?: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <div className={cn(
      'px-3 py-2 rounded-lg border transition-all',
      selected
        ? 'border-accent-gold/60 bg-accent-gold/10'
        : 'border-border/50 hover:border-border'
    )}>
      {/* Top row: Name + Button */}
      <div className="flex items-center gap-2">
        <span className={cn(
          'flex-1 text-[13px] font-medium',
          selected ? 'text-accent-gold' : 'text-text-primary'
        )}>
          {label}
        </span>

        {/* Desktop: show effect inline */}
        {effect && (
          <span className={cn(
            'text-[11px] hidden sm:inline',
            selected ? 'text-accent-gold/70' : 'text-text-muted'
          )}>{effect}</span>
        )}

        <button
          type="button"
          onClick={onClick}
          className={cn(
            'px-3 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer',
            selected
              ? 'bg-accent-gold text-black'
              : 'bg-bg-secondary hover:bg-bg-hover text-text-secondary'
          )}
        >
          {selected ? 'Equipped' : 'Equip'}
        </button>
      </div>

      {/* Mobile: show effect on second line */}
      {effect && (
        <div className={cn(
          'text-[11px] mt-1 sm:hidden',
          selected ? 'text-accent-gold/70' : 'text-text-muted'
        )}>{effect}</div>
      )}
    </div>
  )
}

// ============================================================================
// SLOT ROW (Expandable with Tabs)
// ============================================================================

function SlotRow({
  slot,
  label,
  config,
  allSlots,
  expanded,
  onToggle,
  onRuneChange,
  onInsigniaChange,
  onHeadAttributeChange,
  onAdvanceToNextSlot,
  profession,
  invalidItems = [],
}: {
  slot: ArmorSlot
  label: string
  config: ArmorSlotConfig
  allSlots: ArmorSetConfig
  expanded: boolean
  onToggle: () => void
  onRuneChange: (runeId: number | null) => void
  onInsigniaChange: (insigniaId: number | null) => void
  onHeadAttributeChange?: (attr: string | null) => void
  onAdvanceToNextSlot?: () => void
  profession?: ProfessionKey
  invalidItems?: InvalidEquipmentItem[]
}) {
  // Check if this slot has invalid rune, insignia, or headpiece
  const hasInvalidRune = invalidItems.some(item => item.slot === slot && item.type === 'rune')
  const hasInvalidInsignia = invalidItems.some(item => item.slot === slot && item.type === 'insignia')
  const hasInvalidHeadpiece = invalidItems.some(item => item.type === 'headpiece')
  const isHeadSlot = slot === 'head'
  const [activeTab, setActiveTab] = useState<SlotTab>(isHeadSlot ? 'headpiece' : 'rune')
  const wasExpandedRef = useRef(expanded)
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
      }
    }
  }, [])

  const rune = config.runeId ? getRuneById(config.runeId) : null
  const insignia = config.insigniaId ? getInsigniaById(config.insigniaId) : null
  const headAttribute = allSlots.headAttribute

  // Get profession's attributes for headpiece selection
  const professionAttributes = useMemo(() => {
    if (!profession) return []
    const profId = PROFESSION_TO_ID[profession.charAt(0).toUpperCase() + profession.slice(1)]
    return ATTRIBUTES_BY_PROFESSION[profId] || []
  }, [profession])

  // Set initial tab only when first expanding (not on every selection change)
  useEffect(() => {
    const justExpanded = expanded && !wasExpandedRef.current
    wasExpandedRef.current = expanded

    if (justExpanded) {
      let newTab: SlotTab
      if (isHeadSlot) {
        // Head slot: start at first unfilled tab
        if (!headAttribute) {
          newTab = 'headpiece'
        } else if (!config.runeId) {
          newTab = 'rune'
        } else {
          newTab = 'insignia'
        }
      } else {
        // Other slots: rune first, then insignia
        newTab = config.runeId ? 'insignia' : 'rune'
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync tab to expanded state
      setActiveTab(newTab)
    }
  }, [expanded, config.runeId, headAttribute, isHeadSlot])

  // Get profession-specific options (memoized to avoid re-renders)
  const attributeRunes = useMemo(
    () => profession ? ATTRIBUTE_RUNES_BY_PROFESSION[profession] || [] : [],
    [profession]
  )
  const absorptionRunes = profession === 'warrior' ? ABSORPTION_RUNES : []
  const professionInsignias = profession ? INSIGNIAS_BY_PROFESSION[profession] || [] : []

  // Check what non-stacking runes are already equipped on OTHER slots
  const usedNonStacking = useMemo(() => {
    const used = {
      vigor: false,
      absorption: false,
      attributes: new Set<string>(),
    }

    const otherSlots = ['head', 'chest', 'hands', 'legs', 'feet'].filter(s => s !== slot) as ArmorSlot[]
    for (const s of otherSlots) {
      const runeId = allSlots[s].runeId
      if (runeId) {
        const r = getRuneById(runeId)
        if (r) {
          if (r.category === 'vigor') used.vigor = true
          if (r.category === 'absorption') used.absorption = true
          if (r.category === 'attribute' && r.attribute) {
            used.attributes.add(r.attribute)
          }
        }
      }
    }
    return used
  }, [allSlots, slot])

  const isRuneDisabled = useCallback((r: Rune): { disabled: boolean; reason?: string } => {
    if (r.category === 'vigor' && usedNonStacking.vigor) {
      return { disabled: true, reason: "Doesn't stack" }
    }
    if (r.category === 'absorption' && usedNonStacking.absorption) {
      return { disabled: true, reason: "Doesn't stack" }
    }
    if (r.category === 'attribute' && r.attribute && usedNonStacking.attributes.has(r.attribute)) {
      return { disabled: true, reason: "Doesn't stack" }
    }
    return { disabled: false }
  }, [usedNonStacking])

  const attributeGroups = useMemo(() => {
    const groups: Record<string, Rune[]> = {}
    for (const r of attributeRunes) {
      const attr = r.attribute || 'Other'
      if (!groups[attr]) groups[attr] = []
      groups[attr].push(r)
    }
    return groups
  }, [attributeRunes])

  // Handle headpiece attribute selection with auto-advance to rune tab
  const handleHeadpieceSelect = useCallback((attr: string | null) => {
    onHeadAttributeChange?.(attr)
    // Auto-advance to rune tab after selecting headpiece
    if (attr !== null) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => setActiveTab('rune'), 300)
    }
  }, [onHeadAttributeChange])

  // Handle rune selection with auto-advance to insignia tab
  const handleRuneSelect = useCallback((runeId: number | null) => {
    onRuneChange(runeId)
    // Auto-advance to insignia tab after selecting a rune
    if (runeId !== null) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => setActiveTab('insignia'), 300)
    }
  }, [onRuneChange])

  // Handle insignia selection with auto-advance to next slot
  const handleInsigniaSelect = useCallback((insigniaId: number | null) => {
    onInsigniaChange(insigniaId)
    // Auto-advance to next slot after selecting an insignia
    // Delay matches animation duration for smooth transition
    if (insigniaId !== null && onAdvanceToNextSlot) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => onAdvanceToNextSlot(), 300)
    }
  }, [onInsigniaChange, onAdvanceToNextSlot])

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-colors',
      expanded ? 'border-border bg-bg-card' : 'border-border/60 hover:border-border'
    )}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2.5 transition-colors cursor-pointer',
          'hover:bg-bg-hover',
          expanded && 'bg-bg-secondary'
        )}
      >
        {/* Slot name */}
        <span className="text-[13px] font-semibold text-text-primary w-14 text-left">{label}</span>

        {/* Selection chips */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0 overflow-hidden">
          {isHeadSlot && headAttribute && (
            <SelectionChip
              label={`+1 ${headAttribute}`}
              onClear={() => onHeadAttributeChange?.(null)}
              invalid={hasInvalidHeadpiece}
            />
          )}
          {rune && (
            <SelectionChip
              label={formatRuneLabel(rune)}
              onClear={() => onRuneChange(null)}
              invalid={hasInvalidRune}
            />
          )}
          {insignia && (
            <SelectionChip
              label={formatInsigniaLabel(insignia)}
              onClear={() => onInsigniaChange(null)}
              invalid={hasInvalidInsignia}
            />
          )}
          {!rune && !insignia && !(isHeadSlot && headAttribute) && (
            <span className="text-[12px] text-text-muted">Empty</span>
          )}
        </div>

        {/* Chevron */}
        <ChevronDown className={cn(
          'w-4 h-4 text-text-muted transition-transform flex-shrink-0',
          expanded && 'rotate-180'
        )} />
      </button>

      {/* Expanded Content - always rendered for smooth animation */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div className="overflow-hidden border-t border-border">
              {/* Tab Bar */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15, delay: 0.05, ease: 'easeOut' }}
                className="px-3 pt-3 pb-2"
              >
                <TabBar
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  headpieceSelected={!!headAttribute}
                  runeSelected={!!rune}
                  insigniaSelected={!!insignia}
                  isHeadSlot={isHeadSlot}
                />
              </motion.div>

              {/* Tab Content with smooth transitions */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, delay: 0.1, ease: 'easeOut' }}
                className="px-3 pb-3"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {activeTab === 'headpiece' && isHeadSlot ? (
                    /* HEADPIECE TAB */
                    <motion.div
                      key="headpiece"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="space-y-2"
                    >
                      {professionAttributes.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {professionAttributes.map((attr) => (
                            <button
                              key={attr}
                              type="button"
                              onClick={() => handleHeadpieceSelect(attr)}
                              className={cn(
                                'px-3 py-2 text-[12px] font-medium rounded-lg border transition-all cursor-pointer text-left',
                                headAttribute === attr
                                  ? 'border-accent-gold/60 bg-accent-gold/10 text-accent-gold'
                                  : 'bg-bg-secondary border-border/50 text-text-secondary hover:bg-bg-hover hover:border-border'
                              )}
                            >
                              +1 {attr}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[12px] text-text-muted/60 text-center py-4">
                          {profession ? 'No attributes available' : 'Select a profession first'}
                        </div>
                      )}

                      {headAttribute && (
                        <ClearButton label="Clear Headpiece" onClick={() => onHeadAttributeChange?.(null)} />
                      )}
                    </motion.div>
                  ) : activeTab === 'rune' ? (
                    /* RUNE TAB */
                    <motion.div
                      key="rune"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="space-y-2"
                    >
                      <RuneRow
                        label="Vigor"
                        runes={VIGOR_RUNES}
                        selectedRuneId={config.runeId}
                        onSelect={handleRuneSelect}
                        disabled={usedNonStacking.vigor}
                        disabledReason="Doesn't stack"
                        infoText="+30/41/50 HP"
                      />
                      <RuneRow
                        label="Vitae"
                        runes={UNIVERSAL_RUNES.filter(r => r.category === 'vitae')}
                        selectedRuneId={config.runeId}
                        onSelect={handleRuneSelect}
                        infoText="+10 HP"
                      />
                      <RuneRow
                        label="Attunement"
                        runes={UNIVERSAL_RUNES.filter(r => r.category === 'attunement')}
                        selectedRuneId={config.runeId}
                        onSelect={handleRuneSelect}
                        infoText="+2 Energy"
                      />
                      {absorptionRunes.length > 0 && (
                        <RuneRow
                          label="Absorption"
                          runes={absorptionRunes}
                          selectedRuneId={config.runeId}
                          onSelect={handleRuneSelect}
                          disabled={usedNonStacking.absorption}
                          disabledReason="Doesn't stack"
                          infoText="-1/2/3 phys dmg"
                        />
                      )}

                      {/* Attribute runes - separated by whitespace */}
                      {profession && Object.keys(attributeGroups).length > 0 && (
                        <div className="pt-3 space-y-2">
                          {Object.entries(attributeGroups).map(([attr, attrRunes]) => {
                            const firstRune = attrRunes[0]
                            const { disabled, reason } = isRuneDisabled(firstRune)
                            return (
                              <RuneRow
                                key={attr}
                                label={attr}
                                runes={attrRunes}
                                selectedRuneId={config.runeId}
                                onSelect={handleRuneSelect}
                                disabled={disabled}
                                disabledReason={reason}
                                infoText="+1/2/3"
                              />
                            )
                          })}
                        </div>
                      )}

                      {config.runeId && (
                        <ClearButton label="Clear Rune" onClick={() => onRuneChange(null)} />
                      )}
                    </motion.div>
                  ) : (
                    /* INSIGNIA TAB */
                    <motion.div
                      key="insignia"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="space-y-2"
                    >
                      {UNIVERSAL_INSIGNIAS.map((i) => (
                        <InsigniaRow
                          key={i.id}
                          label={formatInsigniaLabel(i)}
                          effect={i.slotEffects?.[slot] || i.effect}
                          selected={config.insigniaId === i.id}
                          onClick={() => handleInsigniaSelect(i.id)}
                        />
                      ))}

                      {/* Profession insignias - separated by whitespace */}
                      {professionInsignias.length > 0 && (
                        <div className="pt-3 space-y-2">
                          {professionInsignias.map((i) => (
                            <InsigniaRow
                              key={i.id}
                              label={formatInsigniaLabel(i)}
                              effect={i.effect}
                              selected={config.insigniaId === i.id}
                              onClick={() => handleInsigniaSelect(i.id)}
                            />
                          ))}
                        </div>
                      )}

                      {config.insigniaId && (
                        <ClearButton label="Clear Insignia" onClick={() => onInsigniaChange(null)} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// SUMMARY SECTION (shows what each configured item does)
// ============================================================================

function ArmorSummary({ config }: { config: ArmorSetConfig }) {
  const slots = ['head', 'chest', 'hands', 'legs', 'feet'] as const
  const slotLabels: Record<typeof slots[number], string> = {
    head: 'Head',
    chest: 'Chest',
    hands: 'Hands',
    legs: 'Legs',
    feet: 'Feet',
  }

  const configuredSlots = slots.filter(slot => {
    const s = config[slot]
    return s.runeId || s.insigniaId || (slot === 'head' && config.headAttribute)
  })

  if (configuredSlots.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-text-muted text-center">
        No armor configured yet
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-2">
      {configuredSlots.map(slot => {
        const slotConfig = config[slot]
        const rune = slotConfig.runeId ? getRuneById(slotConfig.runeId) : null
        const insignia = slotConfig.insigniaId ? getInsigniaById(slotConfig.insigniaId) : null
        const headAttr = slot === 'head' ? config.headAttribute : null

        return (
          <div key={slot} className="flex gap-3 text-sm">
            <span className="w-12 text-text-muted shrink-0">{slotLabels[slot]}</span>
            <div className="flex-1 space-y-0.5">
              {headAttr && (
                <div className="text-text-secondary">
                  <span className="text-accent-gold">+1 {headAttr}</span>
                  <span className="text-text-muted ml-2">Headpiece bonus</span>
                </div>
              )}
              {rune && (
                <div className="text-text-secondary">
                  <span className="text-text-primary">{formatRuneLabel(rune)}</span>
                  <span className="text-text-muted ml-2">{rune.effect}</span>
                </div>
              )}
              {insignia && (
                <div className="text-text-secondary">
                  <span className="text-text-primary">{formatInsigniaLabel(insignia)}</span>
                  <span className="text-text-muted ml-2">{insignia.slotEffects?.[slot] || insignia.effect}</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================================================
// MAIN MODAL
// ============================================================================

export function ArmorPickerModal({
  isOpen,
  onClose,
  value,
  onChange,
  profession,
  invalidItems: _parentInvalidItems = [], // Unused - we compute locally
}: ArmorPickerModalProps) {
  const [localConfig, setLocalConfig] = useState<ArmorSetConfig>(value)
  const [expandedSlot, setExpandedSlot] = useState<ArmorSlot | null>('head')

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync state from props on mount
      setLocalConfig(value)
      setExpandedSlot('head')
    }
  }, [isOpen, value])

  // Validate local config against profession (updates as user makes changes)
  const localInvalidItems = useMemo(() => {
    if (!profession) return []
    return validateArmorForProfession(localConfig, profession)
  }, [localConfig, profession])

  const handleRuneChange = useCallback((slot: ArmorSlot, runeId: number | null) => {
    setLocalConfig(prev => ({
      ...prev,
      [slot]: { ...prev[slot], runeId },
    }))
  }, [])

  const handleInsigniaChange = useCallback((slot: ArmorSlot, insigniaId: number | null) => {
    setLocalConfig(prev => ({
      ...prev,
      [slot]: { ...prev[slot], insigniaId },
    }))
  }, [])

  const handleHeadAttributeChange = useCallback((attr: string | null) => {
    setLocalConfig(prev => ({
      ...prev,
      headAttribute: attr,
    }))
  }, [])

  const handleSave = useCallback(() => {
    onChange(localConfig)
    onClose()
  }, [localConfig, onChange, onClose])

  // Get next slot in sequence
  const getNextSlot = useCallback((currentSlot: ArmorSlot): ArmorSlot | null => {
    const slotOrder: ArmorSlot[] = ['head', 'chest', 'hands', 'legs', 'feet']
    const currentIndex = slotOrder.indexOf(currentSlot)
    if (currentIndex < slotOrder.length - 1) {
      return slotOrder[currentIndex + 1]
    }
    return null // No next slot (we're on feet)
  }, [])

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Armor"
      maxWidth="max-w-lg"
      footerContent={
        <ModalFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </ModalFooter>
      }
    >
      {/* Summary Section */}
      <div className="border-b border-border bg-bg-secondary/50">
        <ArmorSummary config={localConfig} />
      </div>

      {/* Slot Rows */}
      <ModalBody className="space-y-1.5">
        {SLOTS.map(({ key, label }) => (
          <SlotRow
            key={key}
            slot={key}
            label={label}
            config={localConfig[key]}
            allSlots={localConfig}
            expanded={expandedSlot === key}
            onToggle={() => setExpandedSlot(expandedSlot === key ? null : key)}
            onRuneChange={(runeId) => handleRuneChange(key, runeId)}
            onInsigniaChange={(insigniaId) => handleInsigniaChange(key, insigniaId)}
            onHeadAttributeChange={key === 'head' ? handleHeadAttributeChange : undefined}
            onAdvanceToNextSlot={() => {
              const nextSlot = getNextSlot(key)
              setExpandedSlot(nextSlot)
            }}
            profession={profession}
            invalidItems={localInvalidItems}
          />
        ))}
      </ModalBody>
    </Modal>
  )
}
