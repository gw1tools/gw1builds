# PRD-06: Homepage & Discovery

## Overview

Create the homepage with popular and recent builds feeds.

### AI Context

This PRD implements build discovery. Key decisions:

1. **"Load more" button** - Simple pagination, no infinite scroll complexity
2. **Popular vs Recent tabs** - Two sort modes (star_count vs created_at)
3. **Build cards** - Compact preview with skill bar abbreviations
4. **No type filters** - Simplify for MVP, add later if needed

**Data flow:**
```
Homepage (state: tab)
  ↓
BuildFeed (fetches /api/builds)
  ↓
BuildCard[] (renders each build)
```

## Dependencies

- PRD-00 through PRD-05 completed

## Outcomes

- [ ] Homepage displays at `/`
- [ ] Popular builds tab (sorted by star_count)
- [ ] Recent builds tab (sorted by created_at)
- [ ] "Load more" pagination

---

## Tasks

### Task 6.1: Create Build Card Component

**Create `components/build/build-card.tsx`:**

```typescript
/**
 * @fileoverview Build card for listing pages
 * @module components/build/build-card
 * 
 * Compact build preview showing name, author, stats, and skill preview.
 * Used in homepage feeds.
 */
import Link from 'next/link'
import { Star, Eye, Users } from 'lucide-react'
import { Tag } from '@/components/ui/tag'
import { SkillBarCompact } from './skill-bar-compact'
import { PROFESSION_COLORS } from '@/lib/constants'
import type { BuildListItem } from '@/types'

interface BuildCardProps {
  build: BuildListItem
}

export function BuildCard({ build }: BuildCardProps) {
  const isTeam = build.bars.length > 1
  const primaryProfession = build.bars[0]?.primary

  return (
    <Link
      href={`/b/${build.id}`}
      className="block bg-bg-card border border-border rounded-xl p-4 hover:border-border-hover transition-all hover:shadow-lg group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isTeam ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-blue">
                <Users className="w-3 h-3" />
                {build.bars.length}
              </span>
            ) : (
              <span
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: PROFESSION_COLORS[primaryProfession as keyof typeof PROFESSION_COLORS] }}
              />
            )}
            <h3 className="font-semibold text-text-primary truncate group-hover:text-accent-gold transition-colors">
              {build.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            {build.author && (
              <span className="text-xs text-text-muted">
                by {build.author.display_name}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            {build.star_count}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {build.view_count}
          </span>
        </div>
      </div>

      {/* Skill bar preview (first bar only) */}
      {build.bars[0] && (
        <div className="mb-3">
          <SkillBarCompact bar={build.bars[0] as any} />
        </div>
      )}

      {/* Tags */}
      {build.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {build.tags.slice(0, 4).map((tag) => (
            <Tag key={tag} tag={tag} size="sm" />
          ))}
          {build.tags.length > 4 && (
            <span className="text-xs text-text-muted">+{build.tags.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  )
}
```

**Acceptance Criteria:**
- [ ] Card displays build info
- [ ] Shows star/view counts
- [ ] Shows skill bar preview
- [ ] Links to build page

---

### Task 6.2: Create Build Feed Component

**Create `components/build/build-feed.tsx`:**

```typescript
/**
 * @fileoverview Build feed with "Load more" pagination
 * @module components/build/build-feed
 * 
 * Fetches and displays paginated builds.
 * Simple "Load more" button instead of infinite scroll.
 */
'use client'

import { useState, useEffect, useCallback } from 'react'
import { BuildCard } from './build-card'
import { Loader2 } from 'lucide-react'
import type { BuildListItem } from '@/types'

interface BuildFeedProps {
  type: 'popular' | 'recent'
}

export function BuildFeed({ type }: BuildFeedProps) {
  const [builds, setBuilds] = useState<BuildListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(false)
  const [nextOffset, setNextOffset] = useState<number | null>(null)

  // Fetch builds
  const fetchBuilds = useCallback(async (offset = 0, append = false) => {
    try {
      if (append) setLoadingMore(true)
      else setLoading(true)

      const params = new URLSearchParams({
        type,
        offset: String(offset),
        limit: '20',
      })
      const response = await fetch(`/api/builds?${params}`)
      const data = await response.json()

      if (append) {
        setBuilds(prev => [...prev, ...data.builds])
      } else {
        setBuilds(data.builds)
      }
      setNextOffset(data.nextOffset)
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [type])

  // Initial load and when tab changes
  useEffect(() => {
    setBuilds([])
    setNextOffset(null)
    fetchBuilds(0, false)
  }, [type, fetchBuilds])

  // Handle load more
  const handleLoadMore = () => {
    if (nextOffset !== null && !loadingMore) {
      fetchBuilds(nextOffset, true)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-40 bg-bg-card rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12 text-text-muted">
        Failed to load builds. Please try again.
      </div>
    )
  }

  if (builds.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted">
        No builds found.
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {builds.map((build) => (
          <BuildCard key={build.id} build={build} />
        ))}
      </div>

      {/* Load more button */}
      {nextOffset !== null && (
        <div className="flex justify-center py-8">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-bg-card border border-border rounded-lg font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors disabled:opacity-50"
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </button>
        </div>
      )}
    </>
  )
}
```

**Acceptance Criteria:**
- [ ] Shows loading skeletons
- [ ] "Load more" button works
- [ ] Handles errors gracefully

---

### Task 6.3: Create Homepage

**Create `app/(main)/page.tsx`:**

```typescript
/**
 * @fileoverview Homepage with build discovery feeds
 * @module app/(main)/page
 * 
 * Landing page showing popular/recent builds.
 * Primary entry point for browsing builds.
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Flame, Clock } from 'lucide-react'
import { BuildFeed } from '@/components/build/build-feed'
import { cn } from '@/lib/utils'

type Tab = 'popular' | 'recent'

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('popular')

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <section className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          Share Guild Wars 1 Builds
        </h1>
        <p className="text-text-secondary text-lg mb-6 max-w-xl mx-auto">
          Paste your template code, add notes, and share with a link.
          No signup required to browse.
        </p>
        <Link
          href="/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-accent-gold text-bg-primary rounded-lg font-semibold hover:bg-accent-gold-bright transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Build
        </Link>
      </section>

      {/* Tabs */}
      <div className="flex justify-center mb-6">
        <div className="flex gap-1 bg-bg-secondary p-1 rounded-lg">
          <button
            onClick={() => setTab('popular')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === 'popular'
                ? 'bg-bg-card text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Flame className="w-4 h-4" />
            Popular
          </button>
          <button
            onClick={() => setTab('recent')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors',
              tab === 'recent'
                ? 'bg-bg-card text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
        </div>
      </div>

      {/* Feed */}
      <BuildFeed type={tab} />
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Hero section with CTA
- [ ] Popular/Recent tabs
- [ ] Feed displays correctly

---

### Task 6.4: Create Builds List API

**Update `app/api/builds/route.ts`:**

```typescript
/**
 * @fileoverview Builds list API
 * @module app/api/builds/route
 * 
 * GET /api/builds - List builds with pagination
 * Supports popular (by stars) and recent (by date) sorting.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'popular'
  const offset = parseInt(searchParams.get('offset') || '0')
  const limit = parseInt(searchParams.get('limit') || '20')

  const supabase = await createClient()

  let query = supabase
    .from('builds')
    .select(`
      id, name, tags, bars, star_count, view_count, created_at,
      author:users(display_name, avatar_url)
    `)
    .is('deleted_at', null)

  // Order by type
  if (type === 'popular') {
    query = query.order('star_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  // Pagination
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }

  const nextOffset = data.length === limit ? offset + limit : null

  return NextResponse.json({
    builds: data,
    nextOffset,
  })
}
```

**Acceptance Criteria:**
- [ ] Returns paginated builds
- [ ] Supports popular vs recent sorting
- [ ] Correct pagination

---

## Completion Checklist

- [ ] Build card component
- [ ] Build feed with "Load more"
- [ ] Homepage with hero
- [ ] Popular/Recent tabs
- [ ] Pagination API
- [ ] Ready for PRD-07
