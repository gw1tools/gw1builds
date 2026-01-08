'use client'

import { cn } from '@/lib/utils'

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

interface ProfessionSpinnerProps {
  size?: SpinnerSize
  className?: string
}

const sizeMap: Record<SpinnerSize, { container: number; dot: number }> = {
  sm: { container: 20, dot: 4 },
  md: { container: 32, dot: 6 },
  lg: { container: 48, dot: 8 },
  xl: { container: 72, dot: 12 },
}

// Profession colors referencing CSS variables from globals.css
const professionColors = [
  'var(--color-warrior)',
  'var(--color-paragon)',
  'var(--color-elementalist)',
  'var(--color-assassin)',
  'var(--color-mesmer)',
  'var(--color-dervish)',
  'var(--color-monk)',
  'var(--color-ritualist)',
  'var(--color-necromancer)',
  'var(--color-ranger)',
]

export function ProfessionSpinner({
  size = 'md',
  className,
}: ProfessionSpinnerProps) {
  const { container, dot } = sizeMap[size]
  const radius = (container - dot) / 2

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('animate-profession-spin', className)}
      style={{
        width: container,
        height: container,
        position: 'relative',
      }}
    >
      {professionColors.map((color, i) => {
        const angle = (i / professionColors.length) * 2 * Math.PI - Math.PI / 2
        const x = Math.cos(angle) * radius + radius
        const y = Math.sin(angle) * radius + radius

        return (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: dot,
              height: dot,
              backgroundColor: color,
              left: x,
              top: y,
            }}
            aria-hidden="true"
          />
        )
      })}
      <span className="sr-only">Loading...</span>
    </div>
  )
}

export default ProfessionSpinner
