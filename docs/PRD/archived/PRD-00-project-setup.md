# PRD-00: Project Setup

## Overview

Scaffold the Next.js project, configure all tooling, establish design system, and deploy to Vercel.

## Dependencies

- None (this is the first PRD)

## Outcomes

- [x] Next.js 16.1.1 project running locally
- [x] All dependencies installed
- [x] Tailwind configured with design tokens
- [x] Project deployed to Vercel
- [x] Supabase project created and connected
- [x] Environment variables configured

---

## Tasks

### Task 0.1: Verify Project Structure

**Project is already scaffolded. Verify the setup:**

```bash
# Ensure you're in the project root
cd buildwarsreforged

# Verify it runs
npm run dev
```

**Current stack (already configured):**
- Next.js 16.1.1 with App Router
- React 19
- TypeScript 5.7.2
- Tailwind CSS 4.0.0
- Geist font
- ESLint + Prettier

**Acceptance Criteria:**
- [x] Project runs with `npm run dev`
- [x] TypeScript configured with strict mode
- [x] App Router structure in `/app`

---

### Task 0.2: Install Dependencies

**Install required packages (only 9 new packages):**

```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Editor
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder

# UI & Forms
npm install framer-motion sonner react-hook-form lucide-react nanoid
```

**Updated package.json dependencies should look like:**

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.47.0",
    "@tiptap/extension-mention": "^2.11.0",
    "@tiptap/extension-placeholder": "^2.11.0",
    "@tiptap/react": "^2.11.0",
    "@tiptap/starter-kit": "^2.11.0",
    "clsx": "^2.1.1",
    "framer-motion": "^11.15.0",
    "geist": "^1.3.1",
    "lucide-react": "^0.468.0",
    "nanoid": "^5.0.9",
    "next": "^16.1.1",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.54.2",
    "sonner": "^1.7.1",
    "tailwind-merge": "^2.5.5"
  }
}
```

**Acceptance Criteria:**
- [x] All packages in package.json
- [x] No version conflicts
- [x] `npm run build` succeeds

---

### Task 0.3: Configure Tailwind Design System

**Note:** Tailwind CSS v4 uses CSS-first configuration with `@theme` blocks in your CSS file instead of `tailwind.config.ts`. The minimal `tailwind.config.ts` is only needed for content paths.

**Update `app/globals.css` with custom design tokens using `@theme`:**

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg-primary: #121214;
  --color-bg-secondary: #1a1a1c;
  --color-bg-card: #222225;
  --color-bg-elevated: #2a2a2d;
  --color-bg-hover: #323235;

  /* Text */
  --color-text-primary: #f0f0f0;
  --color-text-secondary: #a0a0a5;
  --color-text-muted: #606065;

  /* Accents */
  --color-accent-gold: #e8b849;
  --color-accent-gold-dim: #c9a03d;
  --color-accent-gold-bright: #f4cf67;
  --color-accent-purple: #a78bda;
  --color-accent-purple-dim: #8b6fc4;
  --color-accent-blue: #5b9bd5;
  --color-accent-green: #5bb98b;
  --color-accent-red: #e05555;

  /* Borders */
  --color-border: #3a3a3d;
  --color-border-subtle: #2a2a2d;
  --color-border-hover: #4a4a4d;

  /* Fonts */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**Acceptance Criteria:**
- [x] Custom colors available as Tailwind classes
- [x] Font families configured
- [x] Can use `bg-bg-primary`, `text-accent-gold`, etc.

---

### Task 0.4: Verify Utility Functions

**The scaffolded project already includes `lib/utils.ts` with the `cn()` function.**

Verify it exists and add any additional utilities needed:

```typescript
// lib/utils.ts (already exists with cn())
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add this function for relative time formatting
export function timeAgo(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
```

**Note:** `clsx` and `tailwind-merge` are already installed in your project.

**Acceptance Criteria:**
- [x] `cn()` function works for merging Tailwind classes
- [x] `timeAgo()` formats dates nicely
- [x] Exported from lib/utils

---

### Task 0.5: Setup Global Styles

**Update `app/globals.css`.**

Note: The `@theme` block from Task 0.3 should be at the top of this file. Add the following styles below it:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

/* @theme block goes here - see Task 0.3 */

body {
  @apply bg-bg-primary text-text-primary font-sans antialiased;
}

/* Subtle grid background */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(#2a2a2d 1px, transparent 1px),
    linear-gradient(90deg, #2a2a2d 1px, transparent 1px);
  background-size: 48px 48px;
  opacity: 0.3;
  pointer-events: none;
  z-index: -1;
}

/* Selection color */
::selection {
  @apply bg-accent-gold text-bg-primary;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  @apply bg-bg-secondary;
}

::-webkit-scrollbar-thumb {
  @apply bg-border rounded-full;
}

::-webkit-scrollbar-thumb:hover {
  @apply bg-border-hover;
}
```

**Acceptance Criteria:**
- [x] Fonts load correctly
- [x] Background grid visible
- [x] Custom selection color works

---

### Task 0.6: Create Supabase Project

**Set up Supabase project and configure environment.**

1. Go to https://supabase.com and create new project
2. Name: `gw1-builds`
3. Choose region closest to target users
4. Generate a strong database password (save it)
5. Wait for project to provision

**Get credentials from Project Settings → API:**
- Project URL
- Anon/Public key
- Service Role key (for server-side)

**Acceptance Criteria:**
- [x] Supabase project created
- [x] Can access Supabase dashboard
- [x] Have all API credentials

---

### Task 0.7: Configure Environment Variables

**Create `.env.local` (never commit this):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Create `.env.example` (commit this):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=
```

**Update `.gitignore`:**

```
.env.local
.env.*.local
```

**Acceptance Criteria:**
- [x] `.env.local` created with real values
- [x] `.env.example` committed without secrets
- [x] Environment variables accessible in app

---

### Task 0.8: Create Supabase Client

**Create `lib/supabase/client.ts` (browser client):**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**Create `lib/supabase/server.ts` (server client):**

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

**Acceptance Criteria:**
- [x] Browser client connects to Supabase
- [x] Server client works in Server Components
- [x] No TypeScript errors

---

### Task 0.9: Setup Providers and Toaster

**Update `app/layout.tsx` to include Sonner toaster:**

```typescript
import { Toaster } from 'sonner'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata = {
  title: 'GW1 Builds',
  description: 'Share Guild Wars 1 builds',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="font-sans">
        {children}
        <Toaster 
          position="bottom-right" 
          theme="dark"
          toastOptions={{
            style: {
              background: '#222225',
              border: '1px solid #3a3a3d',
              color: '#f0f0f0',
            },
          }}
        />
      </body>
    </html>
  )
}
```

**Acceptance Criteria:**
- [x] Sonner toasts working
- [x] Geist fonts applied
- [x] No hydration errors

---

### Task 0.10: Create Folder Structure

**Establish the project structure:**

```
app/
├── (auth)/
│   └── login/
├── (main)/
│   ├── page.tsx          # Homepage
│   ├── new/
│   └── b/[id]/
├── api/
├── layout.tsx
└── globals.css
components/
├── ui/                   # Reusable UI components
├── build/                # Build-specific components
├── editor/               # TipTap editor components
├── layout/               # Header, footer, etc.
└── providers/
lib/
├── supabase/
├── gw/                   # GW1-specific utilities
├── utils.ts
└── constants.ts
hooks/                    # Custom React hooks
types/                    # TypeScript types
```

**Acceptance Criteria:**
- [x] All folders created (hooks/, components/build/, components/editor/, components/providers/, lib/gw/)
- [x] README or .gitkeep in empty folders

---

### Task 0.11: Deploy to Vercel

**Deploy the initial project.**

1. Push code to GitHub repository
2. Go to https://vercel.com
3. Import the repository
4. Configure environment variables (same as .env.local)
5. Deploy

**Acceptance Criteria:**
- [x] Site accessible at Vercel URL
- [x] No build errors
- [x] Environment variables configured in Vercel dashboard

---

### Task 0.12: Create Basic Layout Components

**Create `components/layout/header.tsx`:**

```typescript
import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b border-border bg-bg-secondary sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-accent-gold">
          <div className="w-6 h-6 bg-accent-gold rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-bg-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          GW1<span className="text-text-muted font-medium">Builds</span>
        </Link>
        
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm text-text-secondary hover:text-text-primary">
            Browse
          </Link>
          <Link
            href="/new"
            className="text-sm font-medium px-3 py-1.5 bg-accent-gold text-bg-primary rounded-lg hover:bg-accent-gold-bright"
          >
            + New Build
          </Link>
        </nav>
      </div>
    </header>
  )
}
```

**Acceptance Criteria:**
- [x] Header renders correctly
- [x] Links work
- [x] Responsive on mobile

---

### Task 0.13: Configure AI Development Patterns

**This project is optimized for AI-assisted development. Establish conventions that help LLMs understand and generate code correctly.**

#### File Header Convention

Every TypeScript file should start with a JSDoc block explaining its purpose:

```typescript
/**
 * @fileoverview [Brief description of what this file does]
 * @module [path/to/module]
 * 
 * [Longer description if needed - explain WHY this exists, not just WHAT]
 * 
 * @see [related files]
 * @example
 * // How to use this module
 */
```

**Example for a service file:**

```typescript
/**
 * @fileoverview Build CRUD operations and database queries
 * @module lib/services/builds
 * 
 * Handles all build-related database operations using Supabase.
 * Uses RLS policies for authorization - callers don't need to check permissions.
 * 
 * @see types/database.ts - Build type definitions
 * @see lib/supabase/server.ts - Database client
 */
```

#### Component Documentation Pattern

React components should document their purpose and props:

```typescript
/**
 * Displays a single GW1 skill with hover tooltip
 * 
 * @component
 * @example
 * <Skill skillId={152} size="lg" isElite />
 */
interface SkillProps {
  /** GW1 skill ID from the skills database */
  skillId: number
  /** Visual size - affects icon dimensions */
  size?: 'sm' | 'md' | 'lg'
  /** Shows gold border for elite skills */
  isElite?: boolean
  /** Disables hover tooltip */
  showTooltip?: boolean
}
```

#### Guard Clause Pattern

Use early returns with descriptive logging:

```typescript
export async function getBuildById(id: string): Promise<Build | null> {
  // Guard: Validate ID format
  if (!id || id.length !== 7) {
    console.warn(`[getBuildById] Invalid ID format: "${id}"`)
    return null
  }

  // Guard: Check authentication if needed
  const user = await getUser()
  if (!user) {
    console.warn('[getBuildById] No authenticated user')
    return null
  }

  // Main logic after guards pass
  const { data, error } = await supabase.from('builds')...
}
```

#### Domain Context Comments

For GW1-specific logic, always include context:

```typescript
/**
 * Maximum attribute points available at level 20
 * 
 * Players get 200 base points. Can reach 0-12 in any attribute,
 * or 0-16 with a superior rune (+3) and headgear (+1).
 * 
 * @see https://wiki.guildwars.com/wiki/Attribute_point
 */
export const MAX_ATTRIBUTE_POINTS = 200
```

#### Create AI Command Templates

**Create `.claude/commands/gw1-research.md`:**

```markdown
Research the following Guild Wars 1 mechanic or skill:

$ARGUMENTS

Steps:
1. Check if information exists in types/gw1.ts or lib/gw/
2. If not found, search the GW1 Wiki at wiki.guildwars.com
3. Verify any numbers or mechanics before implementing
4. Add source links in code comments

Never assume GW1 mechanics - always verify with wiki or codebase.
```

**Create `.claude/commands/new-component.md`:**

```markdown
Create a new React component: $ARGUMENTS

Requirements:
1. Add file header with @fileoverview
2. Document all props with JSDoc
3. Use TypeScript strict types
4. Follow existing component patterns in components/
5. Use cn() for conditional classNames
6. Include accessibility attributes (aria-*, role)
```

**Acceptance Criteria:**
- [x] File header convention documented (in CLAUDE.md)
- [x] Guard clause pattern established (in CLAUDE.md)
- [x] Domain context comment examples provided (in CLAUDE.md)
- [x] `.claude/commands/` templates created

---

## Completion Checklist

- [x] All tasks completed
- [x] `npm run dev` works
- [x] `npm run build` succeeds
- [x] Deployed to Vercel
- [x] Supabase connected
- [x] AI development patterns configured
- [x] Ready for PRD-01

**PRD-00 Complete ✓**
