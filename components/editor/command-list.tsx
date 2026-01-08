/**
 * @fileoverview Slash Command List Component
 * @module components/editor/command-list
 *
 * Dropdown menu for slash commands
 * Supports keyboard navigation (arrows, enter, escape)
 */

'use client'

import {
  forwardRef,
  memo,
  useImperativeHandle,
  useState,
} from 'react'
import {
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Minus,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Editor } from '@tiptap/core'

// Editor type is used in CommandItem.command signature
export interface CommandItem {
  id: string
  label: string
  description: string
  icon: string
  command: (editor: Editor) => void
}

export interface CommandListProps {
  items: CommandItem[]
  command: (item: CommandItem) => void
}

export interface CommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

/**
 * Map icon string to Lucide component
 */
const iconMap: Record<string, LucideIcon> = {
  H1: Heading1,
  H2: Heading2,
  List: List,
  ListOrdered: ListOrdered,
  Quote: Quote,
  Minus: Minus,
}

/**
 * Single command item - memoized for performance
 */
const CommandItemButton = memo(function CommandItemButton({
  item,
  isSelected,
  onSelect,
}: {
  item: CommandItem
  isSelected: boolean
  onSelect: () => void
}) {
  const IconComponent = iconMap[item.icon]

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      id={`cmd-${item.id}`}
      onClick={onSelect}
      className={cn(
        'w-full px-3 py-2 text-left transition-colors',
        'flex items-center gap-3',
        isSelected ? 'bg-bg-hover' : 'hover:bg-bg-card'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'w-8 h-8 flex-shrink-0 rounded',
          'bg-bg-card border border-border',
          'flex items-center justify-center',
          isSelected && 'border-accent-gold bg-accent-gold/10'
        )}
      >
        {IconComponent && (
          <IconComponent
            className={cn(
              'w-4 h-4',
              isSelected ? 'text-accent-gold' : 'text-text-muted'
            )}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'font-medium text-sm',
            isSelected ? 'text-text-primary' : 'text-text-secondary'
          )}
        >
          {item.label}
        </div>
        <div className="text-xs text-text-muted truncate">
          {item.description}
        </div>
      </div>
    </button>
  )
})

/**
 * Command list dropdown for slash commands
 */
export const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    // Ensure selected index is always valid (clamp to items length)
    const safeSelectedIndex =
      items.length === 0 ? 0 : Math.min(selectedIndex, items.length - 1)

    const selectItem = (index: number) => {
      const item = items[index]
      if (item) {
        // Pass item to suggestion command handler (which deletes "/" and executes)
        command(item)
      }
    }

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(prev =>
            items.length === 0 ? 0 : (prev + items.length - 1) % items.length
          )
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex(prev =>
            items.length === 0 ? 0 : (prev + 1) % items.length
          )
          return true
        }

        if (event.key === 'Enter') {
          selectItem(safeSelectedIndex)
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div
          className="bg-bg-primary border border-border rounded-lg shadow-xl p-3 min-w-[240px]"
          role="listbox"
          aria-label="Slash commands"
        >
          <div className="text-sm text-text-muted text-center">
            No commands found
          </div>
        </div>
      )
    }

    return (
      <div
        className="bg-bg-primary border border-border rounded-lg shadow-xl py-1.5 min-w-[240px] max-w-[300px] max-h-[320px] overflow-y-auto"
        role="listbox"
        aria-label="Slash commands"
        aria-activedescendant={items[safeSelectedIndex] ? `cmd-${items[safeSelectedIndex].id}` : undefined}
      >
        <div className="px-3 py-1.5 text-xs font-medium text-text-muted uppercase tracking-wider">
          Commands
        </div>
        {items.map((item, index) => (
          <CommandItemButton
            key={item.id}
            item={item}
            isSelected={index === safeSelectedIndex}
            onSelect={() => selectItem(index)}
          />
        ))}
      </div>
    )
  }
)

CommandList.displayName = 'CommandList'
