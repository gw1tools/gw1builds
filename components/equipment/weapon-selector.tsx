'use client'

import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import {
  type WeaponType,
  type EquipmentItem,
  WEAPON_TYPE_LABELS,
  BOW_TYPE_LABELS,
  getItemsByType,
} from '@/lib/gw/equipment/items'
import {
  type Modifier,
  getPrefixesForWeaponType,
  getSuffixesForWeaponType,
  getInscriptionsForWeaponType,
  type ModifierWeaponType,
} from '@/lib/gw/equipment/modifiers'
import {
  encodeWeaponSet,
  type EquipmentToEncode,
} from '@/lib/gw/equipment/template'
import { type WeaponConfig } from '@/types/database'

// Re-export for backwards compatibility
export type { WeaponConfig } from '@/types/database'

// ============================================================================
// TYPES
// ============================================================================

export interface WeaponSelectorProps {
  /** Initial weapon configuration */
  value?: WeaponConfig
  /** Called when weapon configuration changes */
  onChange?: (config: WeaponConfig) => void
  /** Slot type: main hand or off-hand */
  slot: 'mainHand' | 'offHand'
  /** Optional className */
  className?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MARTIAL_WEAPON_TYPES: WeaponType[] = [
  'axe',
  'sword',
  'hammer',
  'bow',
  'daggers',
  'scythe',
  'spear',
]

const CASTER_WEAPON_TYPES: WeaponType[] = ['wand', 'staff']

const OFFHAND_TYPES: WeaponType[] = ['shield', 'focus']

// ============================================================================
// SELECT COMPONENT
// ============================================================================

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  disabled?: boolean
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  disabled = false,
}: SelectProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-text-secondary mb-1.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          'w-full h-10 px-3 rounded-lg appearance-none',
          'bg-bg-primary border border-border',
          'text-text-primary text-sm',
          'transition-colors duration-150',
          'hover:border-border-hover',
          'focus:outline-none focus:border-accent-gold',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && 'text-text-muted'
        )}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ============================================================================
// WEAPON SELECTOR COMPONENT
// ============================================================================

/**
 * Weapon selector component for build equipment
 *
 * Allows selecting:
 * - Weapon type and specific item
 * - Prefix mod (elemental, combat, condition)
 * - Suffix mod (grips, pommels, wrappings)
 * - Inscription
 *
 * @example
 * <WeaponSelector
 *   slot="mainHand"
 *   value={weaponConfig}
 *   onChange={setWeaponConfig}
 * />
 */
export function WeaponSelector({
  value,
  onChange,
  slot,
  className,
}: WeaponSelectorProps) {
  // Local state for selections
  const [weaponType, setWeaponType] = useState<WeaponType | ''>('')
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(
    value?.item || null
  )
  const [selectedPrefix, setSelectedPrefix] = useState<Modifier | null>(
    value?.prefix || null
  )
  const [selectedSuffix, setSelectedSuffix] = useState<Modifier | null>(
    value?.suffix || null
  )
  const [selectedInscription, setSelectedInscription] = useState<Modifier | null>(
    value?.inscription || null
  )

  // Get available weapon types based on slot
  const availableWeaponTypes = useMemo(() => {
    if (slot === 'offHand') {
      return OFFHAND_TYPES
    }
    return [...MARTIAL_WEAPON_TYPES, ...CASTER_WEAPON_TYPES]
  }, [slot])

  // Get items for selected weapon type
  const availableItems = useMemo(() => {
    if (!weaponType) return []
    return getItemsByType(weaponType)
  }, [weaponType])

  // Get available mods for the selected weapon type
  const modWeaponType = useMemo((): ModifierWeaponType | null => {
    if (!weaponType) return null
    // Map WeaponType to ModifierWeaponType
    if (weaponType === 'daggers') return 'dagger'
    return weaponType as ModifierWeaponType
  }, [weaponType])

  const availablePrefixes = useMemo(() => {
    if (!modWeaponType) return []
    return getPrefixesForWeaponType(modWeaponType)
  }, [modWeaponType])

  const availableSuffixes = useMemo(() => {
    if (!modWeaponType) return []
    return getSuffixesForWeaponType(modWeaponType)
  }, [modWeaponType])

  const availableInscriptions = useMemo(() => {
    if (!modWeaponType) return []
    return getInscriptionsForWeaponType(modWeaponType)
  }, [modWeaponType])

  // Notify parent of changes
  const notifyChange = (config: Partial<WeaponConfig>) => {
    const newConfig: WeaponConfig = {
      item: config.item !== undefined ? config.item : selectedItem,
      prefix: config.prefix !== undefined ? config.prefix : selectedPrefix,
      suffix: config.suffix !== undefined ? config.suffix : selectedSuffix,
      inscription:
        config.inscription !== undefined
          ? config.inscription
          : selectedInscription,
    }
    onChange?.(newConfig)
  }

  // Handle weapon type change
  const handleWeaponTypeChange = (type: string) => {
    setWeaponType(type as WeaponType | '')
    setSelectedItem(null)
    setSelectedPrefix(null)
    setSelectedSuffix(null)
    setSelectedInscription(null)
    notifyChange({ item: null, prefix: null, suffix: null, inscription: null })
  }

  // Handle item selection
  const handleItemChange = (itemId: string) => {
    const item = availableItems.find((i) => i.id.toString() === itemId) || null
    setSelectedItem(item)
    notifyChange({ item })
  }

  // Handle prefix change
  const handlePrefixChange = (modId: string) => {
    const mod = availablePrefixes.find((m) => m.id.toString() === modId) || null
    setSelectedPrefix(mod)
    notifyChange({ prefix: mod })
  }

  // Handle suffix change
  const handleSuffixChange = (modId: string) => {
    const mod = availableSuffixes.find((m) => m.id.toString() === modId) || null
    setSelectedSuffix(mod)
    notifyChange({ suffix: mod })
  }

  // Handle inscription change
  const handleInscriptionChange = (modId: string) => {
    const mod =
      availableInscriptions.find((m) => m.id.toString() === modId) || null
    setSelectedInscription(mod)
    notifyChange({ inscription: mod })
  }

  // Generate template code for preview
  const templateCode = useMemo(() => {
    if (!selectedItem) return null
    const modIds = [
      selectedPrefix?.id,
      selectedSuffix?.id,
      selectedInscription?.id,
    ].filter((id): id is number => id !== undefined && id !== null)

    const itemConfig: EquipmentToEncode = {
      itemId: selectedItem.id,
      modifierIds: modIds,
    }

    return encodeWeaponSet(itemConfig)
  }, [selectedItem, selectedPrefix, selectedSuffix, selectedInscription])

  // Build summary string
  const summaryString = useMemo(() => {
    if (!selectedItem) return null
    const parts: string[] = []
    if (selectedPrefix) {
      // Extract just the modifier name (e.g., "Zealous" from "Zealous Dagger Tang")
      const prefixName = selectedPrefix.name.split(' ')[0]
      parts.push(prefixName)
    }
    // Base item name without "PvP " prefix
    const itemName = selectedItem.name.replace('PvP ', '')
    parts.push(itemName)
    if (selectedSuffix) {
      // Extract suffix name (e.g., "of Fortitude")
      const suffixMatch = selectedSuffix.name.match(/of \w+/)
      if (suffixMatch) parts.push(suffixMatch[0])
    }
    return parts.join(' ')
  }, [selectedItem, selectedPrefix, selectedSuffix])

  return (
    <Card className={cn('', className)}>
      <CardHeader
        title={slot === 'mainHand' ? 'Main Hand' : 'Off-Hand'}
        description={
          slot === 'mainHand'
            ? 'Select weapon and modifications'
            : 'Select shield or focus item'
        }
      />
      <CardContent className="space-y-4">
        {/* Weapon Type Selection */}
        <Select
          label="Weapon Type"
          value={weaponType}
          onChange={handleWeaponTypeChange}
          options={availableWeaponTypes.map((type) => ({
            value: type,
            label: WEAPON_TYPE_LABELS[type],
          }))}
          placeholder="Select weapon type..."
        />

        {/* Item Selection (for caster weapons with different attributes) */}
        {weaponType && availableItems.length > 1 && (
          <Select
            label={weaponType === 'bow' ? 'Bow Type' : 'Attribute'}
            value={selectedItem?.id.toString() || ''}
            onChange={handleItemChange}
            options={availableItems.map((item) => ({
              value: item.id.toString(),
              label:
                item.subtype
                  ? BOW_TYPE_LABELS[item.subtype]
                  : item.attribute || item.name,
            }))}
            placeholder="Select..."
          />
        )}

        {/* Auto-select single item types */}
        {weaponType && availableItems.length === 1 && !selectedItem && (
          <div className="text-sm text-text-muted">
            {availableItems[0].name.replace('PvP ', '')}
            <button
              type="button"
              onClick={() => handleItemChange(availableItems[0].id.toString())}
              className="ml-2 text-accent-gold hover:underline"
            >
              Select
            </button>
          </div>
        )}

        {/* Prefix Mod Selection */}
        {selectedItem && availablePrefixes.length > 0 && (
          <Select
            label="Prefix Mod"
            value={selectedPrefix?.id.toString() || ''}
            onChange={handlePrefixChange}
            options={availablePrefixes.map((mod) => ({
              value: mod.id.toString(),
              label: `${mod.name.split(' ')[0]} - ${mod.effect}`,
            }))}
            placeholder="None"
          />
        )}

        {/* Suffix Mod Selection */}
        {selectedItem && availableSuffixes.length > 0 && (
          <Select
            label="Suffix Mod"
            value={selectedSuffix?.id.toString() || ''}
            onChange={handleSuffixChange}
            options={availableSuffixes.map((mod) => ({
              value: mod.id.toString(),
              label: `${mod.name.match(/of \w+/)?.[0] || mod.name} - ${mod.effect}`,
            }))}
            placeholder="None"
          />
        )}

        {/* Inscription Selection */}
        {selectedItem && availableInscriptions.length > 0 && (
          <Select
            label="Inscription"
            value={selectedInscription?.id.toString() || ''}
            onChange={handleInscriptionChange}
            options={availableInscriptions.map((mod) => ({
              value: mod.id.toString(),
              label: `${mod.name} - ${mod.effect}`,
            }))}
            placeholder="None"
          />
        )}

        {/* Summary */}
        {summaryString && (
          <div className="pt-4 border-t border-border">
            <div className="text-sm text-text-muted mb-1">Summary</div>
            <div className="text-text-primary font-medium">{summaryString}</div>
            {selectedInscription && (
              <div className="text-sm text-accent-gold mt-1">
                {selectedInscription.name}
              </div>
            )}
          </div>
        )}

        {/* Template Code Preview */}
        {templateCode && (
          <div className="pt-2">
            <div className="text-sm text-text-muted mb-1">Equipment Code</div>
            <code className="block text-xs font-mono text-text-secondary bg-bg-primary p-2 rounded break-all">
              {templateCode}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// WEAPON SET SELECTOR (MAIN + OFF-HAND)
// ============================================================================

export interface WeaponSetConfig {
  mainHand: WeaponConfig
  offHand: WeaponConfig
}

export interface WeaponSetSelectorProps {
  value?: WeaponSetConfig
  onChange?: (config: WeaponSetConfig) => void
  className?: string
}

/**
 * Complete weapon set selector (main hand + off-hand)
 */
export function WeaponSetSelector({
  value,
  onChange,
  className,
}: WeaponSetSelectorProps) {
  const [mainHand, setMainHand] = useState<WeaponConfig>(
    value?.mainHand || { item: null, prefix: null, suffix: null, inscription: null }
  )
  const [offHand, setOffHand] = useState<WeaponConfig>(
    value?.offHand || { item: null, prefix: null, suffix: null, inscription: null }
  )

  const handleMainHandChange = (config: WeaponConfig) => {
    setMainHand(config)
    onChange?.({ mainHand: config, offHand })
  }

  const handleOffHandChange = (config: WeaponConfig) => {
    setOffHand(config)
    onChange?.({ mainHand, offHand: config })
  }

  // Check if main hand is two-handed
  const isTwoHanded = mainHand.item?.twoHanded ?? false

  return (
    <div className={cn('space-y-4', className)}>
      <WeaponSelector
        slot="mainHand"
        value={mainHand}
        onChange={handleMainHandChange}
      />
      {!isTwoHanded && (
        <WeaponSelector
          slot="offHand"
          value={offHand}
          onChange={handleOffHandChange}
        />
      )}
      {isTwoHanded && (
        <Card variant="ghost" className="border-dashed">
          <div className="text-center text-text-muted py-4">
            Two-handed weapon equipped - no off-hand available
          </div>
        </Card>
      )}
    </div>
  )
}
