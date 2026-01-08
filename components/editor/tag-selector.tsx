/**
 * @fileoverview Tag Selector Component
 * @module components/editor/tag-selector
 *
 * Autocomplete tag input with:
 * - Predefined tags from TAGS constant
 * - Selected tags as removable pills
 * - Filter as user types
 * - Keyboard navigation
 */

'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag as TagIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ALL_TAGS, type Tag } from '@/lib/constants'
import { dropdownVariants } from '@/lib/motion'

export interface TagSelectorProps {
  selected: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  label?: string
  placeholder?: string
  className?: string
}

/**
 * Tag selector with autocomplete dropdown
 * Shows predefined tags, allows selection/removal
 *
 * @example
 * <TagSelector
 *   selected={tags}
 *   onChange={setTags}
 *   maxTags={10}
 * />
 */
export function TagSelector({
  selected,
  onChange,
  maxTags = 10,
  label = 'Tags',
  placeholder = 'Add tags...',
  className,
}: TagSelectorProps) {
  const [input, setInput] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter available tags (not already selected, matches input)
  const availableTags = ALL_TAGS.filter(
    tag =>
      !selected.includes(tag) && tag.toLowerCase().includes(input.toLowerCase())
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset focused index when available tags change
  useEffect(() => {
    setFocusedIndex(0)
  }, [availableTags.length])

  const handleAddTag = (tag: string) => {
    if (selected.length < maxTags && !selected.includes(tag)) {
      onChange([...selected, tag])
      setInput('')
      setIsOpen(false)
      inputRef.current?.focus()
    }
  }

  const handleRemoveTag = (tag: string) => {
    onChange(selected.filter(t => t !== tag))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(prev => (prev + 1) % availableTags.length)
      setIsOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(
        prev => (prev - 1 + availableTags.length) % availableTags.length
      )
      setIsOpen(true)
    } else if (e.key === 'Enter' && availableTags.length > 0) {
      e.preventDefault()
      handleAddTag(availableTags[focusedIndex])
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    } else if (e.key === 'Backspace' && input === '' && selected.length > 0) {
      // Remove last tag if input is empty
      handleRemoveTag(selected[selected.length - 1])
    }
  }

  const atMaxTags = selected.length >= maxTags

  return (
    <div className={cn('w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          {label}
        </label>
      )}

      {/* Input Container */}
      <div
        className={cn(
          'min-h-11 px-3 py-2.5 rounded-lg',
          'bg-bg-primary border border-border',
          'transition-colors duration-150',
          'hover:border-border-hover',
          isOpen && 'border-accent-gold',
          atMaxTags && 'opacity-50'
        )}
      >
        {/* Selected Tags */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            <AnimatePresence>
              {selected.map(tag => (
                <motion.div
                  key={tag}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <TagPill tag={tag} onRemove={() => handleRemoveTag(tag)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Input */}
        <div className="flex items-center gap-2">
          <TagIcon className="w-4 h-4 text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={atMaxTags ? 'Max tags reached' : placeholder}
            disabled={atMaxTags}
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-muted outline-none disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && availableTags.length > 0 && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative z-50"
          >
            <div className="absolute top-2 left-0 right-0 bg-bg-primary border border-border rounded-lg shadow-xl py-1.5 max-h-[240px] overflow-y-auto">
              {availableTags.map((tag, index) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAddTag(tag)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm transition-colors',
                    index === focusedIndex
                      ? 'bg-bg-hover text-text-primary'
                      : 'text-text-secondary hover:bg-bg-card'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper text - only show when approaching limit */}
      {selected.length >= maxTags - 2 && (
        <p className="mt-1.5 text-sm text-text-muted">
          {selected.length}/{maxTags} tags
        </p>
      )}
    </div>
  )
}

/**
 * Tag pill with remove button
 */
interface TagPillProps {
  tag: string
  onRemove: () => void
}

function TagPill({ tag, onRemove }: TagPillProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bg-card border border-border rounded-md text-sm text-text-primary">
      <span>{tag}</span>
      <button
        type="button"
        onClick={onRemove}
        className="hover:text-accent-red transition-colors"
        aria-label={`Remove ${tag}`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
