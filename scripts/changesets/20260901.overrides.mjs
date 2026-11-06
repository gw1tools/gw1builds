/**
 * Manual overrides for the September 1, 2026 changeset — fixes on top of Aug 26.
 * Mirage Cloak text is the wiki infobox text (rendered).
 */
export default {
  832: { note: 'corpse-pool bug fix; no data change' },
  898: { note: 'AoE targeting bug fix; text unchanged' },
  979: { note: 'AoE targeting bug fix; text unchanged' },
  909: { data: { activation: 0 }, note: 'errant 4s cast time from Aug 26 removed' },
  1339: { note: 'recharge 15 -> 10, duration 1...31 -> 6...40 (did not land Aug 26)' },
  1500: {
    description:
      'For 20 seconds, you have a 40% chance to block and an extra 4...10% for each additional enchantment (max 80%). All nearby foes are struck for 10...40 earth damage each time a Dervish enchantment is removed from you.',
    concise:
      '(20 seconds.) 40% chance to block and an extra 4...10% for each additional enchantment. 10...40 earth damage to nearby foes when you lose a Dervish enchantment.',
    note: 'extra block per enchantment 10% -> 4...10%, only Dervish enchantments trigger damage (wiki text)',
  },
  3461: { note: 'description typo fix; our text already uses the fixed wording' },
}
