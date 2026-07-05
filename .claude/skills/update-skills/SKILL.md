---
name: update-skills
description: Apply a GW1 skill balance patch to the local skill data using the changeset pipeline. Use when a new game update / balance patch needs to be applied, when the skill-update detector fires, or when the user says "apply the <date> patch" / "update skill data".
---

# Applying a GW1 Skill Balance Patch

This document is self-contained: everything needed to apply a balance patch correctly is here.

**Core rule: the pipeline drafts, a human-reviewable changeset gates, guards refuse rather than guess. Never bypass a guard, never edit the data files by hand.**

## Background — the data model

Two JSON files hold all skill data, both keyed by the game's numeric skill id (~1485 skills), both tab-indented:

- `lib/gw/data/skilldata.json` → `{ "$schema": ..., "skilldata": { "<id>": {...} } }`. Per skill: `id, campaign, profession, attribute, type, is_elite, is_rp, is_pvp, pvp_split, split_id, upkeep, energy, activation, recharge, adrenaline, sacrifice, overcast`. Balance patches change the cost fields (`energy, activation, recharge, adrenaline`, rarely `sacrifice/upkeep/overcast`). If `pvp_split: true`, the skill has a separate PvP version whose id is `split_id`.
- `lib/gw/data/skilldesc-en.json` → `{ "$schema": ..., "lang": "en", "skilldesc": { "<id>": { id, name, description, concise } } }`. `description` is the full text, `concise` the short in-game form (often starting `(X seconds.)`).

Provenance: the files originate from `build-wars/gw-skilldata`, but that upstream is stale and divergent — **never sync from it**. The only authoritative source is the official wiki (`wiki.guildwars.com`). Never hand-map skill names to ids; both practices caused real data corruption in the past.

## Background — the wiki source

- **Patch notes**: `https://wiki.guildwars.com/wiki/Feedback:Game_updates/<YYYYMMDD>`. Structure: an `=== ... Balance Update ===` (h3) section containing `==== <Profession> ====` (h4) subsections, whose bullets look like `* {{skill icon|Skill Name}} (PvE|PvP|BOTH) - <change text>`. The variant tag is optional. Bullets *without* `{{skill icon}}` are bulk/prose lines (e.g. "Nature Ritual activation time from 3 to 2. Affects: [[...]], [[...]]"). Sections outside Balance Update (AI changes, bug fixes) are intentionally ignored.
- **Per-skill pages**: `https://wiki.guildwars.com/wiki/<Skill Name>`. Each carries a `{{Skill infobox}}` with the authoritative numeric `id`, costs, and both `description` and `concise description` in wikitext. PvP variants are separate pages named `<Skill Name> (PvP)`. Some pages carry two ids (`id = 1951<!-- Luxon -->, 2094<!-- Kurzick -->`).
- **Index of all updates**: queried via the MediaWiki API (`list=allpages`, namespace 202, prefix `Game updates/`) — the human-facing index page builds its list dynamically, so don't scrape it. `scripts/lib/wiki.mjs` exports `listUpdateDates()` for this.
- Wikitext→our-style rendering (done by `renderWikiText` in `scripts/lib/wiki.mjs`, needed when hand-authoring overrides): `{{gr|a|b}}` → `a...b` (three dots; trailing `|-` arg = negative/degeneration), `[[A|B]]` → `B`, `[s]`/`[y|ies]` markers → singular form, `{{gray|...}}` → `<gray>...</gray>`, bold/italic quotes dropped, whitespace collapsed, and the leading type sentence the wiki shows ("Elite Hex Spell. ...") is **stripped** — our descriptions never include it.

## Environment requirements

Node 20+ (native `fetch`, ES modules), network access to `wiki.guildwars.com`. No API keys. The scripts retry transient wiki failures, cache pages per process, and report fetch errors in their summaries — a wiki outage degrades loudly, not silently.

## Preconditions — check ALL before starting

1. **Clean data**: `git status` must show no changes to `lib/gw/data/`. `build-changeset` diffs against current data; running it after a partial apply produces a degenerate (no-op) changeset.
2. **Chronological order**: patches must be applied oldest-first. Check `scripts/changesets/` and `CHANGELOG.md` for what's already applied; check what exists upstream via the wiki index (or prod's `skill_update_notifications` table). If several patches are pending, do the **full workflow including the commit** for the oldest, then repeat for the next.
3. **Right branch**: feature branch off `develop`, named like `feature/june-25-skill-update`. PRs always target `develop`, never `main`.

## Workflow

```bash
# 1. Build the reviewable changeset
npm run skills:build-changeset -- --date <YYYYMMDD>

# 2. Review scripts/changesets/<date>.json — resolve EVERY flag (next section),
#    authoring scripts/changesets/<date>.overrides.mjs as needed, then re-run
#    step 1 until the summary reports 0 skills with flags.

# 3. Apply (guarded, idempotent; writes nothing if ANY entry fails)
npm run skills:apply-changeset -- scripts/changesets/<date>.json

# 4. Immediately audit the applied state
npm run skills:apply-changeset -- scripts/changesets/<date>.json --audit

# 5. Verify against the live wiki (independent oracle)
npm run skills:verify -- scripts/changesets/<date>.json
```

NOTE the `--` before script arguments — without it npm swallows flags like `--audit` instead of passing them through.

Step 5 is meaningful only once wiki editors have updated the skill pages — typically a few days after the patch. Run it immediately anyway (expect many "lagged"), and re-run ~3–7 days later. **0 NUMERIC mismatches is the requirement**; "lagged" is fine; TEXT diffs need eyeballing (known noise below). The TEXT check compares the *multiset of numbers/ranges* in our description+concise vs the wiki's — phrasing-agnostic, so it catches missed flat-number changes regardless of wording.

## The changeset artifact (what you review in step 2)

`scripts/changesets/<date>.json` — one entry per touched skill id:

```jsonc
{
  "id": 33, "name": "Illusionary Weaponry", "profession": "Mesmer",
  "data":  { "recharge": { "from": 25, "to": 15, "noteFrom": 25, "wiki": "confirmed" } },
  "desc":  { "description": { "from": "<old text>", "to": "<new text>" }, "concise": { ... } },
  "flags": [],           // MUST be empty before apply
  "notes": ["[base] Reduce recharge from 25 to 15."]   // raw patch-note lines, for review
}
```

`data.<field>.wiki` is the live-wiki cross-check at build time: `confirmed` (wiki already shows the new value), `lagged` (wiki still shows old — fine), `mismatch(X)` (wiki shows a third value — investigate), `n/a` (no wiki value), `override` (came from the overrides file), `bulk` (from a bulk line). Entries with a non-numeric id like `"unresolved:<name>"` mean a change line resolved to nothing — `apply` refuses the whole changeset until fixed.

`apply` guards every change: the current local value must equal `from` (or already equal `to` — idempotent re-run), and the local skill *name* must match the entry name, so a change can never land on the wrong skill. Any failure → nothing is written at all.

## The overrides file (how you resolve flags)

`scripts/changesets/<date>.overrides.mjs`, auto-loaded by `build-changeset`. Default-exports an object keyed by skill id:

```js
export default {
  1346: {
    description: 'Your next 1...3 non-Illusion spells use your Illusion attribute instead of its normal attribute.',
    concise: '...',                       // full-replace fields
    note: 'reworked: only non-Illusion spells',   // ALWAYS explain the change
  },
  335: { append: { description: ' This attack also hits 1...2 random adjacent foes.', concise: ' ...' },
         note: 'WIKI LAGGED 2026-06-25: clause authored from patch notes; verify later' },
  1406: { replaceAll: [['Dazed for 5 seconds', 'Dazed for 10 seconds']], note: '...' },
  79:   { data: { recharge: 20 }, note: 'recharge 30 -> 20 (no local PvP split)' },
}
```

Fields: `data` (numeric, absolute new values), `description`/`concise` (full replace), `append.{description,concise}`, `replaceAll: [[from, to], ...]` (applied to both text fields), `note` (mandatory practice — it lands in the changeset for the reviewer). An override clears the entry's manual/unparsed flags automatically. Override text must be the **wiki page's updated text rendered to our style** (see rendering rules above) unless the wiki page itself is lagged, in which case author from the patch-notes wording and mark the note `WIKI LAGGED <date>: verify later`.

## Resolving flags — the changeset MUST reach 0 flags before apply

| Flag | Meaning | Resolution |
|---|---|---|
| `manual: "..."` | Rework / added clause / structural change | Author new text in overrides from the updated wiki page |
| `partial parse — review` | Line describes more changes than were captured | Compare wiki page vs our text; author the missed piece. On 2026-06-24 this caught 5 real misses (all flat-% changes) |
| `unparsed: "..."` | Nothing captured at all | Read the line; usually novel phrasing → override |
| `ambiguous range "X" xN` | The old range appears N>1 times in the text | `replaceAll` override with enough surrounding context to be unique |
| `manual (bare "to" range)` | "to A..B" with no from-range | Wiki page has the full new text → override |
| `unknown skill name` | Patch-notes name not in local data | Check spelling/renames on the wiki; if genuinely absent locally, document the skip |
| `ambiguous name → local ids A, B` | Duplicate local names (known: `Pious Fury (PvP)` ids 2146 & 3368) | Determine the correct id from the wiki page's infobox id; override that id directly |
| `local/wiki id disagree` | Our id mapping may be wrong | **STOP and investigate** — this is the historical corruption mode. Do not apply until understood |
| `"X" (PvP): no PvP split in local data` | Notes say PvP but we have one entry | Usually applies to the single entry; confirm on the wiki, then `data` override + note |
| `unhandled balance line — review` | Bulk/prose bullet the parser doesn't model | If it changes skill values (like the Nature Ritual bulk line) it must be represented; if prose-only, document the skip |
| `AoE 100%->75% not representable` | See AoE gotcha below | Override with the wiki's updated phrasing |

## Edge cases and gotchas (all real, all bit us before)

- **Wiki skill pages lag the patch notes by days.** Right after a patch, author overrides from the patch-notes wording, mark them `WIKI LAGGED`, and rely on the step-5 re-run to confirm.
- **Flat-number / flat-% text changes are NOT auto-applied** (e.g. "50% → 100% more adrenaline", "duration 8 → 12 seconds", "Dazed 5 → 10s"). Only cost fields and `A..B → C..D` *range* swaps are automatic. Never assume a text change happened because the numeric one did.
- **AoE "damage from 100% to 75%"** isn't a numeric field; the wiki encodes it in text as "…and all adjacent/nearby foes take 75% of that damage." Override with that phrasing.
- **`(PvE)`/`(PvP)` variants**: a name embedding the suffix is its own skill/page/id. A `(PvP)`-tagged change targets the base skill's `split_id`; `(BOTH)` targets base + split; `(BOTH)` with no local split correctly applies to the base only.
- **Dataset style**: three-dot ranges (`5...41`), `<gray>…</gray>` caveats, concise often `(X seconds.)`-prefixed, no leading type sentence. Match neighboring entries; when in doubt read a few untouched skills.
- **Multi-id wiki pages** (Kurzick/Luxon variants): the parser strips the HTML comments, but confirm which id a change targets.
- **Nature Ritual bulk line** resolves each name in its "Affects:" list — check every listed skill landed in the changeset.
- **Known pre-existing noise in `verify` TEXT diffs**: ~10 Nature Ritual spirit-lifespan divergences from the 2026-02-05 patch (e.g. Winnowing 30…150 local vs 30…240 wiki). NOT caused by your patch — don't fix them inside a patch changeset; they need their own reconciliation pass.
- **`lib/constants.ts` `SKILL_TYPE_BY_ID` is misaligned** with the data's `type` numbers (type 20 = Shouts, not Nature Ritual). Never use it to select skills by type; the pipeline never does.
- **`--audit` checks the POST-apply state** — running it before applying reports failures that just mean "not applied yet".

## Validation checklist (all must pass before PR)

- [ ] Changeset: 0 unresolved entries, 0 flags; the build summary's coverage line (parsed balance lines vs the page's skill-icon count) has no unexplained gap, and no wiki fetch errors are reported
- [ ] `apply` exits 0 with the expected numeric+text change counts
- [ ] `apply --audit` passes
- [ ] `git diff lib/gw/data/` is value-only (tab indentation preserved, no wholesale reformat)
- [ ] `npm run lint && npx tsc --noEmit && npm run build` pass (do NOT start a dev server — the user runs their own)
- [ ] `skills:verify`: 0 NUMERIC mismatches; every TEXT diff explained (lag / known Nature Ritual noise)
- [ ] After the PR opens, spot-check 2–3 changed skills in the Vercel preview

## Shipping

1. Commit the data files **and** `scripts/changesets/<date>.json` + `.overrides.mjs` (the changeset is the review artifact — always committed). Message: `feat: update <Month D, YYYY> skill balance data`.
2. Add a `CHANGELOG.md` entry: `## <today's date>` heading, `**<patch date> Skill Balance Update**` subtitle, then player-facing bullets (highlights first, aggregate the rest — copy the tone of the existing June 24 / April 28 entries). Bump the minor version in `package.json` (`feat:` → minor, per the release process in CLAUDE.md).
3. PR against `develop`.
4. ~3–7 days later, re-run `skills:verify` and resolve anything still lagged or mismatched.

## Relationship to the update detector

A Supabase Edge Function (`check-skill-updates`, prod project `iaqbfleijvzdffahhqtc`) runs daily via pg_cron, watches the wiki for new update pages, records rows in `skill_update_notifications`, advances `skill_update_state.last_known_update_date`, and pings a webhook. It only *detects* — it never modifies skill data, needs no maintenance during this workflow, and will NOT re-alert for a date it already announced (so a patch can be pending even with no fresh notification — check the table or the wiki index). Full detector details: `docs/skill-update-detector-handoff.md`.
