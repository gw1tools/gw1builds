/**
 * @fileoverview TipTap Slash Command Extension
 * @module components/editor/slash-command-extension
 *
 * Notion-style slash commands for quick block insertion
 * Triggered by / at the start of a line or after a space
 */

import { Extension, type Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { CommandList, type CommandItem } from './command-list'

export interface SlashCommandOptions {
  suggestion: Omit<SuggestionOptions, 'editor'>
}

/**
 * Available slash commands
 */
export const slashCommands: CommandItem[] = [
  {
    id: 'heading1',
    label: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 1 }).run()
    },
  },
  {
    id: 'heading2',
    label: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: (editor: Editor) => {
      editor.chain().focus().toggleHeading({ level: 2 }).run()
    },
  },
  {
    id: 'bullet',
    label: 'Bullet List',
    description: 'Create a bullet list',
    icon: 'List',
    command: (editor: Editor) => {
      editor.chain().focus().toggleBulletList().run()
    },
  },
  {
    id: 'numbered',
    label: 'Numbered List',
    description: 'Create a numbered list',
    icon: 'ListOrdered',
    command: (editor: Editor) => {
      editor.chain().focus().toggleOrderedList().run()
    },
  },
  {
    id: 'quote',
    label: 'Quote',
    description: 'Add a blockquote',
    icon: 'Quote',
    command: (editor: Editor) => {
      editor.chain().focus().toggleBlockquote().run()
    },
  },
  {
    id: 'divider',
    label: 'Divider',
    description: 'Add a horizontal line',
    icon: 'Minus',
    command: (editor: Editor) => {
      editor.chain().focus().setHorizontalRule().run()
    },
  },
]

/**
 * Filter commands based on query
 */
function filterCommands(query: string): CommandItem[] {
  if (!query) return slashCommands

  const lowerQuery = query.toLowerCase()
  return slashCommands.filter(
    cmd =>
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.id.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Slash Command Extension
 * Type / to open command palette
 */
export const SlashCommand = Extension.create<SlashCommandOptions>({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        pluginKey: new PluginKey('slashCommand'),
        // Only trigger at start of line or after whitespace
        allowSpaces: false,
        startOfLine: false,
        items: ({ query }: { query: string }) => {
          return filterCommands(query)
        },
        // Delete the slash and query text, then execute the command
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor
          range: { from: number; to: number }
          props: CommandItem
        }) => {
          // Delete the "/" and any query text
          editor.chain().focus().deleteRange(range).run()
          // Execute the command
          props.command(editor)
        },
        render: () => {
          let component: ReactRenderer | null = null
          let popup: TippyInstance[] | null = null

          return {
            onStart: (props: unknown) => {
              component = new ReactRenderer(CommandList, {
                props: props as Record<string, unknown>,
                editor: (props as { editor: Editor }).editor,
              })

              if (
                !props ||
                !(props as { clientRect: () => DOMRect }).clientRect
              ) {
                return
              }

              popup = tippy('body', {
                getReferenceClientRect: (props as { clientRect: () => DOMRect })
                  .clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                theme: 'gw1',
                maxWidth: 320,
              })
            },

            onUpdate(props: unknown) {
              component?.updateProps(props as Record<string, unknown>)

              if (
                !props ||
                !(props as { clientRect: () => DOMRect }).clientRect
              ) {
                return
              }

              popup?.[0]?.setProps({
                getReferenceClientRect: (props as { clientRect: () => DOMRect })
                  .clientRect,
              })
            },

            onKeyDown(props: { event: KeyboardEvent }) {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide()
                return true
              }

              return (
                (
                  component?.ref as {
                    onKeyDown?: (props: { event: KeyboardEvent }) => boolean
                  }
                )?.onKeyDown?.(props) ?? false
              )
            },

            onExit() {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
      },
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})
