/**
 * Manual overrides for the August 26, 2026 changeset (generated from a spec,
 * then reviewed). Text sources, in order of preference:
 *  - our own text with the listed change applied (keeps dataset style);
 *  - reworks: the wiki infobox text, rendered, in our "+damage" style.
 * New PvP splits copy the base skill's pre-patch data, plus the listed changes.
 * Wiki "Guild Wars Wiki notes" corrections are applied (Crippling/Dancing
 * Daggers unchanged, Symbols of Inspiration partial, Focused Shot cast time).
 */
export default {
  45: {
    replaceAll: [
      ['For 10 seconds', 'For 6...12 seconds'],
      ['(10 seconds.)', '(6...12 seconds.)'],
    ],
    note: 'duration 10 -> 6...12',
  },
  50: {
    data: {
      pvp_split: true,
      split_id: 3447,
    },
    note: 'split for PvP; PvP version is id 3447',
  },
  97: {
    description:
      "Exploit a random corpse or sacrifice 30...20% Health to teleport to target foe's location. You become Diseased for 6 seconds and all nearby foes become Poisoned for 5...20 seconds.",
    concise:
      "Exploit a random corpse or sacrifice 30...20% Health to teleport to target foe's location. You become Diseased for 6 seconds and all nearby foes become Poisoned for 5...20 seconds.",
    note: 'reworked (wiki text; wiki concise repeats the full text)',
  },
  164: {
    replaceAll: [
      [
        'You gain 50% of the base Energy cost',
        'You gain 1 Energy plus 50% of the base Energy cost',
      ],
      [
        'You gain 50% of the Energy cost',
        'You gain 1 plus 50% of the Energy cost',
      ],
    ],
    note: 'refund now 1 Energy plus 50%',
  },
  174: {
    replaceAll: [
      ['26...100', '15...85'],
      ['10...68', '15...85'],
    ],
    note: 'both damage values -> 15...85',
  },
  222: {
    replaceAll: [
      ['Strike target foe for 5...40', 'Strike target foe for 10...60'],
      ['struck again for 5...40', 'struck again for 20...40'],
      [
        'Deals 5...40 lightning damage. 25%',
        'Deals 10...60 lightning damage. 25%',
      ],
      ['End effect: deals 5...40', 'End effect: deals 20...40'],
    ],
    note: 'damage 5...40 -> 10...60, Overcast damage 5...40 -> 20...40',
  },
  266: {
    data: {
      pvp_split: true,
      split_id: 3448,
    },
    note: 'split for PvP; PvP version is id 3448',
  },
  326: {
    data: {
      pvp_split: true,
      split_id: 3449,
    },
    note: 'split for PvP; PvP version is id 3449',
  },
  346: {
    data: {
      attribute: 17,
      pvp_split: true,
      split_id: 3443,
    },
    description:
      'For 8 seconds, you attack 33% faster but take 175...125% damage.',
    concise:
      '(8 seconds.) You attack 33% faster. <gray>You take 175...125% damage.</gray>',
    note: 'reworked; moved to Strength; split for PvP; PvP version is id 3443',
  },
  363: {
    description:
      'For 5...11 seconds, while wielding a shield, the next melee attack skill used against you is blocked, your attacker is knocked down and that skill is disabled for an additional 15 seconds.',
    concise:
      '(5...11 seconds.) You block the next melee attack skill. Causes knock-down and +15 second recharge. <gray>No effect unless you are wielding a shield.</gray>',
    note: 'triggers on melee attack skills only (wiki text)',
  },
  381: {
    data: {
      pvp_split: true,
      split_id: 3444,
    },
    note: 'split for PvP; PvP version is id 3444',
  },
  382: {
    data: {
      adrenaline: 3,
    },
    note: 'sword adrenaline 4 -> 3',
  },
  383: {
    data: {
      adrenaline: 7,
    },
    note: 'sword adrenaline 8 -> 7',
  },
  384: {
    data: {
      adrenaline: 5,
    },
    note: 'sword adrenaline 6 -> 5',
  },
  385: {
    concise:
      'Deals +5...40 damage. Deals +5...40 more damage if target foe is below 50% Health. <gray>Lose all adrenaline.</gray>',
    note: 'damage 1...40 -> 5...40 (concise has it twice)',
  },
  393: {
    data: {
      pvp_split: true,
      split_id: 3450,
    },
    note: 'split for PvP; PvP version is id 3450',
  },
  447: {
    data: {
      pvp_split: true,
      split_id: 3451,
    },
    note: 'split for PvP; PvP version is id 3451',
  },
  476: {
    data: {
      pvp_split: true,
      split_id: 3445,
    },
    note: 'split for PvP; PvP version is id 3445',
  },
  571: {
    note: 'projectile speed doubled; not shown in skill text (wiki notes)',
  },
  809: {
    replaceAll: [
      [
        'cold damage and is hexed',
        'cold damage, moves 66% slower, and is hexed',
      ],
      [
        'Initial effect: deals 25...100 cold damage.',
        'Initial effect: deals 25...100 cold damage and target moves 66% slower.',
      ],
    ],
    note: 'now also slows 66%',
  },
  810: {
    data: {
      pvp_split: true,
      split_id: 3457,
    },
    note: 'split for PvP; PvP version is id 3457',
  },
  831: {
    description:
      'For 1...9 seconds, you attack 33% faster and move 33% faster, but you take 150...125% damage.',
    concise:
      '(1...9 seconds.) You attack 33% faster and move 33% faster. <gray>You take 150...125% damage.</gray>',
    note: 'reworked: takes 150...125% damage; split for PvP; PvP version is id 3458',
    data: {
      pvp_split: true,
      split_id: 3458,
    },
  },
  832: {
    replaceAll: [
      ['leaves an exploitable corpse', 'leaves 1...4 exploitable corpse(s)'],
      [
        'which leaves a fresh corpse when it dies',
        'which leaves 1...4 fresh corpse(s) when it dies',
      ],
    ],
    note: 'corpses left on death 1 -> 1...4',
  },
  836: {
    data: {
      energy: 5,
    },
    note: 'energy 10 -> 5',
  },
  846: {
    replaceAll: [
      [
        'Blinds that foe for 5...10 seconds.',
        'Blinds that foe for 5...10 seconds and they take an additional 20...60 fire damage.',
      ],
      [
        '(5...10 seconds) if target foe is Burning.',
        '(5...10 seconds) and does 20...60 fire damage if target foe is Burning.',
      ],
    ],
    note: 'adds 20...60 fire damage vs burning foes',
  },
  853: {
    profession: 'Ranger',
    data: {
      recharge: 8,
      pvp_split: true,
      split_id: 3459,
    },
    note: 'recharge 12 -> 8: June 24 notes said 12 but the PvE skill stayed 8 (infobox); Aug 26 splits PvP "from 8 to 12"; split for PvP; PvP version is id 3459',
  },
  858: {
    description:
      'Send out three Dancing Daggers at target foe, each striking for 5...35 earth damage if they hit. Dancing Daggers has half the normal range. This skill counts as a lead attack.',
    concise:
      'Half Range Spell. Three projectiles: each deals 5...35 earth damage. Counts as a lead attack.',
    note: 'damage/projectile change in notes never landed in game (wiki notes); text kept',
  },
  869: {
    data: {
      pvp_split: true,
      split_id: 3456,
    },
    note: 'split for PvP; PvP version is id 3456',
  },
  885: {
    data: {
      pvp_split: true,
      split_id: 3454,
    },
    note: 'split for PvP; PvP version is id 3454',
  },
  892: {
    data: {
      adrenaline: 4,
    },
    note: 'sword adrenaline 5 -> 4',
  },
  905: {
    data: {
      pvp_split: true,
      split_id: 3455,
    },
    note: 'split for PvP; PvP version is id 3455',
  },
  907: {
    data: {
      adrenaline: 7,
    },
    note: 'sword adrenaline 8 -> 7',
  },
  909: {
    data: {
      activation: 4,
    },
    description:
      'This shot moves three times faster, cannot be blocked, and strikes for +10...40 damage but all of your other attack skills are disabled for 8...4 seconds.',
    concise:
      'Deals +10...40 damage. Unblockable. This shot moves three times faster. <gray>Your other attack skills are disabled (8...4 seconds).</gray>',
    note: 'reworked (wiki text); 4s cast time added by mistake (wiki notes), removed Sep 1',
  },
  925: {
    replaceAll: [
      [
        'all of your skills are disabled for 10 seconds',
        'all of your skills are disabled for 3 seconds',
      ],
      [
        'disables all of your skills for 10 seconds',
        'disables all of your skills for 3 seconds',
      ],
    ],
    note: 'skill disable on end 10 -> 3 seconds',
  },
  928: {
    data: {
      pvp_split: true,
      split_id: 3452,
    },
    note: 'split for PvP; PvP version is id 3452',
  },
  985: {
    replaceAll: [
      [
        'are Crippled for 5...15 seconds',
        'are Crippled and Bleeding for 5...15 seconds',
      ],
      [
        'Inflicts Crippled condition (5...15 seconds)',
        'Inflicts Crippled and Bleeding condition (5...15 seconds)',
      ],
    ],
    note: 'now also inflicts Bleeding',
  },
  1034: {
    replaceAll: [
      [' This spell has half the normal range.', ''],
      ['Elite Half Range Hex Spell. ', ''],
    ],
    note: 'range half -> full',
  },
  1038: {
    note: 'projectile speed not actually changed in game (wiki notes); no data change',
  },
  1043: {
    data: {
      attribute: 31,
      pvp_split: true,
      split_id: 3453,
    },
    note: 'moved to Shadow Arts; split for PvP; PvP version is id 3453',
  },
  1056: {
    replaceAll: [
      ['For 10 seconds', 'For 6...12 seconds'],
      ['(10 seconds.)', '(6...12 seconds.)'],
    ],
    note: 'duration 10 -> 6...12',
  },
  1144: {
    data: {
      adrenaline: 7,
    },
    note: 'sword adrenaline 8 -> 7',
  },
  1146: {
    description:
      'Target touched foe takes 15...75 damage, their stance ends, and they are knocked down.',
    concise:
      'Target touched foe takes 15...75 damage, their stance ends, and they are knocked down.',
    note: 'reworked (wiki text; wiki concise repeats the full text)',
  },
  1199: {
    replaceAll: [['+5...20', '+6...20']],
    profession: 'Ranger',
    note: '(PvE) damage +5...20 -> +6...20, from the Glass Arrows (PvP) line',
  },
  1213: {
    data: {
      pvp_split: true,
      split_id: 3460,
    },
    note: 'split for PvP; PvP version is id 3460',
  },
  1219: {
    replaceAll: [
      ['you gain 10 armor', 'you gain 20 armor'],
      ['+10 armor', '+20 armor'],
    ],
    note: 'armor 10 -> 20',
  },
  1240: {
    replaceAll: [['(minimum 10)', '(minimum 5)']],
    note: 'Energy cost floor 10 -> 5; split for PvP; PvP version is id 3461',
    data: {
      pvp_split: true,
      split_id: 3461,
    },
  },
  1259: {
    data: {
      pvp_split: true,
      split_id: 3462,
    },
    note: 'split for PvP; PvP version is id 3462',
  },
  1339: {
    data: {
      recharge: 15,
    },
    description:
      'For 1...31 seconds, this skill becomes the Elite of target foe. Elite skills you cast use your Fast Casting attribute instead of their normal attributes.',
    concise:
      '(1...31 seconds.) This skill becomes the Elite of target foe. Elite skills you cast use your Fast Casting attribute instead of their normal attributes.',
    note: 'only "Elite spells" -> "Elite skills" landed; recharge/duration came Sep 1 (wiki notes)',
  },
  1342: {
    data: {
      pvp_split: true,
      split_id: 3463,
    },
    note: 'split for PvP; PvP version is id 3463',
  },
  1378: {
    replaceAll: [
      [
        'return 30% of their Energy cost',
        'return 1 Energy plus 30% of their Energy cost',
      ],
    ],
    note: 'refund now 1 Energy plus 30%',
  },
  1404: {
    data: {
      pvp_split: true,
      split_id: 3464,
    },
    note: 'split for PvP; PvP version is id 3464',
  },
  1405: {
    data: {
      pvp_split: true,
      split_id: 3465,
    },
    note: 'split for PvP; PvP version is id 3465',
  },
  1415: {
    data: {
      adrenaline: 5,
    },
    note: 'sword adrenaline 6 -> 5',
  },
  1500: {
    data: {
      pvp_split: true,
      split_id: 3469,
    },
    note: 'split for PvP; PvP version is id 3469; reworked (text from the Aug 26 notes; Sep 1 changed the per-enchantment block to 4...10%)',
    description:
      'For 20 seconds, you have a 40% chance to block and an additional 10% for each enchantment (max 80%). Each time an enchantment is removed from you, all nearby foes are struck for 10...40 earth damage.',
    concise:
      '(20 seconds.) You have 40% chance to block and an additional 10% for each enchantment (max 80%). Deals 10...40 earth damage to nearby foes each time an enchantment is removed from you.',
  },
  1514: {
    data: {
      pvp_split: true,
      split_id: 3470,
      recharge: 10,
    },
    note: 'split for PvP; PvP version is id 3470; recharge 15 -> 10 (BOTH)',
  },
  1529: {
    data: {
      pvp_split: true,
      split_id: 3471,
    },
    note: 'split for PvP; PvP version is id 3471',
  },
  1532: {
    replaceAll: [
      ['take 10...20 earth damage', 'take 10...40 earth damage'],
      [
        'Deals 10...20 earth damage each second',
        'Deals 10...40 earth damage each second',
      ],
    ],
    note: 'unconditional damage 10...20 -> 10...40',
  },
  1544: {
    data: {
      pvp_split: true,
      split_id: 3472,
    },
    note: 'split for PvP; PvP version is id 3472',
  },
  1551: {
    description:
      'Strikes all foes between you and your target. If this attack hits, it deals +10...20 lightning damage. This attack has 25% armor penetration.',
    concise:
      'Deals +10...20 lightning damage. 25% armor penetration. Strikes all foes between you and your target.',
    note: 'reworked: hits all foes in line, damage +8...20 -> +10...20',
  },
  1696: {
    description:
      'You lose all adrenaline and all Energy. This attack is unblockable, you deal +5...80 damage and cause a Deep Wound for 5...20 seconds. This attack is always critical and if foe is killed, nearby foes are Weakened for 8 seconds.',
    concise:
      'Deals +5...80 damage. Unblockable. Inflicts Deep Wound condition (5...20 seconds). Automatic critical hit. If foe is killed, nearby foes are Weakened (8 seconds). <gray>You lose all adrenaline and Energy.</gray>',
    note: 'now unblockable; kill weakens nearby foes (wiki text)',
  },
  1702: {
    data: {
      adrenaline: 7,
    },
    note: 'sword adrenaline 8 -> 7',
  },
  1730: {
    data: {
      pvp_split: true,
      split_id: 3466,
    },
    note: 'split for PvP; PvP version is id 3466',
  },
  1744: {
    replaceAll: [
      ['you gain 5 Energy', 'you gain 7 Energy'],
      ['You gain 5 Energy', 'You gain 7 Energy'],
    ],
    note: 'energy gain 5 -> 7',
  },
  1755: {
    data: {
      pvp_split: true,
      split_id: 3467,
    },
    note: 'split for PvP; PvP version is id 3467',
  },
  1756: {
    description:
      'For 20 seconds, your attack skills also Cripple that foe for 1...11 seconds and you transfer 1...3 conditions from yourself to that foe.',
    concise:
      '(20 seconds.) Inflicts Crippled condition (1...11 seconds) with your attack skills and transfer 1...3 conditions.',
    note: 'cold-weapon requirement removed',
  },
  1758: {
    data: {
      pvp_split: true,
      split_id: 3468,
    },
    note: 'split for PvP; PvP version is id 3468',
  },
  2070: {
    data: {
      pvp_split: true,
      split_id: 3473,
    },
    note: 'split for PvP; PvP version is id 3473',
  },
  2807: {
    data: {
      energy: 5,
    },
    note: 'energy 15 -> 5',
  },
  2861: {
    replaceAll: [['+3...10', '+5...15']],
    note: 'damage +3...10 -> +5...15',
  },
  2864: {
    replaceAll: [['+3...10', '+5...15']],
    note: 'damage +3...10 -> +5...15',
  },
  2998: {
    description:
      'For 8...20 seconds, target and adjacent foes take 5...20 damage each time they suffer or recover from a new condition.',
    concise:
      '(8...20 seconds.) Also hexes foes adjacent to target. These foes take 5...20 damage each time they gain or lose a condition.',
    note: 'now also hits adjacent foes, like PvE (wiki text)',
  },
  3045: {
    append: {
      description:
        ' If you have Comfort Animal equipped, your animal companion will travel with you.',
      concise:
        ' If you have Comfort Animal equipped, your animal companion will travel with you.',
    },
    note: 'pet now travels with you (as PvE)',
  },
  3051: {
    replaceAll: [
      ['(maximum bonus 80)', '(maximum bonus 60)'],
      ['(maximum 80)', '(maximum 60)'],
    ],
    note: 'damage cap 80 -> 60',
  },
  3145: {
    replaceAll: [['+5...12', '+6...18']],
    note: 'damage +5...12 -> +6...18',
  },
  3147: {
    replaceAll: [['+1...5', '+5...15']],
    note: 'damage +1...5 -> +5...15',
  },
  3443: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 0,
        profession: 1,
        attribute: 17,
        type: 29,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 4,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Frenzy (PvP)',
        description:
          'For 8 seconds, you attack 33% faster but take 200...150% damage.',
        concise:
          '(8 seconds.) You attack 33% faster. <gray>You take 200...150% damage.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3443): Strength, takes 200...150% damage',
  },
  3444: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 0,
        profession: 1,
        attribute: 20,
        type: 1,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 20,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Hundred Blades (PvP)',
        description:
          'For 15 seconds, whenever you attack with a sword, all adjacent foes take 10...30 slashing damage.',
        concise:
          '(15 seconds.) Deals 10...30 slashing damage to all adjacent foes whenever you attack with a sword.',
      },
    },
    note: 'new PvP split (wiki id 3444): damage 10...35 -> 10...30',
  },
  3445: {
    profession: 'Ranger',
    create: {
      data: {
        campaign: 0,
        profession: 2,
        attribute: 24,
        type: 19,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 2,
        recharge: 60,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Nature's Renewal (PvP)",
        description:
          'Create a level 1...10 spirit. For 30...240 seconds, enchantments and hexes cast by non-spirit creatures in range take 50...75% longer to cast, and it costs twice as much Energy to maintain enchantments. This spirit dies after 30...240 seconds.',
        concise:
          'Creates a level 1...10 spirit (30...240 second lifespan). For creatures in range, enchantments and Hexes take 50...75% as long to cast and it costs twice as much Energy to maintain enchantments. Does not affect spirits.',
      },
    },
    note: 'new PvP split (wiki id 3445): cast penalty twice as long -> 50...75% longer (wiki text)',
  },
  3446: {
    profession: 'Elementalist',
    create: {
      data: {
        campaign: 0,
        profession: 6,
        attribute: 12,
        type: 23,
        is_elite: false,
        is_rp: true,
        is_pvp: false,
        pvp_split: false,
        split_id: 0,
        upkeep: -1,
        energy: 10,
        activation: 0.5,
        recharge: 30,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Soul Ignition',
        description:
          'While you maintain this enchantment, reduce overcast at a rate of 1...2 per second. You and all adjacent foes are afflicted with burning while this enchantment is active.',
        concise:
          'Reduce overcast at a rate of 1...2 per second. You and all adjacent foes are afflicted with burning.',
      },
    },
    note: 'new PvE-only Energy Storage enchantment (wiki id 3446); costs and text from wiki infobox; type/campaign as Over the Limit',
  },
  3447: {
    profession: 'Mesmer',
    create: {
      data: {
        campaign: 1,
        profession: 5,
        attribute: 2,
        type: 24,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0.25,
        recharge: 4,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Wastrel's Worry (PvP)",
        description:
          "After 3 seconds, target foe takes 20...100 damage and all adjacent foes take 75% of that damage. If that foe successfully uses a skill, Wastrel's Worry ends prematurely and does no damage.",
        concise:
          '(3 seconds). End effect: causes 20...100 damage to target and 75% of that damage to adjacent foes. <gray>No effect and ends early if target foe uses a skill.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3447): keeps pre-patch recharge 4',
  },
  3448: {
    profession: 'Monk',
    create: {
      data: {
        campaign: 1,
        profession: 3,
        attribute: 16,
        type: 23,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0.25,
        recharge: 15,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Peace and Harmony (PvP)',
        description:
          'Target ally loses 0...4 conditions and hexes. For 1...3 seconds, conditions and hexes expire 90% faster on that ally. All your Smiting Prayers are disabled for 20 seconds.',
        concise:
          'Target ally loses 0...4 conditions and hexes. Conditions and hexes expire 90% faster on that ally (1...3 seconds). <gray>Disables your Smiting Prayers (20 seconds).</gray>',
      },
    },
    note: 'new PvP split (wiki id 3448): recharge 10 -> 15, removal 0...9 -> 0...4',
  },
  3449: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 1,
        profession: 1,
        attribute: 17,
        type: 3,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0.5,
        recharge: 6,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Protector's Strike (PvP)",
        description:
          'If this attack strikes a moving foe, you strike for 10...40 more damage.',
        concise: 'Deals +10...40 damage if target is moving.',
      },
    },
    note: 'new PvP split (wiki id 3449): recharge 3 -> 6',
  },
  3450: {
    profession: 'Ranger',
    create: {
      data: {
        campaign: 1,
        profession: 2,
        attribute: 25,
        type: 2,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 10,
        activation: 0,
        recharge: 2,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Crippling Shot (PvP)',
        description:
          'If Crippling Shot hits, your target becomes Crippled for 4...14 seconds. This attack cannot be blocked.',
        concise: 'Unblockable. Inflicts Crippled condition (4...14 seconds).',
      },
    },
    note: 'new PvP split (wiki id 3450): Cripple 1...12 -> 4...14 (keeps energy 10)',
  },
  3451: {
    profession: 'Ranger',
    create: {
      data: {
        campaign: 1,
        profession: 2,
        attribute: 22,
        type: 20,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 30,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Otyugh's Cry (PvP)",
        description:
          'For 5...15 seconds, your animal companion gains +24 armor and cannot be blocked.',
        concise: '(5...15 seconds.) Your pet has +24 armor and is unblockable.',
      },
    },
    note: 'new PvP split (wiki id 3451): duration 10...25 -> 5...15',
  },
  3452: {
    profession: 'Assassin',
    create: {
      data: {
        campaign: 2,
        profession: 7,
        attribute: 31,
        type: 24,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0.25,
        recharge: 20,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Shadow Shroud (PvP)',
        description:
          'For 2...7 seconds, target foe cannot be the target of enchantments.',
        concise:
          '(2...7 seconds.) Target foe cannot be the target of enchantments.',
      },
    },
    note: 'new PvP split (wiki id 3452): duration 3...9 -> 2...7',
  },
  3453: {
    profession: 'Assassin',
    create: {
      data: {
        campaign: 2,
        profession: 7,
        attribute: 31,
        type: 29,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 12,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Dash (PvP)',
        description:
          'For 3 seconds, you run 50% faster. Every 2 points in Shadow Arts lowers recharge by 1 second (max 6 seconds).',
        concise:
          '(3 seconds.) You move 50% faster. Every 2 points in Shadow Arts lowers recharge by 1 second (max 6 seconds).',
      },
    },
    note: 'new PvP split (wiki id 3453): Shadow Arts, recharge 8 -> 12, recharge lowered by Shadow Arts',
  },
  3454: {
    profession: 'Monk',
    create: {
      data: {
        campaign: 2,
        profession: 3,
        attribute: 15,
        type: 23,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 1,
        recharge: 25,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Shield Guardian (PvP)',
        description:
          'For 1...4 seconds, all party members in earshot have a 75% chance to block incoming attacks. If an attack is blocked, all allies in earshot are healed for 10...35 and Shield Guardian ends.',
        concise:
          '(1...4 seconds). Party members in earshot have a 75% chance to block attacks. Block effect: Allies in earshot are healed for 10...35, and Shield Guardian ends.',
      },
    },
    note: 'new PvP split (wiki id 3454): recharge 20 -> 25, healing 10...40 -> 10...35; activation copied from base (1) - wiki says 1.5 for both, open question',
  },
  3455: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 2,
        profession: 1,
        attribute: 19,
        type: 8,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 0,
        activation: 0,
        recharge: 0,
        adrenaline: 5,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Auspicious Blow (PvP)',
        description:
          'If Auspicious Blow hits, you strike for +5...20 damage and gain 2...4 Energy. If target foe is suffering from Weakness, this attack is unblockable.',
        concise:
          'Deals +5...20 damage and you gain 2...4 Energy. Unblockable if target foe is Weakened.',
      },
    },
    note: 'new PvP split (wiki id 3455): Energy gain 3...8 -> 2...4',
  },
  3456: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 2,
        profession: 1,
        attribute: 101,
        type: 20,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 0,
        activation: 0,
        recharge: 4,
        adrenaline: 4,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: '"Coward!" (PvP)',
        description: 'If target foe is moving, that foe is knocked down.',
        concise: 'Causes knock-down if target foe is moving.',
      },
    },
    note: 'new PvP split (wiki id 3456): recharge 2 -> 4',
  },
  3457: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 2,
        profession: 1,
        attribute: 21,
        type: 1,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 30,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Protector's Defense (PvP)",
        description:
          "For 4...8 seconds, allies adjacent to you have a 75% chance to block incoming attacks. Protector's Defense ends if you move.",
        concise:
          '(4...8 seconds.) Allies adjacent to you have 75% chance to block. <gray>Ends if you move.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3457): duration 5...11 -> 4...8',
  },
  3458: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 2,
        profession: 1,
        attribute: 17,
        type: 29,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 4,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Primal Rage (PvP)',
        description:
          'For 1...9 seconds, you attack 33% faster and move 33% faster, but you take 200...150% damage.',
        concise:
          '(1...9 seconds.) You attack 33% faster and move 33% faster. <gray>You take 200...150% damage.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3458): takes 200...150% damage',
  },
  3459: {
    profession: 'Ranger',
    create: {
      data: {
        campaign: 2,
        profession: 2,
        attribute: 25,
        type: 2,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 1,
        recharge: 12,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Melandru's Shot (PvP)",
        description:
          "If Melandru's Shot hits, your target begins Bleeding for 5...25 seconds. If it hits a foe that is moving or knocked down, that foe takes +10...25 damage and is Crippled for 5...15 seconds.",
        concise:
          'Inflicts Bleeding (5...25 seconds). Deals +10...25 damage and inflicts Crippled (5...15 seconds) if target foe was moving or knocked down.',
      },
    },
    note: 'new PvP split (wiki id 3459): recharge 8 -> 12',
  },
  3460: {
    profession: 'Ranger',
    create: {
      data: {
        campaign: 2,
        profession: 2,
        attribute: 24,
        type: 19,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 15,
        activation: 2,
        recharge: 60,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Tranquility (PvP)',
        description:
          'Create a level 1...10 spirit. Enchantments cast by non-spirit creatures within its range expire 10...30% faster. This spirit dies after 15...120 seconds.',
        concise:
          'Creates a level 1...10 spirit (15...120 second lifespan). Enchantments expire 10...30% faster on creatures in range. Does not affect spirits.',
      },
    },
    note: 'new PvP split (wiki id 3460): enchantment expiry 20...50% -> 10...30%',
  },
  3461: {
    profession: 'Ritualist',
    create: {
      data: {
        campaign: 2,
        profession: 8,
        attribute: 36,
        type: 1,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 15,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Soul Twisting (PvP)',
        description:
          'For 5...45 seconds, your Binding Rituals cost 15 less Energy (minimum 5) and recharge 25...50% faster. Soul Twisting ends after 1...3 Binding Rituals.',
        concise:
          '(5...45 seconds.) Your Binding Rituals cost 15 less Energy (minimum 5) and recharge 25...50% faster. <gray>Ends after 1...3 Binding Rituals.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3461): floor 10 -> 5, "recharge instantly" -> "recharge 25...50% faster"',
  },
  3462: {
    profession: 'Ritualist',
    create: {
      data: {
        campaign: 2,
        profession: 8,
        attribute: 32,
        type: 27,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 2,
        recharge: 12,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Guided Weapon (PvP)',
        description:
          "For 4...10 seconds, target ally's attacks cannot be blocked.",
        concise: '(4...10 seconds.) Attacks are unblockable.',
      },
    },
    note: 'new PvP split (wiki id 3462): recharge 5 -> 12',
  },
  3463: {
    profession: 'Mesmer',
    create: {
      data: {
        campaign: 3,
        profession: 5,
        attribute: 3,
        type: 22,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0.25,
        recharge: 20,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Tease (PvP)',
        description:
          'If target foe is using a skill, that foe and other foes in the area are interrupted and you steal 0...5 Energy from all foes in the area.',
        concise:
          'Interrupts a skill. Interruption effect: also interrupts other foes in the area, and you steal 0...5 Energy from all foes in the area.',
      },
    },
    note: 'new PvP split (wiki id 3463): keeps pre-patch recharge 20',
  },
  3464: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 3,
        profession: 1,
        attribute: 17,
        type: 29,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 0,
        activation: 0,
        recharge: 0,
        adrenaline: 4,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Flail (PvP)',
        description:
          'For 1...15 seconds, you attack 33% faster but move 33% slower. Ends if you use a ranged attack skill.',
        concise:
          '(1...15 seconds.) You attack 33% faster. Ends if you use a ranged attack skill. <gray>You move 33% slower.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3464): ends if you use a ranged attack skill',
  },
  3465: {
    profession: 'Warrior',
    create: {
      data: {
        campaign: 3,
        profession: 1,
        attribute: 17,
        type: 29,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 5,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Charging Strike (PvP)',
        description:
          'For 1...10 seconds, you run 33% faster. Your next successful melee hit does +10...80 damage and this stance ends. This stance ends if you use a skill.',
        concise:
          '(1...10 seconds.) You move 33% faster and deal +10...80 damage with your next melee hit. <gray>Ends when you hit or if you use a skill.</gray>',
      },
    },
    note: 'new PvP split (wiki id 3465): damage +10...90 -> +10...80',
  },
  3466: {
    profession: 'Ranger',
    create: {
      data: {
        campaign: 3,
        profession: 2,
        attribute: 23,
        type: 19,
        is_elite: true,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 2,
        recharge: 30,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Infuriating Heat (PvP)',
        description:
          'Create a level 1...10 spirit. Non-spirit creatures within its range gain adrenaline 33...66% as fast. This spirit dies after 30...120 seconds.',
        concise:
          'Creates a level 1...10 spirit (30...120 second lifespan). Adrenaline gain increases by 33...66% for creatures in range.',
      },
    },
    note: 'new PvP split (wiki id 3466): recharge 15 -> 30, adrenaline gain double -> 33...66% (wiki text)',
  },
  3467: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 3,
        profession: 10,
        attribute: 44,
        type: 33,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 10,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Mystic Corruption (PvP)',
        description:
          'All adjacent foes suffer from Disease for 2...6 seconds. For 20 seconds, nothing happens. Disease duration is doubled if you are enchanted when you activate this skill. When this enchantment ends, all party members in earshot are cured of Disease.',
        concise:
          '(20 seconds.) Initial Effect: all adjacent foes are Diseased (2...6 seconds.) Double duration if you are already enchanted. End Effect: party members in earshot lose Disease.',
      },
    },
    note: 'new PvP split (wiki id 3467): Disease 1...10 -> 2...6',
  },
  3468: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 3,
        profession: 10,
        attribute: 42,
        type: 33,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 10,
        activation: 0,
        recharge: 15,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: "Harrier's Grasp (PvP)",
        description:
          'For 5...20 seconds, melee attacks against moving foes also Cripple those foes for 2...9 seconds. When you cast this enchantment, you are relieved of Cripple and 1 other condition. This enchantment ends after you apply Cripple 1...3 times.',
        concise:
          '(5...20 seconds.) Melee attacks on moving foes also Cripple them. Initial Effect: you lose Cripple and 1 other condition. Ends after you apply Cripple 1...3 times.',
      },
    },
    note: 'new PvP split (wiki id 3468): reworked to melee attacks only (wiki text)',
  },
  3469: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 3,
        profession: 10,
        attribute: 43,
        type: 33,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 10,
        activation: 0,
        recharge: 15,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Mirage Cloak (PvP)',
        description:
          'For 1...7 seconds, you have a 30...60% chance to block incoming attacks. When you cast this enchantment, all nearby foes are struck for 10...40 earth damage.',
        concise:
          '(1...7 seconds.) You have 30...60% chance to block. Initial Effect: deals 10...40 earth damage to nearby foes.',
      },
    },
    note: 'new PvP split (wiki id 3469): keeps the pre-rework Mirage Cloak',
  },
  3470: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 3,
        profession: 10,
        attribute: 43,
        type: 33,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 10,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Fleeting Stability (PvP)',
        description:
          'For 2...8 seconds, you cannot be knocked down and move 25% faster. This enchantment ends prematurely if it prevents a knockdown.',
        concise:
          '(2...8 seconds.) You cannot be knocked down and move 25% faster. Ends if knockdown prevented.',
      },
    },
    note: 'new PvP split (wiki id 3470): duration 4...10 -> 2...8, recharge 15 -> 10',
  },
  3471: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 3,
        profession: 10,
        attribute: 42,
        type: 22,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 1,
        recharge: 15,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Pious Restoration (PvP)',
        description:
          'You gain 80...150 Health and remove 1 Dervish enchantment. If an enchantment was removed in this way, you also lose 1 hex.',
        concise:
          'Gain 80...150 Health and remove 1 Dervish enchantment. Removal effect: lose 1 hex.',
      },
    },
    note: 'new PvP split (wiki id 3471): recharge 8 -> 15, hexes removed 1...3 -> 1',
  },
  3472: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 3,
        profession: 10,
        attribute: 42,
        type: 33,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 5,
        activation: 0,
        recharge: 10,
        adrenaline: 0,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Whirling Charge (PvP)',
        description:
          'For 1...6 seconds, you move 33% faster than normal. The next time you strike a foe, all other nearby foes take 10...50 cold damage and this enchantment ends.',
        concise:
          '(1...6 seconds.) You move 33% faster. Deal 10...50 cold damage to all other nearby foes the next time you hit a foe and this enchantment ends.',
      },
    },
    note: 'new PvP split (wiki id 3472): keeps pre-patch recharge 10 and 10...50 damage',
  },
  3473: {
    profession: 'Dervish',
    create: {
      data: {
        campaign: 4,
        profession: 10,
        attribute: 44,
        type: 3,
        is_elite: false,
        is_rp: false,
        is_pvp: true,
        pvp_split: false,
        split_id: 0,
        upkeep: 0,
        energy: 0,
        activation: 0,
        recharge: 0,
        adrenaline: 5,
        sacrifice: 0,
        overcast: 0,
      },
      desc: {
        name: 'Aura Slicer (PvP)',
        description:
          'If this attack hits, you inflict Bleeding for 5...15 seconds. If you are enchanted, you also inflict Cracked Armor for 1...10 seconds.',
        concise:
          '(5...15 seconds.)Inflicts <sic/> Bleeding condition. Also inflicts Cracked Armor (1...10 seconds) if you are enchanted.',
      },
    },
    note: 'new PvP split (wiki id 3473): adrenaline 4 -> 5',
  },
}

export const acknowledged = [
  {
    line: 'Skill can be obtained from [[Dakk]]',
    note: 'Soul Ignition trainer locations; not skill data',
  },
  {
    line: 'Reduce range of nature spirits from 3500 to 3000',
    note: 'spirit range is not in our data or descriptions',
  },
  {
    line: 'Sword [[adrenaline]] reductions:',
    note: 'group label; each sub-line is handled per skill',
  },
  {
    name: 'Lightning Orb (PvP)',
    note: 'removed from the game in 2012 (wiki notes); not in our data',
  },
]
