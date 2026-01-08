# GW1 Builds — Project Documentation

## Overview

**GW1 Builds** is a pastebin-style sharing platform for Guild Wars 1 build templates. Users paste template codes, add context, and get shareable links. The platform surfaces popular and recent builds for discovery.

## Core Philosophy

- **Share-first**: Creation happens in-game; we handle sharing
- **Zero friction to view**: No login required to see builds
- **Minimal friction to create**: Google login only
- **Rich but simple**: Skill mentions auto-link, tooltips on hover
- **Positive curation**: Stars only, no downvotes

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.1.1 |
| Language | TypeScript | 5.7.2 |
| React | React | 19.0.0 |
| Styling | Tailwind CSS | 4.0.0 |
| Font | Geist | 1.3.1 |
| Database | Supabase (Postgres) | latest |
| Auth | Supabase Auth (Google OAuth) | latest |
| Editor | TipTap | 2.x |
| Animations | Framer Motion | 11.x |
| Toasts | Sonner | 1.x |
| Forms | React Hook Form | 7.x |
| Icons | Lucide React | latest |
| IDs | nanoid | 5.x |
| Utilities | clsx, tailwind-merge | (already installed) |

### Minimal Dependencies (only 9 new packages)

```bash
npm install @supabase/supabase-js @supabase/ssr \
  @tiptap/react @tiptap/starter-kit @tiptap/extension-mention @tiptap/extension-placeholder \
  framer-motion sonner react-hook-form lucide-react nanoid
```

## PRD Index

Execute these PRDs in order:

| PRD | Name | Description | Effort |
|-----|------|-------------|--------|
| [PRD-00](./PRD-00-project-setup.md) | Project Setup | Scaffold Next.js, configure tools, deploy | 2h |
| [PRD-01](./PRD-01-data-layer.md) | Core Data Layer | Database schema, types, decoders | 3h |
| [PRD-02](./PRD-02-build-viewing.md) | Build Viewing | View builds without auth | 4h |
| [PRD-03](./PRD-03-authentication.md) | Authentication | Google OAuth login flow | 2h |
| [PRD-04](./PRD-04-build-creation.md) | Build Creation | Create and publish builds | 5h |
| [PRD-05](./PRD-05-build-editing.md) | Build Editing | Edit builds, version history | 3h |
| [PRD-06](./PRD-06-homepage.md) | Homepage & Discovery | Popular/recent feeds | 3h |
| [PRD-07](./PRD-07-stars.md) | Stars & Engagement | Star system, counts | 2h |
| [PRD-08](./PRD-08-user-profiles.md) | User Profiles | Profile pages, dashboards | 2h |
| [PRD-09](./PRD-09-polish.md) | Polish & UX | Animations, errors, mobile, SEO | 4h |

**Total estimated effort: ~30 hours**

## MVP Scope

For initial launch, complete PRD-00 through PRD-07. PRD-08 and PRD-09 can follow.

## Design Tokens

```css
:root {
  /* Backgrounds */
  --bg-primary: #121214;
  --bg-secondary: #1a1a1c;
  --bg-card: #222225;
  --bg-elevated: #2a2a2d;
  --bg-hover: #323235;
  
  /* Text */
  --text-primary: #f0f0f0;
  --text-secondary: #a0a0a5;
  --text-muted: #606065;
  
  /* Accents */
  --gold: #e8b849;
  --gold-dim: #c9a03d;
  --purple: #a78bda;
  --blue: #5b9bd5;
  --green: #5bb98b;
  --red: #e05555;
  
  /* Borders */
  --border: #3a3a3d;
  --border-hover: #4a4a4d;
}
```

## Page Structure

```
/                       → Homepage
/new                    → Create build
/b/[id]                 → View build
/b/[id]/edit            → Edit build
/b/[id]/history         → Version history
/u/[username]           → User profile
/u/[username]/stars     → User's starred builds
/login                  → OAuth flow
```

## Data Model Summary

```
User (1) ──────< Build (many)
                  │
                  ├──< BuildVersion (history)
                  │
User (many) >────< Star >────< Build (many)
```

## Key External Resources

- Guild Wars Template Codec: https://github.com/buildwars/gw-templates
- Skill Database: https://github.com/build-wars/gw1-database
- TipTap Editor: https://tiptap.dev/docs
- Supabase Docs: https://supabase.com/docs
