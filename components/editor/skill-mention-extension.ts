/**
 * @fileoverview TipTap Skill Mention Extension
 * @module components/editor/skill-mention-extension
 *
 * Custom mention extension for GW1 skills
 * Triggered by [[ and searches skills via searchSkills()
 */

import { Node, mergeAttributes, type Editor } from '@tiptap/core'
import { ReactRenderer } from '@tiptap/react'
import { PluginKey } from '@tiptap/pm/state'
import Mention from '@tiptap/extension-mention'
import tippy, { type Instance as TippyInstance } from 'tippy.js'
import { searchSkills, type Skill } from '@/lib/gw/skills'
import { MentionList } from './mention-list'

export interface SkillMentionOptions {
  HTMLAttributes: Record<string, unknown>
  renderLabel: (props: { node: { attrs: Record<string, unknown> } }) => string
  suggestion: {
    char: string
    pluginKey: PluginKey
    items: (props: { query: string }) => Promise<Skill[]>
  }
}

/**
 * Skill Mention Node Extension
 * Renders inline skill mentions with gold styling for elite skills
 */
export const SkillMention = Mention.extend<SkillMentionOptions>({
  name: 'skillMention',

  addOptions() {
    return {
      ...this.parent?.(),
      HTMLAttributes: {},
      renderLabel({ node }) {
        return `${(node.attrs as { label?: string }).label || ''}`
      },
      suggestion: {
        char: '[[',
        pluginKey: new PluginKey('skillMention'),
        // Allow spaces in skill names (e.g., "Signet of Spirits", "Armor of Unfeeling")
        allowSpaces: true,
        items: async ({ query }: { query: string }) => {
          if (!query || query.length < 2) return []
          return await searchSkills(query, 12)
        },
        render: () => {
          let component: ReactRenderer | null = null
          let popup: TippyInstance[] | null = null

          return {
            onStart: (props: unknown) => {
              component = new ReactRenderer(MentionList, {
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

  parseHTML() {
    return [
      {
        tag: `span[data-type="${this.name}"]`,
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    const isElite = node.attrs.elite === true

    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: isElite
            ? 'skill-mention skill-mention-elite'
            : 'skill-mention',
          'data-id': node.attrs.id,
          'data-label': node.attrs.label,
          'data-elite': node.attrs.elite ? 'true' : 'false',
        }
      ),
      this.options.renderLabel({
        node,
      }),
    ]
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {}
          }

          return {
            'data-id': attributes.id,
          }
        },
      },

      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {}
          }

          return {
            'data-label': attributes.label,
          }
        },
      },

      elite: {
        default: false,
        parseHTML: element => element.getAttribute('data-elite') === 'true',
        renderHTML: attributes => {
          return {
            'data-elite': attributes.elite ? 'true' : 'false',
          }
        },
      },
    }
  },
})
