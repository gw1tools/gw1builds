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
  /** Search query to highlight in the description */
  highlightQuery?: string
}

/** Splits text by search query and returns fragments with highlighted matches */
function highlightText(text: string, query: string): React.ReactNode {
  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let index = lowerText.indexOf(lowerQuery)
  let keyCounter = 0

  while (index !== -1) {
    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index))
    }
    parts.push(
      <mark key={keyCounter++} className="bg-accent-gold/30 text-text-primary rounded">
        {text.slice(index, index + query.length)}
      </mark>
    )
    lastIndex = index + query.length
    index = lowerText.indexOf(lowerQuery, lastIndex)
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

/**
 * Renders a skill description with calculated values based on attribute level.
 * Ranges like "82...172" are replaced with the calculated value and styled in blue.
 */
export const ScaledDescription = memo(function ScaledDescription({
  description,
  attributeLevel,
  className,
  highlightQuery,
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
          <span key={index}>
            {highlightQuery ? highlightText(segment.value, highlightQuery) : segment.value}
          </span>
        )
      )}
    </span>
  )
})
