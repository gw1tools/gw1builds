'use client'

import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { copySuccessVariants } from '@/lib/motion'
import { Button } from './button'
import { IconButton } from './icon-button'

export interface TemplateCodeProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The GW1 template code string */
  code: string
  /** Show copy button */
  showCopy?: boolean
  /** Label above the code */
  label?: string
  /** Callback after successful copy */
  onCopy?: () => void
}

/**
 * Template code display with one-click copy
 *
 * @example
 * <TemplateCode code="OQhkAqCalIPvQLDBbSXjHOgbNA" />
 * <TemplateCode code={code} label="Template Code" onCopy={handleCopy} />
 */
export const TemplateCode = forwardRef<HTMLDivElement, TemplateCodeProps>(
  ({ className, code, showCopy = true, label, onCopy, ...props }, ref) => {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(code)
        setCopied(true)
        onCopy?.()
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {label && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
              {label}
            </span>
          </div>
        )}
        <div className="flex gap-2">
          <code
            className={cn(
              'flex-1 px-3 py-2 rounded-lg',
              'font-mono text-sm text-text-primary',
              'bg-bg-primary border border-dashed border-border',
              'select-all break-words overflow-x-auto',
              'transition-colors hover:border-border-hover'
            )}
          >
            {code}
          </code>
          {showCopy && (
            <motion.div
              variants={copySuccessVariants}
              animate={copied ? 'success' : 'idle'}
            >
              <IconButton
                icon={
                  copied ? <Check className="text-accent-green" /> : <Copy />
                }
                aria-label={copied ? 'Copied!' : 'Copy template'}
                variant={copied ? 'gold' : 'default'}
                onClick={handleCopy}
                noLift={copied}
              />
            </motion.div>
          )}
        </div>
      </div>
    )
  }
)

TemplateCode.displayName = 'TemplateCode'

/**
 * Multiple template codes (for team builds)
 */
export interface TemplateCodeListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of template codes */
  codes: { code: string; label?: string }[]
  /** Callback when all codes are copied */
  onCopyAll?: () => void
}

export const TemplateCodeList = forwardRef<
  HTMLDivElement,
  TemplateCodeListProps
>(({ className, codes, onCopyAll, ...props }, ref) => {
  const [copiedAll, setCopiedAll] = useState(false)

  const handleCopyAll = async () => {
    try {
      const allCodes = codes.map(c => c.code).join('\n')
      await navigator.clipboard.writeText(allCodes)
      setCopiedAll(true)
      onCopyAll?.()
      setTimeout(() => setCopiedAll(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">
          Template Codes ({codes.length})
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopyAll}
          leftIcon={
            copiedAll ? (
              <Check className="w-3 h-3" />
            ) : (
              <Copy className="w-3 h-3" />
            )
          }
          className={copiedAll ? 'text-accent-green' : undefined}
          noLift
        >
          {copiedAll ? 'Copied!' : 'Copy All'}
        </Button>
      </div>
      {codes.map((item, index) => (
        <TemplateCode
          key={index}
          code={item.code}
          label={item.label || `Build ${index + 1}`}
        />
      ))}
    </div>
  )
})

TemplateCodeList.displayName = 'TemplateCodeList'
