# PRD-05: Build Editing

## Overview

Allow build owners to edit and delete their builds. Simple overwrites - no version history.

### AI Context

This PRD implements build editing. Key decisions:

1. **Ownership check** - Only build author can edit (verified server-side)
2. **Simple overwrite** - Edits replace the build, no versioning
3. **Soft delete** - Builds are marked deleted_at, not removed
4. **Reuse components** - Same editor components from PRD-04

**Security pattern:**
- Ownership verified in API route before any mutation
- Client-side check is UX only (shows error faster)
- RLS policies as additional layer

## Dependencies

- PRD-00 through PRD-04 completed

## Outcomes

- [ ] Edit page at `/b/[id]/edit`
- [ ] Only owners can access edit page
- [ ] Save overwrites existing build
- [ ] Can delete builds (soft delete)

---

## Tasks

### Task 5.1: Create Edit Page

**Create `app/(main)/b/[id]/edit/page.tsx`:**

```typescript
/**
 * @fileoverview Build edit page
 * @module app/(main)/b/[id]/edit/page
 * 
 * Allows build owner to edit their build. Protected route.
 * Reuses editor components from build creation.
 * 
 * @security Ownership verified both client-side (UX) and server-side (API)
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { SkillBarEditor } from '@/components/editor/skill-bar-editor'
import { NotesEditor } from '@/components/editor/notes-editor'
import { TagSelector } from '@/components/editor/tag-selector'
import type { Build, SkillBar, TipTapDocument } from '@/types'

interface EditPageProps {
  params: { id: string }
}

export default function EditBuildPage({ params }: EditPageProps) {
  const { user } = useAuth()
  const router = useRouter()
  
  const [build, setBuild] = useState<Build | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState('')
  const [bars, setBars] = useState<SkillBar[]>([])
  const [notes, setNotes] = useState<TipTapDocument>({ type: 'doc', content: [] })
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    fetchBuild()
  }, [params.id])

  async function fetchBuild() {
    try {
      const response = await fetch(`/api/builds/${params.id}`)
      if (!response.ok) {
        router.push('/404')
        return
      }
      
      const data = await response.json()
      
      // Check ownership
      if (data.author_id !== user?.id) {
        toast.error('You can only edit your own builds')
        router.push(`/b/${params.id}`)
        return
      }
      
      setBuild(data)
      setName(data.name)
      setBars(data.bars)
      setNotes(data.notes)
      setTags(data.tags)
    } catch (error) {
      console.error('Failed to fetch build:', error)
      router.push('/404')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Please enter a build name')
      return
    }

    const validBars = bars.filter((bar) => bar.skills.length > 0)
    if (validBars.length === 0) {
      toast.error('Please add at least one skill bar')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/builds/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          notes,
          tags,
          bars: validBars,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save')
      }

      toast.success('Build saved!')
      router.push(`/b/${params.id}`)
    } catch (error) {
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this build?')) {
      return
    }

    try {
      const response = await fetch(`/api/builds/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      toast.success('Build deleted')
      router.push('/')
    } catch (error) {
      toast.error('Failed to delete. Please try again.')
    }
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-bg-card rounded w-48" />
          <div className="h-12 bg-bg-card rounded" />
          <div className="h-64 bg-bg-card rounded" />
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Edit Build</h1>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-accent-red hover:bg-accent-red/10 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>

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
                onChange={(updated) => {
                  const newBars = [...bars]
                  newBars[index] = updated
                  setBars(newBars)
                }}
                onRemove={() => setBars(bars.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Notes
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
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent-gold text-bg-primary rounded-lg font-medium hover:bg-accent-gold-bright transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          
          <button
            onClick={() => router.push(`/b/${params.id}`)}
            className="px-4 py-2.5 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  )
}
```

**Acceptance Criteria:**
- [ ] Loads existing build data
- [ ] Only owner can access
- [ ] Save updates build
- [ ] Delete soft-deletes build

---

### Task 5.2: Create Update API Route

**Create `app/api/builds/[id]/route.ts`:**

```typescript
/**
 * @fileoverview Build CRUD API endpoints
 * @module app/api/builds/[id]/route
 * 
 * GET /api/builds/[id] - Fetch single build
 * PATCH /api/builds/[id] - Update build (owner only, overwrites)
 * DELETE /api/builds/[id] - Soft delete build (owner only)
 * 
 * @security All mutations check ownership before proceeding
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Validates build update request body */
function validateBuildUpdate(body: any): { valid: boolean; error?: string } {
  if (!body.name || typeof body.name !== 'string') {
    return { valid: false, error: 'Name is required' }
  }
  if (body.name.length < 3 || body.name.length > 100) {
    return { valid: false, error: 'Name must be 3-100 characters' }
  }
  if (!Array.isArray(body.bars) || body.bars.length === 0 || body.bars.length > 8) {
    return { valid: false, error: 'Must have 1-8 skill bars' }
  }
  return { valid: true }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('builds')
    .select('*, author:users(id, display_name, avatar_url)')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  
  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check ownership
  const { data: build } = await supabase
    .from('builds')
    .select('author_id')
    .eq('id', params.id)
    .single()

  if (!build || build.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse and validate body
  const body = await request.json()
  const validation = validateBuildUpdate(body)
  
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Update build (simple overwrite, no versioning)
  const { error } = await supabase
    .from('builds')
    .update({
      name: body.name,
      notes: body.notes || {},
      tags: body.tags || [],
      bars: body.bars,
    })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }

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

  // Check ownership
  const { data: build } = await supabase
    .from('builds')
    .select('author_id')
    .eq('id', params.id)
    .single()

  if (!build || build.author_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Soft delete
  const { error } = await supabase
    .from('builds')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

**Acceptance Criteria:**
- [ ] GET returns build data
- [ ] PATCH updates build (overwrites)
- [ ] DELETE soft-deletes
- [ ] All check ownership

---

### Task 5.3: OG Image Generation on Save

Generate Open Graph preview images when builds are saved, for social media sharing.

**Prerequisites:**
1. Create `og-images` bucket in Supabase Storage (public access)

**Implementation:**

The utility is already created at `lib/services/og-image.ts`. Hook it into the save flow:

```typescript
// In handleSave() after successful API response:
import { captureAndUploadOGImage } from '@/lib/services/og-image'

// After save succeeds, capture the TeamOverview component
if (overviewRef.current) {
  captureAndUploadOGImage(overviewRef.current, params.id)
    .catch(() => {}) // Fire and forget - don't block navigation
}
```

**Update metadata in `app/b/[id]/page.tsx`:**

```typescript
import { getOGImageUrl } from '@/lib/services/og-image'

// In generateMetadata():
return {
  // ... existing metadata
  openGraph: {
    // ... existing fields
    images: [
      {
        url: getOGImageUrl(build.id),
        width: 1200,
        height: 630,
        alt: build.name,
      },
    ],
  },
}
```

**On delete, cleanup the image:**

```typescript
import { deleteOGImage } from '@/lib/services/og-image'

// In handleDelete() after successful API response:
deleteOGImage(params.id).catch(() => {})
```

**Acceptance Criteria:**
- [ ] Supabase Storage bucket `og-images` created (public)
- [ ] OG image captured on build save
- [ ] OG image URL in page metadata
- [ ] OG image deleted on build delete

**Notes:**
- Images stored at: `og-images/{buildId}.png`
- Utility file: `lib/services/og-image.ts`
- Uses `html-to-image` (already installed for TeamOverview "Copy Image")
- Fire-and-forget pattern - don't block user navigation

---

## Completion Checklist

- [ ] Edit page works
- [ ] Update API overwrites build
- [ ] Delete API soft-deletes
- [ ] OG images generated on save
- [ ] Ready for PRD-06
