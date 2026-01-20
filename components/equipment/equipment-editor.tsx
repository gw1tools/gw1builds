'use client'

/**
 * Equipment Editor
 *
 * A compact equipment display with modal editing.
 * Shows weapon slots + armor slots in a grid.
 * Click any slot to open the equipment picker modal.
 */

import { useState, useMemo, useCallback } from 'react'
import { Swords, Shield, Shirt, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { type BowType, BOW_TYPE_LABELS } from '@/lib/gw/equipment/items'
import { formatEffectMaxValue } from '@/lib/gw/equipment/modifiers'
import { getProfessionForAttribute } from '@/lib/gw/attributes'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import {
  encodeWeaponSet,
  type EquipmentToEncode,
} from '@/lib/gw/equipment/template'
import { getRuneById, getInsigniaById } from '@/lib/gw/equipment/armor'
import {
  type WeaponConfig,
  type ArmorSetConfig,
  EMPTY_ARMOR_SET,
} from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'
import { WeaponPickerModal } from './weapon-picker-modal'
import {
  ArmorPickerModal,
  formatRuneLabel,
  formatInsigniaLabel,
} from './armor-picker-modal'

// Re-export for backwards compatibility
export type { WeaponConfig } from '@/types/database'

// ============================================================================
// TYPES
// ============================================================================

export interface EquipmentSetConfig {
  mainHand: WeaponConfig
  offHand: WeaponConfig
  armor: ArmorSetConfig
}

export interface EquipmentEditorProps {
  value?: Partial<EquipmentSetConfig>
  onChange?: (config: EquipmentSetConfig) => void
  profession?: ProfessionKey
  className?: string
}

type SlotType = 'mainHand' | 'offHand' | 'armor'

const EMPTY_WEAPON: WeaponConfig = {
  item: null,
  prefix: null,
  suffix: null,
  inscription: null,
}

const WEAPON_SLOTS: SlotType[] = ['mainHand', 'offHand']

// GW1 PvP item text color (the blue used for PvP weapons)
const PVP_BLUE = '#AAD9FF'

/**
 * Check if a weapon config has any PvE-only mods equipped
 */
function hasPveOnlyMods(weapon: WeaponConfig): boolean {
  return [weapon.prefix, weapon.suffix, weapon.inscription].some(
    mod => mod?.pveOnly
  )
}

/**
 * Build full weapon name: [Prefix] [Item] [Suffix]
 * E.g., "Furious Sword of Fortitude"
 */
export function buildWeaponName(weapon: WeaponConfig): string | null {
  if (!weapon.item) return null

  const parts: string[] = []

  // Prefix: take first word only (e.g., "Furious" from "Furious Weapon Haft")
  if (weapon.prefix) {
    parts.push(weapon.prefix.name.split(' ')[0])
  }

  // Item name: use bow subtype label or strip "PvP " prefix
  let itemName = weapon.item.name.replace('PvP ', '')
  if (weapon.item.subtype) {
    itemName = BOW_TYPE_LABELS[weapon.item.subtype as BowType]
  }
  parts.push(itemName)

  // Suffix: extract "of X" portion
  if (weapon.suffix) {
    const suffixMatch = weapon.suffix.name.match(/of (?:the \w+|\w+)/)
    if (suffixMatch) parts.push(suffixMatch[0])
  }

  return parts.join(' ')
}

// ============================================================================
// WEAPON PREVIEW CARD (GW1 Tooltip Style)
// ============================================================================

function WeaponPreviewCard({ weapon }: { weapon: WeaponConfig }) {
  if (!weapon.item) return null

  const fullName = buildWeaponName(weapon)
  const isTwoHanded = weapon.item.twoHanded
  const profession = weapon.item.attribute
    ? getProfessionForAttribute(weapon.item.attribute)
    : null

  return (
    <div className="rounded border border-border bg-bg-primary">
      {/* Item Name */}
      <div className="px-2.5 py-1.5 border-b border-border">
        <div className="text-[13px] font-medium text-text-primary leading-tight">
          {fullName}
        </div>
      </div>

      {/* Stats: prefix, suffix, inscription name, inscription effect */}
      <div
        className="px-2.5 py-1.5 text-[12px] leading-relaxed"
        style={{ color: PVP_BLUE }}
      >
        {/* Prefix effect */}
        {weapon.prefix?.effect && (
          <div>{formatEffectMaxValue(weapon.prefix.effect)}</div>
        )}
        {/* Suffix effect */}
        {weapon.suffix?.effect && (
          <div>{formatEffectMaxValue(weapon.suffix.effect)}</div>
        )}
        {/* Inscription name */}
        {weapon.inscription && (
          <div className="text-text-muted mt-1">
            Inscription: {weapon.inscription.name}
          </div>
        )}
        {/* Inscription effect */}
        {weapon.inscription?.effect && (
          <div>{formatEffectMaxValue(weapon.inscription.effect)}</div>
        )}

        {/* Footer info */}
        <div className="text-text-muted text-[11px] mt-1.5 flex flex-wrap items-center gap-x-2">
          {isTwoHanded && <span>Two-handed</span>}
          {weapon.item.attribute && (
            <span className="flex items-center gap-1">
              {profession && (
                <ProfessionIcon
                  profession={profession as ProfessionKey}
                  size="xs"
                />
              )}
              Req. 9 {weapon.item.attribute}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EQUIPMENT SLOT BUTTON
// ============================================================================

function EquipmentSlotButton({
  slot,
  label,
  summary,
  onClick,
  disabled,
}: {
  slot: SlotType
  label: string
  summary: string | null
  onClick: () => void
  disabled?: boolean
}) {
  const isWeapon = WEAPON_SLOTS.includes(slot)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-colors text-left',
        'bg-bg-card border-border',
        disabled
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:bg-bg-hover hover:border-border-hover cursor-pointer',
        summary && 'border-accent-gold/30'
      )}
    >
      <div
        className={cn(
          'w-8 h-8 rounded flex items-center justify-center flex-shrink-0',
          summary
            ? 'bg-accent-gold/10 text-accent-gold'
            : 'bg-bg-secondary text-text-muted'
        )}
      >
        {isWeapon ? (
          slot === 'offHand' ? (
            <Shield className="w-3.5 h-3.5" />
          ) : (
            <Swords className="w-3.5 h-3.5" />
          )
        ) : (
          <Shirt className="w-3.5 h-3.5" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-text-muted uppercase tracking-wide leading-tight">
          {label}
        </div>
        <div
          className={cn(
            'text-sm truncate leading-snug',
            summary ? 'text-text-primary' : 'text-text-muted'
          )}
        >
          {summary || 'None'}
        </div>
      </div>
    </button>
  )
}

// ============================================================================
// MAIN EQUIPMENT EDITOR
// ============================================================================

export function EquipmentEditor({
  value,
  onChange,
  profession,
  className,
}: EquipmentEditorProps) {
  const [activeSlot, setActiveSlot] = useState<SlotType | null>(null)

  // Initialize config - component is uncontrolled after mount
  // If parent needs to reset values, it should remount with a key
  const [config, setConfig] = useState<EquipmentSetConfig>(() => ({
    mainHand: value?.mainHand || EMPTY_WEAPON,
    offHand: value?.offHand || EMPTY_WEAPON,
    armor: value?.armor || EMPTY_ARMOR_SET,
  }))

  const [copied, setCopied] = useState(false)

  // Check if main hand is two-handed
  const isTwoHanded = config.mainHand.item?.twoHanded ?? false

  // Generate armor summary from ArmorSetConfig
  const getArmorSetSummary = useCallback(
    (armor: ArmorSetConfig): string | null => {
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

      // Helper to format count map as summary string
      const formatCounts = (counts: Map<string, number>): string | null => {
        if (counts.size === 0) return null
        // Check for full set (all 5 slots same)
        if (counts.size === 1 && [...counts.values()][0] === 5) {
          return `Full ${[...counts.keys()][0]}`
        }
        // Sort by count descending, then alphabetically
        const sorted = [...counts.entries()].sort(
          (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
        )
        return sorted
          .map(([name, count]) => (count > 1 ? `${count}x ${name}` : name))
          .join(', ')
      }

      const runeSummary = formatCounts(runeCounts)
      const insigniaSummary = formatCounts(insigniaCounts)

      return [runeSummary, insigniaSummary].filter(Boolean).join(' · ')
    },
    []
  )

  // Detect if any PvE-only mods are equipped
  const hasPveEquipment = useMemo(() => {
    return hasPveOnlyMods(config.mainHand) || hasPveOnlyMods(config.offHand)
  }, [config.mainHand, config.offHand])

  // Generate template code
  const templateCode = useMemo(() => {
    if (!config.mainHand.item) return null

    const modIds = [
      config.mainHand.prefix?.id,
      config.mainHand.suffix?.id,
      config.mainHand.inscription?.id,
    ].filter((id): id is number => id !== undefined && id !== null)

    const mainHand: EquipmentToEncode = {
      itemId: config.mainHand.item.id,
      modifierIds: modIds,
    }

    let offHandItem: EquipmentToEncode | undefined
    if (config.offHand.item && !isTwoHanded) {
      const offModIds = [
        config.offHand.prefix?.id,
        config.offHand.suffix?.id,
        config.offHand.inscription?.id,
      ].filter((id): id is number => id !== undefined && id !== null)
      offHandItem = {
        itemId: config.offHand.item.id,
        modifierIds: offModIds,
      }
    }

    return encodeWeaponSet(mainHand, offHandItem)
  }, [config.mainHand, config.offHand, isTwoHanded])

  const handleCopy = useCallback(async () => {
    if (!templateCode) return
    await navigator.clipboard.writeText(templateCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [templateCode])

  // Update handlers
  const handleWeaponChange = useCallback(
    (slot: 'mainHand' | 'offHand', weapon: WeaponConfig) => {
      const newConfig = { ...config, [slot]: weapon }
      // Clear off-hand if main-hand becomes two-handed
      if (slot === 'mainHand' && weapon.item?.twoHanded) {
        newConfig.offHand = EMPTY_WEAPON
      }
      setConfig(newConfig)
      onChange?.(newConfig)
    },
    [config, onChange]
  )

  const handleArmorChange = useCallback(
    (newArmor: ArmorSetConfig) => {
      const newConfig = { ...config, armor: newArmor }
      setConfig(newConfig)
      onChange?.(newConfig)
    },
    [config, onChange]
  )

  return (
    <div className={cn('space-y-3', className)}>
      {/* Weapons Section */}
      <div>
        <div className="text-[11px] text-text-muted uppercase tracking-wide mb-1.5">
          Weapons
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <EquipmentSlotButton
            slot="mainHand"
            label="Main Hand"
            summary={buildWeaponName(config.mainHand)}
            onClick={() => setActiveSlot('mainHand')}
          />
          <EquipmentSlotButton
            slot="offHand"
            label="Off-Hand"
            summary={
              isTwoHanded ? '(Two-handed)' : buildWeaponName(config.offHand)
            }
            onClick={() => setActiveSlot('offHand')}
            disabled={isTwoHanded}
          />
        </div>

        {/* Weapon Preview Cards (GW1 Tooltip Style) */}
        {(config.mainHand.item || config.offHand.item) && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {config.mainHand.item ? (
              <WeaponPreviewCard weapon={config.mainHand} />
            ) : (
              /* Empty placeholder to push off-hand to right column */
              <div className="hidden sm:block" />
            )}
            {config.offHand.item && !isTwoHanded && (
              <WeaponPreviewCard weapon={config.offHand} />
            )}
          </div>
        )}
      </div>

      {/* Armor Section */}
      <div>
        <div className="text-[11px] text-text-muted uppercase tracking-wide mb-1.5">
          Armor
        </div>
        <EquipmentSlotButton
          slot="armor"
          label="Runes & Insignias"
          summary={getArmorSetSummary(config.armor)}
          onClick={() => setActiveSlot('armor')}
        />
      </div>

      {/* Template Code (only if weapon selected) */}
      {config.mainHand.item && (
        <div className="flex items-center gap-2 px-2.5 py-2 bg-bg-card border border-border rounded">
          {hasPveEquipment ? (
            <span className="flex-1 text-[11px] text-text-muted italic">
              PvE-only equipment (no template code)
            </span>
          ) : templateCode ? (
            <>
              <code className="flex-1 text-[11px] font-mono text-text-muted truncate">
                {templateCode}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  'flex-shrink-0 p-1 rounded transition-colors cursor-pointer',
                  copied
                    ? 'bg-accent-green/20 text-accent-green'
                    : 'bg-bg-hover text-text-muted hover:text-text-primary'
                )}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Weapon Picker Modal */}
      {(activeSlot === 'mainHand' || activeSlot === 'offHand') && (
        <WeaponPickerModal
          isOpen={true}
          onClose={() => setActiveSlot(null)}
          slot={activeSlot}
          value={config[activeSlot]}
          onChange={weapon => handleWeaponChange(activeSlot, weapon)}
        />
      )}

      {/* Armor Picker Modal */}
      {activeSlot === 'armor' && (
        <ArmorPickerModal
          isOpen={true}
          onClose={() => setActiveSlot(null)}
          value={config.armor}
          onChange={handleArmorChange}
          profession={profession}
        />
      )}
    </div>
  )
}
