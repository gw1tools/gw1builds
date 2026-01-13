/**
 * @fileoverview Rich text notes editor component
 * @module components/editor/notes-editor
 *
 * TipTap-based rich text editor for build notes.
 * Supports formatting (headings, bold, italic, lists, links) and skill mentions via [[ trigger.
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Typography from '@tiptap/extension-typography'
import {
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Unlink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { extractTextFromTiptap } from '@/lib/search/text-utils'
import { MAX_NOTES_LENGTH } from '@/lib/constants'
import { SkillMention } from './skill-mention-extension'
import { SlashCommand } from './slash-command-extension'
import type { TipTapDocument } from '@/types/database'

interface NotesEditorProps {
  value: TipTapDocument
  onChange: (doc: TipTapDocument) => void
  /** Optional content to render at the bottom of the card (e.g., tags) */
  footer?: React.ReactNode
}

function ToolbarButton({
  onClick,
  isActive,
  label,
  children,
  disabled = false,
}: {
  onClick: () => void
  isActive: boolean
  label: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'text-text-primary bg-bg-hover'
          : 'text-text-muted hover:bg-bg-hover hover:text-text-secondary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={label}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-4 bg-border mx-1" />
}

export function NotesEditor({ value, onChange, footer }: NotesEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  // Detect touch device on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- window only available client-side
    setIsTouchDevice(!window.matchMedia('(hover: hover)').matches)
  }, [])

  // Calculate character count from actual text content
  const charCount = useMemo(() => extractTextFromTiptap(value).length, [value])
  const isOverLimit = charCount > MAX_NOTES_LENGTH

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
        // Configure hard breaks to keep formatting
        hardBreak: {
          keepMarks: true,
        },
      }),
      Placeholder.configure({
        placeholder:
          'Add notes about strategy, usage, or alternative skills...',
      }),
      // Typography for smart quotes, arrows, etc.
      Typography,
      Link.configure({
        openOnClick: false,
        // Auto-detect and link URLs as you type
        autolink: true,
        // Auto-link when pasting URLs
        linkOnPaste: true,
        // Default protocol for URLs without one
        defaultProtocol: 'https',
        HTMLAttributes: {
          class:
            'text-accent-blue hover:text-accent-blue/80 underline cursor-pointer',
          rel: 'noopener noreferrer nofollow',
          target: '_blank',
        },
      }),
      SkillMention,
      SlashCommand,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TipTapDocument)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3',
      },
      // Handle click on links to open them
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement
        if (target.tagName === 'A') {
          const href = target.getAttribute('href')
          if (href && (event.metaKey || event.ctrlKey)) {
            window.open(href, '_blank', 'noopener,noreferrer')
            return true
          }
        }
        return false
      },
    },
  })

  const setLink = useCallback(() => {
    if (!editor) return

    // If empty URL, remove the link
    if (linkUrl.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setShowLinkInput(false)
      setLinkUrl('')
      return
    }

    // Add https:// if no protocol specified
    let url = linkUrl.trim()
    if (!url.match(/^https?:\/\//)) {
      url = `https://${url}`
    }

    // Check if there's a selection
    const { from, to } = editor.state.selection
    const hasSelection = from !== to

    if (hasSelection) {
      // Apply link to selection
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      // No selection - extend to existing link mark or insert URL as text
      const isInLink = editor.isActive('link')
      if (isInLink) {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: url })
          .run()
      } else {
        // Insert the URL as linked text
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${url}">${url}</a>`)
          .run()
      }
    }

    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const handleLinkClick = useCallback(() => {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href
    if (previousUrl) {
      setLinkUrl(previousUrl)
    } else {
      setLinkUrl('')
    }
    setShowLinkInput(true)
  }, [editor])

  const removeLink = useCallback(() => {
    if (!editor) return
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
  }, [editor])

  return (
    <div className="w-full">
      <div
        className={cn(
          'bg-bg-secondary border border-border rounded-lg',
          'focus-within:border-accent-gold transition-colors duration-150'
        )}
      >
        {/* Toolbar - sticky below site header (h-16 = 64px), hidden on touch devices */}
        <div
          className={cn(
            'flex-wrap items-center gap-0.5 px-2 sm:px-3 py-2 bg-bg-secondary sticky top-16 z-10 rounded-t-lg border-b border-border/30',
            isTouchDevice ? 'hidden' : 'flex'
          )}
        >
          {/* Headings */}
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
            isActive={editor?.isActive('heading', { level: 1 }) ?? false}
            label="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            isActive={editor?.isActive('heading', { level: 2 }) ?? false}
            label="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text formatting */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            isActive={editor?.isActive('bold') ?? false}
            label="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            isActive={editor?.isActive('italic') ?? false}
            label="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link */}
          <ToolbarButton
            onClick={handleLinkClick}
            isActive={editor?.isActive('link') ?? false}
            label="Add Link (Ctrl+K)"
          >
            <LinkIcon className="w-4 h-4" />
          </ToolbarButton>
          {editor?.isActive('link') && (
            <ToolbarButton
              onClick={removeLink}
              isActive={false}
              label="Remove Link"
            >
              <Unlink className="w-4 h-4" />
            </ToolbarButton>
          )}

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            isActive={editor?.isActive('bulletList') ?? false}
            label="Bullet List"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            isActive={editor?.isActive('orderedList') ?? false}
            label="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Block elements */}
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            isActive={editor?.isActive('blockquote') ?? false}
            label="Quote"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            isActive={false}
            label="Horizontal Rule"
          >
            <Minus className="w-4 h-4" />
          </ToolbarButton>

          <div className="flex-1" />

          {/* Command hints - hidden on mobile to save space */}
          <span className="hidden sm:inline text-xs text-text-muted">
            <code className="px-1 py-0.5 bg-bg-hover rounded text-xs font-mono text-text-secondary">
              /
            </code>{' '}
            <span className="text-text-muted">commands</span>
            <span className="mx-2 text-border">|</span>
            <code className="px-1 py-0.5 bg-accent-gold/10 rounded text-xs font-mono text-accent-gold">
              [[
            </code>{' '}
            <span className="text-accent-gold">skills</span>
          </span>
        </div>

        {/* Link input bar */}
        {showLinkInput && (
          <div className="flex items-center gap-2 px-3 py-2 bg-bg-card border-t border-accent-gold">
            <LinkIcon className="w-4 h-4 text-accent-gold flex-shrink-0" />
            <input
              type="url"
              placeholder="Enter URL (e.g., wiki.guildwars.com)"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setLink()
                }
                if (e.key === 'Escape') {
                  setShowLinkInput(false)
                  setLinkUrl('')
                  editor?.chain().focus().run()
                }
              }}
              className={cn(
                'flex-1 bg-transparent text-sm text-text-primary',
                'placeholder:text-text-muted focus:outline-none'
              )}
              autoFocus
            />
            <button
              type="button"
              onClick={setLink}
              className="px-2 py-1 text-xs font-medium bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 rounded transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkInput(false)
                setLinkUrl('')
                editor?.chain().focus().run()
              }}
              className="px-2 py-1 text-xs text-text-muted hover:text-text-secondary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Editor content with subtle separator */}
        <div
          className={cn(
            'border-t border-border/30',
            isTouchDevice && 'border-t-0'
          )}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Bubble menu for touch devices - appears on text selection */}
        {editor && isTouchDevice && (
          <BubbleMenu
            editor={editor}
            options={{
              placement: 'top',
            }}
          >
            <div className="flex items-center gap-0.5 px-1.5 py-1 bg-bg-card border border-border rounded-lg shadow-lg">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                label="Bold"
              >
                <Bold className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                label="Italic"
              >
                <Italic className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarDivider />
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
                isActive={editor.isActive('heading', { level: 1 })}
                label="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
                isActive={editor.isActive('heading', { level: 2 })}
                label="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarDivider />
              <ToolbarButton
                onClick={handleLinkClick}
                isActive={editor.isActive('link')}
                label="Link"
              >
                <LinkIcon className="w-4 h-4" />
              </ToolbarButton>
              {editor.isActive('link') && (
                <ToolbarButton
                  onClick={removeLink}
                  isActive={false}
                  label="Remove Link"
                >
                  <Unlink className="w-4 h-4" />
                </ToolbarButton>
              )}
              <ToolbarDivider />
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                isActive={editor.isActive('blockquote')}
                label="Quote"
              >
                <Quote className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                label="Bullet List"
              >
                <List className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                label="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </ToolbarButton>
            </div>
          </BubbleMenu>
        )}

        {/* Optional footer content (e.g., tags) */}
        {footer && (
          <div className="border-t border-border/30 px-3 py-3">{footer}</div>
        )}
      </div>

      {/* Helper text and character count */}
      <div className="flex items-center justify-between mt-1.5 text-xs text-text-muted">
        <p>
          <span className="text-text-secondary">Tip:</span>{' '}
          {isTouchDevice ? (
            <>
              Select text for formatting. Type{' '}
              <span className="text-text-secondary">/</span> for commands,{' '}
              <span className="text-accent-gold">[[</span> for skills.
            </>
          ) : (
            <>
              Type <span className="text-text-secondary">/</span> for commands,{' '}
              <span className="text-accent-gold">[[</span> for skills. Paste URLs
              to auto-link.
            </>
          )}
        </p>
        <span className={cn(isOverLimit && 'text-accent-red font-medium')}>
          {charCount.toLocaleString()} / {MAX_NOTES_LENGTH.toLocaleString()}
        </span>
      </div>
    </div>
  )
}
