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
  <a href="https://nextjs.org">
    <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js">
  </a>
  <a href="https://www.typescriptlang.org">
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  </a>
  <a href="https://tailwindcss.com">
    <img src="https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#credits">Credits</a>
</p>

---

## What is this?

**GW1 Builds** is a modern build sharing tool for a timeless legend. No downloads, no clunky UIs. Just builds you can share with a link. 

Create your build in-game, paste the template code, add some notes, and share it with the world. That's it!

**[Check it out live →](https://gw1builds.com)**

---

## Features

- **Zero friction** - Browse builds without creating an account or downloads
- **One-click copy** - Template codes ready to paste in-game
- **Solo or teams** - Support for solo builds, full 8-player builds, and anything in between
- **Rich notes** - Feature-rich editor with tool-tip skill mentions in your build descriptions
- **Dark theme** - Because it's nice and we're all getting older
- **Mobile friendly** - Check builds on your phone, no more "let me check when I'm on my PC"

---

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

---

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

---

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

---

## Contributing

**For now, let's keep it simple:** Directly share your feedback and [open an issue](https://github.com/gw1tools/gw1builds/issues) on GitHub. The more detailed your feedback, the higher the chance of it being addressed.

---

## Credits

A special thanks to:

- **[ArenaNet](https://www.arena.net)** - For creating Guild Wars and so many wonderful memories. Reforged has been such a surprise and an inspiration to create this project.
- **[Guild Wars Wiki](https://wiki.guildwars.com)** - The definitive resource for all things GW1
- **[PvX Wiki](https://gwpvx.fandom.com)** - For years of build documentation and community knowledge. We hope to build a complementary tool for easier build sharing.
- **[TeamBuilder](http://www.gwteambuilder.de/en/)** - For creating the original build sharing tool and all the amazing memories playing HA late at night.
- **[paw·ned²](https://memorial.redeemer.biz/pawned2/)** - For continuing the TeamBuilder legacy and for the profession icon font
- **[build-wars](https://github.com/build-wars)** - For the template decoder and skill data
- **[Claude Code](https://claude.ai)** - AI-assisted development companion

---

## License

[MIT](LICENSE) - Do what you want with it.

---

<p align="center">
  <sub>Built with love and nostalgia for the Guild Wars 1 community</sub>
</p>
