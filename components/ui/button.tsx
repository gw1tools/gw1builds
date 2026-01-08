'use client'

import { forwardRef } from 'react'
import Link from 'next/link'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { hoverLiftVariants } from '@/lib/motion'

const MotionLink = motion.create(Link)

/**
 * Button variants with sticky-note shadow effect
 */
const buttonVariants = {
  primary:
    'bg-accent-gold text-bg-primary hover:bg-accent-gold-bright border-transparent',
  secondary:
    'bg-bg-card text-text-primary hover:bg-bg-hover border-border hover:border-border-hover',
  ghost:
    'bg-bg-card/30 text-text-secondary hover:text-text-primary hover:bg-bg-card border-border/30 hover:border-border',
  danger: 'bg-accent-red text-white hover:brightness-110 border-transparent',
  gold: 'bg-transparent text-accent-gold hover:bg-accent-gold/10 border-accent-gold-dim hover:border-accent-gold',
}

const buttonSizes = {
  sm: 'h-7 min-h-7 px-2 text-xs gap-1 sm:h-8 sm:min-h-8 sm:px-3 sm:text-sm sm:gap-1.5',
  md: 'h-8 min-h-8 px-2.5 text-xs gap-1.5 sm:h-10 sm:min-h-10 sm:px-4 sm:text-sm sm:gap-2',
  lg: 'h-12 min-h-12 px-4 text-sm gap-2 sm:px-6 sm:text-base',
}

export interface ButtonProps extends Omit<
  HTMLMotionProps<'button'>,
  'children'
> {
  variant?: keyof typeof buttonVariants
  size?: keyof typeof buttonSizes
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
  /** Disable the hover lift animation */
  noLift?: boolean
  /** When provided, renders as a Next.js Link instead of button */
  href?: string
}

/**
 * Button component with sticky-note shadow and hover lift effect
 *
 * @example
 * <Button variant="primary">Create Build</Button>
 * <Button variant="secondary" leftIcon={<Copy />}>Copy</Button>
 * <Button variant="ghost" size="sm" isLoading>Loading</Button>
 * <Button href="/new" variant="primary">Link Button</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      noLift = false,
      href,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    const sharedClassName = cn(
      // Base styles
      'relative inline-flex items-center justify-center',
      'font-medium rounded-lg border whitespace-nowrap',
      'transition-colors cursor-pointer',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary',
      // Shadow (only on non-ghost variants)
      variant !== 'ghost' && 'shadow-sticky',
      // Variant styles
      buttonVariants[variant],
      // Size styles
      buttonSizes[size],
      // Disabled styles
      isDisabled && 'opacity-50 !cursor-not-allowed',
      className
    )

    const content = (
      <>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && (
          <span className="shrink-0 inline-flex items-center justify-center">
            {leftIcon}
          </span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && (
          <span className="shrink-0 inline-flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </>
    )

    // Render as Link when href is provided
    if (href) {
      return (
        <MotionLink
          href={href}
          variants={noLift ? undefined : hoverLiftVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className={sharedClassName}
        >
          {content}
        </MotionLink>
      )
    }

    return (
      <motion.button
        ref={ref}
        variants={noLift ? undefined : hoverLiftVariants}
        initial="rest"
        whileHover={isDisabled ? undefined : 'hover'}
        whileTap={isDisabled ? undefined : 'tap'}
        disabled={isDisabled}
        className={sharedClassName}
        {...props}
      >
        {content}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
