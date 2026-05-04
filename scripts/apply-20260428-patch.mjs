#!/usr/bin/env node
/* global console, process */
/**
 * Apply the April 28, 2026 Guild Wars 1 skill balance update.
 * Source: https://wiki.guildwars.com/wiki/Feedback:Game_updates/20260428
 *
 * Run with --audit to verify the final data without writing files.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const skillDataPath = path.join(rootDir, 'lib', 'gw', 'data', 'skilldata.json')
const skillDescPath = path.join(rootDir, 'lib', 'gw', 'data', 'skilldesc-en.json')

const auditOnly = process.argv.includes('--audit')
const failures = []
let dataChanges = 0
let descChanges = 0

const readJson = filePath => JSON.parse(fs.readFileSync(filePath, 'utf8'))

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, '\t')}\n`)
}

const skillDataFile = readJson(skillDataPath)
const skillDescFile = readJson(skillDescPath)
const skillData = skillDataFile.skilldata
const skillDesc = skillDescFile.skilldesc

const idKey = id => String(id)

const label = id => `${id} ${skillDesc[idKey(id)]?.name ?? '(missing name)'}`

const normalizeExpected = expected => {
  if (expected === undefined) return undefined
  return Array.isArray(expected) ? expected : [expected]
}

const sameValue = (actual, expected) => Object.is(actual, expected)

const assertKnownCurrent = (id, field, actual, expected) => {
  const accepted = normalizeExpected(expected)
  if (accepted === undefined) return
  if (accepted.some(value => sameValue(actual, value))) return

  failures.push(
    `[${label(id)}] expected ${field} to be one of ${accepted
      .map(String)
      .join(', ')}, found ${actual}`
  )
}

const updateData = (id, updates, expected = {}) => {
  const key = idKey(id)
  const entry = skillData[key]

  if (!entry) {
    failures.push(`[${id}] missing skilldata entry`)
    return
  }

  for (const [field, value] of Object.entries(updates)) {
    assertKnownCurrent(id, field, entry[field], expected[field])
    if (!sameValue(entry[field], value)) {
      entry[field] = value
      dataChanges += 1
    }
  }
}

const updateDesc = (id, updates, expected = {}) => {
  const key = idKey(id)
  const entry = skillDesc[key]

  if (!entry) {
    failures.push(`[${id}] missing skilldesc entry`)
    return
  }

  for (const [field, value] of Object.entries(updates)) {
    assertKnownCurrent(id, field, entry[field], expected[field])
    if (!sameValue(entry[field], value)) {
      entry[field] = value
      descChanges += 1
    }
  }
}

const addOrUpdateSkill = (id, dataEntry, descEntry) => {
  const key = idKey(id)

  if (!skillData[key]) {
    skillData[key] = dataEntry
    dataChanges += 1
  } else {
    updateData(id, dataEntry)
  }

  if (!skillDesc[key]) {
    skillDesc[key] = descEntry
    descChanges += 1
  } else {
    updateDesc(id, descEntry)
  }
}

const expectData = (id, expected) => {
  const entry = skillData[idKey(id)]
  if (!entry) {
    failures.push(`[${id}] missing skilldata entry during audit`)
    return
  }

  for (const [field, value] of Object.entries(expected)) {
    if (!sameValue(entry[field], value)) {
      failures.push(
        `[${label(id)}] audit expected ${field}=${value}, found ${entry[field]}`
      )
    }
  }
}

const expectDesc = (id, expected) => {
  const entry = skillDesc[idKey(id)]
  if (!entry) {
    failures.push(`[${id}] missing skilldesc entry during audit`)
    return
  }

  for (const [field, value] of Object.entries(expected)) {
    if (!sameValue(entry[field], value)) {
      failures.push(`[${label(id)}] audit mismatch in ${field}`)
    }
  }
}

const expectIncludes = (id, field, text) => {
  const entry = skillDesc[idKey(id)]
  if (!entry?.[field]?.includes(text)) {
    failures.push(`[${label(id)}] audit expected ${field} to include "${text}"`)
  }
}

const expectNotIncludes = (id, field, text) => {
  const entry = skillDesc[idKey(id)]
  if (entry?.[field]?.includes(text)) {
    failures.push(`[${label(id)}] audit expected ${field} not to include "${text}"`)
  }
}

const wellDescriptions = {
  92: {
    description:
      'Exploit nearest corpse or sacrifice 66% Health to create a Well of Blood at its location. For 8...20 seconds, allies in that area receive +1...6 Health regeneration.',
    concise:
      '(8...20 seconds.) Allies in this well have +1...6 Health regeneration. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
  1366: {
    description:
      'Exploit nearest corpse or sacrifice 66% Health to create a Well of Darkness for 5...50 seconds. Hexed foes within the Well of Darkness miss 50% of the time.',
    concise:
      '(5...50 seconds.) Hexed foes in this well have 50% chance to miss. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
  91: {
    description:
      'Exploit nearest corpse or sacrifice 66% Health to create a Well of Power at that location. For 8...20 seconds, allies within the area of Well of Power gain +1...6 Health regeneration and +2 Energy regeneration.',
    concise:
      '(8...20 seconds.) Allies in this well have +1...6 Health regeneration and +2 Energy regeneration. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
  2236: {
    description:
      'Exploit nearest corpse or sacrifice 66% Health to create a Well of Ruin at its location. For 5...30 seconds, whenever a foe in the well takes physical damage, that foe has Cracked Armor for 5...20 seconds.',
    concise:
      '(5...30 seconds.) Inflicts Cracked Armor condition (5...20 seconds) to any foe in the well that takes physical damage. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
  1660: {
    description:
      'Exploit target corpse or sacrifice 66% Health to create a Well of Silence for 10...30 seconds. Foes within the well cannot use shouts or chants and suffer -1...4 Health degeneration.',
    concise:
      '(10...30 seconds.) Foes in this well cannot use shouts and chants and have -1...4 Health degeneration. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
  93: {
    description:
      'Exploit nearest corpse or sacrifice 66% Health to create a Well of Suffering at its location. For 10...30 seconds, foes in that area suffer -1...6 Health degeneration.',
    concise:
      '(10...30 seconds.) Foes in this well have -1...6 Health degeneration. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
  94: {
    description:
      'Exploit nearest corpse or sacrifice 66% Health to create a Well of the Profane at its location. For 8...20 seconds, foes in that area are stripped of all enchantments and cannot be the target of further enchantments. (50% failure chance with Death Magic 4 or less.)',
    concise:
      '(8...20 seconds.) Foes in this well lose all enchantments and cannot be the target of further enchantments. <gray>Exploits a fresh corpse or sacrifices 66% Health. 50% failure chance unless Death Magic 5 or more.</gray>',
  },
  818: {
    description:
      'Exploit target corpse or sacrifice 66% Health to create a Well of Weariness for 10...55 seconds. Enemies within the Well of Weariness suffer -1 Energy degeneration.',
    concise:
      '(10...55 seconds.) Foes in this well have -1 Energy degeneration. <gray>Exploits a fresh corpse or sacrifices 66% Health.</gray>',
  },
}

const applyPatch = () => {
  // Assassin
  updateData(1638, { energy: 5 }, { energy: [10, 5] })
  updateDesc(1638, {
    description:
      'For 10...35 seconds, half-ranged spells cast 5...50% faster and recharge 5...60% faster.',
    concise:
      '(10...35 seconds.) Your half-ranged spells cast 5...50% faster and recharge 5...60% faster.',
  })
  updateDesc(1635, {
    description:
      'If you are under the effects of an enchantment and this attack hits, target foe is Dazed 1...12 seconds.',
    concise:
      'Inflicts Dazed condition (1...12 seconds). <gray>No effect unless you are enchanted.</gray>',
  })
  updateData(974, { recharge: 20, type: 35 }, { recharge: [15, 20], type: [22, 35] })
  updateDesc(974, {
    description:
      'Target foe becomes Crippled for 5...20 seconds. This skill counts as an off-hand attack.',
    concise:
      'Inflicts Crippled condition (5...20 seconds). This skill counts as an off-hand attack.',
  })
  updateDesc(570, {
    description:
      'For 5...25 seconds, target foe suffers from -1...5 Health degeneration, and enchantments and stances on target foe expire 30...80% faster. All of your non-Assassin skills are disabled for 5 seconds.',
    concise:
      '(5...25 seconds.) Causes -1...5 Health degeneration. Enchantments and stances expire 30...80% faster on target foe. <gray>Disables your non-Assassin skills (5 seconds).</gray>',
  })
  updateDesc(815, {
    description:
      "For 8...20 seconds, the next time you and target foe are more than 75' apart, you Shadow Step to that foe and that foe is knocked down. This spell has half the normal range.",
    concise:
      "Half Range Hex Spell. (8...20 seconds.) Shadow Step to target foe and cause knock-down the next time this foe is more than 75' away from you.",
  })
  updateData(2052, { recharge: 20 }, { recharge: [45, 20] })
  updateData(1652, { recharge: 15 }, { recharge: [25, 15] })
  updateData(
    928,
    { energy: 5, activation: 0.25 },
    { energy: [10, 5], activation: [1, 0.25] }
  )
  updateDesc(950, {
    description:
      'For 3...15 seconds, target foe moves 25% slower and while target foe has no other hexes, that foe has 20...30 less armor against your attacks.',
    concise:
      '(3...15 seconds.) Target foe moves 25% slower and has 20...30 less armor against your attacks. <gray>Armor reduction only affects this foe while it has no other hexes.</gray>',
  })
  updateData(927, { activation: 1 }, { activation: [2, 1] })
  updateDesc(951, {
    description:
      'For 5...15 seconds, target foe moves 33% slower and you move 33% faster. This spell recharges 50% faster if cast on a moving foe.',
    concise:
      '(5...15 seconds.) Target foe moves 33% slower and you move 33% faster. Recharges 50% faster if cast on a moving foe.',
  })

  // Dervish
  updateData(2015, { pvp_split: true, split_id: 3437 }, { split_id: [0, 3437] })
  addOrUpdateSkill(
    3437,
    {
      id: 3437,
      campaign: 4,
      profession: 10,
      attribute: 41,
      type: 9,
      is_elite: false,
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
    {
      id: 3437,
      name: "Farmer's Scythe (PvP)",
      description:
        'If this attack hits, you deal +5...35 damage. If you hit more than one foe, this attack recharges instantly.',
      concise: 'Deals +5...35 damage. Instant recharge if you hit more than one foe.',
    }
  )
  updateData(3269, { recharge: 15 }, { recharge: [30, 15] })
  updateData(3348, { energy: 5 }, { energy: [10, 5] })
  updateData(1523, { recharge: 15 }, { recharge: [20, 15] })
  updateData(3272, { recharge: 10 }, { recharge: [20, 10] })
  updateData(1491, { recharge: 4 }, { recharge: [8, 4] })
  updateData(1767, { adrenaline: 7 }, { adrenaline: [8, 7] })
  updateDesc(1534, {
    description:
      'Deals 15...65 cold damage to target foe. You lose one Dervish enchantment. If an enchantment was removed, target foe loses 1 enchantment and you gain 2 strikes of adrenaline.',
    concise:
      'Touch Spell. Deals 15...65 cold damage. Lose 1 Dervish enchantment. Removal effect: target foe loses 1 enchantment and you gain 2 strikes of adrenaline.',
  })
  updateDesc(3430, {
    description:
      'For 3...10 seconds, you have +1...6 energy regeneration. This skill reapplies itself every time you use a non-Dervish skill.',
    concise:
      '(3...10 seconds.) Gain +1...6 energy regeneration. Renewal: whenever you use a non-Dervish skill.',
  })
  updateDesc(1761, {
    description:
      'For 20 seconds, you have -2 Energy regeneration, and you gain 1...6 Energy every time you hit with an attack.',
    concise:
      '(20 seconds.) You gain 1...6 Energy each time you hit with an attack. <gray>You have -2 Energy regeneration.</gray>',
  })

  // Elementalist
  updateData(837, { recharge: 12 }, { recharge: [20, 12] })
  updateData(1377, { recharge: 20 }, { recharge: [25, 20] })
  updateDesc(216, {
    description:
      'For 8...15 seconds, you have +15 armor. Your Air Magic spells that target a foe activate and recharge 33% faster, but you are Overcast by 2 points.',
    concise:
      '(8...15 seconds.) Gain +15 armor. Air Magic spells that target a foe activate and recharge 33% faster, but you are Overcast by 2 points.',
  })
  updateData(2190, { activation: 1 }, { activation: [1.5, 1] })
  updateData(866, { energy: 5 }, { energy: [10, 5] })

  // Mesmer
  updateData(1059, { recharge: 15 }, { recharge: [25, 15] })
  updateData(1655, { activation: 1 }, { activation: [2, 1] })
  updateDesc(1655, {
    description:
      'For 5 seconds, the next time target foe uses an elite skill, that foe loses 3...15 Energy.',
    concise: '(5 seconds.) Causes 3...15 Energy loss the next time target foe uses an elite skill.',
  })
  updateData(1055, { recharge: 3 }, { recharge: [10, 3] })
  updateDesc(1055, {
    description:
      'For 5 seconds, target foe suffers from -1...6 Health degeneration. If that foe has another hex when Recurring Insecurity would end, it is reapplied.',
    concise:
      '(5 seconds.) Causes -1...6 Health degeneration. Renewal: if target foe has another hex when Recurring Insecurity would end.',
  })
  updateData(1993, { activation: 0.25 }, { activation: [1, 0.25] })
  updateDesc(1993, {
    description:
      'For 6 seconds, you have -4 Energy regeneration. When this effect ends, you gain 13...20 Energy.',
    concise: '(6 seconds.) You have -4 Energy regeneration. End effect: you gain 13...20 Energy.',
  })
  updateData(1996, { activation: 1.5 }, { activation: [2, 1.5] })

  // Monk
  updateDesc(1115, {
    description:
      'For 4...10 seconds, enchantments cast on target other ally cost 10 less Energy (minimum 1 Energy).',
    concise:
      '(4...10 seconds.) Enchantments cast on target ally cost 10 less Energy (minimum 1 Energy). <gray>Cannot self-target.</gray>',
  })
  updateDesc(1395, {
    description:
      'For 5...25 seconds, the next time target ally would be knocked down by a foe, that foe is knocked down instead.',
    concise:
      '(5...25 seconds.) Causes knock-down to the next foe attempting to knock-down target ally.',
  })
  updateDesc(1394, {
    description:
      'While you maintain this enchantment, your Healing Prayers spells heal for 20% less Health, but cost 1...4 less Energy.',
    concise:
      'Your Healing Prayers spells cost 1...4 less Energy. <gray>These spells heal for 20% less.</gray>',
  })
  updateData(298, { activation: 0.25 }, { activation: [1, 0.25] })
  updateData(960, { activation: 0.25 }, { activation: [1, 0.25] })
  updateData(1398, { activation: 1.5 }, { activation: [2, 1.5] })
  updateData(1690, { activation: 0.25 }, { activation: [1, 0.25] })
  updateData(2895, { recharge: 90 }, { recharge: [89, 90] })
  updateData(957, { activation: 1 }, { activation: [2, 1] })
  updateDesc(957, {
    description:
      'For 5...20 seconds, while you are casting spells, foes cannot target you with spells. When Spell Shield ends, all your skills are disabled for 8...4 seconds.',
    concise:
      '(5...20 seconds.) While casting spells, you cannot be the target of spells. <gray>End effect: your skills are disabled (8...4 seconds).</gray>',
  })
  updateDesc(1391, {
    description:
      'For 5...23 seconds, whenever target ally takes damage while knocked down, that ally is healed for 5...50 Health.',
    concise: '(5...23 seconds.) Heals for 5...50 whenever target ally takes damage while knocked-down.',
  })
  updateData(942, { energy: 5 }, { energy: [15, 5] })
  updateDesc(942, {
    description:
      'Remove all hexes from target ally and all adjacent allies. This spell takes an additional 2 seconds to recharge for each hex removed in this way. 50% failure chance with Divine Favor 4 or less.',
    concise:
      'Removes all hexes. Also affects adjacent allies. <gray>Removal cost: +2 seconds recharge for each hex removed. 50% failure chance unless Divine Favor 5 or more.</gray>',
  })

  // Necromancer wells
  for (const [id, desc] of Object.entries(wellDescriptions)) {
    updateDesc(Number(id), desc)
    updateData(Number(id), { sacrifice: 0 }, { sacrifice: [0] })
  }

  // Necromancer
  updateDesc(1076, {
    description:
      'If your Health is above 90%, you begin Bleeding for 6 seconds. Steal up to 20...65 Health from target foe.',
    concise:
      'Steals 20...65 Health. <gray>You begin Bleeding (6 seconds) if your Health is above 90%.</gray>',
  })
  updateData(1998, { activation: 1 }, { activation: [2, 1] })
  updateDesc(1998, {
    description:
      'For 15 seconds, whenever target foe uses a shout or chant, that foe takes 35...105 damage.',
    concise: '(15 seconds.) Deals 35...105 damage whenever target foe uses a shout or chant.',
  })
  updateData(820, { activation: 1 }, { activation: [2, 1] })
  updateData(1079, { recharge: 3 }, { recharge: [5, 3] })
  updateDesc(1079, {
    description:
      'Target touched foe loses 5...65 Health and suffers from Weakness for 5...20 seconds.',
    concise: 'Causes 5...65 Health loss. Inflicts Weakness condition (5...20 seconds).',
  })
  updateData(766, { recharge: 10 }, { recharge: [15, 10] })
  updateData(1260, { activation: 1, recharge: 20 }, { activation: [2, 1], recharge: [15, 20] })
  updateData(
    128,
    { energy: 15, activation: 1, recharge: 7 },
    { energy: [10, 15], activation: [2, 1], recharge: [15, 7] }
  )
  updateDesc(113, {
    description:
      'For 20...44 seconds, allies in the area are immune to disease, and anyone striking those allies in melee becomes Diseased for 3...15 seconds.',
    concise:
      '(20...44 seconds.) Foes who hit allies in the area in melee become Diseased (3...15 seconds); these allies are immune to Disease.',
  })
  updateData(822, { recharge: 5 }, { recharge: [10, 5] })
  updateDesc(822, {
    description:
      'For 1...16 seconds, target foe suffers -1...4 Health degeneration and takes 5...20 damage while moving.',
    concise:
      '(1...16 seconds.) Target foe has -1...4 Health degeneration and takes 5...20 damage while moving.',
  })
  updateData(125, { activation: 1, recharge: 5 }, { activation: [2, 1], recharge: [10, 5] })

  // Paragon
  updateData(1587, { recharge: 15 }, { recharge: [30, 15] })
  updateDesc(1573, {
    description:
      'If this skill hits a knocked-down foe, that foe becomes Dazed for 5...15 seconds.',
    concise: 'Inflicts Dazed condition (5...15 seconds). <gray>No effect unless target is knocked-down.</gray>',
  })
  updateData(3027, { recharge: 8 }, { recharge: [12, 8] })
  updateDesc(3027, {
    description:
      'For 5...15 seconds, the next time target other ally would be knocked down, 1 nearby foe takes 15...90 damage instead.',
    concise:
      '(5...15 seconds.) Prevents the next knock-down and deals 15...90 damage to one foe near target ally. <gray>Cannot self-target.</gray>',
  })
  updateData(3062, { recharge: 10 }, { recharge: [20, 10] })
  updateData(1581, { recharge: 15 }, { recharge: [20, 15] })
  updateDesc(1549, {
    description:
      'If this attack hits, you deal +5...20 damage. If this attack hits a moving foe, it deals an additional 5...40 damage.',
    concise: 'Deals +5...20 damage. Deals 5...40 more damage if target is moving.',
  })
  updateDesc(2875, {
    description:
      'If this attack hits, you deal +5...20 damage. If this attack hits a moving foe, it deals an additional 5...40 damage.',
    concise: 'Deals +5...20 damage. Deals 5...40 more damage if target is moving.',
  })
  updateDesc(1594, {
    name: '"Help!"',
    description:
      "Target non-spirit ally gains 15...90 Health. For 1...10 seconds, other allies' spells targeting that ally cast 50% faster.",
    concise:
      "(1...10 seconds.) Target non-spirit ally gains 15...90 Health. Other allies' spells targeting that ally cast 50% faster.",
  })
  updateDesc(3036, {
    name: '"Help!" (PvP)',
    description:
      "Target non-spirit ally gains 5...50 Health. For 1...10 seconds, other allies' spells targeting that ally cast 50% faster.",
    concise:
      "(1...10 seconds.) Target non-spirit ally gains 5...50 Health. Other allies' spells targeting that ally cast 50% faster.",
  })
  updateData(1590, { energy: 5 }, { energy: [10, 5] })
  updateDesc(1590, {
    description:
      'Target ally moves 25% faster for 1...5 seconds for each ally within earshot (maximum of 30 seconds).',
    concise:
      'Target ally moves 25% faster for 1...5 seconds (maximum of 30 seconds) for each ally in earshot.',
  })
  updateDesc(1779, {
    description:
      'You gain 2 strikes of adrenaline for each party member within earshot (maximum 1...8 adrenaline).',
    concise: 'You gain 2 adrenaline (maximum 1...8) for each party member in earshot.',
  })
  updateData(2210, { energy: 5 }, { energy: [10, 5] })

  // Ranger
  updateDesc(1200, {
    description:
      'For 1...24 seconds, conditions you apply while wielding a bow last 150% longer.',
    concise: '(1...24 seconds.) Conditions you apply while wielding a bow last 150% longer.',
  })
  updateData(393, { recharge: 2 }, { recharge: [4, 2] })
  updateDesc(393, {
    description:
      'If Crippling Shot hits, your target becomes Crippled for 1...12 seconds. This attack cannot be blocked.',
    concise: 'Unblockable. Inflicts Crippled condition (1...12 seconds).',
  })
  updateData(1206, { recharge: 15 }, { recharge: [20, 15] })
  updateData(422, { activation: 0.25, recharge: 5 }, { activation: [6, 0.25], recharge: [20, 5] })
  updateData(1471, { recharge: 12 }, { recharge: [20, 12] })
  updateData(893, { energy: 10, recharge: 15 }, { energy: [15, 10], recharge: [20, 15] })
  updateData(1729, { recharge: 15 }, { recharge: [20, 15] })
  updateData(854, { activation: 1.5, recharge: 15 }, { activation: [2, 1.5], recharge: [20, 15] })
  updateData(397, { activation: 0.5 }, { activation: [1, 0.5] })
  updateDesc(946, {
    description:
      'For 12...36 seconds, your trap skills are not easily interruptible and your Wilderness Survival attribute is increased by +0...4.',
    concise:
      '(12...36 seconds.) Your trap skills are no longer easy to interrupt. You gain +0...4 to your Wilderness Survival attribute.',
  })

  // Ritualist
  updateData(1223, { activation: 1.5 }, { activation: [2, 1.5] })
  updateDesc(1223, {
    description:
      "Hold Lingwah's ashes for up to 10...60 seconds. While you hold her ashes, your Ritualist hexes cost 1...5 less energy and last 50% longer. When you drop her ashes all your Ritualist hexes are recharged.",
    concise:
      '(10...60 seconds.) Your Ritualist hexes cost 1...5 less energy and last 50% longer. Drop effect: all your Ritualist hexes are recharged.',
  })
  updateData(1220, { activation: 1.5, recharge: 30 }, { activation: [2, 1.5], recharge: [60, 30] })
  updateData(2206, { energy: 3 }, { energy: [5, 3] })
  updateData(789, { activation: 1.5, recharge: 25 }, { activation: [1, 1.5], recharge: [20, 25] })
  updateDesc(789, {
    description:
      "Hold Kuurong's ashes for up to 15...60 seconds. When you drop his ashes, all foes in the area are struck for 15...75 damage and knocked down.",
    concise: '(15...60 seconds.) Drop effect: deal 15...75 damage and knocks-down all foes in the area.',
  })
  updateData(1259, { energy: 5 }, { energy: [15, 5] })
  updateData(1479, { energy: 3 }, { energy: [5, 3] })
  updateData(2202, { recharge: 4 }, { recharge: [6, 4] })
  updateDesc(2202, {
    description:
      'Target ally is healed for 20...80 Health. If that ally is under the effects of a weapon spell, that ally loses one condition.',
    concise: 'Heals for 20...80. Removes one condition if target ally is under a Weapon <sic/> spell.',
  })
  updateDesc(1749, {
    description:
      'For 5...20 seconds, target ally gains 100% more adrenaline and 1 Energy whenever that ally successfully hits with an attack.',
    concise:
      '(5...20 seconds.) 100% more adrenaline gain and +1 Energy whenever target ally hits with an attack.',
  })
  updateData(1752, { energy: 3 }, { energy: [5, 3] })
  updateDesc(1752, {
    description:
      'For 8 seconds, the next time target ally takes damage or life steal from a foe, that ally steals up to 20...80 Health from that foe and loses 1 condition.',
    concise:
      '(8 seconds.) The next time target ally takes damage or life steal from a foe, this ally steals 20...80 Health from that foe and loses 1 condition.',
  })
  updateData(1740, { energy: 3 }, { energy: [5, 3] })
  updateDesc(1740, {
    description:
      'For 10...30 seconds, whenever you cast a weapon spell on an ally, that ally loses 2 conditions.',
    concise:
      '(10...30 seconds.) Whenever you cast a weapon spell, the targeted ally loses 2 conditions.',
  })

  // Warrior
  updateData(379, { recharge: 12 }, { recharge: [20, 12] })
  updateDesc(379, {
    description:
      "For 1...7 seconds, you move 50% faster and if you strike a moving foe in melee, that foe is knocked down. Bull's Charge ends if you use a skill.",
    concise:
      '(1...7 seconds.) You move 50% faster. Causes knock-down if you hit a moving foe in melee. <gray>Ends if you use a skill.</gray>',
  })
  updateData(1696, { adrenaline: 7 }, { adrenaline: [8, 7] })
  updateDesc(1696, {
    description:
      'You lose all adrenaline and all Energy. If this attack hits, you deal +5...80 damage and cause a Deep Wound for 5...20 seconds. This attack always results in a critical hit.',
    concise:
      'Deals +5...80 damage. Inflicts Deep Wound condition (5...20 seconds). Automatic critical hit. <gray>You lose all adrenaline and Energy.</gray>',
  })
  updateDesc(2194, {
    description:
      "If Distracting Strike hits, it deals no damage and interrupts target foe's action. If target foe has Cracked Armor, that skill is disabled for 30 seconds.",
    concise:
      "Interrupts an action. Interruption effect: Disables interrupted skill (30 seconds) if target foe has Cracked Armor. <gray>Deals no damage.</gray>",
  })
  updateData(2011, { recharge: 8 }, { recharge: [12, 8] })
  updateData(831, { energy: 5, adrenaline: 0, recharge: 4 }, { energy: [0, 5], adrenaline: [4, 0], recharge: [10, 4] })
  updateDesc(831, {
    description:
      'For 1...9 seconds, you attack 33% faster and move 33% faster, but you take double damage.',
    concise: '(1...9 seconds.) You attack 33% faster and move 33% faster. <gray>You take double damage.</gray>',
  })
  updateDesc(892, {
    description:
      'If Quivering Blade hits, you strike for +10...40 damage. If this attack hits a moving foe, that foe is Dazed for 10 seconds.',
    concise:
      'Deals +10...40 damage. Inflicts Dazed condition (10 seconds) if target foe was moving.',
  })
  updateData(1146, { recharge: 10 }, { recharge: [15, 10] })
  updateData(329, { adrenaline: 6, activation: 0.25 }, { adrenaline: [9, 6], activation: [0.5, 0.25] })
  updateData(1701, { recharge: 4 }, { recharge: [6, 4] })
  updateDesc(1701, {
    description:
      'For 10 seconds, the next time you would be knocked down, you gain 1...4 strikes of adrenaline and 1...7 Energy instead.',
    concise:
      '(10 seconds.) The next time you would be knocked-down, you gain 1...4 adrenaline and 1...7 Energy instead.',
  })
  updateData(365, { recharge: 10 }, { recharge: [15, 10] })
}

const auditPatch = () => {
  const expectedData = {
    1638: { energy: 5 },
    974: { recharge: 20, type: 35 },
    2052: { recharge: 20 },
    1652: { recharge: 15 },
    928: { energy: 5, activation: 0.25 },
    927: { activation: 1 },
    2015: { pvp_split: true, split_id: 3437 },
    3437: { is_pvp: true, recharge: 20 },
    3269: { recharge: 15 },
    3348: { energy: 5 },
    1523: { recharge: 15 },
    3272: { recharge: 10 },
    1491: { recharge: 4 },
    1767: { adrenaline: 7 },
    837: { recharge: 12 },
    1377: { recharge: 20 },
    2190: { activation: 1 },
    866: { energy: 5 },
    1059: { recharge: 15 },
    1655: { activation: 1 },
    1055: { recharge: 3 },
    1993: { activation: 0.25 },
    1996: { activation: 1.5 },
    298: { activation: 0.25 },
    960: { activation: 0.25 },
    1398: { activation: 1.5 },
    1690: { activation: 0.25 },
    2895: { recharge: 90 },
    957: { activation: 1 },
    942: { energy: 5 },
    1998: { activation: 1 },
    820: { activation: 1 },
    1079: { recharge: 3 },
    766: { recharge: 10 },
    1260: { activation: 1, recharge: 20 },
    128: { energy: 15, activation: 1, recharge: 7 },
    822: { recharge: 5 },
    125: { activation: 1, recharge: 5 },
    1587: { recharge: 15 },
    3027: { recharge: 8 },
    3062: { recharge: 10 },
    1581: { recharge: 15 },
    1590: { energy: 5 },
    2210: { energy: 5 },
    393: { recharge: 2 },
    1206: { recharge: 15 },
    422: { activation: 0.25, recharge: 5 },
    1471: { recharge: 12 },
    893: { energy: 10, recharge: 15 },
    1729: { recharge: 15 },
    854: { activation: 1.5, recharge: 15 },
    397: { activation: 0.5 },
    1223: { activation: 1.5 },
    1220: { activation: 1.5, recharge: 30 },
    2206: { energy: 3 },
    789: { activation: 1.5, recharge: 25 },
    1259: { energy: 5 },
    1479: { energy: 3 },
    2202: { recharge: 4 },
    1752: { energy: 3 },
    1740: { energy: 3 },
    379: { recharge: 12 },
    1696: { adrenaline: 7 },
    2011: { recharge: 8 },
    831: { energy: 5, adrenaline: 0, recharge: 4 },
    1146: { recharge: 10 },
    329: { adrenaline: 6, activation: 0.25 },
    1701: { recharge: 4 },
    365: { recharge: 10 },
  }

  for (const [id, expected] of Object.entries(expectedData)) {
    expectData(Number(id), expected)
  }

  for (const [id, expected] of Object.entries(wellDescriptions)) {
    expectData(Number(id), { sacrifice: 0 })
    expectDesc(Number(id), expected)
  }

  expectIncludes(1638, 'description', 'recharge 5...60% faster')
  expectIncludes(1635, 'description', 'Dazed 1...12 seconds')
  expectNotIncludes(974, 'description', 'Must follow a lead attack')
  expectIncludes(570, 'description', '-1...5 Health degeneration')
  expectIncludes(570, 'description', 'disabled for 5 seconds')
  expectIncludes(815, 'description', "more than 75' apart")
  expectIncludes(950, 'description', '20...30 less armor')
  expectNotIncludes(951, 'description', 'half the normal range')
  expectIncludes(3437, 'description', '+5...35 damage')
  expectIncludes(1534, 'description', 'gain 2 strikes of adrenaline')
  expectIncludes(3430, 'description', '+1...6 energy regeneration')
  expectIncludes(1761, 'description', '-2 Energy regeneration')
  expectIncludes(216, 'description', '33% faster')
  expectIncludes(216, 'description', 'Overcast by 2 points')
  expectIncludes(1655, 'description', 'For 5 seconds')
  expectIncludes(1655, 'description', 'loses 3...15 Energy')
  expectIncludes(1055, 'description', 'For 5 seconds')
  expectIncludes(1055, 'description', '-1...6 Health degeneration')
  expectIncludes(1993, 'description', 'For 6 seconds')
  expectIncludes(1115, 'description', 'cost 10 less Energy')
  expectIncludes(1395, 'description', 'For 5...25 seconds')
  expectIncludes(1394, 'description', 'heal for 20% less')
  expectIncludes(1394, 'description', 'cost 1...4 less Energy')
  expectIncludes(957, 'description', 'disabled for 8...4 seconds')
  expectIncludes(1391, 'description', 'healed for 5...50 Health')
  expectIncludes(942, 'description', 'additional 2 seconds')
  expectIncludes(942, 'description', 'Divine Favor 4 or less')
  expectIncludes(1076, 'description', 'above 90%')
  expectIncludes(1076, 'description', 'Bleeding for 6 seconds')
  expectIncludes(1998, 'description', 'For 15 seconds')
  expectIncludes(1079, 'description', 'loses 5...65 Health')
  expectIncludes(113, 'description', 'allies in the area')
  expectIncludes(822, 'description', 'takes 5...20 damage')
  expectNotIncludes(1573, 'description', 'half the normal range')
  expectIncludes(3027, 'description', '15...90 damage')
  expectIncludes(1549, 'description', 'additional 5...40 damage')
  expectIncludes(2875, 'description', 'additional 5...40 damage')
  expectDesc(1594, { name: '"Help!"' })
  expectDesc(3036, { name: '"Help!" (PvP)' })
  expectIncludes(1594, 'description', 'Target non-spirit ally gains 15...90 Health')
  expectIncludes(3036, 'description', 'Target non-spirit ally gains 5...50 Health')
  expectIncludes(1590, 'description', 'maximum of 30 seconds')
  expectIncludes(1779, 'description', '2 strikes of adrenaline')
  expectIncludes(1779, 'description', 'maximum 1...8 adrenaline')
  expectIncludes(1200, 'description', '150% longer')
  expectIncludes(393, 'description', '1...12 seconds')
  expectIncludes(946, 'description', 'For 12...36 seconds')
  expectIncludes(946, 'description', '+0...4')
  expectIncludes(1223, 'description', 'last 50% longer')
  expectIncludes(789, 'description', 'all foes in the area')
  expectIncludes(2202, 'description', '20...80 Health')
  expectIncludes(1749, 'description', '100% more adrenaline')
  expectIncludes(1752, 'description', '20...80 Health')
  expectIncludes(1752, 'description', 'loses 1 condition')
  expectIncludes(1740, 'description', 'loses 2 conditions')
  expectIncludes(379, 'description', 'For 1...7 seconds')
  expectIncludes(379, 'description', 'move 50% faster')
  expectIncludes(1696, 'description', '+5...80 damage')
  expectIncludes(2194, 'description', 'disabled for 30 seconds')
  expectIncludes(831, 'description', 'For 1...9 seconds')
  expectIncludes(831, 'description', 'move 33% faster')
  expectIncludes(892, 'description', 'Dazed for 10 seconds')
  expectIncludes(1701, 'description', '1...4 strikes of adrenaline')

  expectNotIncludes(1752, 'description', 'loses 2 conditions')
  expectNotIncludes(892, 'description', '+10 damage')
  expectNotIncludes(113, 'description', 'party members')
}

if (!auditOnly) {
  applyPatch()

  if (failures.length === 0) {
    writeJson(skillDataPath, skillDataFile)
    writeJson(skillDescPath, skillDescFile)
  }
}

auditPatch()

if (failures.length > 0) {
  console.error(`April 28 patch ${auditOnly ? 'audit' : 'apply'} failed:`)
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

if (auditOnly) {
  process.stdout.write('April 28 patch audit passed.\n')
} else {
  process.stdout.write(
    `April 28 patch applied. ${dataChanges} skilldata changes, ${descChanges} skilldesc changes.`
  )
  process.stdout.write('\n')
}
