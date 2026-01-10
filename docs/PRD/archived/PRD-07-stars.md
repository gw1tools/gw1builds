# PRD-07: Stars & Engagement

## Overview

Implement the star system for build curation. Users can star builds they like, and star counts influence the Popular feed.

### AI Context

This PRD implements user engagement features. Key decisions:

1. **Optimistic UI** - Star toggles instantly, reverts on API error
2. **Denormalized count** - star_count on builds for fast sorting
3. **SQL functions** - Atomic increment/decrement via RPC
4. **No report system for MVP** - Defer moderation tools to v2

**Star flow:**
```
User clicks star
  ↓ (optimistic update)
UI updates immediately
  ↓
API call POST/DELETE /api/builds/[id]/star
  ↓
RPC increment/decrement_star_count
  ↓
On error: revert UI state
```

## Dependencies

- PRD-00 through PRD-06 completed

## Outcomes

- [ ] Star button on build pages
- [ ] Optimistic UI updates
- [ ] Star count updates in real-time
- [ ] View count displayed on builds

---

## Tasks

### Task 7.1: Create Star Button Component

**Create `components/build/star-button.tsx`:**

```typescript
/**
 * @fileoverview Star button with optimistic updates
 * @module components/build/star-button
 *
 * Toggles star state for a build. Uses optimistic UI pattern
 * for instant feedback, reverting on API error.
 */
'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface StarButtonProps {
  buildId: string
  initialStarred: boolean
  initialCount: number
  size?: 'sm' | 'md' | 'lg'
}

export function StarButton({
  buildId,
  initialStarred,
  initialCount,
  size = 'md',
}: StarButtonProps) {
  const { user } = useAuth()
  const [starred, setStarred] = useState(initialStarred)
  const [count, setCount] = useState(initialCount)
  const [pending, setPending] = useState(false)

  const handleClick = async () => {
    if (!user) {
      toast.error('Sign in to star builds', {
        action: {
          label: 'Sign In',
          onClick: () => window.location.href = `/login?redirect=/b/${buildId}`,
        },
      })
      return
    }

    if (pending) return

    // Optimistic update
    const wasStarred = starred
    const prevCount = count
    setStarred(!starred)
    setCount(starred ? count - 1 : count + 1)
    setPending(true)

    try {
      const response = await fetch(`/api/builds/${buildId}/star`, {
        method: wasStarred ? 'DELETE' : 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to update star')
      }
    } catch {
      // Revert on error
      setStarred(wasStarred)
      setCount(prevCount)
      toast.error('Failed to update. Please try again.')
    } finally {
      setPending(false)
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className={cn(
        'inline-flex items-center rounded-lg font-medium transition-all',
        sizeClasses[size],
        starred
          ? 'bg-accent-gold/20 text-accent-gold border border-accent-gold-dim hover:bg-accent-gold/30'
          : 'bg-bg-card text-text-secondary border border-border hover:border-border-hover hover:text-text-primary',
        pending && 'opacity-50 cursor-not-allowed'
      )}
    >
      <Star
        className={cn(
          iconSizes[size],
          starred && 'fill-accent-gold'
        )}
      />
      <span>{count.toLocaleString()}</span>
    </button>
  )
}
```

**Acceptance Criteria:**
- [ ] Star toggles on click
- [ ] Optimistic UI updates
- [ ] Shows toast for unauthenticated users
- [ ] Count updates visually

---

### Task 7.2: Create Star API Routes

**Create `app/api/builds/[id]/star/route.ts`:**

```typescript
/**
 * @fileoverview Star toggle API endpoints
 * @module app/api/builds/[id]/star/route
 *
 * POST - Add star to build
 * DELETE - Remove star from build
 *
 * Uses RPC functions for atomic count updates.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if already starred
  const { data: existing } = await supabase
    .from('stars')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('build_id', params.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already starred' }, { status: 400 })
  }

  // Add star
  const { error: starError } = await supabase
    .from('stars')
    .insert({
      user_id: user.id,
      build_id: params.id,
    })

  if (starError) {
    return NextResponse.json({ error: 'Failed to star' }, { status: 500 })
  }

  // Increment star count
  await supabase.rpc('increment_star_count', { build_id: params.id })

  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Remove star
  const { error: deleteError } = await supabase
    .from('stars')
    .delete()
    .eq('user_id', user.id)
    .eq('build_id', params.id)

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to unstar' }, { status: 500 })
  }

  // Decrement star count
  await supabase.rpc('decrement_star_count', { build_id: params.id })

  return NextResponse.json({ success: true })
}
```

**Add SQL functions to Supabase:**

```sql
CREATE OR REPLACE FUNCTION increment_star_count(build_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE builds
  SET star_count = star_count + 1
  WHERE id = build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrement_star_count(build_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE builds
  SET star_count = GREATEST(star_count - 1, 0)
  WHERE id = build_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Acceptance Criteria:**
- [ ] POST adds star
- [ ] DELETE removes star
- [ ] Star count updates atomically
- [ ] Prevents duplicate stars

---

### Task 7.3: Add Star State to Build Page

**Update `app/(main)/b/[id]/page.tsx` to include star state:**

```typescript
// Add to the existing page.tsx

// Fetch if current user has starred
let hasStarred = false
if (user) {
  const { data: star } = await supabase
    .from('stars')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('build_id', params.id)
    .single()

  hasStarred = !!star
}

// Pass to component
<StarButton
  buildId={build.id}
  initialStarred={hasStarred}
  initialCount={build.star_count}
/>
```

**Acceptance Criteria:**
- [ ] Shows filled star if user has starred
- [ ] Works for logged out users (shows count only)

---

### Task 7.4: Update Action Bar with Star

**Update `components/build/action-bar.tsx`:**

```typescript
'use client'

import { useState } from 'react'
import { Copy, Share2, Pencil, Check } from 'lucide-react'
import { toast } from 'sonner'
import { StarButton } from './star-button'
import { cn } from '@/lib/utils'

interface ActionBarProps {
  buildId: string
  templateCodes: string[]
  isOwner?: boolean
  initialStarred?: boolean
  starCount?: number
}

export function ActionBar({
  buildId,
  templateCodes,
  isOwner = false,
  initialStarred = false,
  starCount = 0,
}: ActionBarProps) {
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
      <div className="flex items-center gap-1 p-1.5 bg-bg-card border border-border rounded-xl shadow-2xl">
        {/* Star */}
        <StarButton
          buildId={buildId}
          initialStarred={initialStarred}
          initialCount={starCount}
        />

        <div className="w-px h-6 bg-border mx-1" />

        {/* Copy */}
        <button
          onClick={handleCopyAll}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all',
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-accent-gold text-bg-primary hover:bg-accent-gold-bright'
          )}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {templateCodes.length > 1 ? `Copy All` : 'Copy'}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-all"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Edit (owner only) */}
        {isOwner && (
          <a
            href={`/b/${buildId}/edit`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-text-primary hover:bg-bg-hover transition-all"
          >
            <Pencil className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}
```

**Acceptance Criteria:**
- [ ] Star button in action bar
- [ ] Copy and share work
- [ ] Edit shows for owners only

---

## Completion Checklist

- [ ] Star button component
- [ ] Star API routes
- [ ] Star state on build page
- [ ] Updated action bar
- [ ] Ready for PRD-09
