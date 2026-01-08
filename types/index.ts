/**
 * @fileoverview Type exports barrel
 * @module types
 *
 * Central export point for all type definitions.
 * Import from '@/types' instead of individual files.
 */

// Database entity types
export type {
  BuildId,
  ValidTemplateCode,
  User,
  SkillBar,
  Build,
  BuildVersion,
  Star,
  Report,
  TipTapDocument,
  TipTapNode,
  TipTapMark,
  UserInsert,
  BuildInsert,
  BuildVersionInsert,
  StarInsert,
  ReportInsert,
  BuildUpdate,
  BuildWithAuthor,
  BuildListItem,
} from './database'

export { asBuildId, asValidTemplateCode, EMPTY_TIPTAP_DOC } from './database'

// GW1 domain types
export type {
  Profession,
  ProfessionKey,
  Attribute,
  WarriorAttribute,
  RangerAttribute,
  MonkAttribute,
  NecromancerAttribute,
  MesmerAttribute,
  ElementalistAttribute,
  AssassinAttribute,
  RitualistAttribute,
  ParagonAttribute,
  DervishAttribute,
  SkillTypeName,
  Campaign,
  ProfessionMeta,
} from './gw1'

export {
  PROFESSIONS,
  getProfession,
  getProfessionByName,
  getProfessionColor,
  getProfessionColorVar,
  professionToKey,
} from './gw1'
