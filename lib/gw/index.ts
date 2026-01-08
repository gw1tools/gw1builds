/**
 * @fileoverview GW1 Module Exports
 * @module lib/gw
 *
 * Central export point for Guild Wars 1 related functionality.
 * Import from '@/lib/gw' instead of individual files.
 */

// Template decoder
export {
  decodeTemplate,
  isValidTemplateCode,
  getPrimaryProfession,
  getAttributesForProfession,
  getAttributesForBuild,
  type DecodedTemplate,
  type DecodeError,
  type DecodeErrorCode,
  type DecodeResult,
} from './decoder'

// Skill database
export {
  getSkillById,
  getSkillByName,
  getSkillsByIds,
  searchSkills,
  getSkillsByProfession,
  getEliteSkills,
  getAllSkills,
  getSkillCount,
  preloadSkills,
  type Skill,
} from './skills'

// Wiki URLs
export {
  GW1_WIKI_BASE,
  getSkillWikiUrl,
  getAttributeWikiUrl,
  getTitleTrackWikiUrl,
  getProfessionWikiUrl,
} from './wiki'
