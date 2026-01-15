<p align="center">
  <img src="public/logo-512.png" alt="GW1 Builds Logo" width="120" height="120">
</p>

<h1 align="center">GW1 Builds</h1>

<h4 align="center">A lightweight build sharing tool for Guild Wars 1, built for the Reforged era.</h4>

<p align="center">
  <a href="https://gw1builds.com">
    <img src="https://img.shields.io/badge/demo-gw1builds.com-e8b849?style=flat-square" alt="Live Demo">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License">
  </a>
</p>

---

## What is this?

**GW1 Builds** is a modern build sharing tool for a timeless legend. No downloads, no clunky UIs. Just builds you can share with a link.

Create your build in-game, paste the template code, add some notes, and share it with the world. That's it!

**[Check it out live →](https://gw1builds.com)**

## Features

**Builder**
- Paste skill template codes or pick skills manually with search
- Paste equipment template codes or configure armor, weapons, runes, and insignias individually
- Attribute-scaled skill descriptions show actual damage/duration at your build's level
- Build variants for alternative setups (anti-caster, budget, etc.)
- One-click copy for both skill and equipment codes

**Team Builds**
- Support for solo builds up to 12-player teams
- Duplicate slots for flexible team compositions

**Sharing & Collaboration**
- Private builds (hidden from search, shareable via direct link)
- Share drafts before publishing
- Collaborators can edit your builds with you
- Create new builds from existing ones as templates

**Search**
- Spotlight search (Cmd+K / Ctrl+K) for quick access
- Searches both user builds and 26,000+ PvX Wiki archives

**Quality of Life**
- Browse and copy builds without an account
- Create builds as a guest, sign up when ready to save
- Discord and email login options
- Dark theme and mobile friendly
- Feedback button for bugs and suggestions

## Tech Stack

| Tech | Purpose |
|------|---------|
| [Next.js 16](https://nextjs.org) | React framework with App Router |
| [TypeScript](https://typescriptlang.org) | Type-safe JavaScript |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling |
| [Supabase](https://supabase.com) | Database, auth, and storage |
| [TipTap](https://tiptap.dev) | Rich text editor for build notes |
| [Vercel](https://vercel.com) | Hosting and deployment |
| [Claude Code](https://claude.ai) | AI-powered code companion |

## Getting Started

```bash
# Clone the repository
git clone https://github.com/gw1tools/gw1builds.git
cd gw1builds

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [localhost:3000](http://localhost:3000) to run it locally. You need to create your Supabase project and update the `.env.local` file with your Supabase credentials.

## Project Structure

```
app/          → Pages, routes, and API endpoints
components/   → Reusable React components
lib/          → Utilities, services, and GW1 data
types/        → TypeScript type definitions
docs/PRD/     → Product requirement documents (some might be outdated, but I left them in to show the dev process)
```

<details>
<summary>More details</summary>

- `.claude` - Settings, Agents, Plugins and Commands for Claude Code
- `app/(main)/` - Main app pages (home, build details, create)
- `app/api/` - Server-side API routes
- `components/ui/` - Design system components
- `components/build/` - Build-specific components
- `components/editor/` - TipTap editor components
- `lib/gw/` - GW1-specific utilities (template decoder, skill data)
- `lib/supabase/` - Database client and queries

</details>

## Contributing

Found a bug or have an idea? [Open an issue](https://github.com/gw1tools/gw1builds/issues) on GitHub. The more detail you provide, the easier it is to implement. Want to contribute code? Reach out via an issue first and we'll go from there.

## Credits

A special thanks to:

- **[ArenaNet](https://www.arena.net)** - For creating Guild Wars and so many wonderful memories. Reforged has been such a surprise and an inspiration to create this project.
- **[Guild Wars Wiki](https://wiki.guildwars.com)** - The definitive resource for all things GW1.
- **[PvX Wiki](https://gwpvx.fandom.com)** - For years of build documentation and community knowledge. We hope to build a complementary tool for easier build sharing.
- **[TeamBuilder](http://www.gwteambuilder.de/en/)** - For creating the original build sharing tool and all the amazing memories playing HA late at night.
- **[paw·ned²](https://memorial.redeemer.biz/pawned2/)** - For continuing the TeamBuilder legacy and for the profession icon font.
- **[build-wars](https://github.com/build-wars)** - For the template decoder and skill data.
- **[Claude Code](https://claude.ai)** - For making this project possible. Without AI-assisted development, we wouldn't have had the time or resources to build this.

## License

[MIT](LICENSE) - Free to use, modify, and share.

---

<p align="center">
  <sub>Built with love and nostalgia for the Guild Wars 1 community</sub>
</p>
