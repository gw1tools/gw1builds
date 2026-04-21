import { Diamond } from 'lucide-react'
import { cn } from '@/lib/utils'

const sizes = {
  sm: 'text-lg gap-1',
  md: 'text-2xl gap-1.5',
  lg: 'text-4xl gap-2',
}

const iconSizes = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-4 w-4',
}

/**
 * GW1 Tactics brand mark — ported from echo-wars-tactics/web/src/components/ui/logo.tsx.
 * Uses lucide's Diamond (gw1builds already depends on lucide; Phosphor would be a new dep).
 */
export function TacticsLogo({
  size = 'md',
  className,
}: {
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center font-bold tracking-tight',
        sizes[size],
        className
      )}
      aria-label="GW1 Tactics"
    >
      <span className="text-accent-gold">GW1</span>
      <Diamond
        className={cn('text-accent-gold fill-accent-gold', iconSizes[size])}
        aria-hidden="true"
      />
      <span className="text-text-primary">Tactics</span>
    </div>
  )
}
