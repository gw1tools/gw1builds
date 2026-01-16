'use client'

/**
 * GW1-Style Equipment Panel
 *
 * A responsive equipment selector inspired by the Guild Wars 1 PvP Equipment panel.
 * Features a panel-based layout with weapon/offhand selection and mod customization.
 *
 * Mobile: Vertical accordion panels
 * Desktop: 2×2 grid mimicking the original GW1 UI
 */

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Copy, Check, Swords, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  type WeaponType,
  type EquipmentItem,
  type BowType,
  WEAPON_TYPE_LABELS,
  BOW_TYPE_LABELS,
  getItemsByType,
} from '@/lib/gw/equipment/items'
import {
  type Modifier,
  type ModifierWeaponType,
  getPrefixesForWeaponType,
  getSuffixesForWeaponType,
  getInscriptionsForWeaponType,
} from '@/lib/gw/equipment/modifiers'
import {
  encodeWeaponSet,
  type EquipmentToEncode,
} from '@/lib/gw/equipment/template'

// ============================================================================
// TYPES
// ============================================================================

export interface EquipmentConfig {
  item: EquipmentItem | null
  prefix: Modifier | null
  suffix: Modifier | null
  inscription: Modifier | null
}

export interface EquipmentPanelProps {
  /** Current configuration */
  value?: EquipmentConfig
  /** Called when configuration changes */
  onChange?: (config: EquipmentConfig) => void
  /** Equipment slot type */
  slot?: 'mainHand' | 'offHand'
  /** Optional className */
  className?: string
}

type SlotTab = 'two-handed' | 'one-handed' | 'off-hand'

// ============================================================================
// CONSTANTS
// ============================================================================

const SLOT_TABS: { id: SlotTab; label: string; icon: React.ReactNode }[] = [
  { id: 'two-handed', label: 'Two-Handed', icon: <Swords className="w-4 h-4" /> },
  { id: 'one-handed', label: 'One-Handed', icon: <Swords className="w-4 h-4" /> },
  { id: 'off-hand', label: 'Off-Hand', icon: <Shield className="w-4 h-4" /> },
]

const TWO_HANDED_TYPES: WeaponType[] = ['hammer', 'bow', 'daggers', 'scythe', 'staff']
const ONE_HANDED_TYPES: WeaponType[] = ['axe', 'sword', 'spear', 'wand']
const OFF_HAND_TYPES: WeaponType[] = ['shield', 'focus']

// Mod component names by weapon type
const PREFIX_LABELS: Partial<Record<WeaponType, string>> = {
  axe: 'Axe Hafts',
  sword: 'Sword Hilts',
  hammer: 'Hammer Hafts',
  bow: 'Bow Strings',
  daggers: 'Dagger Tangs',
  scythe: 'Scythe Snathes',
  spear: 'Spearheads',
  staff: 'Staff Heads',
  wand: 'Wand Wrappings',
}

const SUFFIX_LABELS: Partial<Record<WeaponType, string>> = {
  axe: 'Axe Grips',
  sword: 'Sword Pommels',
  hammer: 'Hammer Grips',
  bow: 'Bow Grips',
  daggers: 'Dagger Handles',
  scythe: 'Scythe Grips',
  spear: 'Spear Grips',
  staff: 'Staff Wrappings',
  shield: 'Shield Handles',
  focus: 'Focus Cores',
}

// ============================================================================
// PANEL HEADER COMPONENT
// ============================================================================

function PanelHeader({
  title,
  isExpanded,
  onToggle,
  count,
}: {
  title: string
  isExpanded?: boolean
  onToggle?: () => void
  count?: number
}) {
  const isCollapsible = onToggle !== undefined

  return (
    <div
      className={cn(
        'relative px-3 py-2',
        'bg-gradient-to-b from-[#2a2a30] to-[#222228]',
        'border-b border-[#3a3a42]',
        isCollapsible && 'cursor-pointer select-none',
        isCollapsible && 'active:bg-[#1f1f24]'
      )}
      onClick={onToggle}
    >
      {/* Subtle top highlight line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#4a4a52] to-transparent" />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary tracking-wide">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {count !== undefined && count > 0 && (
            <span className="text-xs text-text-muted tabular-nums">
              {count}
            </span>
          )}
          {isCollapsible && (
            <ChevronDown
              className={cn(
                'w-4 h-4 text-text-muted transition-transform duration-200',
                isExpanded && 'rotate-180'
              )}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// ITEM ROW COMPONENT
// ============================================================================

function ItemRow({
  label,
  sublabel,
  isSelected,
  isNone,
  onClick,
}: {
  label: string
  sublabel?: string
  isSelected: boolean
  isNone?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
        'hover:bg-bg-hover',
        isSelected && 'bg-accent-gold/10'
      )}
    >
      {/* Selection indicator */}
      <div
        className={cn(
          'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors',
          isSelected
            ? 'border-accent-gold bg-accent-gold'
            : 'border-[#4a4a52] bg-transparent'
        )}
      >
        {isSelected && (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-bg-primary" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-sm truncate',
            isNone ? 'text-text-muted italic' : 'text-text-primary',
            isSelected && !isNone && 'text-accent-gold font-medium'
          )}
        >
          {label}
        </div>
        {sublabel && (
          <div className="text-xs text-text-muted truncate mt-0.5">
            {sublabel}
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================================================
// SELECTION PANEL COMPONENT
// ============================================================================

function SelectionPanel({
  title,
  items,
  selectedId,
  onSelect,
  renderItem,
  emptyMessage = 'No options available',
  className,
  maxHeight = 'max-h-48',
  isCollapsible = false,
  defaultExpanded = true,
}: {
  title: string
  items: { id: string | number; label: string; sublabel?: string }[]
  selectedId: string | number | null
  onSelect: (id: string | number | null) => void
  renderItem?: (item: { id: string | number; label: string; sublabel?: string }) => React.ReactNode
  emptyMessage?: string
  className?: string
  maxHeight?: string
  isCollapsible?: boolean
  defaultExpanded?: boolean
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const content = (
    <div className={cn('overflow-y-auto', maxHeight)}>
      {/* None option */}
      <ItemRow
        label="None"
        isSelected={selectedId === null}
        isNone
        onClick={() => onSelect(null)}
      />

      {items.length === 0 && selectedId !== null && (
        <div className="px-3 py-4 text-sm text-text-muted text-center">
          {emptyMessage}
        </div>
      )}

      {items.map((item) =>
        renderItem ? (
          <div key={item.id} onClick={() => onSelect(item.id)}>
            {renderItem(item)}
          </div>
        ) : (
          <ItemRow
            key={item.id}
            label={item.label}
            sublabel={item.sublabel}
            isSelected={selectedId === item.id}
            onClick={() => onSelect(item.id)}
          />
        )
      )}
    </div>
  )

  return (
    <div
      className={cn(
        'bg-bg-card border border-[#3a3a42] rounded-lg overflow-hidden',
        className
      )}
    >
      <PanelHeader
        title={title}
        count={items.length}
        isExpanded={isCollapsible ? isExpanded : undefined}
        onToggle={isCollapsible ? () => setIsExpanded(!isExpanded) : undefined}
      />

      {isCollapsible ? (
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      ) : (
        content
      )}
    </div>
  )
}

// ============================================================================
// EQUIPMENT PREVIEW COMPONENT
// ============================================================================

function EquipmentPreview({
  config,
  templateCode,
}: {
  config: EquipmentConfig
  templateCode: string | null
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!templateCode) return
    await navigator.clipboard.writeText(templateCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [templateCode])

  // Build the display name
  const displayName = useMemo(() => {
    if (!config.item) return null

    const parts: string[] = []

    // Prefix (e.g., "Zealous")
    if (config.prefix) {
      const prefixName = config.prefix.name.split(' ')[0]
      parts.push(prefixName)
    }

    // Item name without "PvP " prefix
    const itemName = config.item.name.replace('PvP ', '')
    parts.push(itemName)

    // Suffix (e.g., "of Fortitude")
    if (config.suffix) {
      const suffixMatch = config.suffix.name.match(/of \w+/)
      if (suffixMatch) parts.push(suffixMatch[0])
    }

    return parts.join(' ')
  }, [config])

  if (!config.item) {
    return (
      <div className="bg-bg-card border border-[#3a3a42] border-dashed rounded-lg p-4">
        <div className="text-center text-text-muted text-sm">
          Select a weapon to see preview
        </div>
      </div>
    )
  }

  return (
    <div className="bg-bg-card border border-[#3a3a42] rounded-lg overflow-hidden">
      <PanelHeader title="Equipment Preview" />

      <div className="p-4 space-y-3">
        {/* Item name with mods */}
        <div>
          <div className="text-base font-semibold text-accent-gold">
            {displayName}
          </div>
          {config.item.attribute && (
            <div className="text-xs text-text-muted mt-0.5">
              Requires {config.item.attribute}
            </div>
          )}
        </div>

        {/* Mod effects: prefix, suffix, inscription name, inscription effect */}
        <div className="text-xs text-text-secondary space-y-0.5">
          {config.prefix?.effect && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent-gold" />
              {config.prefix.effect}
            </div>
          )}
          {config.suffix?.effect && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent-gold" />
              {config.suffix.effect}
            </div>
          )}
          {config.inscription && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent-gold" />
              Inscription: {config.inscription.name}
            </div>
          )}
          {config.inscription?.effect && (
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-accent-gold" />
              {config.inscription.effect}
            </div>
          )}
        </div>

        {/* Template code */}
        {templateCode && (
          <div className="pt-3 border-t border-[#3a3a42]">
            <div className="flex items-center justify-between gap-2">
              <code className="flex-1 text-xs font-mono text-text-muted bg-bg-primary px-2 py-1.5 rounded truncate">
                {templateCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'flex-shrink-0 p-1.5 rounded transition-colors',
                  copied
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-bg-hover text-text-muted hover:text-text-primary'
                )}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN EQUIPMENT PANEL COMPONENT
// ============================================================================

export function EquipmentPanel({
  value,
  onChange,
  slot = 'mainHand',
  className,
}: EquipmentPanelProps) {
  // Active slot tab
  const [activeTab, setActiveTab] = useState<SlotTab>(
    slot === 'offHand' ? 'off-hand' : 'one-handed'
  )

  // Selected weapon type within the current tab
  const [selectedWeaponType, setSelectedWeaponType] = useState<WeaponType | null>(null)

  // Current configuration
  const [config, setConfig] = useState<EquipmentConfig>(
    value || { item: null, prefix: null, suffix: null, inscription: null }
  )

  // Get available weapon types for current tab
  const availableWeaponTypes = useMemo(() => {
    switch (activeTab) {
      case 'two-handed':
        return TWO_HANDED_TYPES
      case 'one-handed':
        return ONE_HANDED_TYPES
      case 'off-hand':
        return OFF_HAND_TYPES
      default:
        return []
    }
  }, [activeTab])

  // Get items for selected weapon type
  const availableItems = useMemo(() => {
    if (!selectedWeaponType) return []
    return getItemsByType(selectedWeaponType)
  }, [selectedWeaponType])

  // Map weapon type to modifier weapon type
  const modWeaponType = useMemo((): ModifierWeaponType | null => {
    if (!selectedWeaponType) return null
    if (selectedWeaponType === 'daggers') return 'dagger'
    return selectedWeaponType as ModifierWeaponType
  }, [selectedWeaponType])

  // Get available mods
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

  // Generate template code
  const templateCode = useMemo(() => {
    if (!config.item) return null

    const modIds = [
      config.prefix?.id,
      config.suffix?.id,
      config.inscription?.id,
    ].filter((id): id is number => id !== undefined && id !== null)

    const itemConfig: EquipmentToEncode = {
      itemId: config.item.id,
      modifierIds: modIds,
    }

    return encodeWeaponSet(itemConfig)
  }, [config])

  // Update config and notify parent
  const updateConfig = useCallback(
    (updates: Partial<EquipmentConfig>) => {
      const newConfig = { ...config, ...updates }
      setConfig(newConfig)
      onChange?.(newConfig)
    },
    [config, onChange]
  )

  // Handle tab change
  const handleTabChange = useCallback((tab: SlotTab) => {
    setActiveTab(tab)
    setSelectedWeaponType(null)
    setConfig({ item: null, prefix: null, suffix: null, inscription: null })
  }, [])

  // Handle weapon type selection
  const handleWeaponTypeSelect = useCallback((type: WeaponType | null) => {
    setSelectedWeaponType(type)
    setConfig({ item: null, prefix: null, suffix: null, inscription: null })
  }, [])

  // Handle item selection
  const handleItemSelect = useCallback(
    (itemId: string | number | null) => {
      if (itemId === null) {
        updateConfig({ item: null, prefix: null, suffix: null, inscription: null })
        return
      }
      const item = availableItems.find((i) => i.id === Number(itemId)) || null
      updateConfig({ item, prefix: null, suffix: null, inscription: null })
    },
    [availableItems, updateConfig]
  )

  // Handle mod selections
  const handlePrefixSelect = useCallback(
    (modId: string | number | null) => {
      const mod = modId
        ? availablePrefixes.find((m) => m.id === Number(modId)) || null
        : null
      updateConfig({ prefix: mod })
    },
    [availablePrefixes, updateConfig]
  )

  const handleSuffixSelect = useCallback(
    (modId: string | number | null) => {
      const mod = modId
        ? availableSuffixes.find((m) => m.id === Number(modId)) || null
        : null
      updateConfig({ suffix: mod })
    },
    [availableSuffixes, updateConfig]
  )

  const handleInscriptionSelect = useCallback(
    (modId: string | number | null) => {
      const mod = modId
        ? availableInscriptions.find((m) => m.id === Number(modId)) || null
        : null
      updateConfig({ inscription: mod })
    },
    [availableInscriptions, updateConfig]
  )

  // Format items for display
  const itemOptions = useMemo(() => {
    return availableItems.map((item) => {
      // For bows, show the bow type
      if (item.subtype) {
        return {
          id: item.id,
          label: BOW_TYPE_LABELS[item.subtype as BowType] || item.name,
          sublabel: item.attribute || undefined,
        }
      }
      // For caster weapons, show the attribute
      if (item.attribute && (item.type === 'wand' || item.type === 'staff' || item.type === 'focus')) {
        return {
          id: item.id,
          label: item.attribute,
          sublabel: item.name.replace('PvP ', ''),
        }
      }
      return {
        id: item.id,
        label: item.name.replace('PvP ', ''),
        sublabel: item.attribute || undefined,
      }
    })
  }, [availableItems])

  // Format mods for display
  const formatModOptions = useCallback((mods: Modifier[]) => {
    return mods.map((mod) => {
      // Extract the key part of the name
      let label = mod.name
      if (mod.category === 'prefix') {
        label = mod.name.split(' ')[0] // "Zealous", "Vampiric", etc.
      } else if (mod.category === 'suffix') {
        const match = mod.name.match(/of (\w+)/)
        label = match ? match[0] : mod.name // "of Fortitude", etc.
      }
      return {
        id: mod.id,
        label,
        sublabel: mod.effect || undefined,
      }
    })
  }, [])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Slot Tabs */}
      <div className="flex gap-1 p-1 bg-bg-card border border-[#3a3a42] rounded-lg">
        {SLOT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-accent-gold/20 text-accent-gold'
                : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            )}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Weapon Type Selection */}
      <div className="flex flex-wrap gap-2">
        {availableWeaponTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => handleWeaponTypeSelect(type)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors border',
              selectedWeaponType === type
                ? 'bg-accent-gold/20 text-accent-gold border-accent-gold/40'
                : 'bg-bg-card text-text-secondary border-[#3a3a42] hover:border-[#4a4a52] hover:text-text-primary'
            )}
          >
            {WEAPON_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Main Panel Grid */}
      {selectedWeaponType && (
        <>
          {/* Mobile: Accordion style */}
          <div className="grid gap-3 md:hidden">
            <SelectionPanel
              title="Items"
              items={itemOptions}
              selectedId={config.item?.id || null}
              onSelect={handleItemSelect}
              isCollapsible
              defaultExpanded
              maxHeight="max-h-52"
            />

            {config.item && availablePrefixes.length > 0 && (
              <SelectionPanel
                title={PREFIX_LABELS[selectedWeaponType] || 'Prefix Mods'}
                items={formatModOptions(availablePrefixes)}
                selectedId={config.prefix?.id || null}
                onSelect={handlePrefixSelect}
                isCollapsible
                defaultExpanded={false}
                maxHeight="max-h-52"
              />
            )}

            {config.item && availableSuffixes.length > 0 && (
              <SelectionPanel
                title={SUFFIX_LABELS[selectedWeaponType] || 'Suffix Mods'}
                items={formatModOptions(availableSuffixes)}
                selectedId={config.suffix?.id || null}
                onSelect={handleSuffixSelect}
                isCollapsible
                defaultExpanded={false}
                maxHeight="max-h-52"
              />
            )}

            {config.item && availableInscriptions.length > 0 && (
              <SelectionPanel
                title="Inscriptions"
                items={formatModOptions(availableInscriptions)}
                selectedId={config.inscription?.id || null}
                onSelect={handleInscriptionSelect}
                isCollapsible
                defaultExpanded={false}
                maxHeight="max-h-52"
              />
            )}
          </div>

          {/* Desktop: 2×2 Grid like GW1 */}
          <div className="hidden md:grid md:grid-cols-2 gap-3">
            <SelectionPanel
              title="Items"
              items={itemOptions}
              selectedId={config.item?.id || null}
              onSelect={handleItemSelect}
              maxHeight="max-h-56"
            />

            <SelectionPanel
              title={PREFIX_LABELS[selectedWeaponType] || 'Prefix Mods'}
              items={config.item ? formatModOptions(availablePrefixes) : []}
              selectedId={config.prefix?.id || null}
              onSelect={handlePrefixSelect}
              emptyMessage="Select an item first"
              maxHeight="max-h-56"
            />

            <SelectionPanel
              title="Inscriptions"
              items={config.item ? formatModOptions(availableInscriptions) : []}
              selectedId={config.inscription?.id || null}
              onSelect={handleInscriptionSelect}
              emptyMessage="Select an item first"
              maxHeight="max-h-56"
            />

            <SelectionPanel
              title={SUFFIX_LABELS[selectedWeaponType] || 'Suffix Mods'}
              items={config.item ? formatModOptions(availableSuffixes) : []}
              selectedId={config.suffix?.id || null}
              onSelect={handleSuffixSelect}
              emptyMessage="Select an item first"
              maxHeight="max-h-56"
            />
          </div>
        </>
      )}

      {/* Preview */}
      <EquipmentPreview config={config} templateCode={templateCode} />
    </div>
  )
}

// ============================================================================
// FULL WEAPON SET PANEL (MAIN + OFF-HAND)
// ============================================================================

export interface WeaponSetPanelConfig {
  mainHand: EquipmentConfig
  offHand: EquipmentConfig
}

export interface WeaponSetPanelProps {
  value?: WeaponSetPanelConfig
  onChange?: (config: WeaponSetPanelConfig) => void
  className?: string
}

export function WeaponSetPanel({
  value,
  onChange,
  className,
}: WeaponSetPanelProps) {
  const [activeSlot, setActiveSlot] = useState<'mainHand' | 'offHand'>('mainHand')

  const [mainHand, setMainHand] = useState<EquipmentConfig>(
    value?.mainHand || { item: null, prefix: null, suffix: null, inscription: null }
  )
  const [offHand, setOffHand] = useState<EquipmentConfig>(
    value?.offHand || { item: null, prefix: null, suffix: null, inscription: null }
  )

  const handleMainHandChange = useCallback(
    (config: EquipmentConfig) => {
      setMainHand(config)
      onChange?.({ mainHand: config, offHand })
    },
    [offHand, onChange]
  )

  const handleOffHandChange = useCallback(
    (config: EquipmentConfig) => {
      setOffHand(config)
      onChange?.({ mainHand, offHand: config })
    },
    [mainHand, onChange]
  )

  // Check if main hand is two-handed
  const isTwoHanded = mainHand.item?.twoHanded ?? false

  return (
    <div className={cn('space-y-4', className)}>
      {/* Slot Toggle */}
      <div className="flex gap-2 p-1 bg-bg-card border border-[#3a3a42] rounded-lg">
        <button
          type="button"
          onClick={() => setActiveSlot('mainHand')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
            activeSlot === 'mainHand'
              ? 'bg-accent-gold/20 text-accent-gold'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          )}
        >
          <Swords className="w-4 h-4" />
          Main Hand
          {mainHand.item && (
            <span className="w-2 h-2 rounded-full bg-accent-gold" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSlot('offHand')}
          disabled={isTwoHanded}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-colors',
            activeSlot === 'offHand'
              ? 'bg-accent-gold/20 text-accent-gold'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover',
            isTwoHanded && 'opacity-40 cursor-not-allowed'
          )}
        >
          <Shield className="w-4 h-4" />
          Off-Hand
          {offHand.item && !isTwoHanded && (
            <span className="w-2 h-2 rounded-full bg-accent-gold" />
          )}
        </button>
      </div>

      {/* Two-handed notice */}
      {isTwoHanded && activeSlot === 'offHand' && (
        <div className="text-center text-sm text-text-muted py-4 bg-bg-card border border-dashed border-[#3a3a42] rounded-lg">
          Two-handed weapon equipped — no off-hand available
        </div>
      )}

      {/* Active slot panel */}
      {activeSlot === 'mainHand' ? (
        <EquipmentPanel
          slot="mainHand"
          value={mainHand}
          onChange={handleMainHandChange}
        />
      ) : (
        !isTwoHanded && (
          <EquipmentPanel
            slot="offHand"
            value={offHand}
            onChange={handleOffHandChange}
          />
        )
      )}
    </div>
  )
}
