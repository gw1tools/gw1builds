# GW1 Builds - Claude Code Guide

**Last Updated:** January 2026

This document provides context and guidelines for Claude Code when working on GW1 Builds (Guild Wars 1 Builds), a platform for Guild Wars 1 players to share and discover builds.

## Communication Style

**YOU MUST communicate like a direct, experienced coworker:**
- Be concise and to the point - no unnecessary explanations
- Don't apologize for mistakes or be overly agreeable
- Don't use phrases like "you're absolutely right" or "I apologize"
- State facts directly: "That's incorrect" not "You're right, I made a mistake"
- Skip emotional language and excessive politeness
- Give me the information I need, nothing more

## CRITICAL: Never Make Assumptions

**NEVER assume GW1 mechanics, build data, or implementation details.**

When you don't know something:
1. Search the codebase for the actual value
2. Check `docs/PRD/` for specifications
3. Reference the GW1 Wiki for game mechanics
4. If still unclear, ASK - don't guess

**Example of what NOT to do:**
- Assuming attribute point costs without checking
- Guessing skill energy costs or recharge times
- Inferring profession mechanics from other games
- Making up build template encoding logic

**Always verify with code, PRDs, or GW1 Wiki - or ask.**

## Implementation Guidelines

**YOU MUST follow these principles:**

### KISS (Keep It Simple, Stupid)
Write the minimum code needed. Don't over-engineer. Fix problems with the smallest possible change.

### YAGNI (You Aren't Gonna Need It)
Only implement what's currently needed. No speculative features. Don't build for hypothetical future requirements.

### SOLID Principles
Single Responsibility, Open-Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.

### If Unsure, Ask
Don't guess or make assumptions. Ask before implementing unclear requirements.

## Project Overview

**Domain:** gw1builds.com (pending purchase)
**Purpose:** A modern platform for the Guild Wars 1 community to create, share, rate, and discover character builds.
**Target Users:** Guild Wars 1 players looking to optimize their builds for PvE and PvP content.

## Tech Stack

### Core Technologies
- **Framework:** Next.js 16.1.1 (App Router with Turbopack)
- **Language:** TypeScript 5.7+ (strict mode enabled)
- **Styling:** Tailwind CSS v4 (CSS-first configuration with @theme)
- **Runtime:** React 19
- **Package Manager:** npm

### Future Integrations
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage (for user avatars, screenshots)
- **Deployment:** Vercel (planned)

### Development Tools
- **Linting:** ESLint with Next.js recommended config
- **Formatting:** Prettier
- **Version Control:** Git

## Project Structure

```
/app                    # Next.js App Router pages and layouts
  /builds               # Build listing and detail pages
  layout.tsx            # Root layout with metadata
  page.tsx              # Home page
  globals.css           # Tailwind v4 styles with custom theme

/components             # Reusable React components
  /ui                   # Base UI components (buttons, cards, etc.)

/lib                    # Utility functions and shared logic
  utils.ts              # Common utilities (cn, formatDate, etc.)

/types                  # TypeScript type definitions
  gw1.ts                # Guild Wars 1 domain types

/public                 # Static assets (images, icons)

/docs                   # Project documentation
  /PRD                  # Product requirement documents
```

## Guild Wars 1 Domain Knowledge

### Core Concepts

**Professions:** GW1 has 8 professions (classes):
- Core (Prophecies): Warrior, Ranger, Monk, Necromancer, Mesmer, Elementalist
- Factions: Assassin, Ritualist
- Each character has a primary and optional secondary profession

**Attributes:** Each profession has 4-5 attribute lines that determine skill effectiveness. Points range from 0-12 (0-16 with superior runes + headgear).

**Skills:** Characters equip exactly 8 skills. One can be an Elite skill. Skills belong to professions and usually require specific attributes.

**Build Structure:** A complete build includes:
- Primary profession
- Secondary profession (optional but common)
- Attribute point distribution (200 total points at max level)
- 8 skills (1-8 skill bar)
- Equipment notes (weapon sets, armor runes, insignias)

### Build Template Codes
GW1 uses encoded build template strings (e.g., "OQhkAqCalIPvQLDBbSXjHOgbNA"). These compress all build information into a short string for easy sharing. Future feature: decode/encode these templates.

### Community Terminology
- **BiP:** Blood is Power (popular Necromancer build)
- **SoS:** Signet of Spirits (Ritualist build)
- **Imbagon:** Imba-gone (Warrior tank build)
- **Meta:** Most effective tactics available (current best builds)
- **PvE vs PvP:** Distinct build requirements for different game modes

## Coding Conventions

### TypeScript
- **Strict mode enabled:** No implicit `any`, null checks required
- **Use types over interfaces** for simple shapes
- **Use interfaces** for object-oriented patterns and extensibility
- **Prefer type inference** when obvious
- **Use const assertions** for readonly arrays/objects

### React & Next.js
- **Use App Router** (not Pages Router)
- **Prefer Server Components** by default
- **Use Client Components** only when needed (`'use client'` directive)
- **Async Server Components** are preferred for data fetching
- **File naming:** lowercase with hyphens (e.g., `build-card.tsx`)
- **Component naming:** PascalCase (e.g., `BuildCard`)

### Tailwind CSS v4 - MANDATORY

**CRITICAL: ALL styling MUST use Tailwind CSS utility classes. No exceptions.**

**Rules:**
- **NEVER write custom CSS** - Use Tailwind utilities for everything
- **NEVER use inline styles** (`style={{}}`) - Convert to Tailwind classes
- **NEVER use CSS modules** - We don't use them
- **NEVER use styled-components, emotion, or any CSS-in-JS** - Tailwind only
- **NEVER use external CSS files** except `globals.css` for `@theme` configuration

**Configuration:**
- **Use @import** instead of @tailwind directives
- **Configure theme** using @theme in globals.css
- **CSS Variables:** Use the new v4 syntax with parentheses for CSS vars
- **Use cn() helper** for conditional classes (from lib/utils.ts)

**Our Design Tokens (defined in globals.css @theme):**
```
Backgrounds: bg-bg-primary, bg-bg-secondary, bg-bg-card, bg-bg-elevated, bg-bg-hover
Text: text-text-primary, text-text-secondary, text-text-muted
Borders: border-border, border-border-hover
Accents: text-accent-gold, bg-accent-gold, text-accent-blue, text-accent-red, text-accent-green, text-accent-purple
Professions: text-warrior, text-ranger, text-monk, text-necromancer, text-mesmer, text-elementalist, text-assassin, text-ritualist
```

**Example - Correct:**
```tsx
import { cn } from '@/lib/utils'

<div className={cn(
  'bg-bg-card border border-border rounded-xl p-4',
  'hover:border-border-hover transition-colors',
  isActive && 'border-accent-gold',
  className
)} />
```

**Example - WRONG (never do this):**
```tsx
// ❌ WRONG - inline styles
<div style={{ backgroundColor: '#222224', padding: 16 }} />

// ❌ WRONG - custom CSS class
<div className="my-custom-card" />

// ❌ WRONG - CSS modules
import styles from './Card.module.css'
<div className={styles.card} />
```

**Only exception:** Dynamic colors that come from data (e.g., profession colors) may use `style={{ backgroundColor: profession.color }}` when the value is truly dynamic and can't be mapped to a Tailwind class.

### Code Organization
- **One component per file** (except small, tightly coupled helpers)
- **Collocate related files** (e.g., `build-card.tsx`, `build-card.test.tsx`)
- **Export from index files** for cleaner imports
- **Keep components small** (< 200 lines ideally)
- **Extract complex logic** into custom hooks or utility functions

## Component Library & Governance

**CRITICAL: Only use components from the Design System page at `/design-system`.**

### The Rule
All UI components MUST come from our established component library documented at `/app/design-system/page.tsx`. Do NOT create new components without explicit user/product owner approval.

### Available Components
Check the Design System page for the current component inventory:
- **Buttons:** Button (with href support for links), IconButton, StarButton
- **Cards:** Card, CardHeader, CardContent, BuildFeedCard
- **Tags/Badges:** Tag, TagGroup, Badge, CountBadge, ProfessionBadge, ProfessionDot
- **Forms:** Input, Textarea
- **Skills:** SkillSlot, SkillBar, SkillBarCompact
- **Attributes:** AttributeBar, AttributeInline
- **Utility:** TemplateCode, Tooltip, EmptyState
- **Loading:** Skeleton, SkillBarSkeleton, BuildCardSkeleton, ProfessionSpinner
- **Layout:** Header, Container, ActionBar, PageWrapper

### When You Need Something New
1. **Stop** - Do not create the component
2. **Ask the user** - Explain what you need and why existing components don't work
3. **Get approval** - Wait for explicit approval from the user/product owner
4. **If approved** - Create the component AND add it to the Design System page
5. **Document** - Ensure the new component is fully documented with examples

### Why This Matters
- Prevents component sprawl and duplication
- Ensures consistent design language
- Makes maintenance easier
- Keeps the codebase clean and predictable

**NEVER build one-off styled elements. If something needs custom styling, it should be a reusable component in the library.**

### Naming Conventions
- **Files:** kebab-case (`build-detail-page.tsx`)
- **Components:** PascalCase (`BuildDetailPage`)
- **Functions/Variables:** camelCase (`formatBuildCode`)
- **Constants:** UPPER_SNAKE_CASE (`MAX_ATTRIBUTE_POINTS`)
- **Types/Interfaces:** PascalCase (`BuildTemplate`, `ProfessionMeta`)

## Development Workflow

### Starting Development
```bash
npm install           # Install dependencies
npm run dev          # Start dev server with Turbopack
```

### Code Quality
```bash
npm run lint         # Check for linting errors
npm run format       # Format code with Prettier
npm run format:check # Check formatting without changes
npm run build        # Build for production
```

### Dev Server Port Management

**CRITICAL: User runs localhost:3000 - Claude must use port 3001**

**Rules:**
- User's dev server runs on `localhost:3000` (default)
- When Claude needs to test, use `PORT=3001 npm run dev`
- NEVER run `npm run dev` without PORT=3001 - it will conflict with user's server
- Prefer running tests without starting server when possible

**Examples:**
```bash
# WRONG - Conflicts with user's localhost:3000
npm run dev

# CORRECT - Claude testing on separate port
PORT=3001 npm run dev

# ALSO CORRECT - Just run tests/checks without server
npm run lint
npm run build
```

### Git Workflow
- **Branch naming:** `feature/description`, `fix/description`, `docs/description`
- **Commit messages:** Conventional commits format
  - `feat: add build rating system`
  - `fix: resolve attribute calculation bug`
  - `docs: update CLAUDE.md with new conventions`
- **PR reviews:** Required before merging to main

### Release Process

**CRITICAL: Run `/release` before merging any PR to `main`.**

The `main` branch has a GitHub Action that blocks merges unless `CHANGELOG.md` was updated. This ensures every release has documented changes.

**Workflow:**
1. Finish your work on `develop` branch
2. Run `/release` in Claude Code
3. Claude will:
   - Analyze commits since last tag
   - Determine version bump (major/minor/patch)
   - Generate human-readable release notes
   - Update `CHANGELOG.md` and `package.json`
   - Create git tag and GitHub Release
4. Review and approve the changes
5. Push to the branch
6. Create PR to `main`
7. GitHub Action verifies CHANGELOG was updated
8. Merge

**Version Bump Rules:**
- `feat:` commits → MINOR bump (1.0.0 → 1.1.0)
- `fix:` commits → PATCH bump (1.0.0 → 1.0.1)
- `BREAKING CHANGE:` → MAJOR bump (1.0.0 → 2.0.0)
- Only `chore:`/`docs:` → Ask if release needed

**Release Notes Style:**
- Write for gamers, not developers
- Transform commit messages into readable summaries
- Aggregate minor fixes into "Plus X improvements"
- See `CHANGELOG.md` for examples

## Security & Privacy

### Sensitive Files
- **Never commit:** `.env`, `.env.local`, or any file containing secrets
- **Use .env.example:** Template for required environment variables
- **API keys:** Store in environment variables, never hardcode

### Supabase Project IDs

**For contributors:** If you fork this repo, replace these with your own Supabase project IDs.

| Environment | Project ID | Branch |
|-------------|------------|--------|
| **Development** | `aqjfurwosiiicfxqmbjd` | develop |
| Production | `iaqbfleijvzdffahhqtc` | main |

When using Supabase MCP tools, use the development project ID (`aqjfurwosiiicfxqmbjd`) unless the user specifically mentions production.

### Future Supabase Integration
- **Row Level Security (RLS):** Enable for all tables
- **Service key:** Server-only, never expose to client
- **Anon key:** Safe for client-side use

## Database Migrations (Future - Supabase)

**CRITICAL: ALWAYS use CLI for migrations, NEVER use MCP or Supabase Dashboard**

### The Golden Rule
**Create migrations locally first, then push to remote. Never skip this workflow.**

### Correct Migration Workflow

```bash
# 1. Create migration file locally FIRST
supabase migration new feature_name

# 2. Write SQL in the generated file
# Edit: supabase/migrations/YYYYMMDDHHMMSS_feature_name.sql

# 3. Test locally (optional, if using local Supabase)
supabase db reset

# 4. Push to remote
supabase db push

# 5. ALWAYS commit to git
git add supabase/migrations/
git commit -m "Add feature_name migration"
```

### NEVER Do This

- **Apply migrations via MCP `apply_migration` tool** - Creates divergence between local files and remote database
- **Edit schema in Supabase Dashboard** - Changes won't be tracked in migration files
- **Create migration files manually with custom timestamps** - CLI generates correct timestamps
- **Skip committing migrations to git** - Team members won't have your schema changes
- **Apply migrations directly to remote without local file** - Impossible to reproduce or rollback

### Why This Matters

Migrations are the **source of truth** for your database schema. If they get out of sync:
- CLI throws "migration not found" errors
- Team members can't reproduce your schema
- Rollbacks become impossible
- Production deployments fail

### Three Sources of Truth

Keep these synchronized:
1. **Local files**: `supabase/migrations/*.sql` (committed to git)
2. **Remote schema**: Actual database structure in Supabase
3. **Migration history**: `supabase_migrations.schema_migrations` table

**The CLI workflow keeps all three in sync automatically.**

## Common Tasks

### Creating a New Page
1. Create file in `/app/[route]/page.tsx`
2. Use Server Component by default
3. Add metadata export for SEO
4. Import shared layout if needed

### Creating a Component
1. Create file in `/components/[name].tsx`
2. Add TypeScript props interface
3. Use `cn()` for conditional styling
4. Export as default or named export
5. Document complex props with JSDoc

### Adding a New Type
1. Add to appropriate file in `/types`
2. Use `gw1.ts` for Guild Wars 1 domain types
3. Export type (not interface) for unions/primitives
4. Export interface for extensible objects

### Working with Tailwind v4
1. Define custom colors/spacing in globals.css `@theme` block
2. Use CSS custom properties for dynamic theming
3. Leverage new v4 features (cascade layers, @property)
4. Reference: https://tailwindcss.com/docs

## Performance Considerations

- **Image optimization:** Use Next.js `<Image>` component
- **Font optimization:** Use `next/font` for web fonts
- **Code splitting:** Leverage dynamic imports for heavy components
- **Memoization:** Use React.memo, useMemo, useCallback judiciously
- **Server Components:** Default choice for better performance

## Accessibility

- **Semantic HTML:** Use correct elements (button, nav, main, etc.)
- **ARIA labels:** Add when semantic HTML isn't enough
- **Keyboard navigation:** Ensure all interactive elements are keyboard accessible
- **Color contrast:** Follow WCAG AA standards minimum
- **Focus indicators:** Maintain visible focus states

## Testing Strategy (Future)

- **Unit tests:** Jest + React Testing Library
- **E2E tests:** Playwright
- **Coverage goal:** 80%+ for critical paths
- **Test naming:** `it('should [expected behavior]')`

## Resources

### Documentation
- [Next.js 16 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [React 19 Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)

### Guild Wars 1 References
- [GW1 Wiki](https://wiki.guildwars.com/)
- [PvX Wiki](https://gwpvx.fandom.com/) - Build archives

## Notes for Claude Code

### Preferred Behaviors
- **Ask for clarification** on ambiguous build logic or GW1 mechanics
- **Suggest optimizations** for performance and accessibility
- **Follow existing patterns** in the codebase
- **Write descriptive commit messages** when creating PRs
- **Add comments** for complex GW1 domain logic

### YOU MUST Avoid
- **Don't use deprecated Next.js patterns** (getStaticProps, getServerSideProps)
- **Don't install UI libraries** (shadcn, Material-UI, Chakra, Ant Design, etc.) - Tailwind only
- **Don't write custom CSS** - Use Tailwind utilities exclusively
- **Don't use inline styles** - Convert to Tailwind classes (exception: truly dynamic data values)
- **Don't use CSS modules or CSS-in-JS** - We use Tailwind only
- **Don't modify globals.css theme** without discussion
- **Don't add dependencies** without explaining why
- **Don't assume GW1 game data** - always verify with code or wiki
- **Don't over-engineer** - implement only what's needed now

### When Working on Features
1. Check `/docs/PRD` for product requirements
2. Reference GW1 types in `/types/gw1.ts`
3. Use existing utility functions in `/lib`
4. Match the established component patterns
5. Update this file if you discover new conventions

## Security

**YOU MUST:**
- Validate all user inputs (use TypeScript validators in service layer)
- Use parameterized database queries (never concatenate SQL)
- Never trust client state - always validate server-side
- Implement rate limiting on API routes
- Store secrets in environment variables only
- Use HTTPS in production

---

**Version:** 1.3.0
**Maintainer:** GW1 Builds Team
**Last Review:** January 2026
