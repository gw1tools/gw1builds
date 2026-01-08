/**
 * @fileoverview Floating skill icons background decoration
 * @module components/layout/floating-skills-background
 *
 * Decorative background with scattered GW1 skill icons.
 * Static (no animation) with opacity and transforms for depth.
 */

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { getSkillIconUrlById } from '@/lib/gw/icons'

// Verified skill IDs from skilldata.json - mix of professions
// Warrior (1), Ranger (2), Monk (3), Necro (4), Mesmer (5), Ele (6), Assassin (7), Rit (8), Paragon (9), Dervish (10)
const BACKGROUND_SKILL_IDS = [
  // Warrior
  1, 316, 317, 318,
  // Ranger
  391, 392, 393, 394,
  // Monk
  240, 241, 242, 243,
  // Necromancer
  83, 84, 85, 86,
  // Mesmer
  5, 6, 7, 8,
  // Elementalist
  160, 162, 163, 164,
  // Assassin
  570, 571, 572, 769,
  // Ritualist
  772, 773, 787, 788,
  // Paragon
  1546, 1547, 1548, 1549,
  // Dervish
  1483, 1484, 1485, 1486,
]

// Pre-defined positions for skill icons (percentage-based)
// Fewer, smaller icons scattered in center area
const SKILL_POSITIONS = [
  // Hero area - more centered
  { x: 15, y: 12, rotate: -8, scale: 0.45, opacity: 0.12 },
  { x: 82, y: 10, rotate: 12, scale: 0.4, opacity: 0.1 },
  { x: 12, y: 24, rotate: 5, scale: 0.35, opacity: 0.08 },
  { x: 85, y: 22, rotate: -10, scale: 0.4, opacity: 0.09 },

  // Background - more centered
  { x: 18, y: 48, rotate: -15, scale: 0.35, opacity: 0.06 },
  { x: 80, y: 52, rotate: 8, scale: 0.3, opacity: 0.05 },
  { x: 14, y: 75, rotate: 12, scale: 0.3, opacity: 0.04 },
  { x: 84, y: 80, rotate: -5, scale: 0.35, opacity: 0.05 },
]

interface FloatingSkillsBackgroundProps {
  className?: string
}

/**
 * Decorative background with floating skill icons
 *
 * Renders scattered skill icons with varying opacity, rotation, and scale
 * to create depth. Static (no animation) for performance.
 *
 * Icons are concentrated around the hero area (top) with higher opacity,
 * and scattered throughout the background with lower opacity.
 *
 * @example
 * <FloatingSkillsBackground />
 */
export function FloatingSkillsBackground({
  className,
}: FloatingSkillsBackgroundProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none overflow-hidden z-0',
        className
      )}
      aria-hidden="true"
    >
      {SKILL_POSITIONS.map((pos, index) => {
        const skillId =
          BACKGROUND_SKILL_IDS[index % BACKGROUND_SKILL_IDS.length]
        const iconUrl = getSkillIconUrlById(skillId)

        return (
          <div
            key={index}
            className="absolute w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `rotate(${pos.rotate}deg) scale(${pos.scale})`,
              opacity: pos.opacity,
            }}
          >
            <Image
              src={iconUrl}
              alt=""
              width={80}
              height={80}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        )
      })}
    </div>
  )
}
