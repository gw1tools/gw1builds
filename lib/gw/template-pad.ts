/**
 * @fileoverview Bit-width fix for @buildwars/gw-templates encoders
 * @module lib/gw/template-pad
 *
 * The library's getPadSize() grows the field width by at most one bit per
 * id it sees. A single id that needs two or more extra bits (e.g. skill
 * 2420 needs 12 bits, the minimum is 10) is then written truncated and
 * every later field shifts, producing a template whose remaining skills
 * are garbage. Every skill id >= 2048 (Nightfall, EotN, PvP versions) can
 * trigger it unless another big id happens to bump the width first.
 *
 * @see https://wiki.guildwars.com/wiki/Skill_template_format
 */

type PadSizeTemplate = {
  getPadSize: (nums: number[], minPad: number) => number
}

/**
 * Patches an encoder instance so ids are written with the bit length of the
 * largest id (never below the format minimum).
 */
export function withCorrectPadSize<T extends object>(template: T): T {
  ;(template as unknown as PadSizeTemplate).getPadSize = (nums, minPad) =>
    Math.max(
      minPad,
      ...nums.map(n => (Math.trunc(Number(n)) || 0).toString(2).length)
    )
  return template
}
