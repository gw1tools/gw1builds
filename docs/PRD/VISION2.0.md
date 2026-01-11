# GW1Builds Product Direction

## The Vision

**GW1Builds is a collaborative build workbench for Guild Wars 1.**

Users can create builds from scratch or paste templates, tinker with skills/attributes/equipment, collaborate with their party, and optionally publish to the community.

### Positioning
- **Not PvX**: We're a workbench, not a wiki. Tinker and share, not document the meta.
- **Not just sharing**: You can build and edit here, not just paste and view.
- **Collaboration-first**: Private by default, invite your party, publish when ready.

---

## Design Philosophy

### "Improvement, Not Addition"
Every feature must make the product feel **more focused**, not more scattered. New capabilities should feel like natural extensions of what exists, not bolted-on extras. If a feature makes the app feel cluttered, we cut it or redesign it.

### "Magical and Snappy"
The UX should feel **fun, magical, futuristic**. Interactions should spark joy, not feel like work.

**The Spotlight Principle**: Key interactions (like picking a skill) should feel like pressing `Cmd+Space` on a Mac:
- Instant response
- Search by typing (name, profession, attribute)
- Results appear as you type
- Pick and done
- Discover things you didn't know existed

This isn't about keyboard shortcuts - it's about the *feeling* of a well-designed interaction: fast, fluid, and slightly delightful.

### Design Adjectives
When building any UI, ask: does this feel...
- **Fun** - not tedious or bureaucratic
- **Magical** - surprisingly smooth, almost anticipates what you want
- **Futuristic** - modern, not like a 2008 wiki

### Examples of This Philosophy Applied

| Feature | Bad (addition) | Good (improvement) |
|---------|---------------|-------------------|
| Skill picker | Modal with dropdowns, click 5 times | Spotlight-style search, type → find → pick |
| Attribute editor | Form with 10 input fields | Inline sliders that snap to common breakpoints |
| Collaborator invite | Settings page with forms | Type username, instant add, avatar appears |
| Version history | Separate page with table | Subtle timeline, hover to see diff |

### The Litmus Test
Before shipping any feature, ask:
1. Does the app feel simpler or more cluttered?
2. Would I enjoy using this, or just tolerate it?
3. Would a new user find this obvious or confusing?

### Core User: The Tinkerer
Someone who wants to:
- Experiment with builds outside the game
- Share work-in-progress with friends
- Coordinate team builds with their party
- Maybe publish when they're happy with it

---

## Feature Roadmap

### Phase 1: Collaboration Foundation
**Goal**: Make GW1Builds useful for parties coordinating builds.

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Unlisted builds** | Visibility toggle (public/unlisted). Unlisted = not in feed, shareable by link. | Low |
| **Invite collaborators** | Add users by username who can edit the build. | Medium |
| **Version history** | Track who changed what and when. View history, maybe revert. | Medium |

**Why this first**: Even without better editing, parties can share and collaborate on builds. This makes the tool immediately useful for the workspace use case.

### Phase 2: Build Editing
**Goal**: Let users create and modify builds in the tool, not just paste templates.

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Empty start** | Create a build without pasting a template code. Pick profession, start empty. | Medium |
| **Skill swapping** | Click a skill slot → searchable skill picker → replace skill. | Medium |
| **Attribute editor** | Adjust attribute points. Validate: 200 total max, 12 per attribute max. | Medium |

**Why this second**: Once collaboration works, make the editing experience better so tinkerers can actually build in the tool.

### Phase 3: Equipment
**Goal**: Complete builds with equipment info (weapons, armor, runes).

| Feature | Description | Complexity |
|---------|-------------|------------|
| **Equipment entry** | Structured fields to select weapons, armor pieces, runes, insignias. | High |
| **Equipment template decode** | Optionally decode PvP equipment template codes. | Medium |
| **Item mentions in editor** | Type `[[` to mention items like `[[Fiery Dragon Sword]]` with tooltips. | Medium |

**Why this third**: Equipment makes builds complete, but the tool is useful without it. Add when the foundation is solid.

---

## What We're NOT Building (For Now)

| Feature | Why not |
|---------|---------|
| **Real-time collaboration** | Async editing (last save wins + history) is simpler and good enough |
| **Complex permissions** | Just owner + collaborators, no roles/tiers |
| **AI recommendations** | Overkill for this scale, let community curate via stars |
| **PvX import** | Conflicts with "tinkering" identity, those are finished builds |
| **Commenting/discussion** | Use Discord for that, avoid moderation burden |

---

## Technical Notes

### Database Changes Needed
- `builds.visibility`: enum ('public', 'unlisted')
- `build_collaborators`: junction table (build_id, user_id, added_at)
- `build_versions`: table tracking changes (build_id, user_id, changed_at, diff or snapshot)

### UI Components Needed
- Visibility toggle in create/edit forms
- Collaborator management (add by username, list, remove)
- Version history panel (list of changes, who/when)
- Skill picker modal (searchable, filterable by profession/attribute)
- Attribute editor (sliders or inputs with validation)
- Equipment selector (dropdowns or search for each slot)

### Data Requirements
- Skill data: already have via `@buildwars/gw-templates`
- Equipment data: need items.json, runes.json, mods.json (source from GW Wiki or build-wars)

---

## Success Metrics

1. **Community adoption**: People actually use it, builds get created and shared
2. **Personal satisfaction**: Fun to build, learned things along the way
3. **Party coordination**: Groups use it to sync their team builds

---

## Open Questions

1. **Version history granularity**: Snapshot on every save, or track individual field changes?
2. **Collaborator discovery**: How do users find each other's usernames? Display name visible?
3. **Empty start UX**: Profession picker first, or blank slate with profession dropdown?
4. **Equipment data source**: Build from GW Wiki, find existing JSON, or manual curation?

---

## Next Steps

### Prototyping First (UI Before DB)
Build a prototype page (`/prototype` or `/lab`) with just UI to nail the "magical and snappy" feeling before wiring to the database.

**Prototype components to build:**
1. **Skill Picker** - Spotlight-style search, type to filter, click to select
2. **Attribute Editor** - Inline sliders or inputs with validation feel
3. **Equipment Selector** - Fast selection of weapons/armor/runes
4. **Collaborator Invite** - Type username, instant feedback

**Why prototype first:**
- Test the UX feel without backend complexity
- Iterate quickly on interactions
- Make sure it feels magical before committing to schema
- Can show to users for feedback

### Then Wire Up
Once the UI feels right:
1. Design the collaboration schema (visibility, collaborators, versions)
2. Implement unlisted builds
3. Implement collaborator invites
4. Implement version history
5. Move to Phase 2 (editing features)

---

## Single Source of Truth
This plan replaces PRD-11 through PRD-15. Those drafts have been deleted. All product direction lives here.
