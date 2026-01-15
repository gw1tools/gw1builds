import Image from 'next/image'
import { cn } from '@/lib/utils'

export type CostType =
  | 'energy'
  | 'adrenaline'
  | 'activation'
  | 'recharge'
  | 'sacrifice'
  | 'upkeep'
  | 'overcast'

const COST_ICONS: Record<CostType, string> = {
  energy: '/icons/tango-energy.png',
  adrenaline: '/icons/tango-adrenaline.png',
  activation: '/icons/tango-activation.png',
  recharge: '/icons/tango-recharge.png',
  sacrifice: '/icons/tango-sacrifice.png',
  upkeep: '/icons/tango-upkeep.png',
  overcast: '/icons/tango-overcast.png',
}

const SIZE_MAP = {
  sm: 14,
  md: 16,
} as const

export interface CostStatProps {
  type: CostType
  value: number
  /** Show unit suffix (s for seconds, % for sacrifice) */
  showUnit?: boolean
  /** Icon size */
  size?: keyof typeof SIZE_MAP
  className?: string
}

/**
 * Renders a cost value with icon: "value [icon]"
 *
 * Normalizes cost display across the app with consistent
 * "number left, icon right" layout.
 *
 * @example
 * <CostStat type="energy" value={10} />
 * <CostStat type="activation" value={1.5} showUnit />
 * <CostStat type="sacrifice" value={10} showUnit />
 */
export function CostStat({
  type,
  value,
  showUnit = false,
  size = 'md',
  className,
}: CostStatProps) {
  const iconSize = SIZE_MAP[size]
  const iconSrc = COST_ICONS[type]

  // Format value with appropriate unit
  const formatValue = () => {
    let formatted = String(value)

    if (showUnit) {
      if (type === 'activation' || type === 'recharge') {
        formatted += 's'
      } else if (type === 'sacrifice') {
        formatted += '%'
      }
    }

    return formatted
  }

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span className="tabular-nums">{formatValue()}</span>
      <Image
        src={iconSrc}
        alt=""
        width={iconSize}
        height={iconSize}
        className="shrink-0 opacity-75"
        unoptimized
      />
    </span>
  )
}
