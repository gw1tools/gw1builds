# PRD-04: Build Creation

## Overview

Create the build editor page where authenticated users can create new builds. Supports single builds and team builds (up to 8 skill bars).

### AI Context

This PRD implements the build creation flow. Key architectural decisions:

1. **Client-side form** - Complex interactive form requires client component
2. **Template decoding** - Paste GW1 template codes to auto-populate fields
3. **TipTap editor** - Rich text with custom skill mention extension
4. **Validation on submit** - API validates and creates build

**Component structure:**
```
NewBuildPage (form container)
├── SkillBarEditor[] (1-8 bars)
│   ├── TemplateInput (paste/decode)
│   ├── SkillBar (preview)
│   └── Attributes (preview)
├── NotesEditor (TipTap)
└── TagSelector (predefined + custom)
```

## Dependencies

- PRD-00, PRD-01, PRD-02, PRD-03 completed

## Outcomes

- [ ] New build page at `/new`
- [ ] Template paste and decode works
- [ ] Can add multiple skill bars (up to 8)
- [ ] TipTap editor with skill mentions
- [ ] Tag selection
- [ ] Preview mode
- [ ] Publish creates build and redirects

---

## Tasks

### Task 4.1: Create TipTap Skill Mention Extension

**Create `components/editor/skill-mention-extension.ts`:**

```typescript
/**
 * @fileoverview TipTap extension for skill mentions
 * @module components/editor/skill-mention-extension
 * 
 * Allows users to mention GW1 skills in notes using [[skill name]] syntax.
 * Shows autocomplete dropdown while typing.
 * 
 * @see https://tiptap.dev/api/nodes/mention
 */
import { Mention } from '@tiptap/extension-mention'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import { MentionList } from './mention-list'
import { searchSkills } from '@/lib/gw/skills'

export const SkillMention = Mention.configure({
  HTMLAttributes: {
    class: 'skill-mention',
  },
  suggestion: {
    char: '[[',
    items: ({ query }) => {
      return searchSkills(query, 8)
    },
    render: () => {
      let component: ReactRenderer
      let popup: Instance[]

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) return

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props) {
          component.updateProps(props)

          if (!props.clientRect) return

          popup[0].setProps({
            getReferenceClientRect: props.clientRect as () => DOMRect,
          })
        },

        onKeyDown(props) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }

          return (component.ref as any)?.onKeyDown?.(props)
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  },
  renderLabel({ node }) {
    return `[[${node.attrs.label}]]`
  },
})
```

**Create `components/editor/mention-list.tsx`:**

```typescript
/**
 * @fileoverview Autocomplete dropdown for skill mentions
 * @module components/editor/mention-list
 * 
 * Renders the skill suggestion list when user types [[.
 * Keyboard navigation (arrows, enter) handled via imperative handle.
 */
'use client'

import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import type { Skill } from '@/lib/gw/skills'
import { cn } from '@/lib/utils'

interface MentionListProps {
  items: Skill[]
  command: (item: { id: number; label: string }) => void
}

export const MentionList = forwardRef<unknown, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    useEffect(() => {
      setSelectedIndex(0)
    }, [items])

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: { event: KeyboardEvent }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }

        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }

        if (event.key === 'Enter') {
          const item = items[selectedIndex]
          if (item) {
            command({ id: item.id, label: item.name })
          }
          return true
        }

        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div className="bg-bg-card border border-border rounded-lg p-3 text-sm text-text-muted shadow-xl">
          No skills found
        </div>
      )
    }

    return (
      <div className="bg-bg-card border border-border rounded-lg shadow-xl overflow-hidden">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => command({ id: item.id, label: item.name })}
            className={cn(
              'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
              index === selectedIndex ? 'bg-bg-hover' : 'hover:bg-bg-hover'
            )}
          >
            <div className="flex-1">
              <div className={cn(
                'text-sm font-medium',
                item.elite ? 'text-accent-gold' : 'text-text-primary'
              )}>
                {item.name}
              </div>
              <div className="text-xs text-text-muted">
                {item.profession} • {item.attribute}
              </div>
            </div>
          </button>
        ))}
      </div>
    )
  }
)

MentionList.displayName = 'MentionList'
```

**Acceptance Criteria:**
- [ ] Typing `[[` triggers skill search
- [ ] Arrow keys navigate suggestions
- [ ] Enter/click inserts skill mention
- [ ] Skill mentions styled correctly

---

### Task 4.2: Create TipTap Editor Component

**Create `components/editor/notes-editor.tsx`:**

```typescript
/**
 * @fileoverview Rich text editor for build notes
 * @module components/editor/notes-editor
 * 
 * TipTap-based editor with basic formatting (bold, italic, lists)
 * and custom skill mentions via [[ trigger.
 */
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { SkillMention } from './skill-mention-extension'
import type { TipTapDocument } from '@/types'

interface NotesEditorProps {
  content?: TipTapDocument
  onChange: (content: TipTapDocument) => void
  placeholder?: string
}

export function NotesEditor({ content, onChange, placeholder }: NotesEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,  // Keep it simple
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Add notes about this build... Type [[ to mention skills.',
      }),
      SkillMention,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as TipTapDocument)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[120px] px-4 py-3',
      },
    },
  })

  return (
    <div className="bg-bg-secondary border border-border rounded-lg overflow-hidden focus-within:border-border-hover transition-colors">
      <EditorContent editor={editor} />
      
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border bg-bg-primary">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={cn(
            'p-1.5 rounded hover:bg-bg-hover transition-colors',
            editor?.isActive('bold') ? 'text-text-primary bg-bg-hover' : 'text-text-muted'
          )}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={cn(
            'p-1.5 rounded hover:bg-bg-hover transition-colors',
            editor?.isActive('italic') ? 'text-text-primary bg-bg-hover' : 'text-text-muted'
          )}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-1.5 rounded hover:bg-bg-hover transition-colors',
            editor?.isActive('bulletList') ? 'text-text-primary bg-bg-hover' : 'text-text-muted'
          )}
        >
          <List className="w-4 h-4" />
        </button>
        
        <div className="flex-1" />
        
        <span className="text-xs text-text-muted">
          Type <code className="px-1 py-0.5 bg-bg-card rounded">[[</code> to mention skills
        </span>
      </div>
    </div>
  )
}

import { Bold, Italic, List } from 'lucide-react'
import { cn } from '@/lib/utils'
```

**Acceptance Criteria:**
- [ ] Editor renders with placeholder
- [ ] Bold, italic, list formatting works
- [ ] Skill mentions work via `[[`
- [ ] onChange fires with TipTap JSON

---

### Task 4.3: Create Template Input Component

**Create `components/editor/template-input.tsx`:**

```typescript
/**
 * @fileoverview Template code input with auto-decode
 * @module components/editor/template-input
 * 
 * Accepts GW1 template codes via paste or typing. Automatically
 * decodes valid templates and extracts profession/skills/attributes.
 */
'use client'

import { useState } from 'react'
import { AlertCircle, Check } from 'lucide-react'
import { decodeTemplate } from '@/lib/gw/decoder'
import { cn } from '@/lib/utils'
import type { SkillBar } from '@/types'

interface TemplateInputProps {
  onDecode: (bar: Omit<SkillBar, 'name' | 'hero'>) => void
  existingTemplate?: string
}

export function TemplateInput({ onDecode, existingTemplate }: TemplateInputProps) {
  const [value, setValue] = useState(existingTemplate || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').trim()
    processTemplate(pasted)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setError(null)
    setSuccess(false)
  }

  const handleBlur = () => {
    if (value.trim()) {
      processTemplate(value.trim())
    }
  }

  const processTemplate = (code: string) => {
    setValue(code)
    
    const decoded = decodeTemplate(code)
    
    if (!decoded) {
      setError('Invalid template code')
      setSuccess(false)
      return
    }

    setError(null)
    setSuccess(true)
    
    onDecode({
      template: code,
      primary: decoded.primary,
      secondary: decoded.secondary,
      attributes: decoded.attributes,
      skills: decoded.skills,
    })
  }

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder="Paste template code (e.g., OQBDAasySIAFgFGDAxhMxBDhCA)"
          className={cn(
            'w-full font-mono text-sm px-4 py-3 bg-bg-secondary border rounded-lg transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-accent-gold/20',
            error
              ? 'border-accent-red focus:border-accent-red'
              : success
              ? 'border-green-500 focus:border-green-500'
              : 'border-border focus:border-border-hover'
          )}
        />
        
        {(error || success) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error ? (
              <AlertCircle className="w-5 h-5 text-accent-red" />
            ) : (
              <Check className="w-5 h-5 text-green-500" />
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-accent-red">{error}</p>
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Paste triggers decode
- [ ] Shows success/error state
- [ ] Calls onDecode with parsed data

---

### Task 4.4: Create Skill Bar Editor Component

**Create `components/editor/skill-bar-editor.tsx`:**

```typescript
/**
 * @fileoverview Editable skill bar card for build creation
 * @module components/editor/skill-bar-editor
 * 
 * Contains template input, skill preview, attributes, and hero name.
 * Used in the new build form - one per skill bar (1-8 for teams).
 */
'use client'

import { useState } from 'react'
import { Trash2, GripVertical } from 'lucide-react'
import { TemplateInput } from './template-input'
import { SkillBar } from '@/components/build/skill-bar'
import { Attributes } from '@/components/build/attributes'
import { PROFESSIONS } from '@/lib/constants'
import type { SkillBar as SkillBarType } from '@/types'
import { cn } from '@/lib/utils'

interface SkillBarEditorProps {
  bar: SkillBarType
  index: number
  total: number
  onChange: (bar: SkillBarType) => void
  onRemove: () => void
}

export function SkillBarEditor({ bar, index, total, onChange, onRemove }: SkillBarEditorProps) {
  const [expanded, setExpanded] = useState(true)

  const handleDecode = (decoded: Omit<SkillBarType, 'name' | 'hero'>) => {
    onChange({
      ...bar,
      ...decoded,
    })
  }

  const updateField = (field: keyof SkillBarType, value: string | null) => {
    onChange({
      ...bar,
      [field]: value,
    })
  }

  return (
    <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-bg-secondary border-b border-border">
        {total > 1 && (
          <GripVertical className="w-4 h-4 text-text-muted cursor-grab" />
        )}
        
        <span className="w-6 h-6 flex items-center justify-center bg-bg-elevated border border-border rounded text-xs font-semibold text-text-muted">
          {index + 1}
        </span>

        <input
          type="text"
          value={bar.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Build name (e.g., Esurge Mesmer)"
          className="flex-1 bg-transparent border-none text-text-primary font-medium focus:outline-none placeholder:text-text-muted"
        />

        {total > 1 && (
          <button
            onClick={onRemove}
            className="p-1.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        <TemplateInput
          onDecode={handleDecode}
          existingTemplate={bar.template}
        />

        {bar.skills.length > 0 && (
          <>
            <div className="flex items-center gap-4">
              <SkillBar bar={bar} size="md" />
              
              <div className="text-sm text-text-muted">
                {bar.primary}/{bar.secondary}
              </div>
            </div>

            <Attributes attributes={bar.attributes} />

            {total > 1 && (
              <div>
                <label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
                  Hero Name (optional)
                </label>
                <input
                  type="text"
                  value={bar.hero || ''}
                  onChange={(e) => updateField('hero', e.target.value || null)}
                  placeholder="e.g., Gwen, Norgu"
                  className="w-48 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-border-hover"
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Name field editable
- [ ] Template input decodes skills
- [ ] Shows skill bar preview
- [ ] Hero name field for teams
- [ ] Remove button works

---

### Task 4.5: Create Tag Selector Component

**Create `components/editor/tag-selector.tsx`:**

```typescript
/**
 * @fileoverview Tag selection component for categorizing builds
 * @module components/editor/tag-selector
 * 
 * Shows predefined tag categories (mode, campaign, meta status)
 * plus ability to add custom tags. Used in build create/edit forms.
 */
'use client'

import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { TAGS, ALL_TAGS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TagSelectorProps {
  selected: string[]
  onChange: (tags: string[]) => void
}

export function TagSelector({ selected, onChange }: TagSelectorProps) {
  const [customTag, setCustomTag] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const toggleTag = (tag: string) => {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag))
    } else {
      onChange([...selected, tag])
    }
  }

  const addCustomTag = () => {
    const tag = customTag.trim().toLowerCase()
    if (tag && !selected.includes(tag)) {
      onChange([...selected, tag])
    }
    setCustomTag('')
    setShowCustomInput(false)
  }

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-accent-gold/10 border border-accent-gold-dim text-accent-gold rounded text-xs font-medium"
            >
              {tag}
              <button
                onClick={() => toggleTag(tag)}
                className="hover:text-accent-gold-bright"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Tag categories */}
      <div className="space-y-2">
        {Object.entries(TAGS).map(([category, tags]) => (
          <div key={category}>
            <div className="text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
              {category}
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium transition-colors',
                    selected.includes(tag)
                      ? 'bg-accent-gold text-bg-primary'
                      : 'bg-bg-secondary border border-border text-text-secondary hover:border-border-hover'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Custom tag */}
      {showCustomInput ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
            placeholder="Custom tag"
            className="flex-1 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:border-border-hover"
            autoFocus
          />
          <button
            onClick={addCustomTag}
            className="px-3 py-1.5 bg-accent-gold text-bg-primary rounded-lg text-sm font-medium hover:bg-accent-gold-bright"
          >
            Add
          </button>
          <button
            onClick={() => setShowCustomInput(false)}
            className="px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm hover:bg-bg-hover"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowCustomInput(true)}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
        >
          <Plus className="w-4 h-4" />
          Add custom tag
        </button>
      )}
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Predefined tags clickable
- [ ] Custom tags addable
- [ ] Selected tags removable
- [ ] Tags organized by category

---

### Task 4.6: Create New Build Page

**Create `app/(main)/new/page.tsx`:**

```typescript
/**
 * @fileoverview New build creation page
 * @module app/(main)/new/page
 * 
 * Form for creating new builds. Supports single builds and team
 * builds with up to 8 skill bars. Protected route (requires auth).
 */
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/components/providers/auth-provider'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { NotesEditor } from '@/components/editor/notes-editor'
import { TagSelector } from '@/components/editor/tag-selector'
import { MAX_BARS } from '@/lib/constants'
import type { SkillBar, TipTapDocument } from '@/types'
import { cn } from '@/lib/utils'

const emptyBar = (): SkillBar => ({
  name: '',
  hero: null,
  template: '',
  primary: '',
  secondary: 'Any',
  attributes: {},
  skills: [],
})

export default function NewBuildPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [name, setName] = useState('')
  const [bars, setBars] = useState<SkillBar[]>([emptyBar()])
  const [notes, setNotes] = useState<TipTapDocument>({ type: 'doc', content: [] })
  const [tags, setTags] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const addBar = () => {
    if (bars.length < MAX_BARS) {
      setBars([...bars, emptyBar()])
    }
  }

  const updateBar = (index: number, bar: SkillBar) => {
    const newBars = [...bars]
    newBars[index] = bar
    setBars(newBars)
  }

  const removeBar = (index: number) => {
    if (bars.length > 1) {
      setBars(bars.filter((_, i) => i !== index))
    }
  }

  const handleSubmit = async () => {
    // Validation
    if (!name.trim()) {
      toast.error('Please enter a build name')
      return
    }

    const validBars = bars.filter((bar) => bar.skills.length > 0)
    if (validBars.length === 0) {
      toast.error('Please add at least one skill bar')
      return
    }

    // Check all bars have names
    for (const bar of validBars) {
      if (!bar.name.trim()) {
        toast.error('Please name all skill bars')
        return
      }
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          notes,
          tags,
          bars: validBars.map((bar) => ({
            ...bar,
            name: bar.name.trim(),
            hero: bar.hero?.trim() || null,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create build')
      }

      const { id } = await response.json()
      
      toast.success('Build created!')
      router.push(`/b/${id}`)
    } catch (error) {
      console.error('Failed to create build:', error)
      toast.error('Failed to create build. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-text-primary mb-6">New Build</h1>

      <div className="space-y-6">
        {/* Build Name */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Build Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., 7-Hero Mesmerway"
            className="w-full px-4 py-3 bg-bg-secondary border border-border rounded-lg text-lg font-medium focus:outline-none focus:border-border-hover"
          />
        </div>

        {/* Skill Bars */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Skill Bars
          </label>
          <div className="space-y-3">
            {bars.map((bar, index) => (
              <SkillBarEditor
                key={index}
                bar={bar}
                index={index}
                total={bars.length}
                onChange={(updated) => updateBar(index, updated)}
                onRemove={() => removeBar(index)}
              />
            ))}
          </div>

          {bars.length < MAX_BARS && (
            <button
              onClick={addBar}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary border border-dashed border-border hover:border-border-hover rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add another hero (for team builds)
            </button>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Notes (optional)
          </label>
          <NotesEditor content={notes} onChange={setNotes} />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Tags
          </label>
          <TagSelector selected={tags} onChange={setTags} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={cn(
              'inline-flex items-center gap-2 px-6 py-2.5 bg-accent-gold text-bg-primary rounded-lg font-medium transition-colors',
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent-gold-bright'
            )}
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Creating...' : 'Publish Build'}
          </button>

          <button
            onClick={() => setShowPreview(!showPreview)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Hide Preview' : 'Preview'}
          </button>
        </div>
      </div>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Form displays all fields
- [ ] Can add/remove skill bars
- [ ] Validation shows errors
- [ ] Submit creates build via API
- [ ] Redirects to new build page

---

### Task 4.7: Create Build API Route

**Create `app/api/builds/route.ts`:**

```typescript
/**
 * @fileoverview Build creation API endpoint
 * @module app/api/builds/route
 * 
 * POST /api/builds - Creates a new build
 * Requires authentication. Validates input and creates build in database.
 * 
 * @security
 * - Requires valid session (checked via Supabase auth)
 * - Input validated before database insert
 * - Uses RLS policies for additional security
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

/** Validates build creation request body */
function validateBuild(body: any): { valid: boolean; error?: string } {
  if (!body.name || typeof body.name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }
  if (body.name.length < 3 || body.name.length > 100) {
    return { valid: false, error: 'Name must be 3-100 characters' }
  }
  if (!Array.isArray(body.bars) || body.bars.length === 0 || body.bars.length > 8) {
    return { valid: false, error: 'Must have 1-8 skill bars' }
  }
  for (const bar of body.bars) {
    if (!bar.name || !bar.template || !Array.isArray(bar.skills)) {
      return { valid: false, error: 'Invalid skill bar data' }
    }
  }
  if (body.tags && (!Array.isArray(body.tags) || body.tags.length > 10)) {
    return { valid: false, error: 'Max 10 tags allowed' }
  }
  return { valid: true }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate body
    const body = await request.json()
    const validation = validateBuild(body)
    
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { name, notes, tags, bars } = body
    const id = nanoid(7)

    // Insert build
    const { error } = await supabase.from('builds').insert({
      id,
      author_id: user.id,
      name,
      notes: notes || {},
      tags: tags || [],
      bars,
    })

    if (error) {
      console.error('Failed to create build:', error)
      return NextResponse.json({ error: 'Failed to create build' }, { status: 500 })
    }

    return NextResponse.json({ id })
  } catch (error) {
    console.error('Build creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

**Acceptance Criteria:**
- [ ] Validates request body
- [ ] Requires authentication
- [ ] Creates build in database
- [ ] Returns new build ID

---

## Future Enhancements

> **TODO: Rune Support**
> - Add ability to specify rune bonuses (+1/+2/+3) per attribute during build creation
> - Display attribute values as "base + rune" (e.g., "12 + 1 + 1") 
> - Store rune data in database alongside attributes
> - Consider headgear bonus (+1) as separate field

> **TODO: Primary Attribute Bonuses**
> - Display primary attribute passive bonus text (e.g., "Your allies are healed for X Health whenever you cast Monk spells")
> - Calculate and show actual bonus values based on attribute points
> - Each profession has one primary attribute with unique passive effect:
>   - Monk (Divine Favor): Bonus healing on Monk spells
>   - Warrior (Strength): Armor penetration on attack skills
>   - Elementalist (Energy Storage): Bonus max energy
>   - Necromancer (Soul Reaping): Energy on nearby deaths
>   - Mesmer (Fast Casting): Reduced casting time
>   - Ranger (Expertise): Reduced energy costs
>   - Assassin (Critical Strikes): Crit chance and energy on crit
>   - Ritualist (Spawning Power): Spirit/weapon spell bonuses
>   - Paragon (Leadership): Energy on chants/shouts
>   - Dervish (Mysticism): Health/energy when enchantments end

---

## Completion Checklist

- [ ] TipTap skill mention extension
- [ ] Notes editor with toolbar
- [ ] Template input with decode
- [ ] Skill bar editor
- [ ] Tag selector
- [ ] New build page form
- [ ] Build creation API
- [ ] Ready for PRD-05
