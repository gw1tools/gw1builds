/**
 * Manual overrides for the July 8, 2026 changeset.
 *
 * Mighty Throw was split into PvE/PvP versions. The PvP record (wiki id 3442)
 * is created with its July 8 state: a copy of the base skill with recharge 2.
 * Its later Aug 26 changes (adrenaline 4, recharge 1) land in that changeset.
 */
export default {
  1547: {
    data: { pvp_split: true, split_id: 3442 },
    note: 'split into PvE/PvP versions; PvP version is id 3442',
  },
  3442: {
    profession: 'Paragon',
    create: {
      data: {
        campaign: 3,
        profession: 9,
        attribute: 37,
        type: 12,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 0,
        activation: 1,
        recharge: 2,
        adrenaline: 2,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Mighty Throw (PvP)',
        description:
          'Your spear moves three times faster. If it hits, you deal +10...40 damage.',
        concise: 'Deals +10...40 damage. This spear moves three times faster.',
      },
    },
    note: 'new PvP split (wiki id 3442): base copy, recharge 0 -> 2',
  },
  // Listed under "Bug fixes", not the skill section, so the parser skips it
  166: {
    profession: 'Elementalist',
    replaceAll: [['renewed for 8 seconds', 'renewed for 12 seconds']],
    note: 'description fixed to match game: renewal 8 -> 12 seconds',
  },
}

export const acknowledged = [
  { line: '{{P}} Paragon', note: 'profession group label, not a change' },
  { line: 'Underworld', note: 'group label, not a change' },
  {
    name: "Dhuum's Rest",
    note: 'Underworld-only skill (id 3087), not in our data; nothing to update',
  },
]
