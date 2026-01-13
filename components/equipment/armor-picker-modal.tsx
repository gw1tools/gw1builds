'use client'

/**
 * Armor Picker Modal
 *
 * Tabbed slot-by-slot editor for armor runes and insignias.
 * Each slot (Head, Chest, Hands, Legs, Feet) has Rune/Insignia tabs.
 * Auto-advances to Insignia tab after selecting a rune.
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
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

/** Format rune name for display (abbreviated tier + category/attribute) */
export function formatRuneLabel(rune: Rune): string {
  const tierAbbr = rune.tier === 'superior' ? 'Sup' : rune.tier === 'major' ? 'Maj' : 'Min'

  switch (rune.category) {
    case 'vigor':
      return `${tierAbbr} Vigor`
    case 'vitae':
      return 'Vitae'
    case 'attunement':
      return 'Attunement'
    case 'absorption':
      return `${tierAbbr} Absorption`
    case 'attribute':
      return rune.attribute ? `${tierAbbr} ${rune.attribute}` : rune.name.replace('Rune of ', '')
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
  type,
  onClear,
}: {
  label: string
  type: 'headpiece' | 'rune' | 'insignia'
  onClear: () => void
}) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium',
      type === 'headpiece'
        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
        : type === 'rune'
        ? 'bg-accent-gold/15 text-accent-gold border border-accent-gold/30'
        : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
    )}>
      <span className="truncate max-w-[100px]">{label}</span>
      {/* Using span instead of button to avoid nested button hydration error */}
      <span
        role="button"
        tabIndex={0}
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
        <X className="w-3 h-3" />
      </span>
    </span>
  )
}

// ============================================================================
// TAB BAR
// ============================================================================

const TAB_INDICATOR_COLORS: Record<SlotTab, string> = {
  headpiece: 'bg-purple-400',
  rune: 'bg-accent-gold',
  insignia: 'bg-blue-400',
}

function TabButton({
  tab,
  label,
  isActive,
  isSelected,
  onClick,
}: {
  tab: SlotTab
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
      {isSelected && (
        <span className={cn('w-1.5 h-1.5 rounded-full', TAB_INDICATOR_COLORS[tab])} />
      )}
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
          tab="headpiece"
          label="Headpiece"
          isActive={activeTab === 'headpiece'}
          isSelected={!!headpieceSelected}
          onClick={() => onTabChange('headpiece')}
        />
      )}
      <TabButton
        tab="rune"
        label="Rune"
        isActive={activeTab === 'rune'}
        isSelected={runeSelected}
        onClick={() => onTabChange('rune')}
      />
      <TabButton
        tab="insignia"
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
      'flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all',
      disabled ? 'opacity-40 border-border/30' : 'border-border/50 hover:border-border',
      isSelected && !disabled && 'border-accent-gold/50 bg-accent-gold/5'
    )}>
      <span className={cn(
        'flex-1 text-[13px] font-medium min-w-0 truncate',
        disabled ? 'text-text-muted' : isSelected ? 'text-accent-gold' : 'text-text-primary'
      )}>
        {label}
      </span>

      {infoText && !disabled && (
        <span className="text-[10px] text-text-muted/70 hidden sm:inline">{infoText}</span>
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
            const tierLabel = r.tier === 'superior' ? 'Superior' : r.tier === 'major' ? 'Major' : 'Minor'
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
                {tierLabel}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// INSIGNIA OPTION BUTTON
// ============================================================================

function InsigniaButton({
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg border text-left transition-all cursor-pointer',
        'hover:bg-bg-hover',
        selected
          ? 'border-blue-500/50 bg-blue-500/10'
          : 'border-border/50 hover:border-border'
      )}
    >
      <div className={cn(
        'text-[12px] font-medium',
        selected ? 'text-blue-400' : 'text-text-primary'
      )}>
        {label}
      </div>
      {effect && (
        <div className={cn(
          'text-[10px] mt-0.5',
          selected ? 'text-blue-400/60' : 'text-text-muted'
        )}>
          {effect}
        </div>
      )}
    </button>
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
}) {
  const isHeadSlot = slot === 'head'
  const [activeTab, setActiveTab] = useState<SlotTab>(isHeadSlot ? 'headpiece' : 'rune')

  const rune = config.runeId ? getRuneById(config.runeId) : null
  const insignia = config.insigniaId ? getInsigniaById(config.insigniaId) : null
  const headAttribute = allSlots.headAttribute

  // Get profession's attributes for headpiece selection
  const professionAttributes = useMemo(() => {
    if (!profession) return []
    const profId = PROFESSION_TO_ID[profession.charAt(0).toUpperCase() + profession.slice(1)]
    return ATTRIBUTES_BY_PROFESSION[profId] || []
  }, [profession])

  // Reset tab when expanding
  useEffect(() => {
    if (expanded) {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- derived state from props
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
      setTimeout(() => setActiveTab('rune'), 150)
    }
  }, [onHeadAttributeChange])

  // Handle rune selection with auto-advance to insignia tab
  const handleRuneSelect = useCallback((runeId: number | null) => {
    onRuneChange(runeId)
    // Auto-advance to insignia tab after selecting a rune
    if (runeId !== null) {
      setTimeout(() => setActiveTab('insignia'), 150)
    }
  }, [onRuneChange])

  // Handle insignia selection with auto-advance to next slot
  const handleInsigniaSelect = useCallback((insigniaId: number | null) => {
    onInsigniaChange(insigniaId)
    // Auto-advance to next slot after selecting an insignia
    if (insigniaId !== null && onAdvanceToNextSlot) {
      setTimeout(() => onAdvanceToNextSlot(), 200)
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
              type="headpiece"
              onClear={() => onHeadAttributeChange?.(null)}
            />
          )}
          {rune && (
            <SelectionChip
              label={formatRuneLabel(rune)}
              type="rune"
              onClear={() => onRuneChange(null)}
            />
          )}
          {insignia && (
            <SelectionChip
              label={formatInsigniaLabel(insignia)}
              type="insignia"
              onClear={() => onInsigniaChange(null)}
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

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-border">
          {/* Tab Bar */}
          <div className="px-3 pt-3 pb-2">
            <TabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              headpieceSelected={!!headAttribute}
              runeSelected={!!rune}
              insigniaSelected={!!insignia}
              isHeadSlot={isHeadSlot}
            />
          </div>

          {/* Tab Content */}
          <div className="px-3 pb-3">
            {activeTab === 'headpiece' && isHeadSlot ? (
              /* HEADPIECE TAB */
              <div className="space-y-2">
                <div className="text-[11px] text-text-muted mb-2">
                  Select an attribute for +1 bonus from your headpiece
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {professionAttributes.map((attr) => (
                    <button
                      key={attr}
                      type="button"
                      onClick={() => handleHeadpieceSelect(attr)}
                      className={cn(
                        'px-3 py-2 text-[12px] font-medium rounded-lg border transition-colors cursor-pointer text-left',
                        headAttribute === attr
                          ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                          : 'bg-bg-secondary border-border/50 text-text-secondary hover:bg-bg-hover hover:border-border'
                      )}
                    >
                      +1 {attr}
                    </button>
                  ))}
                </div>
                {headAttribute && (
                  <ClearButton label="Clear Headpiece" onClick={() => onHeadAttributeChange?.(null)} />
                )}
              </div>
            ) : activeTab === 'rune' ? (
              /* RUNE TAB */
              <div className="space-y-1">
                {/* Universal Runes */}
                <RuneRow
                  label="Vigor"
                  runes={VIGOR_RUNES}
                  selectedRuneId={config.runeId}
                  onSelect={handleRuneSelect}
                  disabled={usedNonStacking.vigor}
                  disabledReason="Doesn't stack"
                  infoText="+30/+41/+50 HP"
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

                {/* Absorption (Warrior only) */}
                {absorptionRunes.length > 0 && (
                  <RuneRow
                    label="Absorption"
                    runes={absorptionRunes}
                    selectedRuneId={config.runeId}
                    onSelect={handleRuneSelect}
                    disabled={usedNonStacking.absorption}
                    disabledReason="Doesn't stack"
                    infoText="Phys dmg −1/−2/−3"
                  />
                )}

                {/* Attribute Runes */}
                {profession && Object.keys(attributeGroups).length > 0 && (
                  <div className="pt-2 mt-2 border-t border-border/40">
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <span className="text-[10px] text-text-muted uppercase tracking-wide">Attribute Runes</span>
                      <span className="text-[9px] text-text-muted">+1 / +2 / +3</span>
                    </div>
                    <div className="space-y-1">
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
                          />
                        )
                      })}
                    </div>
                  </div>
                )}

                {config.runeId && (
                  <ClearButton label="Clear Rune" onClick={() => onRuneChange(null)} />
                )}
              </div>
            ) : (
              /* INSIGNIA TAB */
              <div className="space-y-2">
                {/* Universal Insignias */}
                <div className="grid grid-cols-2 gap-1.5">
                  {UNIVERSAL_INSIGNIAS.map((i) => (
                    <InsigniaButton
                      key={i.id}
                      label={formatInsigniaLabel(i)}
                      effect={i.slotEffects?.[slot] || i.effect}
                      selected={config.insigniaId === i.id}
                      onClick={() => handleInsigniaSelect(i.id)}
                    />
                  ))}
                </div>

                {/* Profession Insignias */}
                {professionInsignias.length > 0 && (
                  <div className="pt-2 mt-1 border-t border-border/40">
                    <div className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5 px-1">
                      Profession
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {professionInsignias.map((i) => (
                        <InsigniaButton
                          key={i.id}
                          label={formatInsigniaLabel(i)}
                          effect={i.effect}
                          selected={config.insigniaId === i.id}
                          onClick={() => handleInsigniaSelect(i.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {config.insigniaId && (
                  <ClearButton label="Clear Insignia" onClick={() => onInsigniaChange(null)} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
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

  // Lock body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

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

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      <div className="fixed inset-x-4 top-[5%] mx-auto max-w-lg z-50">
        <div className="bg-bg-elevated rounded-xl border border-border shadow-xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
            <h2 className="text-base font-semibold text-text-primary">Armor</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Slot Rows */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
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
              />
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-4 py-3 border-t border-border flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-sm rounded-lg border border-border hover:bg-bg-hover transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-sm rounded-lg bg-accent-gold text-black font-medium hover:bg-accent-gold/90 transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
