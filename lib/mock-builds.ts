/**
 * @fileoverview Mock build data for development
 * @module lib/mock-builds
 *
 * Realistic GW1 builds with actual skill IDs for testing the homepage feed.
 * These will be replaced by Supabase queries in production.
 */

import type { BuildListItem } from '@/types/database'

/**
 * Mock builds for homepage feed development
 * Includes variety of professions, star counts, and build types
 */
export const MOCK_BUILDS: BuildListItem[] = [
  // Popular Mesmer build
  {
    id: 'esurge1',
    name: 'Esurge Domination Hero',
    tags: ['pve', 'hero', 'meta'],
    bars: [
      {
        primary: 'Mesmer',
        secondary: 'Necromancer',
        name: 'Esurge Domination Hero',
        skills: [56, 63, 58, 70, 149, 152, 155, 2],
      },
    ],
    star_count: 847,
    view_count: 12420,
    created_at: '2024-12-15T10:30:00Z',
    author: { username: 'GuildLord', avatar_url: null },
  },
  // Classic Warrior
  {
    id: '100bwar',
    name: '100 Blades Warrior',
    tags: ['pve', 'player', 'beginner'],
    bars: [
      {
        primary: 'Warrior',
        secondary: 'Monk',
        name: '100 Blades Warrior',
        skills: [323, 330, 346, 351, 333, 940, 941, 2],
      },
    ],
    star_count: 523,
    view_count: 8934,
    created_at: '2024-12-20T14:22:00Z',
    author: { username: 'WarriorMain', avatar_url: null },
  },
  // Team build
  {
    id: 'mesway7',
    name: '7-Hero Mesmerway',
    tags: ['pve', 'team', 'meta', 'hard-mode'],
    bars: [
      {
        primary: 'Mesmer',
        secondary: 'Necromancer',
        name: 'Esurge 1 (Gwen)',
        skills: [56, 63, 58, 70, 149, 152, 155, 2],
      },
      {
        primary: 'Mesmer',
        secondary: 'Necromancer',
        name: 'Esurge 2 (Norgu)',
        skills: [56, 63, 58, 70, 149, 152, 155, 2],
      },
      {
        primary: 'Mesmer',
        secondary: 'Elementalist',
        name: 'Panic (Xandra)',
        skills: [66, 63, 58, 70, 213, 216, 155, 2],
      },
    ],
    star_count: 1247,
    view_count: 34521,
    created_at: '2024-11-08T09:15:00Z',
    author: { username: 'MetaBuilder', avatar_url: null },
  },
  // Monk healer
  {
    id: 'wohmon',
    name: 'Word of Healing Monk',
    tags: ['pve', 'hero', 'healer'],
    bars: [
      {
        primary: 'Monk',
        secondary: 'Mesmer',
        name: 'WoH Healer',
        skills: [268, 256, 259, 261, 270, 79, 80, 2],
      },
    ],
    star_count: 412,
    view_count: 6789,
    created_at: '2024-12-28T16:45:00Z',
    author: { username: 'HealerMains', avatar_url: null },
  },
  // Necro minion master
  {
    id: 'mmnecr',
    name: 'Minion Master Necromancer',
    tags: ['pve', 'hero', 'beginner'],
    bars: [
      {
        primary: 'Necromancer',
        secondary: 'Monk',
        name: 'MM Necro',
        skills: [138, 130, 135, 141, 144, 146, 261, 2],
      },
    ],
    star_count: 389,
    view_count: 5234,
    created_at: '2024-12-22T11:30:00Z',
    author: { username: 'DarkArts', avatar_url: null },
  },
  // Elementalist nuker
  {
    id: 'sfelem',
    name: 'Searing Flames Elementalist',
    tags: ['pve', 'player', 'nuker'],
    bars: [
      {
        primary: 'Elementalist',
        secondary: 'Monk',
        name: 'SF Ele',
        skills: [227, 219, 221, 224, 231, 235, 261, 2],
      },
    ],
    star_count: 298,
    view_count: 4521,
    created_at: '2024-12-25T08:00:00Z',
    author: { username: 'FireMage', avatar_url: null },
  },
  // Ranger spirit spammer
  {
    id: 'spirng',
    name: 'Spirit Ranger',
    tags: ['pve', 'hero', 'support'],
    bars: [
      {
        primary: 'Ranger',
        secondary: 'Ritualist',
        name: 'Spirit Ranger',
        skills: [296, 299, 302, 305, 873, 876, 879, 2],
      },
    ],
    star_count: 267,
    view_count: 3890,
    created_at: '2024-12-18T13:20:00Z',
    author: { username: 'NatureWalker', avatar_url: null },
  },
  // Assassin dagger
  {
    id: 'dagass',
    name: 'Dagger Spam Assassin',
    tags: ['pve', 'player', 'melee'],
    bars: [
      {
        primary: 'Assassin',
        secondary: 'Warrior',
        name: 'Dagger Assassin',
        skills: [779, 782, 785, 788, 791, 794, 333, 2],
      },
    ],
    star_count: 234,
    view_count: 3456,
    created_at: '2024-12-30T19:45:00Z',
    author: { username: 'ShadowBlade', avatar_url: null },
  },
  // Ritualist SoS
  {
    id: 'sosrit',
    name: 'Signet of Spirits Ritualist',
    tags: ['pve', 'hero', 'meta'],
    bars: [
      {
        primary: 'Ritualist',
        secondary: 'Mesmer',
        name: 'SoS Rit',
        skills: [873, 876, 879, 882, 885, 79, 80, 2],
      },
    ],
    star_count: 678,
    view_count: 9876,
    created_at: '2024-12-12T07:30:00Z',
    author: { username: 'SpiritCaller', avatar_url: null },
  },
  // Paragon imbagon
  {
    id: 'imbago',
    name: 'Imbagon Paragon',
    tags: ['pve', 'player', 'meta', 'tank'],
    bars: [
      {
        primary: 'Paragon',
        secondary: 'Warrior',
        name: 'Imbagon',
        skills: [920, 923, 926, 929, 932, 935, 333, 2],
      },
    ],
    star_count: 945,
    view_count: 15678,
    created_at: '2024-11-25T12:00:00Z',
    author: { username: 'CommanderX', avatar_url: null },
  },
  // Dervish VoS
  {
    id: 'vosdrv',
    name: 'Vow of Strength Dervish',
    tags: ['pve', 'player', 'melee'],
    bars: [
      {
        primary: 'Dervish',
        secondary: 'Assassin',
        name: 'VoS Derv',
        skills: [956, 959, 962, 965, 968, 779, 782, 2],
      },
    ],
    star_count: 356,
    view_count: 5432,
    created_at: '2024-12-27T15:15:00Z',
    author: { username: 'WindWalker', avatar_url: null },
  },
  // PvP build
  {
    id: 'pvpmes',
    name: 'Shutdown Mesmer',
    tags: ['pvp', 'gvg', 'player'],
    bars: [
      {
        primary: 'Mesmer',
        secondary: 'Elementalist',
        name: 'Shutdown Mes',
        skills: [56, 63, 66, 70, 73, 213, 216, 2],
      },
    ],
    star_count: 189,
    view_count: 2345,
    created_at: '2024-12-29T21:00:00Z',
    author: { username: 'PvPLegend', avatar_url: null },
  },
  // Budget build
  {
    id: 'budwar',
    name: 'Budget Warrior (No Elite)',
    tags: ['pve', 'player', 'beginner', 'budget'],
    bars: [
      {
        primary: 'Warrior',
        secondary: 'Ranger',
        name: 'Budget Warrior',
        skills: [330, 333, 336, 339, 296, 299, 302, 2],
      },
    ],
    star_count: 156,
    view_count: 2890,
    created_at: '2024-12-31T10:30:00Z',
    author: { username: 'NewPlayer2024', avatar_url: null },
  },
  // Meme build
  {
    id: '55monk',
    name: '55 Monk (Classic)',
    tags: ['pve', 'player', 'meme', 'solo'],
    bars: [
      {
        primary: 'Monk',
        secondary: 'Necromancer',
        name: '55 Monk',
        skills: [256, 259, 262, 265, 138, 141, 144, 2],
      },
    ],
    star_count: 534,
    view_count: 8765,
    created_at: '2024-11-15T18:30:00Z',
    author: { username: 'OldSchoolGW', avatar_url: null },
  },
  // Recent with no stars
  {
    id: 'newbld',
    name: 'Experimental Necro',
    tags: ['pve', 'player', 'niche'],
    bars: [
      {
        primary: 'Necromancer',
        secondary: 'Ritualist',
        name: 'Experimental',
        skills: [138, 141, 144, 147, 873, 876, 879, 2],
      },
    ],
    star_count: 3,
    view_count: 47,
    created_at: '2025-01-05T23:45:00Z',
    author: { username: 'Experimenter', avatar_url: null },
  },
]

/**
 * Get builds sorted by type
 */
export function getMockBuilds(
  type: 'popular' | 'recent',
  offset: number = 0,
  limit: number = 20
): { builds: BuildListItem[]; nextOffset: number | null } {
  const sorted = [...MOCK_BUILDS].sort((a, b) => {
    if (type === 'popular') {
      return b.star_count - a.star_count
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const builds = sorted.slice(offset, offset + limit)
  const hasMore = offset + limit < sorted.length

  return {
    builds,
    nextOffset: hasMore ? offset + limit : null,
  }
}
