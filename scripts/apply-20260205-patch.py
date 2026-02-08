#!/usr/bin/env python3
"""
Apply the February 5, 2026 Guild Wars 1 skill balance update.
Source: https://wiki.guildwars.com/wiki/Feedback:Game_updates/20260205

This script updates both skilldata.json (mechanical values) and
skilldesc-en.json (description text) to reflect the balance patch.

Description format: "X...Y" where X = rank 0 value, Y = rank 15 value.
Patch notes format: "X...Y...Z" where X = rank 0, Y = rank 12, Z = rank 15.
So description "X...Z" maps to patch notes "X...Y...Z".
"""

import json
import sys
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'lib', 'gw', 'data')
SKILLDATA_PATH = os.path.join(DATA_DIR, 'skilldata.json')
SKILLDESC_PATH = os.path.join(DATA_DIR, 'skilldesc-en.json')

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent='\t')
        f.write('\n')

def apply_mechanical_changes(skilldata):
    """Apply energy/activation/recharge/adrenaline changes to skilldata.json"""
    sd = skilldata['skilldata']

    changes = {
        # Warrior
        1406: {'recharge': 15},          # Headbutt: 20→15

        # Ranger
        1467: {'recharge': 3},            # Arcing Shot: 6→3
        908:  {'energy': 5},              # Marauder's Shot: 10→5
        430:  {'activation': 1},          # Marksman's Wager: 2→1

        # Nature Rituals (activation 5→3)
        947:  {'activation': 3},          # Brambles
        466:  {'activation': 3},          # Conflagration
        464:  {'activation': 3},          # Edge of Extinction
        467:  {'activation': 3},          # Fertile Season
        471:  {'activation': 3},          # Frozen Soil
        477:  {'activation': 3},          # Muddy Terrain
        870:  {'activation': 3},          # Pestilence
        470:  {'activation': 3},          # Predatory Season
        1473: {'activation': 3},          # Quicksand
        1725: {'activation': 3},          # Roaring Winds
        468:  {'activation': 3},          # Symbiosis
        1472: {'activation': 3},          # Toxicity
        1213: {'activation': 3},          # Tranquility

        # Monk
        265:  {'recharge': 20},           # Amity: 45→20
        847:  {'recharge': 6},            # Boon Signet: 8→6
        1692: {'energy': 5},              # Divert Hexes: 10→5
        269:  {'activation': 0.25, 'recharge': 15},  # Mark of Protection: act 1→0.25, rech 45→15
        264:  {'recharge': 15},           # Pacifism: 30→15
        253:  {'energy': 5},              # Scourge Sacrifice: 10→5

        # Mesmer
        2137: {'activation': 1},          # Confusing Images: 2→1
        1061: {'activation': 1},          # Feedback: 2→1
        55:   {'energy': 5, 'activation': 1},  # Fevered Dreams: energy 10→5, act 2→1
        1348: {'energy': 5, 'activation': 0.25},  # Hex Eater Vortex: energy 10→5, act 1→0.25
        1334: {'activation': 0.25},       # Hypochondria: 1→0.25
        35:   {'energy': 10},             # Ignorance: 15→10
        1338: {'energy': 5},              # Persistence of Memory: 10→5

        # Necromancer
        1355: {'recharge': 10},           # Jagged Bones: 15→10
        763:  {'energy': 5},              # Jaundiced Gaze: 10→5
        1358: {'energy': 10, 'activation': 1},  # Ulcerous Lungs: energy 15→10, act 2→1

        # Elementalist
        2193: {'energy': 5},              # Energy Blast: 10→5
        175:  {'energy': 10},             # Ward Against Elements: 15→10
        2001: {'energy': 5},              # Ward of Weakness: 10→5

        # Assassin
        802:  {'energy': 5},              # Expose Defenses: 10→5
        1654: {'energy': 5},              # Shadow Meld: 10→5
        876:  {'recharge': 15},           # Signet of Shadows: 30→15
        1648: {'activation': 1},          # Signet of Twilight: 2→1

        # Ritualist
        914:  {'activation': 0.25},       # Consume Soul: 1→0.25
        980:  {'energy': 5},              # Feast of Souls: 10→5
        2072: {'energy': 5},              # Pure Was Li Ming: 10→5
        794:  {'recharge': 15},           # Wailing Weapon: 25→15
        1268: {'activation': 1},          # Weapon of Quickening: 2→1
        1737: {'energy': 5},              # Wielder's Zeal: 10→5

        # Dervish
        1755: {'energy': 5},              # Mystic Corruption: 10→5
        1525: {'activation': 1},          # Natural Healing: 2→1
        2014: {'recharge': 10},           # Signet of Pious Restraint: 20→10
        1545: {'adrenaline': 5},          # Test of Faith: 7→5
        1533: {'energy': 5},              # Winds of Disenchantment: 10→5

        # Paragon
        1779: {'recharge': 10},           # "Make Your Time!": 30→10
        1568: {'adrenaline': 2},          # Anthem of Guidance: 4→2
        1569: {'adrenaline': 3},          # Energizing Chorus: 4→3
        1579: {'activation': 0.25, 'recharge': 5},  # Purifying Finale: act 1→0.25, rech 10→5
        1560: {'energy': 15},             # Song of Power: 25→15
        1570: {'adrenaline': 3},          # Song of Purification: 5→3
    }

    applied = 0
    for skill_id, updates in changes.items():
        key = str(skill_id)
        if key not in sd:
            print(f"  WARNING: Skill ID {skill_id} not found in skilldata.json!")
            continue
        for field, new_val in updates.items():
            old_val = sd[key][field]
            sd[key][field] = new_val
            print(f"  [{skill_id}] {field}: {old_val} → {new_val}")
            applied += 1

    return applied


def apply_description_changes(skilldesc):
    """Apply description text changes to skilldesc-en.json.

    Description format uses "X...Y" where X=rank0, Y=rank15.
    Patch notes use "X...Y...Z" where X=rank0, Y=rank12, Z=rank15.
    So we update "old_X...old_Z" to "new_X...new_Z" in descriptions.
    """
    sd = skilldesc['skilldesc']

    # Each entry: (skill_id, field, old_text, new_text)
    # field is 'description', 'concise', or 'both' (applies to both)
    changes = []

    # ── WARRIOR ──────────────────────────────────────────────────

    # "I Meant to Do That!" (2067): adrenaline gain 1...4...5 → 1...5...6
    # desc rank15: 5→6
    changes.append((2067, 'description', 'gain 1...5 strikes', 'gain 1...6 strikes'))
    changes.append((2067, 'concise', 'gain 1...5 strikes', 'gain 1...6 strikes'))

    # "You Will Die!" (1141): health threshold 50% → 90%
    changes.append((1141, 'description', 'below 50% Health', 'below 90% Health'))
    changes.append((1141, 'concise', 'under 50% Health', 'under 90% Health'))

    # Charging Strike (1405): damage bonus +10...34...40 → +10...74...90
    # desc rank15: 40→90
    changes.append((1405, 'description', '+10...40 damage', '+10...90 damage'))
    changes.append((1405, 'concise', '+10...40 damage', '+10...90 damage'))

    # Headbutt (1406): daze 5...17...20 → flat 5 seconds
    changes.append((1406, 'description', 'Dazed for 5...20 seconds', 'Dazed for 5 seconds'))
    changes.append((1406, 'concise', 'Dazed (5...20 seconds)', 'Dazed (5 seconds)'))

    # Rage of the Ntouka (1408): duration 10→8 seconds, adrenal recharge 5→3 seconds
    changes.append((1408, 'description', 'For 10 seconds, whenever you use an adrenal skill, that skill recharges for 5 seconds', 'For 8 seconds, whenever you use an adrenal skill, that skill recharges for 3 seconds'))
    changes.append((1408, 'concise', 'For 10 seconds, adrenal skills have a 5 second recharge', 'For 8 seconds, adrenal skills have a 3 second recharge'))

    # ── RANGER ───────────────────────────────────────────────────

    # Arcing Shot (1467): damage +10...22...25 → +10...30...35
    changes.append((1467, 'description', '+10...25 damage', '+10...35 damage'))
    changes.append((1467, 'concise', '+10...25 damage', '+10...35 damage'))

    # Marauder's Shot (908): damage +10...30...35 → +25...49...55, disable 10→5
    changes.append((908, 'description', '+10...35 damage and all your non-attack skills are disabled for 10 seconds', '+25...55 damage and all your non-attack skills are disabled for 5 seconds'))
    changes.append((908, 'concise', 'Deals +10...35 damage.', 'Deals +25...55 damage.'))
    changes.append((908, 'concise', 'disabled (10 seconds)', 'disabled (5 seconds)'))

    # Practiced Stance (449): prep duration 30...126...150% → 30...246...300%
    changes.append((449, 'description', 'last 30...150% longer', 'last 30...300% longer'))
    changes.append((449, 'concise', 'last 30...150% longer', 'last 30...300% longer'))

    # Splinter Shot (852): adjacent → area
    changes.append((852, 'description', 'foes adjacent to your target', 'foes in the area of your target'))
    changes.append((852, 'concise', 'to adjacent foes', 'to foes in the area'))

    # ── NATURE RITUALS ───────────────────────────────────────────

    # Brambles (947): duration 30...126...150 → 30...198...240
    # Actual text: "This Spirit dies after 30...150 seconds"
    changes.append((947, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((947, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Conflagration (466): duration 30...126...150 → 30...198...240
    # Actual text: "This spirit dies after 30...150 seconds"
    changes.append((466, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((466, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Edge of Extinction (464): duration 30...126...150 → 30...198...240
    # Actual text: "This spirit dies after 30...150 seconds" (note: "spirit die" in some)
    changes.append((464, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((464, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Equinox (1212): duration 30...126...150 → 30...198...240
    changes.append((1212, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((1212, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Famine (997): duration 30...78...90 → 30...150...180, damage 10...30...35 → 20...60...70
    # Actual text: "takes 10...35 damage. This spirit dies after 30...90 seconds"
    changes.append((997, 'description', 'takes 10...35 damage', 'takes 20...70 damage'))
    changes.append((997, 'description', 'dies after 30...90 seconds', 'dies after 30...180 seconds'))
    changes.append((997, 'concise', 'Deals 10...35 damage', 'Deals 20...70 damage'))
    changes.append((997, 'concise', '30...90 lifespan', '30...180 lifespan'))

    # Fertile Season (467): duration 15...39...45 → 15...75...90
    changes.append((467, 'description', 'dies after 15...45 seconds', 'dies after 15...90 seconds'))
    changes.append((467, 'concise', '15...45 second lifespan', '15...90 second lifespan'))

    # Frozen Soil (471): duration 30...78...90 → 30...150...180
    changes.append((471, 'description', 'dies after 30...90 seconds', 'dies after 30...180 seconds'))
    changes.append((471, 'concise', '30...90 second lifespan', '30...180 second lifespan'))

    # Greater Conflagration (465): duration 30...126...150 → 30...198...240
    changes.append((465, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((465, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Infuriating Heat (1730): duration 30...54...60 → 30...102...120
    changes.append((1730, 'description', 'dies after 30...60 seconds', 'dies after 30...120 seconds'))
    changes.append((1730, 'concise', '30...60 second lifespan', '30...120 second lifespan'))

    # Lacerate (961): duration 30...126...150 → 30...198...240
    changes.append((961, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((961, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Muddy Terrain (477): duration 30...78...90 → 30...150...180
    changes.append((477, 'description', 'dies after 30...90 seconds', 'dies after 30...180 seconds'))
    changes.append((477, 'concise', '30...90 second lifespan', '30...180 second lifespan'))

    # Pestilence (870): duration 30...78...90 → 30...150...180
    changes.append((870, 'description', 'dies after 30...90 seconds', 'dies after 30...180 seconds'))
    changes.append((870, 'concise', '30...90 second lifespan', '30...180 second lifespan'))

    # Predatory Season (470): duration 30...126...150 → 30...198...240
    changes.append((470, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((470, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Quicksand (1473): duration 30...78...90 → 30...150...180
    changes.append((1473, 'description', 'dies after 30...90 seconds', 'dies after 30...180 seconds'))
    changes.append((1473, 'concise', '30...90 second lifespan', '30...180 second lifespan'))

    # Roaring Winds (1725): duration 30...54...60 → 30...150...180
    changes.append((1725, 'description', 'dies after 30...60 seconds', 'dies after 30...180 seconds'))
    changes.append((1725, 'concise', '30...60 second lifespan', '30...180 second lifespan'))

    # Symbiosis (468): duration 30...126...150 → 30...198...240
    changes.append((468, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((468, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # Toxicity (1472): duration 30...78...90 → 30...150...180
    changes.append((1472, 'description', 'dies after 30...90 seconds', 'dies after 30...180 seconds'))
    changes.append((1472, 'concise', '30...90 second lifespan', '30...180 second lifespan'))

    # Tranquility (1213): duration 15...54...60 → 30...102...120
    changes.append((1213, 'description', 'dies after 15...60 seconds', 'dies after 30...120 seconds'))
    changes.append((1213, 'concise', '15...60 second lifespan', '30...120 second lifespan'))

    # Winter (462): duration 30...126...150 → 30...198...240
    changes.append((462, 'description', 'dies after 30...150 seconds', 'dies after 30...240 seconds'))
    changes.append((462, 'concise', '30...150 second lifespan', '30...240 second lifespan'))

    # ── MONK ─────────────────────────────────────────────────────

    # Amity (265): duration 8...18...20 → 4...10...12
    changes.append((265, 'description', 'For 8...20 seconds', 'For 4...12 seconds'))
    changes.append((265, 'concise', '(8...20 seconds.)', '(4...12 seconds.)'))

    # Boon Signet (847): bonus healing 20...68...80 → 20...84...100
    # Actual desc has <sic/> tag: "Protection Prayer <sic/> spell"
    changes.append((847, 'description', '20...80 Health. Your next Healing or Protection Prayer <sic/> spell that targets an ally heals for an additional 20...80 Health', '20...100 Health. Your next Healing or Protection Prayer <sic/> spell that targets an ally heals for an additional 20...100 Health'))
    changes.append((847, 'concise', 'Heals for 20...80. Your next Healing or Protection Prayer <sic/> spell that targets an ally heals for +20...80 Health', 'Heals for 20...100. Your next Healing or Protection Prayer <sic/> spell that targets an ally heals for +20...100 Health'))

    # Pacifism (264): duration 8...18...20 → 4...7...8
    changes.append((264, 'description', 'For 8...20 seconds', 'For 4...8 seconds'))
    changes.append((264, 'concise', '(8...20 seconds.)', '(4...8 seconds.)'))

    # Smiter's Boon (2005, PvP): duration "30 seconds" → "4 seconds"
    # Note: This is the PvP version. Our data has "For 30 seconds" which is the PvE value.
    # The patch specifically changes the PvP split. Since our data stores the PvE version
    # and the skill has pvp_split=true, we should NOT change the PvE description.
    # However, the web search says "Smiter's Boon (PvP): reduced duration to 4 seconds (from 5)."
    # The current description says "For 30 seconds" which is the PvE value. Skip this one.

    # Word of Censure (1129): damage 15...63...75 → 30...110...130, threshold 33% → 50%
    # Actual desc: "takes 15...75 holy damage. If your target was below 33% Health"
    changes.append((1129, 'description', 'takes 15...75 holy damage. If your target was below 33% Health', 'takes 30...130 holy damage. If your target was below 50% Health'))
    # Actual concise has <gray> tag
    changes.append((1129, 'concise', 'Deals 15...75 holy damage.', 'Deals 30...130 holy damage.'))
    changes.append((1129, 'concise', 'below 33% Health', 'below 50% Health'))

    # ── MESMER ───────────────────────────────────────────────────

    # Hex Eater Vortex (1348): "foes near that ally" → "foes in the area of that ally"
    changes.append((1348, 'description', 'foes near that ally', 'foes in the area of that ally'))
    changes.append((1348, 'concise', 'from foes near this ally', 'from foes in the area of this ally'))

    # Shared Burden (900): "nearby foes" → "foes in the area"
    changes.append((900, 'description', 'all nearby foes attack', 'all foes in the area attack'))
    changes.append((900, 'concise', 'Also hexes foes near your target', 'Also hexes foes in the area of your target'))

    # Mantra of Signets (18, PvP): added "+3 armor for each signet equipped"
    # Current desc already says "+3 armor per equipped signet" so this is already matching.
    # The patch makes PvP function the same as PvE. No change needed to PvE desc.

    # ── NECROMANCER ──────────────────────────────────────────────

    # Jagged Bones (1355): duration 30 → 60 seconds
    changes.append((1355, 'description', 'For 30 seconds', 'For 60 seconds'))
    changes.append((1355, 'concise', '(30 seconds.)', '(60 seconds.)'))

    # Jaundiced Gaze (763): duration 1...12...15 → 1...16...20
    # Actual desc: "for the next 1...15 seconds"
    changes.append((763, 'description', 'the next 1...15 seconds', 'the next 1...20 seconds'))
    changes.append((763, 'concise', '(1...15 seconds)', '(1...20 seconds)'))

    # Order of Apostasy (863): health loss 25...17...15% → 10...4...3%
    # Actual: "25...15% maximum Health"
    changes.append((863, 'description', 'lose 25...15% maximum Health', 'lose 10...3% maximum Health'))
    changes.append((863, 'concise', 'lose 25...15% maximum Health', 'lose 10...3% maximum Health'))

    # Spinal Shivers (124): triggered energy cost 10...6...5 → 8...4...3
    changes.append((124, 'description', 'you lose 10...5 Energy', 'you lose 8...3 Energy'))
    changes.append((124, 'concise', 'lose 10...5 Energy', 'lose 8...3 Energy'))

    # ── ELEMENTALIST ─────────────────────────────────────────────

    # Ether Renewal (181, PvP split): PvP duration 7→10
    # PvE description says "5...20 seconds" - no PvE change. Skip.

    # Magnetic Aura (168): duration 1...4...5 → 1...7...8
    changes.append((168, 'description', 'For 1...5 seconds', 'For 1...8 seconds'))
    changes.append((168, 'concise', '(1...5 seconds.)', '(1...8 seconds.)'))

    # Mind Freeze (209, PvP split): PvP-only change. Skip.

    # Slippery Ground (2191, PvP split): PvP-only recharge change. No desc change.

    # Swirling Aura (233): duration "5 seconds" → "3...7 seconds"
    changes.append((233, 'description', 'For 5 seconds', 'For 3...7 seconds'))
    changes.append((233, 'concise', '(5 seconds.)', '(3...7 seconds.)'))

    # Teinai's Prison (1097): duration 1...5...6 → 1...7...8
    changes.append((1097, 'description', 'For 1...6 seconds', 'For 1...8 seconds'))
    changes.append((1097, 'concise', '(1...6 seconds.)', '(1...8 seconds.)'))

    # ── ASSASSIN ─────────────────────────────────────────────────

    # Dark Apostasy (1029): triggered energy cost 10...5...4 → 10...4...3
    changes.append((1029, 'description', 'lose 10...4 Energy', 'lose 10...3 Energy'))
    changes.append((1029, 'concise', 'lose 10...4 Energy', 'lose 10...3 Energy'))

    # Hidden Caltrops (1642): disable 10→3 seconds
    # Actual desc: "Your non-Assassin skills are disabled for 10 seconds"
    changes.append((1642, 'description', 'skills are disabled for 10 seconds', 'skills are disabled for 3 seconds'))
    # Actual concise: "Your non-Assassin skills are disabled (10 seconds.)"
    changes.append((1642, 'concise', 'skills are disabled (10 seconds.)', 'skills are disabled (3 seconds.)'))

    # Mark of Death (785): healing reduction 33% → 50%
    changes.append((785, 'description', 'gains 33% less benefit from healing', 'gains 50% less benefit from healing'))
    changes.append((785, 'concise', 'receives 33% less from healing', 'receives 50% less from healing'))

    # Sadist's Signet (1991): health gain 10...34...40 → 10...38...45
    changes.append((1991, 'description', 'gain 10...40 Health', 'gain 10...45 Health'))
    changes.append((1991, 'concise', 'gain 10...40 Health', 'gain 10...45 Health'))

    # Shroud of Silence (801): duration 1...3...3 → 1...5...6
    changes.append((801, 'description', 'For 1...3 seconds', 'For 1...6 seconds'))
    changes.append((801, 'concise', '(1...3 seconds.)', '(1...6 seconds.)'))

    # Siphon Strength (827): crit chance +33% → +50%
    # Actual desc: "additional 33% chance of being a critical hit"
    changes.append((827, 'description', 'additional 33% chance of being a critical hit', 'additional 50% chance of being a critical hit'))
    # Actual concise: "+33% chance to land a critical hit"
    changes.append((827, 'concise', '+33% chance to land a critical hit', '+50% chance to land a critical hit'))

    # ── RITUALIST ────────────────────────────────────────────────

    # Consume Soul (914): life steal 5...49...60 → 5...57...70, area → earshot
    # Actual desc: "steal 5...60 Health from target foe. All hostile summoned creatures in the area of that foe"
    changes.append((914, 'description', 'steal 5...60 Health', 'steal 5...70 Health'))
    changes.append((914, 'description', 'creatures in the area of that foe', 'creatures in earshot of that foe'))
    # Actual concise: "Steals 5...60 Health. Deal 25...125 damage to hostile summoned creatures in the area of target foe."
    changes.append((914, 'concise', 'Steals 5...60 Health', 'Steals 5...70 Health'))
    changes.append((914, 'concise', 'creatures in the area of target foe', 'creatures in earshot of target foe'))

    # Doom (1264): damage 10...34...40 → 10...50...60
    # Actual desc: "for 10...40 lightning (maximum 135) damage"
    changes.append((1264, 'description', '10...40 lightning (maximum 135) damage', '10...60 lightning (maximum 135) damage'))
    # Actual concise: "10...40 lightning damage (maximum 135)"
    changes.append((1264, 'concise', '10...40 lightning damage (maximum 135)', '10...60 lightning damage (maximum 135)'))

    # Dulled Weapon (1235): duration 5...13...15 → 5...17...20, damage reduction 1...12...15 → -3...17...20
    # Note: the "-3" at rank 0 likely means the description changes from "1...15" to "3...20"
    # Actually, looking at patch notes: "increased damage reduction to -3...17...20 (from 1...12...15)"
    # The -3 means "minus 3 damage" at rank 0. The description format would use the absolute values.
    # Current desc: "deal 1...15 less damage" → new: "deal 3...20 less damage"
    changes.append((1235, 'description', 'For 5...15 seconds', 'For 5...20 seconds'))
    changes.append((1235, 'description', 'deal 1...15 less damage', 'deal 3...20 less damage'))
    changes.append((1235, 'concise', '(5...15 seconds)', '(5...20 seconds)'))
    changes.append((1235, 'concise', 'Reduces damage by 1...15', 'Reduces damage by 3...20'))

    # Ghostly Haste (1244): duration 5...17...20 → 5...25...30
    changes.append((1244, 'description', 'For 5...20 seconds', 'For 5...30 seconds'))
    changes.append((1244, 'concise', '(5...20 seconds.)', '(5...30 seconds.)'))

    # Restoration (963, PvP split): activation 5→3 is PvP only. Skip desc.

    # Wailing Weapon (794): duration 3...8...9 → 3...12...14
    changes.append((794, 'description', 'For 3...9 seconds', 'For 3...14 seconds'))
    changes.append((794, 'concise', '(3...9 seconds.)', '(3...14 seconds.)'))

    # Weapon of Renewal (2149): duration 4...9...10 → 5...17...20
    changes.append((2149, 'description', 'For 4...10 seconds', 'For 5...20 seconds'))
    changes.append((2149, 'concise', '(4...10 seconds.)', '(5...20 seconds.)'))

    # Wielder's Zeal (1737): duration 10...26...30 → 10...34...40
    changes.append((1737, 'description', 'For 10...30 seconds', 'For 10...40 seconds'))
    changes.append((1737, 'concise', '(10...30 seconds.)', '(10...40 seconds.)'))

    # ── DERVISH ──────────────────────────────────────────────────

    # Arcane Zeal (1502): energy gain 1→2 per enchantment, max 1...7 → 2...7
    # Actual: "you gain 1 Energy for each enchantment on you (maximum 1...7 Energy)"
    changes.append((1502, 'description', 'gain 1 Energy for each enchantment on you (maximum 1...7 Energy)', 'gain 2 Energy for each enchantment on you (maximum 2...7 Energy)'))
    # Actual concise: "You gain 1 Energy (maximum 1...7) for each enchantment"
    changes.append((1502, 'concise', 'gain 1 Energy (maximum 1...7)', 'gain 2 Energy (maximum 2...7)'))

    # Dwayna's Touch (1528): heal 15...51...60 → 60, max 150 → 60...204...240
    # Actual: "healed for 15...60 Health for each Enchantment on you (maximum 150)"
    changes.append((1528, 'description', 'healed for 15...60 Health for each Enchantment on you (maximum 150)', 'healed for 60 Health for each Enchantment on you (maximum 60...240)'))
    # Actual concise: "Heals for 15...60 (maximum 150) for each enchantment"
    changes.append((1528, 'concise', 'Heals for 15...60 (maximum 150)', 'Heals for 60 (maximum 60...240)'))

    # Ebon Dust Aura (1760): earth damage 3...13...15 → 3...25...30
    changes.append((1760, 'description', '+3...15 earth damage', '+3...30 earth damage'))
    changes.append((1760, 'concise', '+3...15 earth damage', '+3...30 earth damage'))

    # Featherfoot Grace (1766): condition expiration 25% → 50%
    changes.append((1766, 'description', 'conditions expire 25% faster', 'conditions expire 50% faster'))
    changes.append((1766, 'concise', 'conditions expire 25% faster', 'conditions expire 50% faster'))

    # Grenth's Grasp (1756): conditions transferred 1 → 1...3...3
    changes.append((1756, 'description', 'transfer 1 condition', 'transfer 1...3 conditions'))
    changes.append((1756, 'concise', 'transfer 1 condition', 'transfer 1...3 conditions'))

    # Mystic Corruption (1755): duration 1...2...2 → 1...8...10
    # Actual: "suffer from Disease for 1...2 seconds"
    changes.append((1755, 'description', 'Disease for 1...2 seconds', 'Disease for 1...10 seconds'))
    # Actual concise: "are Diseased (1...2 seconds.)"
    changes.append((1755, 'concise', 'Diseased (1...2 seconds.)', 'Diseased (1...10 seconds.)'))

    # Pious Restoration (1529): hexes removed 1...2...2 → 1...3...3
    changes.append((1529, 'description', 'also lose 1...2 hexes', 'also lose 1...3 hexes'))
    changes.append((1529, 'concise', 'lose 1...2 hexes', 'lose 1...3 hexes'))

    # Signet of Pious Restraint (2014): "foes nearby your target" → "foes in the area of your target"
    # Actual: "all foes nearby your target are also Crippled"
    changes.append((2014, 'description', 'foes nearby your target are also Crippled', 'foes in the area of your target are also Crippled'))
    # Actual concise: "causes Cripple to foes nearby your target"
    changes.append((2014, 'concise', 'foes nearby your target', 'foes in the area of your target'))

    # Test of Faith (1545): cold damage 15...55...65 → 15...63...75
    changes.append((1545, 'description', '15...65 cold damage', '15...75 cold damage'))
    changes.append((1545, 'concise', '15...65 cold damage', '15...75 cold damage'))

    # ── PARAGON ──────────────────────────────────────────────────

    # Angelic Protection (1586): threshold 250...130...100 → 250...114...80
    changes.append((1586, 'description', 'more than 250...100 damage', 'more than 250...80 damage'))
    changes.append((1586, 'concise', 'damage over 250...100', 'damage over 250...80'))

    # Energizing Finale (1775): energy gain 1 → 1...2...2
    changes.append((1775, 'description', 'that ally gains 1 Energy', 'that ally gains 1...2 Energy'))
    changes.append((1775, 'concise', 'gains 1 Energy', 'gains 1...2 Energy'))

    # Hasty Refrain (2075): duration 3...9...11 → 3...13...15
    changes.append((2075, 'description', 'For 3...11 seconds', 'For 3...15 seconds'))
    changes.append((2075, 'concise', '(3...11 seconds.)', '(3...15 seconds.)'))

    # Inspirational Speech (2207): adrenaline gain 1...3...4 → 1...7...8
    changes.append((2207, 'description', 'gains 1...4 strikes of adrenaline', 'gains 1...8 strikes of adrenaline'))
    changes.append((2207, 'concise', 'gains 1...4 strikes', 'gains 1...8 strikes'))

    # Leader's Zeal (1583): energy gain 2 → 2...4...4 (per ally)
    # Actual: "you gain 2 Energy (maximum 8...12 Energy)"
    changes.append((1583, 'description', 'gain 2 Energy (maximum 8...12 Energy)', 'gain 2...4 Energy (maximum 8...12 Energy)'))
    # Actual concise: "gain 2 Energy (maximum 8...12 Energy)"
    changes.append((1583, 'concise', 'gain 2 Energy (maximum 8...12 Energy)', 'gain 2...4 Energy (maximum 8...12 Energy)'))

    # Song of Purification (1570): activations 1...3...3 → 1...5...6
    changes.append((1570, 'description', 'next 1...3 skills', 'next 1...6 skills'))
    changes.append((1570, 'concise', 'next 1...3 skills', 'next 1...6 skills'))

    # Apply all changes
    applied = 0
    failed = 0
    for skill_id, field, old_text, new_text in changes:
        key = str(skill_id)
        if key not in sd:
            print(f"  WARNING: Skill ID {skill_id} not found in skilldesc-en.json!")
            failed += 1
            continue

        entry = sd[key]
        if old_text not in entry[field]:
            print(f"  WARNING: [{skill_id} {entry['name']}] '{old_text}' not found in {field}")
            print(f"    Current {field}: {entry[field]}")
            failed += 1
            continue

        entry[field] = entry[field].replace(old_text, new_text, 1)
        print(f"  [{skill_id} {entry['name']}] {field}: '{old_text}' → '{new_text}'")
        applied += 1

    return applied, failed


def main():
    print("Loading skill data files...")
    skilldata = load_json(SKILLDATA_PATH)
    skilldesc = load_json(SKILLDESC_PATH)

    print(f"\n{'='*60}")
    print("APPLYING MECHANICAL CHANGES (skilldata.json)")
    print(f"{'='*60}")
    mech_count = apply_mechanical_changes(skilldata)
    print(f"\nApplied {mech_count} mechanical changes.")

    print(f"\n{'='*60}")
    print("APPLYING DESCRIPTION CHANGES (skilldesc-en.json)")
    print(f"{'='*60}")
    desc_applied, desc_failed = apply_description_changes(skilldesc)
    print(f"\nApplied {desc_applied} description changes, {desc_failed} failures.")

    if desc_failed > 0:
        print(f"\n*** {desc_failed} CHANGES FAILED - review warnings above ***")
        sys.exit(1)

    print("\nSaving updated files...")
    save_json(SKILLDATA_PATH, skilldata)
    save_json(SKILLDESC_PATH, skilldesc)
    print("Done!")


if __name__ == '__main__':
    main()
