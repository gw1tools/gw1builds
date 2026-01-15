/**
 * @fileoverview Equipment component exports
 * @module components/equipment
 */

// Components
export { WeaponPickerModal } from './weapon-picker-modal'
export { WeaponSelector } from './weapon-selector'
export { EquipmentEditor } from './equipment-editor'
export { EquipmentPanel } from './equipment-panel'
export { WeaponSummary, getWeaponEffects } from './weapon-summary'

// Re-export types for convenience
export type { WeaponConfig, Equipment } from '@/types/database'
export { EMPTY_WEAPON_CONFIG } from '@/types/database'

// Re-export base equipment types from lib
export type { EquipmentItem, WeaponType } from '@/lib/gw/equipment/items'
export type { Modifier } from '@/lib/gw/equipment/modifiers'
