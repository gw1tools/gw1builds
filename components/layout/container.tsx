'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const containerSizes = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  full: 'max-w-full',
}

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Maximum width */
  size?: keyof typeof containerSizes
  /** Center content horizontally */
  centered?: boolean
  /** Add vertical padding */
  padY?: boolean
}

/**
 * Centered content container with max-width
 *
 * @example
 * <Container>Page content</Container>
 * <Container size="sm" centered>Narrow content</Container>
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  (
    {
      className,
      size = 'lg',
      centered = true,
      padY = false,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'w-full px-4',
          containerSizes[size],
          centered && 'mx-auto',
          padY && 'py-8',
          className
        )}
        {...props}
      />
    )
  }
)

Container.displayName = 'Container'
