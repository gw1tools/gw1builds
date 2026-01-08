# PRD-02: Build Viewing

## Overview

Create the build view page that displays a single or team build. No authentication required to view.

### AI Context

This PRD creates the read-only build viewing experience. Key architectural decisions:

1. **Server Components by default** - Build page uses RSC for SEO and performance
2. **Client Components for interactivity** - Tooltips, copy buttons use `'use client'`
3. **Component composition** - Small, focused components that compose together
4. **Stacked cards for teams** - Team builds show all hero bars as stacked cards (no accordion)

**Component documentation pattern used throughout:**
- File headers with `@fileoverview` explaining component purpose
- JSDoc on exported components with `@component`, `@example`
- Props documented with inline comments for domain context
- Accessibility notes in JSDoc when relevant

## Dependencies

- PRD-00 completed
- PRD-01 completed (data layer exists)

## Outcomes

- [x] Build page renders at `/b/[id]`
- [x] Single builds display correctly
- [x] Team builds display as stacked cards
- [x] Skill tooltips work on hover
- [x] Template code is copyable
- [x] Share functionality works
- [x] View count increments
- [x] 404 page for missing builds

---

## Tasks

### Task 2.1: Create Skill Component

**Create `components/build/skill.tsx`:**

```typescript
/**
 * @fileoverview Skill display component with hover tooltip
 * @module components/build/skill
 * 
 * Renders a single GW1 skill as an interactive tile. Shows profession-colored
 * background and displays a detailed tooltip on hover with skill stats.
 * 
 * @see lib/gw/skills.ts for skill data lookup
 * @see https://wiki.guildwars.com/wiki/Skill for GW1 skill mechanics
 */
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getSkillById, type Skill } from '@/lib/gw/skills'
import { PROFESSION_COLORS } from '@/lib/constants'

/**
 * Props for the Skill component
 */
interface SkillProps {
  /** GW1 skill ID (1-3431, 0 = empty slot) */
  skillId: number
  /** Display size - sm for lists, md default, lg for detail views */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to show tooltip on hover (disable in compact views) */
  showTooltip?: boolean
  /** Whether this skill is elite (gold border treatment) */
  isElite?: boolean
}

/**
 * Displays a single GW1 skill with profession-colored background
 * 
 * @component
 * @example
 * // Basic usage
 * <Skill skillId={152} />
 * 
 * @example
 * // Elite skill in skill bar
 * <Skill skillId={892} isElite size="lg" />
 * 
 * @example
 * // Compact view without tooltip
 * <Skill skillId={152} size="sm" showTooltip={false} />
 * 
 * @accessibility
 * - Skill tile is focusable for keyboard navigation
 * - Tooltip appears on focus as well as hover
 * - Uses role="img" with aria-label for skill name
 */
export function Skill({ skillId, size = 'md', showTooltip = true, isElite = false }: SkillProps) {
  const [showingTooltip, setShowingTooltip] = useState(false)
  const skill = getSkillById(skillId)

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-14 h-14',
  }

  const profession = skill?.profession || 'Unknown'
  const bgColor = PROFESSION_COLORS[profession as keyof typeof PROFESSION_COLORS] || '#3a3a3d'

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowingTooltip(true)}
      onMouseLeave={() => setShowingTooltip(false)}
      onFocus={() => setShowingTooltip(true)}
      onBlur={() => setShowingTooltip(false)}
    >
      <div
        role="img"
        aria-label={skill ? `${skill.name}${isElite ? ' (Elite)' : ''}` : 'Unknown skill'}
        tabIndex={0}
        className={cn(
          sizeClasses[size],
          'rounded border-2 flex items-center justify-center cursor-pointer transition-all',
          'hover:translate-y-[-2px] hover:shadow-lg',
          'focus:outline-none focus:ring-2 focus:ring-accent-gold focus:ring-offset-2 focus:ring-offset-bg-primary',
          isElite
            ? 'border-accent-gold shadow-[inset_0_0_0_1px_var(--accent-gold-dim)]'
            : 'border-border hover:border-text-muted'
        )}
        style={{
          background: `linear-gradient(180deg, ${bgColor}40 0%, ${bgColor}20 100%)`,
        }}
      >
        {skill ? (
          <span className="text-[8px] text-center leading-tight text-text-primary font-medium px-1">
            {skill.name.split(' ').slice(0, 2).join('\n')}
          </span>
        ) : (
          <span className="text-[8px] text-text-muted">?</span>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && showingTooltip && skill && (
        <SkillTooltip skill={skill} />
      )}
    </div>
  )
}

/**
 * Tooltip displaying detailed skill information
 * 
 * Shows skill name, type, description, and resource costs.
 * Positioned above the skill tile with a pointer arrow.
 * 
 * @internal - Not exported, used only by Skill component
 */
function SkillTooltip({ skill }: { skill: Skill }) {
  return (
    <div 
      role="tooltip"
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
    >
      <div className="bg-bg-primary border border-border rounded-lg p-3 shadow-xl w-56">
        <div className={cn(
          'font-semibold text-sm mb-1',
          skill.elite ? 'text-accent-gold' : 'text-text-primary'
        )}>
          {skill.name}
          {skill.elite && ' [Elite]'}
        </div>
        <div className="text-[10px] text-text-muted uppercase tracking-wide mb-2">
          {skill.attribute} • {skill.type}
        </div>
        <div className="text-xs text-text-secondary leading-relaxed">
          {skill.description}
        </div>
        {(skill.energy || skill.activation || skill.recharge) && (
          <div className="flex gap-3 mt-2 text-[10px] text-text-muted">
            {skill.energy && <span>⚡ {skill.energy}</span>}
            {skill.activation && <span>⏱ {skill.activation}s</span>}
            {skill.recharge && <span>🔄 {skill.recharge}s</span>}
          </div>
        )}
      </div>
      {/* Arrow */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-border" />
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Skill renders with profession color
- [ ] Elite skills have gold border
- [ ] Tooltip shows on hover
- [ ] Tooltip displays all skill info

---

### Task 2.2: Create Skill Bar Component

**Create `components/build/skill-bar.tsx`:**

```typescript
/**
 * @fileoverview Skill bar component displaying 8 skills
 * @module components/build/skill-bar
 * 
 * GW1 characters have exactly 8 skill slots. The first slot (index 0)
 * is conventionally used for elite skills, though this is player choice.
 * 
 * @see https://wiki.guildwars.com/wiki/Skill_Bar
 */
import { Skill } from './skill'
import type { SkillBar as SkillBarType } from '@/types'

interface SkillBarProps {
  /** The skill bar data containing 8 skill IDs */
  bar: SkillBarType
  /** Display size passed to individual Skill components */
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Displays a complete GW1 skill bar (8 skills in a row)
 * 
 * @component
 * @example
 * <SkillBar bar={build.bars[0]} size="lg" />
 * 
 * @accessibility
 * - Skills are keyboard navigable via Tab
 * - Each skill has aria-label with skill name
 */
export function SkillBar({ bar, size = 'md' }: SkillBarProps) {
  return (
    <div className="flex gap-1" role="list" aria-label="Skill bar">
      {bar.skills.map((skillId, index) => (
        <Skill
          key={index}
          skillId={skillId}
          size={size}
          isElite={index === 0}  // First slot conventionally holds elite skill
        />
      ))}
    </div>
  )
}
```

**Create compact version `components/build/skill-bar-compact.tsx`:**

```typescript
/**
 * @fileoverview Compact skill bar showing skill abbreviations
 * @module components/build/skill-bar-compact
 * 
 * Used in collapsed accordion views and list items where full skill
 * icons would be too large. Shows 2-letter abbreviations.
 */
import { getSkillById } from '@/lib/gw/skills'
import { cn } from '@/lib/utils'
import type { SkillBar as SkillBarType } from '@/types'

interface SkillBarCompactProps {
  /** The skill bar data containing 8 skill IDs */
  bar: SkillBarType
}

/**
 * Compact skill bar showing 2-letter abbreviations
 * 
 * @component
 * @example
 * // In accordion header
 * <SkillBarCompact bar={heroBar} />
 */
export function SkillBarCompact({ bar }: SkillBarCompactProps) {
  return (
    <div className="flex gap-0.5" aria-label="Skill bar preview">
      {bar.skills.map((skillId, index) => {
        const skill = getSkillById(skillId)
        // Create 2-letter abbreviation from skill name initials
        const abbrev = skill?.name
          .split(' ')
          .map(w => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase() || '??'
        
        return (
          <div
            key={index}
            title={skill?.name}
            className={cn(
              'w-7 h-7 rounded-sm border flex items-center justify-center',
              'text-[9px] font-medium',
              index === 0
                ? 'border-accent-gold text-accent-gold bg-accent-gold/10'
                : 'border-border text-text-muted bg-bg-primary'
            )}
          >
            {abbrev}
          </div>
        )
      })}
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Full skill bar displays 8 skills
- [ ] Compact skill bar shows abbreviations
- [ ] Elite skill highlighted

---

### Task 2.3: Create Attributes Component

**Create `components/build/attributes.tsx`:**

```typescript
/**
 * @fileoverview Attribute point distribution display
 * @module components/build/attributes
 * 
 * GW1 characters have 200 attribute points at level 20. Points are
 * distributed across profession-specific attribute lines. Higher
 * values mean stronger skills in that line.
 * 
 * @see https://wiki.guildwars.com/wiki/Attribute
 */

interface AttributesProps {
  /** Map of attribute name to point value (0-16) */
  attributes: Record<string, number>
}

/**
 * Displays attribute point distribution for a build
 * 
 * Only shows attributes with points > 0. Values above 12 require
 * runes/headgear (indicated by high values like 14, 15, 16).
 * 
 * @component
 * @example
 * <Attributes attributes={{ 'Domination Magic': 12, 'Fast Casting': 10 }} />
 */
export function Attributes({ attributes }: AttributesProps) {
  // Filter out zero-value attributes (unspent points)
  const entries = Object.entries(attributes).filter(([_, value]) => value > 0)
  
  if (entries.length === 0) return null

  return (
    <div className="flex gap-4 flex-wrap" role="list" aria-label="Attribute distribution">
      {entries.map(([name, value]) => (
        <div key={name} className="flex items-center gap-2 text-sm" role="listitem">
          <span className="text-text-secondary">{name}</span>
          <span className="font-mono font-semibold text-accent-gold bg-bg-primary px-2 py-0.5 rounded border border-border">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Attributes display with values
- [ ] Zero-value attributes hidden
- [ ] Styled consistently

---

### Task 2.4: Create Template Code Component

**Create `components/build/template-code.tsx`:**

```typescript
/**
 * @fileoverview Template code display with copy functionality
 * @module components/build/template-code
 * 
 * GW1 template codes are base64-encoded strings that represent
 * a complete build. Players paste these in-game to load builds.
 * Format example: OQhkAqCalIPvQLDBbSXjHOgbNA
 * 
 * @see https://wiki.guildwars.com/wiki/Template_code
 */
'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TemplateCodeProps {
  /** The GW1 template code string */
  code: string
  /** Additional CSS classes for the container */
  className?: string
}

/**
 * Displays a template code with one-click copy functionality
 * 
 * The code is shown in a monospace font and is fully selectable.
 * Copy button provides visual feedback and toast notification.
 * 
 * @component
 * @example
 * <TemplateCode code="OQhkAqCalIPvQLDBbSXjHOgbNA" />
 * 
 * @accessibility
 * - Copy button is keyboard accessible
 * - Success state announced via toast
 */
export function TemplateCode({ code, className }: TemplateCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Template copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('flex gap-2', className)}>
      <code className="flex-1 font-mono text-sm bg-bg-primary border border-border rounded-lg px-3 py-2 text-text-primary select-all break-all">
        {code}
      </code>
      <button
        onClick={handleCopy}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border font-medium text-sm transition-all',
          copied
            ? 'bg-green-500/20 border-green-500/50 text-green-400'
            : 'bg-bg-card border-border text-text-primary hover:bg-bg-hover hover:border-border-hover'
        )}
      >
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Code displays in monospace
- [ ] Copy button works
- [ ] Success toast shows
- [ ] Button state changes on copy

---

### Task 2.5: Create Notes Renderer

**Create `components/build/notes-renderer.tsx`:**

```typescript
/**
 * @fileoverview Renders TipTap JSON content as HTML
 * @module components/build/notes-renderer
 * 
 * Build notes are stored as TipTap ProseMirror JSON. This component
 * converts that JSON to HTML for read-only display. Supports basic
 * formatting (bold, lists) and custom skill mentions.
 * 
 * @see components/editor/skill-mention-extension.ts for mention rendering
 */
'use client'

import { useMemo } from 'react'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import { SkillMention } from '@/components/editor/skill-mention-extension'
import type { TipTapDocument } from '@/types'

interface NotesRendererProps {
  /** TipTap ProseMirror JSON document */
  notes: TipTapDocument
}

/**
 * Renders TipTap JSON content as styled HTML
 * 
 * Uses memoization to avoid re-parsing JSON on every render.
 * Gracefully handles empty or invalid content.
 * 
 * @component
 * @example
 * <NotesRenderer notes={build.notes} />
 */
export function NotesRenderer({ notes }: NotesRendererProps) {
  const html = useMemo(() => {
    if (!notes || !notes.content || notes.content.length === 0) {
      return null
    }
    
    try {
      return generateHTML(notes, [StarterKit, SkillMention])
    } catch (e) {
      console.error('Failed to render notes:', e)
      return null
    }
  }, [notes])

  if (!html) {
    return null
  }

  return (
    <div 
      className="prose prose-invert prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
```

**Add prose styles to globals.css:**

```css
/* TipTap content styles */
.prose {
  @apply text-text-secondary leading-relaxed;
}

.prose p {
  @apply mb-3;
}

.prose strong {
  @apply text-text-primary font-semibold;
}

.prose code {
  @apply font-mono text-sm bg-bg-secondary px-1.5 py-0.5 rounded border border-border text-accent-gold;
}

.prose ul, .prose ol {
  @apply my-3 pl-5;
}

.prose li {
  @apply mb-1;
}

.prose a {
  @apply text-accent-blue hover:underline;
}

/* Skill mention styling */
.skill-mention {
  @apply inline-flex items-center px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple rounded cursor-pointer hover:bg-accent-purple/30;
}
```

**Acceptance Criteria:**
- [ ] Notes render from TipTap JSON
- [ ] Basic formatting works (bold, lists)
- [ ] Skill mentions styled
- [ ] Empty notes handled gracefully

---

### Task 2.6: Create Hero Build Card (for teams)

**Create `components/build/hero-build-card.tsx`:**

```typescript
/**
 * @fileoverview Stacked card for hero builds in team compositions
 * @module components/build/hero-build-card
 * 
 * Team builds in GW1 consist of the player + 7 heroes. Each hero
 * needs their own skill bar, attributes, and template. Cards are
 * always expanded (stacked layout, no accordion).
 * 
 * @see https://wiki.guildwars.com/wiki/Hero for hero system info
 */

import { SkillBar } from './skill-bar'
import { Attributes } from './attributes'
import { TemplateCode } from './template-code'
import { PROFESSION_COLORS } from '@/lib/constants'
import type { SkillBar as SkillBarType } from '@/types'

interface HeroBuildCardProps {
  /** The skill bar data for this hero */
  bar: SkillBarType
  /** Position in team (0-7, 0 = player) */
  index: number
}

/**
 * Card showing a single hero's build (always expanded)
 * 
 * Displays profession, hero name, skill bar, attributes, and template.
 * Stacked layout - all cards visible at once for easy comparison.
 * 
 * @component
 * @example
 * <HeroBuildCard bar={build.bars[0]} index={0} />
 */
export function HeroBuildCard({ bar, index }: HeroBuildCardProps) {
  const professionColor = PROFESSION_COLORS[bar.primary as keyof typeof PROFESSION_COLORS] || '#a0a0a5'

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border bg-bg-secondary">
        <span className="w-7 h-7 flex items-center justify-center bg-bg-elevated border border-border rounded text-sm font-semibold text-text-muted">
          {index + 1}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: professionColor }}
            />
            <span className="font-semibold text-text-primary">{bar.name}</span>
          </div>
          <div className="text-xs text-text-muted uppercase tracking-wide">
            {bar.primary}/{bar.secondary} {bar.hero && `• ${bar.hero}`}
          </div>
        </div>
      </div>

      {/* Content - always visible */}
      <div className="p-4 space-y-4">
        <SkillBar bar={bar} size="lg" />
        <Attributes attributes={bar.attributes} />
        <TemplateCode code={bar.template} />
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Card displays hero info
- [ ] Shows full skill bar
- [ ] Shows attributes and template
- [ ] Profession color indicator works

---

### Task 2.7: Create Tag Component

**Create `components/ui/tag.tsx`:**

```typescript
/**
 * @fileoverview Tag/badge component for build categorization
 * @module components/ui/tag
 * 
 * Tags are used to categorize builds (PvE, PvP, meta, beginner, etc).
 * Special "meta" tags get highlighted styling to indicate community
 * recognized best-in-slot builds.
 */
import { cn } from '@/lib/utils'

interface TagProps {
  /** The tag text to display */
  tag: string
  /** Force a specific variant (auto-detected from tag name otherwise) */
  variant?: 'default' | 'meta'
  /** Display size */
  size?: 'sm' | 'md'
}

/** Tags that get special "meta" highlight styling */
const META_TAGS = ['meta', 'beginner', 'budget'] as const

/**
 * Displays a categorization tag/badge
 * 
 * Automatically highlights certain tags (meta, beginner, budget)
 * with gold styling to make them stand out.
 * 
 * @component
 * @example
 * <Tag tag="PvE" />
 * <Tag tag="meta" />  // Auto-highlighted
 * <Tag tag="custom" variant="meta" />  // Force highlight
 */
export function Tag({ tag, variant, size = 'md' }: TagProps) {
  const isMeta = variant === 'meta' || META_TAGS.includes(tag.toLowerCase())
  
  return (
    <span
      className={cn(
        'inline-block rounded font-medium uppercase tracking-wide',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs',
        isMeta
          ? 'bg-accent-gold/10 border border-accent-gold-dim text-accent-gold'
          : 'bg-bg-secondary border border-border text-text-secondary'
      )}
    >
      {tag}
    </span>
  )
}
```

**Acceptance Criteria:**
- [ ] Tags display with correct styling
- [ ] Meta tags highlighted in gold
- [ ] Size variants work

---

### Task 2.8: Create Action Bar Component

**Create `components/build/action-bar.tsx`:**

```typescript
/**
 * @fileoverview Floating action bar for build page interactions
 * @module components/build/action-bar
 * 
 * Fixed-position bar at bottom of viewport with primary actions:
 * copy template(s), share link, and edit (for owners). Uses native
 * Web Share API when available, falls back to clipboard.
 */
'use client'

import { Copy, Share2, Pencil, Check } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ActionBarProps {
  /** Build ID for generating share URL */
  buildId: string
  /** Template codes to copy (1 for single build, 8 for team) */
  templateCodes: string[]
  /** Whether current user owns this build (shows edit button) */
  isOwner?: boolean
}

/**
 * Floating action bar with copy/share/edit buttons
 * 
 * Positioned fixed at bottom center of viewport. For team builds,
 * copies all templates separated by newlines.
 * 
 * @component
 * @example
 * <ActionBar 
 *   buildId="abc1234" 
 *   templateCodes={['OQhk...', 'OQBj...']} 
 *   isOwner={false} 
 * />
 * 
 * @accessibility
 * - All buttons are keyboard accessible
 * - Visual feedback on copy action
 * - Toast announcements for screen readers
 */
export function ActionBar({ buildId, templateCodes, isOwner = false }: ActionBarProps) {
  const [copied, setCopied] = useState(false)

  const handleCopyAll = async () => {
    const text = templateCodes.join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success(templateCodes.length > 1 ? `Copied ${templateCodes.length} templates!` : 'Template copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/b/${buildId}`
    
    if (navigator.share) {
      await navigator.share({ title: 'GW1 Build', url })
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
      <div className="flex gap-1 p-1.5 bg-bg-card border border-border rounded-xl shadow-2xl">
        <button
          onClick={handleCopyAll}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-accent-gold text-bg-primary hover:bg-accent-gold-bright'
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {templateCodes.length > 1 ? `Copy All (${templateCodes.length})` : 'Copy Template'}
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-bg-card border border-border text-text-primary hover:bg-bg-hover hover:border-border-hover transition-all"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>

        {isOwner && (
          <a
            href={`/b/${buildId}/edit`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-bg-card border border-border text-text-primary hover:bg-bg-hover hover:border-border-hover transition-all"
          >
            <Pencil className="w-4 h-4" />
            Edit
          </a>
        )}
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Floating bar at bottom of screen
- [ ] Copy all templates button
- [ ] Share button (native or clipboard)
- [ ] Edit button only shows for owner

---

### Task 2.9: Create Build Page

**Create `app/(main)/b/[id]/page.tsx`:**

```typescript
/**
 * @fileoverview Build detail page - displays single or team builds
 * @module app/(main)/b/[id]/page
 * 
 * Server Component that fetches and displays a complete build.
 * Handles both single-character and team (8-hero) builds.
 * Increments view count on each page load.
 * 
 * Route: /b/[id] where id is a 7-character nanoid
 * 
 * @see lib/services/builds.ts for data fetching
 * @see components/build/ for UI components
 */
import { notFound } from 'next/navigation'
import { getBuildById, incrementViewCount } from '@/lib/services/builds'
import { createClient } from '@/lib/supabase/server'
import { Tag } from '@/components/ui/tag'
import { SkillBar } from '@/components/build/skill-bar'
import { Attributes } from '@/components/build/attributes'
import { TemplateCode } from '@/components/build/template-code'
import { NotesRenderer } from '@/components/build/notes-renderer'
import { HeroBuildCard } from '@/components/build/hero-build-card'
import { ActionBar } from '@/components/build/action-bar'
import { PROFESSION_COLORS } from '@/lib/constants'
import { Eye, Clock } from 'lucide-react'

interface BuildPageProps {
  params: { id: string }
}

/**
 * Build detail page component
 * 
 * Async Server Component that:
 * 1. Fetches build data by ID
 * 2. Shows 404 if not found
 * 3. Increments view count (fire-and-forget)
 * 4. Checks ownership for edit button
 * 5. Renders appropriate view (single vs team)
 */
export default async function BuildPage({ params }: BuildPageProps) {
  const build = await getBuildById(params.id)
  
  if (!build) {
    notFound()
  }

  // Increment view count (fire and forget)
  incrementViewCount(params.id)

  // Check if current user is owner
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === build.author_id

  const isSingleBuild = build.bars.length === 1
  const templateCodes = build.bars.map(bar => bar.template)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-24">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted font-mono mb-6">
        <a href="/" className="text-text-secondary hover:text-accent-gold">builds</a>
        {' / '}
        <span>{params.id}</span>
      </nav>

      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {isSingleBuild && (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-semibold uppercase tracking-wide"
              style={{
                borderColor: PROFESSION_COLORS[build.bars[0].primary as keyof typeof PROFESSION_COLORS] || '#3a3a3d',
                color: PROFESSION_COLORS[build.bars[0].primary as keyof typeof PROFESSION_COLORS] || '#a0a0a5',
              }}
            >
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: PROFESSION_COLORS[build.bars[0].primary as keyof typeof PROFESSION_COLORS] }}
              />
              {build.bars[0].primary}/{build.bars[0].secondary}
            </span>
          )}
          {!isSingleBuild && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded border border-accent-blue text-accent-blue text-xs font-semibold uppercase tracking-wide">
              {build.bars.length} heroes
            </span>
          )}
          {build.tags.map(tag => (
            <Tag key={tag} tag={tag} size="sm" />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {build.name}
        </h1>

        {build.author && (
          <p className="text-text-secondary text-sm">
            by <span className="text-text-primary">{build.author.display_name}</span>
          </p>
        )}
      </header>

      {/* Single Build View */}
      {isSingleBuild && (
        <div className="space-y-4 mb-8">
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4">
              Skill Bar
            </div>
            <SkillBar bar={build.bars[0]} size="lg" />
            <div className="mt-4">
              <Attributes attributes={build.bars[0].attributes} />
            </div>
          </div>

          <TemplateCode code={build.bars[0].template} />

          {build.bars[0].hero && (
            <div className="bg-bg-card border border-border rounded-xl p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Works On
              </span>
              <div className="mt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-secondary border border-border rounded-lg text-sm">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PROFESSION_COLORS[build.bars[0].primary as keyof typeof PROFESSION_COLORS] }}
                  />
                  {build.bars[0].hero}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Team Build View - Stacked Cards */}
      {!isSingleBuild && (
        <div className="space-y-4 mb-8">
          {build.bars.map((bar, index) => (
            <HeroBuildCard
              key={index}
              bar={bar}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Notes */}
      {build.notes && build.notes.content && build.notes.content.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary mb-3">
            Notes
          </h2>
          <NotesRenderer notes={build.notes} />
        </section>
      )}

      {/* Footer */}
      <footer className="flex items-center justify-between pt-6 border-t border-border text-sm text-text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {build.view_count.toLocaleString()} views
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {new Date(build.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        <button className="text-text-secondary hover:text-text-primary transition-colors">
          Report
        </button>
      </footer>

      {/* Action Bar */}
      <ActionBar
        buildId={build.id}
        templateCodes={templateCodes}
        isOwner={isOwner}
      />
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Single builds display correctly
- [ ] Team builds show accordion
- [ ] Skills, attributes, template visible
- [ ] Notes render properly
- [ ] View count shows
- [ ] Action bar at bottom

---

### Task 2.10: Create 404 Page

**Create `app/(main)/b/[id]/not-found.tsx`:**

```typescript
/**
 * @fileoverview 404 page for missing builds
 * @module app/(main)/b/[id]/not-found
 * 
 * Displayed when getBuildById returns null. Provides friendly
 * message and navigation back to build listing.
 */
import Link from 'next/link'

/**
 * Build not found page
 * 
 * Next.js automatically renders this when notFound() is called
 * from the page component.
 */
export default function BuildNotFound() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        Build not found
      </h1>
      <p className="text-text-secondary mb-6">
        This build may have been deleted or never existed.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg-primary rounded-lg font-medium hover:bg-accent-gold-bright transition-colors"
      >
        Browse builds
      </Link>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] 404 page displays for missing builds
- [ ] Link back to homepage

---

### Task 2.11: Add Loading State

**Create `app/(main)/b/[id]/loading.tsx`:**

```typescript
/**
 * @fileoverview Loading skeleton for build page
 * @module app/(main)/b/[id]/loading
 * 
 * Displayed by Next.js while the async page component loads.
 * Skeleton matches the page layout to prevent layout shift.
 */

/**
 * Build page loading skeleton
 * 
 * Uses animated pulse effect on placeholder elements.
 * Layout matches BuildPage structure for smooth transition.
 */
export default function BuildLoading() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-bg-card rounded animate-pulse mb-6" />

      {/* Header skeleton */}
      <div className="mb-6">
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-20 bg-bg-card rounded animate-pulse" />
          <div className="h-6 w-16 bg-bg-card rounded animate-pulse" />
        </div>
        <div className="h-8 w-64 bg-bg-card rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-bg-card rounded animate-pulse" />
      </div>

      {/* Skill bar skeleton */}
      <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
        <div className="h-3 w-20 bg-bg-elevated rounded animate-pulse mb-4" />
        <div className="flex gap-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="w-14 h-14 bg-bg-elevated rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Template skeleton */}
      <div className="flex gap-2 mb-8">
        <div className="flex-1 h-10 bg-bg-card rounded-lg animate-pulse" />
        <div className="w-20 h-10 bg-bg-card rounded-lg animate-pulse" />
      </div>

      {/* Notes skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-bg-card rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-bg-card rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-bg-card rounded animate-pulse" />
      </div>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Loading skeleton matches layout
- [ ] Smooth animation
- [ ] Prevents layout shift

---

### Task 2.12: Add Meta Tags for SEO

**Update `app/(main)/b/[id]/page.tsx` to include metadata:**

Add this function above the page component to generate dynamic SEO metadata.

```typescript
import type { Metadata } from 'next'
import { getBuildById } from '@/lib/services/builds'

/**
 * Generates dynamic metadata for build pages
 * 
 * Called by Next.js at request time to populate <head> tags.
 * Fetches build data (cached/deduped with page fetch).
 * 
 * @see https://nextjs.org/docs/app/api-reference/functions/generate-metadata
 */
export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const build = await getBuildById(params.id)
  
  if (!build) {
    return {
      title: 'Build not found — GW1 Builds',
    }
  }

  const description = build.bars.length > 1
    ? `${build.bars.length}-hero team build for Guild Wars 1`
    : `${build.bars[0].primary} build for Guild Wars 1`

  return {
    title: `${build.name} — GW1 Builds`,
    description,
    openGraph: {
      title: build.name,
      description,
      type: 'article',
      url: `/b/${build.id}`,
    },
    twitter: {
      card: 'summary',
      title: build.name,
      description,
    },
  }
}
```

**Acceptance Criteria:**
- [ ] Page title includes build name
- [ ] OpenGraph tags set
- [ ] Twitter card tags set

---

## Completion Checklist

- [x] Skill component with tooltip
- [x] Skill bar (full and compact)
- [x] Attributes display
- [x] Template code with copy
- [x] Notes renderer
- [x] Hero build accordion card
- [x] Tag component
- [x] Action bar (floating)
- [x] Build page complete
- [x] 404 page
- [x] Loading skeleton
- [x] SEO meta tags
- [x] Ready for PRD-03
