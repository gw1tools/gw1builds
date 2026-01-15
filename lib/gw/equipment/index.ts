/**
 * @fileoverview GW1 Equipment System
 * @module lib/gw/equipment
 *
 * Equipment data, types, and template encoding/decoding for GW1 builds.
 *
 * Note: Equipment templates are a PvP feature in GW1, but we use them
 * for all builds to provide structured equipment information.
 */

// Items (weapons, shields, focus items)
export * from './items'

// Modifiers (prefixes, suffixes, inscriptions)
export * from './modifiers'

// Armor (runes, insignias)
export * from './armor'

// Template encoding/decoding
export * from './template'
