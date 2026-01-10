# PRD-09: Polish & UX

## Overview

Final polish pass: page transitions, error handling, mobile responsiveness, and dynamic OG images for social sharing.

### AI Context

This PRD adds polish and production-readiness features. Key decisions:

1. **Framer Motion** - Page transitions only (no complex micro-interactions)
2. **Error boundaries** - Graceful error handling with recovery
3. **Mobile-first** - Responsive down to 320px
4. **Dynamic OG images** - Generated preview images showing build name, skills, and author

**Polish priorities:**
- Performance over animation complexity
- Accessible interactions (focus states, ARIA)
- Progressive enhancement (works without JS where possible)

**Deferred to v2:**
- Keyboard shortcuts
- Animated skill bar stagger
- Complex micro-interactions

## Dependencies

- PRD-00 through PRD-07 completed

## Outcomes

- [ ] Smooth page transitions (Framer Motion)
- [ ] Comprehensive error handling
- [ ] Mobile-first responsive design
- [ ] Dynamic OG images for social sharing

---

## Tasks

### Task 9.1: Add Page Transitions with Framer Motion

**Create `components/providers/motion-provider.tsx`:**

```typescript
/**
 * @fileoverview Page transition animation provider
 * @module components/providers/motion-provider
 *
 * Wraps page content to animate transitions between routes.
 * Uses Framer Motion's AnimatePresence for exit animations.
 */
'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
```

**Update layout to include MotionProvider:**

```typescript
// In layout.tsx
<MotionProvider>
  {children}
</MotionProvider>
```

**Acceptance Criteria:**
- [ ] Pages fade in/out smoothly
- [ ] No layout shift during transitions

---

### Task 9.2: Create Error Boundary

**Create `components/error-boundary.tsx`:**

```typescript
/**
 * @fileoverview React error boundary for graceful error handling
 * @module components/error-boundary
 *
 * Catches JavaScript errors in child components and displays
 * a fallback UI instead of crashing the entire app.
 */
'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-accent-red mb-4" />
          <h2 className="text-xl font-bold text-text-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-text-secondary mb-6 max-w-md">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg-primary rounded-lg font-medium hover:bg-accent-gold-bright transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Create `app/error.tsx`:**

```typescript
/**
 * @fileoverview Root error page for unhandled errors
 * @module app/error
 *
 * Next.js error boundary page. Displayed when an error occurs
 * that isn't caught by a more specific error boundary.
 */
'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-accent-red mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Something went wrong
        </h1>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          We hit an unexpected error. This has been logged and we'll look into it.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg-primary rounded-lg font-medium hover:bg-accent-gold-bright transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-card border border-border text-text-primary rounded-lg font-medium hover:bg-bg-hover transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </Link>
        </div>
      </div>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Errors don't crash the app
- [ ] User-friendly error messages
- [ ] Retry and home options

---

### Task 9.3: Mobile Responsive Audit

**Create `styles/responsive.css` (add to globals):**

```css
/* Mobile-first responsive utilities */

/* Stack on mobile, row on desktop */
.stack-to-row {
  @apply flex flex-col gap-4;
}

@screen sm {
  .stack-to-row {
    @apply flex-row items-center;
  }
}

/* Hide on mobile */
.hide-mobile {
  @apply hidden sm:block;
}

/* Show only on mobile */
.show-mobile {
  @apply block sm:hidden;
}

/* Full width on mobile */
.mobile-full {
  @apply w-full sm:w-auto;
}

/* Skill bar responsive */
.skill-bar-responsive {
  @apply flex gap-0.5 sm:gap-1;
}

.skill-bar-responsive > * {
  @apply w-10 h-10 sm:w-12 sm:h-12;
}

/* Action bar mobile */
@media (max-width: 640px) {
  .action-bar {
    @apply left-4 right-4 translate-x-0;
  }
}
```

**Key responsive fixes:**

1. **Header**: Stack nav items on mobile
2. **Build page**: Full-width cards
3. **Skill bars**: Smaller on mobile (40px vs 48px)
4. **Action bar**: Full width on mobile
5. **Forms**: Full width inputs
6. **Cards**: Single column on mobile

**Acceptance Criteria:**
- [ ] All pages usable on 320px width
- [ ] No horizontal scroll
- [ ] Touch targets at least 44px
- [ ] Text readable without zoom

---

### Task 9.4: Dynamic OG Images

**Create `app/api/og/[id]/route.tsx`:**

```typescript
/**
 * @fileoverview Dynamic OpenGraph image generation
 * @module app/api/og/[id]/route
 *
 * Generates social preview images for build pages.
 * Shows build name, skill icons, author, and star count.
 * Uses Next.js ImageResponse for edge rendering.
 */
import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { getSkillById } from '@/lib/gw/skills'
import { PROFESSION_COLORS } from '@/lib/constants'

export const runtime = 'edge'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data: build } = await supabase
    .from('builds')
    .select(`
      name, bars, tags, star_count,
      author:users(display_name)
    `)
    .eq('id', params.id)
    .single()

  if (!build) {
    return new Response('Not found', { status: 404 })
  }

  const isTeam = build.bars.length > 1
  const primaryBar = build.bars[0]
  const professionColor = PROFESSION_COLORS[primaryBar?.primary as keyof typeof PROFESSION_COLORS] || '#a0a0a5'

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #121214 0%, #1a1a1c 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
          <div
            style={{
              width: 48,
              height: 48,
              background: '#e8b849',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 28, color: '#121214' }}>⚔</span>
          </div>
          <span style={{ fontSize: 28, color: '#e8b849', fontWeight: 700 }}>
            Build Wars Reforged
          </span>
        </div>

        {/* Build Name */}
        <div style={{ fontSize: 56, fontWeight: 700, color: '#f0f0f0', marginBottom: 16, lineHeight: 1.2 }}>
          {build.name}
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40 }}>
          {/* Profession badge */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8,
            padding: '8px 16px',
            background: `${professionColor}20`,
            border: `2px solid ${professionColor}`,
            borderRadius: 8,
          }}>
            <div style={{ width: 12, height: 12, background: professionColor, borderRadius: 4 }} />
            <span style={{ color: professionColor, fontSize: 18, fontWeight: 600, textTransform: 'uppercase' }}>
              {isTeam ? `${build.bars.length} Heroes` : `${primaryBar?.primary}/${primaryBar?.secondary}`}
            </span>
          </div>

          {/* Star count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e8b849', fontSize: 20 }}>
            <span>★</span>
            <span style={{ fontWeight: 600 }}>{build.star_count}</span>
          </div>

          {/* Author */}
          {build.author && (
            <span style={{ color: '#a0a0a5', fontSize: 18 }}>
              by {build.author.display_name}
            </span>
          )}
        </div>

        {/* Skill bar preview */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 40 }}>
          {primaryBar?.skills?.slice(0, 8).map((skillId: number, i: number) => {
            const skill = getSkillById(skillId)
            const skillProfession = skill?.profession || 'Unknown'
            const skillColor = PROFESSION_COLORS[skillProfession as keyof typeof PROFESSION_COLORS] || '#3a3a3d'
            
            return (
              <div
                key={i}
                style={{
                  width: 56,
                  height: 56,
                  background: `linear-gradient(180deg, ${skillColor}40 0%, ${skillColor}20 100%)`,
                  border: i === 0 ? '3px solid #e8b849' : '2px solid #3a3a3d',
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ 
                  fontSize: 10, 
                  color: '#f0f0f0', 
                  textAlign: 'center',
                  fontWeight: 500,
                  padding: 4,
                }}>
                  {skill?.name?.split(' ').slice(0, 2).join('\n') || '?'}
                </span>
              </div>
            )
          })}
        </div>

        {/* Tags */}
        {build.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 10 }}>
            {build.tags.slice(0, 4).map((tag: string) => (
              <span
                key={tag}
                style={{
                  padding: '8px 14px',
                  background: '#2a2a2d',
                  border: '1px solid #3a3a3d',
                  borderRadius: 6,
                  color: '#a0a0a5',
                  fontSize: 14,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
```

**Update build page metadata:**

```typescript
// In app/(main)/b/[id]/page.tsx

export async function generateMetadata({ params }: BuildPageProps): Promise<Metadata> {
  const build = await getBuildById(params.id)

  if (!build) {
    return { title: 'Build not found — Build Wars Reforged' }
  }

  const isTeam = build.bars.length > 1
  const description = isTeam
    ? `${build.bars.length}-hero team build for Guild Wars 1`
    : `${build.bars[0].primary}/${build.bars[0].secondary} build for Guild Wars 1`

  const ogImageUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/og/${build.id}`

  return {
    title: `${build.name} — Build Wars Reforged`,
    description,
    openGraph: {
      title: build.name,
      description,
      type: 'article',
      url: `/b/${build.id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${build.name} - GW1 Build`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: build.name,
      description,
      images: [ogImageUrl],
    },
  }
}
```

**Acceptance Criteria:**
- [ ] OG images generate dynamically
- [ ] Shows build name prominently
- [ ] Shows skill icons for first bar
- [ ] Shows author name
- [ ] Shows star count
- [ ] Discord/Twitter show rich previews

---

### Task 9.5: Create 404 Page

**Create `app/not-found.tsx`:**

```typescript
/**
 * @fileoverview Custom 404 page
 * @module app/not-found
 *
 * Displayed when a page or resource is not found.
 * Provides helpful links to navigate back.
 */
import Link from 'next/link'
import { Search, Home, Plus } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-accent-gold mb-4">404</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Build not found
        </h1>
        <p className="text-text-secondary mb-8 max-w-md mx-auto">
          This build may have been deleted or the link might be incorrect.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-gold text-bg-primary rounded-lg font-medium hover:bg-accent-gold-bright transition-colors"
          >
            <Home className="w-4 h-4" />
            Browse Builds
          </Link>
          <Link
            href="/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-bg-card border border-border text-text-primary rounded-lg font-medium hover:bg-bg-hover transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Build
          </Link>
        </div>
      </div>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Shows friendly 404 message
- [ ] Links to browse and create

---

## Completion Checklist

- [ ] Page transitions smooth
- [ ] Error boundary catches errors
- [ ] Mobile responsive verified
- [ ] Dynamic OG images generate
- [ ] 404 page works
- [ ] Ready for launch
