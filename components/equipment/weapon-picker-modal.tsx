'use client'

/**
 * Weapon Picker Modal
 *
 * Clean weapon configuration interface.
 * Features: text-based weapon type selection, side-by-side mod config + preview.
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type WeaponType,
  type EquipmentItem,
  type BowType,
  WEAPON_TYPE_LABELS,
  BOW_TYPE_LABELS,
  getItemsByType,
} from '@/lib/gw/equipment/items'
import { getProfessionForAttribute } from '@/lib/gw/attributes'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import type { ProfessionKey } from '@/types/gw1'
import {
  type ModifierWeaponType,
  getPrefixesForWeaponType,
  getSuffixesForWeaponType,
  getInscriptionsForWeaponType,
  formatEffectMaxValue,
} from '@/lib/gw/equipment/modifiers'
import { type WeaponConfig, EMPTY_WEAPON_CONFIG } from '@/types/database'
import { WeaponSummary } from './weapon-summary'

// Re-export for backwards compatibility
export type { WeaponConfig } from '@/types/database'

interface WeaponPickerModalProps {
  isOpen: boolean
  onClose: () => void
  slot: 'mainHand' | 'offHand'
  value: WeaponConfig
  onChange: (config: WeaponConfig) => void
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TWO_HANDED_TYPES: WeaponType[] = ['hammer', 'bow', 'daggers', 'scythe', 'staff']

// Main hand weapons sorted by profession: Warrior → Ranger → Assassin → Dervish → Paragon → Caster
const MAIN_HAND_TYPES: WeaponType[] = [
  'sword', 'axe', 'hammer',  // Warrior (melee)
  'bow',                      // Ranger
  'daggers',                  // Assassin
  'scythe',                   // Dervish
  'spear',                    // Paragon
  'wand', 'staff',            // Caster
]
const OFF_HAND_TYPES: WeaponType[] = ['shield', 'focus']

// Weapon types that have multiple profession-specific variants
const PROFESSION_SPECIFIC_TYPES: WeaponType[] = ['wand', 'staff', 'focus', 'shield']

// ============================================================================
// WEAPON TYPE BUTTON
// ============================================================================

function WeaponTypeButton({
  type,
  isSelected,
  onClick,
}: {
  type: WeaponType
  isSelected: boolean
  onClick: () => void
}) {
  const isTwoHanded = TWO_HANDED_TYPES.includes(type)

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative px-3 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer',
        'border whitespace-nowrap',
        isSelected
          ? 'bg-accent-gold/15 border-accent-gold text-accent-gold'
          : 'bg-bg-card border-border hover:border-border-hover hover:bg-bg-hover text-text-secondary hover:text-text-primary'
      )}
    >
      {WEAPON_TYPE_LABELS[type]}
      {isTwoHanded && (
        <span className="ml-1 text-[10px] text-text-muted">(2H)</span>
      )}
    </button>
  )
}

// ============================================================================
// MOD SELECTOR (controlled open state for auto-advance)
// ============================================================================

type ModSection = 'prefix' | 'suffix' | 'inscription'

function ModSelector({
  label,
  options,
  selectedId,
  onSelect,
  isOpen,
  onToggle,
}: {
  label: string
  options: { id: number; name: string; effect?: string; pveOnly?: boolean }[]
  selectedId: number | null
  onSelect: (id: number | null) => void
  isOpen: boolean
  onToggle: () => void
}) {
  // Sort options: non-PvE first, then PvE-only at bottom
  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      if (a.pveOnly && !b.pveOnly) return 1
      if (!a.pveOnly && b.pveOnly) return -1
      return 0
    })
  }, [options])

  const selected = options.find(o => o.id === selectedId)
  const isInscription = label === 'Inscription'

  // Format display name - inscriptions get "Inscription: " prefix
  const formatDisplayName = (name: string) => isInscription ? `Inscription: ${name}` : name

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted uppercase tracking-wide">{label}</span>
        {selected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect(null)
            }}
            className="text-xs text-text-muted hover:text-accent-red transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all cursor-pointer',
          selected
            ? 'bg-bg-elevated border-border-hover text-text-primary'
            : 'bg-bg-card border-border hover:border-border-hover text-text-secondary',
          isOpen && 'border-accent-gold/50'
        )}
      >
        <span className="flex items-center gap-2">
          {selected && (
            <Check className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          )}
          {selected ? formatDisplayName(selected.name) : 'None'}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pt-1">
              {sortedOptions.map((option) => {
                const isSelected = selectedId === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => onSelect(option.id)}
                    className={cn(
                      'text-left px-2 py-1.5 rounded border text-xs transition-all cursor-pointer',
                      isSelected
                        ? 'bg-bg-elevated border-border-hover text-text-primary'
                        : 'bg-bg-card border-border hover:border-border-hover hover:bg-bg-hover text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      {isSelected && (
                        <Check className="w-3 h-3 text-text-muted flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{formatDisplayName(option.name)}</span>
                      {option.pveOnly && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple rounded flex-shrink-0">
                          PvE
                        </span>
                      )}
                    </div>
                    {option.effect && (
                      <div className={cn(
                        "text-[10px]",
                        isSelected ? "text-text-secondary ml-[18px]" : "text-text-muted"
                      )}>
                        {formatEffectMaxValue(option.effect)}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================================================
// WEAPON PREVIEW (Uses shared WeaponSummary component)
// ============================================================================

function LivePreview({ config }: { config: WeaponConfig }) {
  if (!config.item) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-6 text-center">
        <p className="text-sm text-text-muted">Select a weapon type</p>
      </div>
    )
  }
  return <WeaponSummary config={config} variant="detailed" />
}

// ============================================================================
// MODAL CONTENT (Inner component that mounts/unmounts with modal)
// ============================================================================

interface WeaponPickerContentProps {
  slot: 'mainHand' | 'offHand'
  initialValue: WeaponConfig
  onSave: (config: WeaponConfig) => void
  onClear: () => void
  onClose: () => void
}

function WeaponPickerContent({
  slot,
  initialValue,
  onSave,
  onClear,
  onClose,
}: WeaponPickerContentProps) {
  // Initialize state directly from props - no useEffect sync needed
  const [selectedType, setSelectedType] = useState<WeaponType | null>(
    initialValue.item?.type || null
  )
  const [config, setConfig] = useState<WeaponConfig>(initialValue)
  // Store configs per weapon type so switching tabs preserves selections
  const [configsByType, setConfigsByType] = useState<Partial<Record<WeaponType, WeaponConfig>>>(
    initialValue.item?.type ? { [initialValue.item.type]: initialValue } : {}
  )
  // Track which mod section is expanded (auto-advance flow)
  const [expandedSection, setExpandedSection] = useState<ModSection | null>(null)

  const weaponTypes = slot === 'offHand'
    ? OFF_HAND_TYPES
    : MAIN_HAND_TYPES

  const items = useMemo(() => {
    if (!selectedType) return []
    return getItemsByType(selectedType)
  }, [selectedType])

  const modType = useMemo((): ModifierWeaponType | null => {
    if (!selectedType) return null
    if (selectedType === 'daggers') return 'dagger'
    return selectedType as ModifierWeaponType
  }, [selectedType])

  const prefixes = useMemo(() => modType ? getPrefixesForWeaponType(modType) : [], [modType])
  const suffixes = useMemo(() => modType ? getSuffixesForWeaponType(modType) : [], [modType])
  const inscriptions = useMemo(() => modType ? getInscriptionsForWeaponType(modType) : [], [modType])

  const handleTypeSelect = useCallback((type: WeaponType) => {
    // Save current config before switching
    if (selectedType && config.item) {
      setConfigsByType(prev => ({ ...prev, [selectedType]: config }))
    }

    setSelectedType(type)

    // Restore previous config for this type, or start fresh
    const savedConfig = configsByType[type]
    if (savedConfig) {
      setConfig(savedConfig)
    } else {
      const typeItems = getItemsByType(type)
      if (typeItems.length === 1) {
        setConfig({ item: typeItems[0], prefix: null, suffix: null, inscription: null })
      } else {
        setConfig({ item: null, prefix: null, suffix: null, inscription: null })
      }
    }
  }, [selectedType, config, configsByType])

  const handleItemSelect = useCallback((item: EquipmentItem | null) => {
    setConfig(prev => ({ ...prev, item, prefix: null, suffix: null, inscription: null }))
    // Auto-open prefix section when item is selected
    if (item) {
      setTimeout(() => setExpandedSection('prefix'), 100)
    }
  }, [])

  const handlePrefixSelect = useCallback((id: number | null) => {
    const mod = id ? prefixes.find(p => p.id === id) || null : null
    setConfig(prev => ({ ...prev, prefix: mod }))
    // Auto-advance to suffix after selecting prefix
    if (id !== null) {
      setTimeout(() => setExpandedSection('suffix'), 150)
    }
  }, [prefixes])

  const handleSuffixSelect = useCallback((id: number | null) => {
    const mod = id ? suffixes.find(s => s.id === id) || null : null
    setConfig(prev => ({ ...prev, suffix: mod }))
    // Auto-advance to inscription after selecting suffix
    if (id !== null) {
      setTimeout(() => setExpandedSection('inscription'), 150)
    }
  }, [suffixes])

  const handleInscriptionSelect = useCallback((id: number | null) => {
    const mod = id ? inscriptions.find(i => i.id === id) || null : null
    setConfig(prev => ({ ...prev, inscription: mod }))
    // Close sections after selecting inscription (all done)
    if (id !== null) {
      setTimeout(() => setExpandedSection(null), 150)
    }
  }, [inscriptions])

  const handleSave = () => {
    onSave(config)
  }

  const getItemLabel = (item: EquipmentItem) => {
    if (item.subtype) return BOW_TYPE_LABELS[item.subtype as BowType]
    if (item.attribute && ['wand', 'staff', 'focus', 'shield'].includes(item.type)) {
      return item.attribute
    }
    return item.name.replace('PvP ', '')
  }

  return (
    <div className="bg-bg-elevated border border-border rounded-xl overflow-hidden flex flex-col shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h2 className="text-base font-semibold text-text-primary">
          {slot === 'mainHand' ? 'Main Hand Weapon' : 'Off-Hand Item'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded hover:bg-bg-hover text-text-muted hover:text-text-primary cursor-pointer transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Weapon Type Selection */}
        <div>
          <h3 className="text-xs text-text-muted uppercase tracking-wide mb-2">Weapon Type</h3>
          <div className="flex flex-wrap gap-1.5">
            {weaponTypes.map((type) => (
              <WeaponTypeButton
                key={type}
                type={type}
                isSelected={selectedType === type}
                onClick={() => handleTypeSelect(type)}
              />
            ))}
          </div>
        </div>

        {/* Config + Preview side by side */}
        {selectedType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Item + Mods */}
            <div className="space-y-3">
              {/* Item Selection */}
              {items.length > 1 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-muted uppercase tracking-wide">
                      {selectedType === 'bow' ? 'Bow Type' : 'Variant'}
                    </span>
                    {config.item && (
                      <button
                        type="button"
                        onClick={() => handleItemSelect(null)}
                        className="text-xs text-text-muted hover:text-accent-red transition-colors cursor-pointer"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    {config.item ? (
                      /* Selected item - collapsed view */
                      <motion.div
                        key="selected"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        {(() => {
                          const item = config.item!
                          const showProfessionIcon = PROFESSION_SPECIFIC_TYPES.includes(selectedType) && item.attribute
                          const profession = showProfessionIcon ? getProfessionForAttribute(item.attribute!) : null
                          return (
                            <button
                              type="button"
                              onClick={() => handleItemSelect(null)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-lg border bg-bg-elevated border-border-hover cursor-pointer hover:bg-bg-hover transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                                {profession && (
                                  <ProfessionIcon
                                    profession={profession as ProfessionKey}
                                    size="xs"
                                    className="flex-shrink-0"
                                  />
                                )}
                                <span className="font-medium text-sm text-text-primary">
                                  {getItemLabel(item)}
                                </span>
                              </div>
                              <ChevronDown className="w-4 h-4 text-text-muted" />
                            </button>
                          )
                        })()}
                      </motion.div>
                    ) : (
                      /* All items - expanded grid */
                      <motion.div
                        key="grid"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="grid grid-cols-2 gap-1.5"
                      >
                        {items.map((item, index) => {
                          const showProfessionIcon = PROFESSION_SPECIFIC_TYPES.includes(selectedType) && item.attribute
                          const profession = showProfessionIcon ? getProfessionForAttribute(item.attribute!) : null

                          return (
                            <motion.button
                              key={item.id}
                              type="button"
                              onClick={() => handleItemSelect(item)}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.15, delay: index * 0.02 }}
                              className="text-left px-2.5 py-2 rounded-lg border text-sm bg-bg-card border-border hover:border-border-hover hover:bg-bg-hover text-text-secondary transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5">
                                {profession && (
                                  <ProfessionIcon
                                    profession={profession as ProfessionKey}
                                    size="xs"
                                    className="flex-shrink-0"
                                  />
                                )}
                                <span className="font-medium truncate">{getItemLabel(item)}</span>
                              </div>
                            </motion.button>
                          )
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mods */}
              {config.item && (
                <div className="space-y-3">
                  {prefixes.length > 0 && (
                    <ModSelector
                      label="Prefix"
                      options={prefixes.map(p => ({ id: p.id, name: p.name, effect: p.effect, pveOnly: p.pveOnly }))}
                      selectedId={config.prefix?.id || null}
                      onSelect={handlePrefixSelect}
                      isOpen={expandedSection === 'prefix'}
                      onToggle={() => setExpandedSection(expandedSection === 'prefix' ? null : 'prefix')}
                    />
                  )}
                  {suffixes.length > 0 && (
                    <ModSelector
                      label="Suffix"
                      options={suffixes.map(s => ({ id: s.id, name: s.name, effect: s.effect, pveOnly: s.pveOnly }))}
                      selectedId={config.suffix?.id || null}
                      onSelect={handleSuffixSelect}
                      isOpen={expandedSection === 'suffix'}
                      onToggle={() => setExpandedSection(expandedSection === 'suffix' ? null : 'suffix')}
                    />
                  )}
                  {inscriptions.length > 0 && (
                    <ModSelector
                      label="Inscription"
                      options={inscriptions.map(i => ({ id: i.id, name: i.name, effect: i.effect, pveOnly: i.pveOnly }))}
                      selectedId={config.inscription?.id || null}
                      onSelect={handleInscriptionSelect}
                      isOpen={expandedSection === 'inscription'}
                      onToggle={() => setExpandedSection(expandedSection === 'inscription' ? null : 'inscription')}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Right: Preview */}
            <div className="rounded-lg p-3 bg-bg-card border border-border">
              <LivePreview config={config} />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-bg-secondary/50">
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-text-muted hover:text-accent-red cursor-pointer transition-colors"
        >
          Clear
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm bg-bg-card border border-border rounded-lg hover:bg-bg-hover hover:text-text-primary cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!config.item}
            className={cn(
              'px-4 py-1.5 text-sm rounded-lg font-medium transition-colors',
              config.item
                ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold/30 hover:bg-accent-gold/30 cursor-pointer'
                : 'bg-bg-card text-text-muted border border-border cursor-not-allowed'
            )}
          >
            Equip
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN MODAL (Wrapper that handles portal and backdrop)
// ============================================================================

export function WeaponPickerModal({
  isOpen,
  onClose,
  slot,
  value,
  onChange,
}: WeaponPickerModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSave = useCallback((config: WeaponConfig) => {
    onChange(config)
    onClose()
  }, [onChange, onClose])

  const handleClear = useCallback(() => {
    onChange(EMPTY_WEAPON_CONFIG)
    onClose()
  }, [onChange, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-[5%] left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-50 max-h-[90vh] overflow-hidden flex flex-col">
        <WeaponPickerContent
          slot={slot}
          initialValue={value}
          onSave={handleSave}
          onClear={handleClear}
          onClose={onClose}
        />
      </div>
    </>
  )
}
