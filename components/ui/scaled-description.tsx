'use client'

import { useMemo, memo } from 'react'
import { parseSkillDescription } from '@/lib/gw/skill-scaling'

interface ScaledDescriptionProps {
  /** Raw skill description with ranges (e.g., "82...172 Health") */
  description: string
  /** Current attribute level (0-20) */
  attributeLevel: number
  /** Additional CSS classes */
  className?: string
}

/**
 * Renders a skill description with calculated values based on attribute level.
 * Ranges like "82...172" are replaced with the calculated value and styled in blue.
 */
export const ScaledDescription = memo(function ScaledDescription({
  description,
  attributeLevel,
  className,
}: ScaledDescriptionProps) {
  const segments = useMemo(
    () => (description ? parseSkillDescription(description, attributeLevel) : []),
    [description, attributeLevel]
  )

  if (segments.length === 0) {
    return null
  }

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.type === 'scaled' ? (
          <span key={index} className="text-accent-blue font-medium">
            {segment.value}
          </span>
        ) : (
          <span key={index}>{segment.value}</span>
        )
      )}
    </span>
  )
})
