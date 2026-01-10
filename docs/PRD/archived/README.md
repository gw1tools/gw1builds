# GW1 Builds — Project Documentation

## Overview

**GW1 Builds** is a collaborative build workbench for Guild Wars 1. Users can create builds from scratch or paste templates, tinker with skills/attributes/equipment, collaborate with their party, and optionally publish to the community.

## Core Philosophy

- **Tinker-first**: Build and experiment in the tool, not just share
- **Collaboration-first**: Private by default, invite your party, publish when ready
- **Zero friction to view**: No login required to see builds
- **Magical and snappy**: UX should feel fun, not tedious (Spotlight-style interactions)
- **Improvement, not addition**: Every feature makes the product more focused, not more cluttered

## Product Direction

**See the full product plan:** [PLAN.md](./PLAN.md)

The plan includes:
- Feature roadmap (Collaboration → Build Editing → Equipment)
- Design philosophy and UX principles
- Technical notes and open questions

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

## Core PRDs (MVP - Completed)

| PRD | Name | Description | Status |
|-----|------|-------------|--------|
| [PRD-00](./PRD-00-project-setup.md) | Project Setup | Scaffold Next.js, configure tools, deploy | Done |
| [PRD-01](./PRD-01-data-layer.md) | Core Data Layer | Database schema, types, decoders | Done |
| [PRD-02](./PRD-02-build-viewing.md) | Build Viewing | View builds without auth | Done |
| [PRD-03](./PRD-03-authentication.md) | Authentication | Google OAuth login flow | Done |
| [PRD-04](./PRD-04-build-creation.md) | Build Creation | Create and publish builds | Done |
| [PRD-05](./PRD-05-build-editing.md) | Build Editing | Edit builds, version history | Done |
| [PRD-06](./PRD-06-homepage.md) | Homepage & Discovery | Popular/recent feeds | Done |
| [PRD-07](./PRD-07-stars.md) | Stars & Engagement | Star system, counts | Done |
| [PRD-09](./PRD-09-polish.md) | Polish & UX | Animations, errors, mobile, SEO | Done |
| [PRD-10](./PRD-10-security-hardening.md) | Security | Content moderation, rate limiting | Done |

## Future Direction

Future features are tracked in the product plan, not separate PRDs. See the plan file for:
- **Phase 1**: Collaboration (unlisted builds, collaborators, version history)
- **Phase 2**: Build Editing (skill swapping, attribute editor, empty start)
- **Phase 3**: Equipment (equipment entry, item mentions)

## Explicitly Out of Scope

| Feature | Reason |
|---------|--------|
| **Real-time collaboration** | Async editing with history is simpler and good enough |
| **Comments / Discussion** | High moderation burden. Use Discord/Reddit instead. |
| **Build Ratings / Downvotes** | Stars only, positive curation. |
| **AI Recommendations** | Overkill for this scale, let community curate |
| **PvX Import** | Conflicts with "tinkering" identity |

## MVP Status

MVP is complete (PRD-00 through PRD-10). Future work focuses on the collaboration and editing features outlined in the product plan.

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
