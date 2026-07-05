/**
 * Manual overrides for the June 24, 2026 changeset — reworks, added clauses, and
 * range swaps the automatic parser flags for review.
 *
 * Text is taken verbatim from each skill's official wiki page (rendered to our
 * dataset style), which was already updated for this patch on review, EXCEPT
 * Cleave (wiki page still lagged on 2026-06-25 — clause authored from the patch
 * notes and re-verified later by the Supabase verification loop).
 *
 * Keyed by skill id. Fields: data (numeric), description/concise (full replace),
 * append.{description,concise}, replaceAll [[from,to]], clearFlags, note.
 */
export default {
  // Mesmer
  62: {
    description:
      "Target foe's elite skill is disabled for 1...16 seconds. Your non-Mesmer skills are disabled for 4 seconds.",
    concise:
      'Disables elite skill (1...16 seconds). <gray>Disables your non-Mesmer skills (4 seconds).</gray>',
    note: 'non-Mesmer disable 10 -> 4 seconds',
  },
  79: {
    data: { recharge: 20 }, // "from 30/25 to 20"; no PvP split in local data, text unchanged
    clearFlags: true,
    note: 'recharge 30 -> 20 (single skill; no local PvP split)',
  },
  1346: {
    description:
      'Your next 1...3 non-Illusion spells use your Illusion attribute instead of its normal attribute.',
    concise:
      'Your next 1...3 non-Illusion spells use your Illusion attribute instead of its normal attribute.',
    note: 'reworked: only non-Illusion spells',
  },

  // Elementalist
  186: {
    description:
      'Send out a ball of fire that strikes target foe and all nearby foes for 7...112 fire damage.',
    concise: 'Projectile: deals 7...112 fire damage to target and nearby foes.',
    note: 'area of effect adjacent -> nearby',
  },
  222: {
    description:
      'Strike target foe for 5...40 lightning damage. This spell has 25% armor penetration. If you are Overcast, that foe is hexed with Lightning Strike for 3 seconds. When this hex ends, that foe is struck again for 5...40 lightning damage.',
    concise:
      'Deals 5...40 lightning damage. 25% armor penetration. Hex for 3 seconds if Overcast. End effect: deals 5...40 lightning damage.',
    note: 'damage + conditional damage 5...50 -> 5...40 (both)',
  },
  228: {
    description:
      "Create a massive shockwave at target foe's location. Deals 10...50 lightning damage to target and all nearby foes. Struck foes are interrupted and suffer from Cracked Armor and Weakness for 5...20 seconds. This spell has 25% armor penetration.",
    concise:
      'Deals 10...50 lightning damage. Also strikes nearby foes. Inflicts Cracked Armor and Weakness (5...20 seconds). Causes interrupt. 25% armor penetration.',
    note: 'range adjacent -> nearby',
  },
  843: {
    description:
      'For 5...11 seconds, both you and target ally move 33% faster. When you cast this spell, all foes adjacent to you and your target take 15...70 cold damage. Foes struck by Gust while attacking or moving are knocked down.',
    concise:
      '(5...11 seconds.) You and target ally move 33% faster. Initial effect: Foes adjacent to you and target ally are struck for 15...70 cold damage. Attacking or moving foes are knocked down.',
    note: 'cold damage range nearby -> adjacent (recharge handled numerically)',
  },
  1091: {
    description:
      'Invoke the power of the Dragon. For 8 seconds, you and target ally are enchanted with Double Dragon. Adjacent foes are dealt 10...40 fire damage each second. Additionally, when you or your ally use skills that target a foe, that foe is set on fire for 1...4 seconds.',
    concise:
      '(8 seconds.) Enchants you and target ally. Adjacent foes take 10...40 fire damage each second. Skills that target a foe also inflict Burning (1...4 seconds).',
    note: 'dps 5...30 -> 10...40, burning 0...3 -> 1...4 (recharge handled numerically)',
  },
  1372: {
    description:
      "Create a Sandstorm at target foe's location. For 10 seconds, nearby foes are struck for 20...40 earth damage each second and attacking foes are struck for an additional 10...30 earth damage each second.",
    concise:
      "Deals 20...40 earth damage each second (10 seconds). Hits foes near target foe's initial location. Hits attacking foes for 10...30 more earth damage each second.",
    note: 'primary dps 10...30 -> 20...40 (recharge handled numerically)',
  },

  // Monk
  261: {
    description:
      'For 5...13 seconds, target ally gains +3...10 Health regeneration and 20...45 armor.',
    concise:
      '(5...13 seconds.) +3...10 Health regeneration and +20...45 armor.',
    note: 'armor 40 -> scaling 20...45 (energy handled numerically)',
  },

  // Necromancer
  87: {
    description:
      'If target hostile animated undead has a master, its bond to its master is broken, making it hostile to all other creatures. If it had no master, you become its master and heal it for 60...80. (50% failure chance with Death Magic 4 or less.)',
    concise:
      'Make target undead servant masterless. If it is already masterless, you become its master and heal it for 60...80. <gray>50% failure chance unless Death Magic 5 or more.</gray>',
    note: 'add 60...80 heal on claiming masterless minion',
  },

  // Ranger
  438: {
    description:
      'Your animal companion attempts a Maiming Strike that deals +5...20 damage. If that attack hits that foe becomes Crippled for 3...15 seconds.',
    concise:
      'Deals +5...20 damage. Inflicts Crippled condition (3...15 seconds).',
    note: 'removed moving-foe condition; Crippled on any hit',
  },

  // Assassin
  987: {
    description:
      'For 5...15 seconds, off-hand and dual attacks cost no Energy and recharge 20...50% faster.',
    concise:
      '(5...15 seconds.) Your off-hand and dual attacks cost no Energy and recharge 20...50% faster.',
    note: 'duration 5...20 -> 5...15; added recharge 20...50% faster',
  },
  1021: {
    description:
      'Must follow a lead attack. If it hits, this attack strikes for +10...25 damage. If it hits a foe that was Crippled, that foe and all adjacent foes take 1...31 damage.',
    concise:
      'Deals +10...25 damage. Deals 1...31 damage to target and adjacent foes if target foe is Crippled. <gray>Must follow a lead attack.</gray>',
    note: "removed '+' before conditional damage (recharge handled numerically)",
  },

  // Ritualist
  1257: {
    description:
      'For 10 seconds, target ally gains 5...25 Health per second and an additional 5...25 Health per second if that ally is within earshot of a spirit.',
    concise:
      '(10 seconds.) Target ally gains 5...25 Health each second. 5...25 more healing per second while within earshot of a spirit.',
    note: 'heal 1...15 -> 5...25 (both)',
  },

  // Necromancer
  862: {
    description:
      'Deal 20...40 damage and steal 20...40 Health from target foe and all nearby foes.',
    concise:
      'Deals 20...40 damage and steals 20...40 Health from target and nearby foes.',
    note: 'damage + steal 15...30 -> 20...40 (both)',
  },

  // Warrior
  335: {
    // Wiki page still showed pre-patch text on 2026-06-25; damage swap applied
    // automatically, adjacent-hit clause authored from the patch notes.
    append: {
      description: ' This attack also hits 1...2 random adjacent foes.',
      concise: ' Also hits 1...2 random adjacent foes.',
    },
    note: 'WIKI LAGGED 2026-06-25: adjacent-hit clause from notes; verify later',
  },
  892: {
    clearFlags: true, // "10 -> 10...40" already applied in a prior patch; no-op
    note: 'already +10...40 locally (accidental nerf never applied here)',
  },

  // --- AoE 100%->75% (the wiki encodes it as "75% of that damage to ... foes") ---
  // Verbatim authoritative wiki text; the AoE rephrasing is the representable form.
  27: {
    description:
      'Remove one Mesmer hex from target foe. If a hex was removed, that foe takes 15...75 damage and all adjacent foes take 75% of that damage.',
    concise:
      'Removes a Mesmer hex from target foe. Removal effect: 15...75 damage to target and 75% of that damage to all adjacent foes.',
    note: 'AoE 100% -> 75%',
  },
  3180: {
    description:
      'Remove one Mesmer hex from target foe. If a hex was removed, that foe takes 15...75 damage and all adjacent foes take 75% of that damage.',
    concise:
      'Removes a Mesmer hex from target foe. Removal effect: 15...75 damage to target and 75% of that damage to all adjacent foes.',
    note: 'AoE 100% -> 75% (PvP)',
  },
  39: {
    description:
      'Target foe loses 1...10 Energy. For each point of Energy lost, that foe takes 7 damage and all nearby foes take 75% of that damage.',
    concise:
      'Causes 1...10 Energy loss. Deals 7 damage to target for each point of Energy lost and 75% of that damage to nearby foes.',
    note: 'damage per energy 9 -> 7, AoE 100% -> 75%',
  },
  50: {
    description:
      "After 3 seconds, target foe takes 20...100 damage and all adjacent foes take 75% of that damage. If that foe successfully uses a skill, Wastrel's Worry ends prematurely and does no damage.",
    concise:
      '(3 seconds). End effect: causes 20...100 damage to target and 75% of that damage to adjacent foes. <gray>No effect and ends early if target foe uses a skill.</gray>',
    note: 'AoE 100% -> 75% (recharge handled numerically)',
  },
  57: {
    description:
      'If target foe is using a skill, that foe and all foes in the area are interrupted and suffer 15...75 damage and foes in the area take 75% of that damage.',
    concise:
      'If target foe is using a skill, that foe and all foes in the area are interrupted. Foe suffers 15...75 damage and foes in the area take 75% of that damage.',
    note: 'AoE 100% -> 75% (recharge handled numerically)',
  },
  898: {
    description:
      'For 5 seconds, target foe suffers -1...3 Health degeneration. If target foe is using a skill, then Overload deals 15...75 damage to that foe and 75% of that damage to all adjacent foes.',
    concise:
      '(5 seconds.) Causes -1...3 Health degeneration. If target foe is using a skill, that foe takes 15...75 damage and all adjacent foes take 75% of that damage.',
    note: 'AoE 100% -> 75%',
  },
  979: {
    description:
      'For 6 seconds, the next spell that target foe casts on one of your allies fails and deals 10...80 damage to that foe and 75% of that damage to all nearby foes.',
    concise:
      '(6 seconds.) The next spell that target foe casts on one of your allies fails and deals 10...80 damage to target and 75% of that damage to nearby foes.',
    note: 'damage 10...100 -> 10...80, AoE 100% -> 75% (PvE)',
  },
  3191: {
    description:
      'For 6 seconds, the next spell that target foe casts on one of your allies fails and deals 10...60 damage to that foe and 75% of that damage to all nearby foes.',
    concise:
      '(6 seconds.) The next spell that target foe casts on one of your allies fails and deals 10...60 damage to target and 75% of that damage to nearby foes.',
    note: 'damage 10...75 -> 10...60, AoE 100% -> 75% (PvP)',
  },
  1345: {
    description:
      'For 10 seconds, target foe casts enchantments 100...200% slower. If target foe is not under the effects of an enchantment when this hex is applied, that foe takes 10...100 damage and all adjacent foes take 75% of that damage.',
    concise:
      'Causes 100...200% slower enchantment casting (10 seconds). Initial effect: if target foe is not enchanted deals 10...100 damage to target and 75% of that damage to adjacent foes.',
    note: 'AoE 100% -> 75%',
  },
  3192: {
    description:
      'For 10 seconds, target foe casts enchantments 100...200% slower. If target foe is not under the effects of an enchantment when this hex is applied, that foe takes 10...100 damage and all adjacent foes take 75% of that damage.',
    concise:
      'Causes 100...200% slower enchantment casting (10 seconds). Initial effect: if target foe is not enchanted deals 10...100 damage to target and 75% of that damage to adjacent foes.',
    note: 'AoE 100% -> 75% (PvP)',
  },

  // Dervish
  3273: {
    description:
      'Lose 1 Dervish enchantment and Cripple target foe 5...15 seconds. If an enchantment was removed, this skill recharges 50% faster.',
    concise:
      '(5...15 seconds.) Cripples target foe and removes 1 of your Dervish enchantments. Removal effect: recharges 50% faster.',
    note: 'recharge bonus 75% -> 50% (PvP)',
  },

  // --- flat-number / flat-% text changes the range/numeric parsers don't cover ---
  // (surfaced by the partial-parse guard; values verbatim from the updated wiki)
  142: {
    description:
      'For 6...30 seconds, target foe and all nearby foes suffer -1...4 Health degeneration, and gain 25% less benefit from healing.',
    concise:
      '(6...30 seconds.) Target and nearby foes have -1...4 Health degeneration and receive 25% less benefit from healing.',
    note: 'degeneration 0...3 -> 1...4, healing reduction 20% -> 25%',
  },
  166: {
    description:
      'For 12 seconds, you gain +20...80 armor. Whenever you cast a spell, Kinetic Armor is renewed for 8 seconds.',
    concise:
      '(12 seconds.) You have +20...80 armor. Renewal bonus: cast a spell.',
    note: 'initial duration 8 -> 12 seconds (recharge handled numerically)',
  },
  247: {
    description:
      "Create a Symbol of Wrath at target foe's location. For 5 seconds, adjacent foes are struck for 10...40 holy damage each second.",
    concise:
      "Deals 10...40 holy damage each second (5 seconds). Hits foes adjacent to target foe's initial location.",
    note: 'damage 8...32 -> 10...40; AoE pulse now at target location (act/recharge numeric)',
  },
  370: {
    description:
      'For 8...14 seconds, you attack 33% faster and gain 100% more adrenaline. Berserker Stance ends if you use a skill.',
    concise:
      '(8...14 seconds.) You attack 33% faster and gain 100% more adrenaline. <gray>Ends if you use a skill.</gray>',
    note: 'adrenaline gain 50% -> 100% (energy/recharge numeric, duration via swap)',
  },
  1406: {
    // Preserve local phrasing (wiki left an "Elite Skill." prefix artifact); only Daze changes.
    replaceAll: [
      ['Dazed for 5 seconds', 'Dazed for 10 seconds'],
      ['Dazed (5 seconds)', 'Dazed (10 seconds)'],
    ],
    note: 'Daze duration 5 -> 10 seconds (energy/recharge numeric)',
  },
  1782: {
    description:
      'For 2...4 seconds, all allies within earshot gain 1...2 Energy regeneration.',
    concise:
      '(2...4 seconds.) Allies within earshot gain 1...2 Energy regeneration.',
    note: 'effect time 3 -> 2...4, energy regen 0...1 -> 1...2',
  },
  570: {
    // Range 30...80 -> 20...60 was applied by the auto-swap; the partial-parse
    // flag here is a false positive ("expiration increase" counted as a verb).
    clearFlags: true,
    note: 'range applied automatically; partial-parse flag is a false positive',
  },
}
