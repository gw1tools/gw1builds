#!/usr/bin/env python3
"""
Apply PvP-specific changes from the February 5, 2026 GW1 balance patch.
These are stored under split_id entries in the data files.

Source: https://wiki.guildwars.com/wiki/Feedback:Game_updates/20260205
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

def main():
    print("Loading skill data files...")
    skilldata = load_json(SKILLDATA_PATH)
    skilldesc = load_json(SKILLDESC_PATH)
    sd = skilldata['skilldata']
    dd = skilldesc['skilldesc']

    mech_applied = 0
    desc_applied = 0
    failed = 0

    # ── MECHANICAL CHANGES (skilldata.json) ──────────────────────

    mech_changes = {
        # Fevered Dreams (PvP) - ID 3289: energy 10→5, activation 2→1
        3289: {'energy': 5, 'activation': 1},
        # Slippery Ground (PvP) - ID 3398: recharge 20→15
        3398: {'recharge': 15},
        # Restoration (PvP) - ID 3018: activation 5→3
        3018: {'activation': 3},
        # Signet of Pious Restraint (PvP) - ID 3273: recharge 20→10
        3273: {'recharge': 10},
    }

    print("\n=== MECHANICAL CHANGES (PvP entries) ===")
    for skill_id, updates in mech_changes.items():
        key = str(skill_id)
        if key not in sd:
            print(f"  WARNING: ID {skill_id} not found!")
            failed += 1
            continue
        for field, new_val in updates.items():
            old_val = sd[key][field]
            sd[key][field] = new_val
            print(f"  [{skill_id}] {field}: {old_val} → {new_val}")
            mech_applied += 1

    # ── DESCRIPTION CHANGES (skilldesc-en.json) ──────────────────

    desc_changes = []

    # Smiter's Boon (PvP) - ID 2895: duration 5→4 seconds
    desc_changes.append((2895, 'description', 'For 5 seconds', 'For 4 seconds'))
    desc_changes.append((2895, 'concise', '(5 seconds.)', '(4 seconds.)'))

    # Mantra of Signets (PvP) - ID 3179: add "+3 armor per signet" (match PvE)
    # Current PvP: "For 10...40 seconds, whenever you use a signet, you gain 5...60 Health."
    # New PvP (match PvE): "For 10...40 seconds, you have +3 armor for each signet you have equipped. Whenever you use a signet you gain 5...60 Health."
    desc_changes.append((3179, 'description',
        'For 10...40 seconds, whenever you use a signet, you gain 5...60 Health.',
        'For 10...40 seconds, you have +3 armor for each signet you have equipped. Whenever you use a signet you gain 5...60 Health.'))
    # Current PvP concise: "(10...40 seconds.) You gain 5...60 Health each time you use a signet."
    # New: "(10...40 seconds.) You have +3 armor for each signet. You gain 5...60 Health each time you use a signet."
    desc_changes.append((3179, 'concise',
        '(10...40 seconds.) You gain 5...60 Health each time you use a signet.',
        '(10...40 seconds.) You have +3 armor for each signet. You gain 5...60 Health each time you use a signet.'))

    # Shared Burden (PvP) - ID 3186: "nearby" → "area"
    desc_changes.append((3186, 'description', 'all nearby foes attack', 'all foes in the area attack'))
    desc_changes.append((3186, 'concise', 'foes near your target', 'foes in the area of your target'))

    # Ether Renewal (PvP) - ID 2860: duration 7→10 seconds
    desc_changes.append((2860, 'description', 'For 7 seconds', 'For 10 seconds'))
    desc_changes.append((2860, 'concise', '(7 seconds.)', '(10 seconds.)'))

    # Mind Freeze (PvP) - ID 2803: conditional damage 10...34...40 → 10...50...60
    # desc rank15: 40→60
    desc_changes.append((2803, 'description', 'additional 10...40 cold damage', 'additional 10...60 cold damage'))
    desc_changes.append((2803, 'concise', '+10...40 cold damage', '+10...60 cold damage'))

    # Signet of Pious Restraint (PvP) - ID 3273: no description text change
    # (only recharge change, which is mechanical)

    # Fevered Dreams (PvP) - ID 3289: no description text change
    # (only energy/activation changes, which are mechanical)

    # Slippery Ground (PvP) - ID 3398: no description text change
    # (only recharge change, which is mechanical)

    # Restoration (PvP) - ID 3018: no description text change
    # (only activation change, which is mechanical)

    print("\n=== DESCRIPTION CHANGES (PvP entries) ===")
    for skill_id, field, old_text, new_text in desc_changes:
        key = str(skill_id)
        if key not in dd:
            print(f"  WARNING: ID {skill_id} not found in skilldesc!")
            failed += 1
            continue
        entry = dd[key]
        if old_text not in entry[field]:
            print(f"  WARNING: [{skill_id} {entry['name']}] '{old_text}' not found in {field}")
            print(f"    Current: {entry[field]}")
            failed += 1
            continue
        entry[field] = entry[field].replace(old_text, new_text, 1)
        print(f"  [{skill_id} {entry['name']}] {field}: '{old_text}' → '{new_text}'")
        desc_applied += 1

    print(f"\nApplied {mech_applied} mechanical + {desc_applied} description changes, {failed} failures.")

    if failed > 0:
        print(f"\n*** {failed} CHANGES FAILED ***")
        sys.exit(1)

    print("\nSaving updated files...")
    save_json(SKILLDATA_PATH, skilldata)
    save_json(SKILLDESC_PATH, skilldesc)
    print("Done!")

if __name__ == '__main__':
    main()
