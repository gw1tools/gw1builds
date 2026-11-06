#!/usr/bin/env node
/* global console, process */
/**
 * Build a reviewable skill-balance changeset from the official GW1 wiki.
 *
 *   node scripts/build-changeset.mjs --date 20260624
 *
 * Pipeline (reliable, no hand-mapped skill ids):
 *   1. Read the per-skill change lines from Feedback:Game updates/<date>.
 *   2. Resolve each skill to its authoritative numeric id via the wiki Skill
 *      infobox (handles PvE / PvP / BOTH variants), so ids are never guessed.
 *   3. Parse the change text for numeric cost changes (energy/recharge/
 *      activation/adrenaline) and "A..B -> C..D" scaling swaps applied to the
 *      local description/concise text.
 *   4. Cross-check every change against the current wiki value where the skill
 *      page is already updated; flag mismatches and anything that needs manual
 *      authoring (reworks, added clauses, non-representable AoE %, etc.).
 *
 * Output: scripts/changesets/<date>.json — a human-reviewable artifact applied
 * later by scripts/apply-changeset.mjs.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  fetchSkill,
  fetchWikitext,
  parseBalanceChanges,
  parseBalanceOtherBullets,
} from './lib/wiki.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const arg = name => {
  const i = process.argv.indexOf(name)
  return i === -1 ? undefined : process.argv[i + 1]
}
const date = arg('--date') || '20260624'

// Overrides module (optional): default export keyed by skill id, plus an optional
// `acknowledged` export — [{ name?, line?, note }] — for patch lines that
// intentionally produce no data change (prose, skills absent from our data). An
// acknowledged line is recorded in the changeset instead of being flagged.
const overridesFile =
  arg('--overrides') ||
  path.join(rootDir, 'scripts/changesets', `${date}.overrides.mjs`)
const overridesMod = fs.existsSync(overridesFile)
  ? await import(`file://${path.resolve(overridesFile)}`)
  : {}
const overrides = overridesMod.default || overridesMod.overrides || {}
const acknowledgements = (overridesMod.acknowledged ?? []).map(a => ({
  ...a,
  used: false,
}))
const acknowledged = [] // what this run skipped, written to the changeset
const acknowledge = (kind, text) => {
  const a = acknowledgements.find(x =>
    kind === 'name' ? x.name === text : x.line && text.includes(x.line)
  )
  if (!a) return false
  a.used = true
  acknowledged.push({ [kind]: text, note: a.note })
  return true
}

// New skills (e.g. a fresh PvP split) are introduced via an override `create`
// block; the patch-notes name then resolves to that id instead of "unknown".
const createdIdByName = {}
for (const [id, ov] of Object.entries(overrides))
  if (ov.create) createdIdByName[ov.create.desc.name] = Number(id)

const skillData = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'lib/gw/data/skilldata.json'), 'utf8')
).skilldata
const skillDesc = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'lib/gw/data/skilldesc-en.json'), 'utf8')
).skilldesc

// Note: Nature Ritual skills are resolved from the explicit "Affects:" list in
// the patch notes (not by skill type), so no type id is hard-coded here.

// Working copies of description text; original skillDesc stays as the "from" baseline.
const work = {}
const getWork = id => {
  const key = String(id)
  if (!work[key]) work[key] = { ...skillDesc[key] }
  return work[key]
}

// --- change-text parsing -----------------------------------------------------

const numFields = [
  [
    'energy',
    /energy cost[^.]*?from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)(?![%\d/])/i,
  ],
  [
    'recharge',
    /\brecharge(?! bonus)(?: time)?[^.]*?from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)(?![%\d/])/i,
  ],
  [
    'activation',
    // "activation time from" (Jun 2026) or bare "activation from" (Aug 2026)
    /\bactivation(?: time)?[^.]*?from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)(?![%\d/])/i,
  ],
  [
    'adrenaline',
    /adrenaline cost[^.]*?from (\d+(?:\.\d+)?) to (\d+(?:\.\d+)?)(?![%\d/])/i,
  ],
]

const parseNumeric = text => {
  const out = {}
  for (const [field, re] of numFields) {
    const m = text.match(re)
    if (m) out[field] = { from: Number(m[1]), to: Number(m[2]) }
  }
  return out
}

// "A..B -> C..D" range swaps (local format uses three dots); keep optional %.
const parseRanges = text => {
  const out = []
  for (const m of text.matchAll(/(\d+\.\.\d+%?)\s+to\s+(\d+\.\.\d+%?)/g)) {
    out.push({ from: m[1].replace('..', '...'), to: m[2].replace('..', '...') })
  }
  return out
}

const structuralRe =
  /\b(add\b|adds\b|added\b|remove\b|removed\b|rework\b|reworked\b|changed functionality|also hits|scaling|set on fire|range of|adjust text|increase range|reduce range)\b/i
const aoeRe = /AoE damage from 100% to 75%/i

// --- target (id) resolution ---------------------------------------------------

// Local name -> id(s). Resolution is keyed off our EXACT local name (proven
// reliable); the wiki id is only a cross-check. Names map to >1 id are ambiguous.
const localIdsByName = {}
for (const [id, d] of Object.entries(skillDesc)) {
  ;(localIdsByName[d.name] ??= []).push(Number(id))
}

const skillCache = new Map()
let wikiFetchErrors = 0 // network/API failures (not "page has no infobox")
const getSkill = async title => {
  if (skillCache.has(title)) return skillCache.get(title)
  let s = null
  try {
    s = await fetchSkill(title)
  } catch {
    wikiFetchErrors += 1 // surfaced in the summary so a wiki outage isn't silent
    s = null
  }
  skillCache.set(title, s)
  return s
}

// Resolve an id from the local name, cross-checking the wiki id. Pushes flags
// for: unknown name, ambiguous name, and genuine local/wiki id disagreement
// (the "our internal id might be wrong" detector). Wiki redirects/multi-id pages
// (where the wiki page name differs from `name`) are ignored for cross-check.
const resolveLocalId = (name, wiki, flags) => {
  const ids = localIdsByName[name]
  if (!ids || ids.length === 0) {
    const created = createdIdByName[name]
    if (created != null) {
      if (wiki?.id != null && wiki.id !== created)
        flags.push(
          `local/wiki id disagree for "${name}": create ${created}, wiki ${wiki.id}`
        )
      return created
    }
    flags.push(`unknown skill name "${name}" (not in local data)`)
    return null
  }
  if (ids.length > 1) {
    flags.push(`ambiguous name "${name}" -> local ids ${ids.join(', ')}`)
    return null
  }
  const id = ids[0]
  if (wiki?.id != null && wiki.name === name && wiki.id !== id) {
    flags.push(
      `local/wiki id disagree for "${name}": local ${id}, wiki ${wiki.id}`
    )
  }
  return id
}

/** Resolve a change line to one or more local skill ids (+ wiki data, if any). */
const resolveTargets = async (name, variant) => {
  const targets = []
  const flags = []

  // Names that embed a "(PvP)"/"(PvE)" suffix are their own skill + page.
  if (/\((PvP|PvE)\)\s*$/.test(name)) {
    const wiki = await getSkill(name)
    const id = resolveLocalId(name, wiki, flags)
    if (id != null) targets.push({ id, wiki })
    return { targets, flags }
  }

  const baseWiki = await getSkill(name)
  const baseId = resolveLocalId(name, baseWiki, flags)
  if (baseId == null) return { targets, flags }

  const base = skillData[String(baseId)]
  // A split this changeset creates counts as the PvP target too
  const splitId = base?.pvp_split
    ? base.split_id
    : (createdIdByName[`${name} (PvP)`] ?? 0)
  const v = (variant || '').toUpperCase()

  const wantBase = !v || v === 'PVE' || v === 'BOTH'
  const wantPvp = v === 'PVP' || v === 'BOTH'

  if (wantBase) targets.push({ id: baseId, wiki: baseWiki })
  if (wantPvp) {
    if (splitId)
      targets.push({ id: splitId, wiki: await getSkill(`${name} (PvP)`) })
    // BOTH with no split correctly applies to the base only; only an explicit
    // PvP tag with no split is a real problem.
    else if (v === 'PVP')
      flags.push(`"${name}" (PvP): no PvP split in local data`)
  }
  return { targets, flags }
}

// --- build --------------------------------------------------------------------

const entries = new Map() // id -> entry

// Mirrors PROFESSION_BY_ID in lib/constants.ts. Fallback for pages without
// per-profession subheadings (e.g. Jul 8, 2026), so every entry has one.
const PROFESSION_BY_ID = ['None', 'Warrior', 'Ranger', 'Monk', 'Necromancer', 'Mesmer', 'Elementalist', 'Assassin', 'Ritualist', 'Paragon', 'Dervish']

const entryFor = (id, name, profession) => {
  const key = String(id)
  if (!entries.has(key)) {
    const numericId = Number(id)
    const localProf = skillData[key]?.profession ?? overrides[key]?.create?.data.profession
    entries.set(key, {
      id: Number.isNaN(numericId) ? id : numericId,
      name,
      profession: profession ?? PROFESSION_BY_ID[localProf] ?? null,
      data: {},
      desc: {},
      flags: [],
      notes: [],
    })
  }
  return entries.get(key)
}

const run = async () => {
  const changes = await parseBalanceChanges(date)

  // Silent-empty guard: the balance section is found by heading text ("... Balance
  // Update"). If that heading is ever renamed, parseBalanceChanges returns [] and
  // we'd produce an empty changeset that LOOKS like "no changes". Cross-check
  // against the raw count of skill-icon lines on the page so that can't hide.
  const pageText = await fetchWikitext(`Feedback:Game updates/${date}`)
  const iconLineCount = (pageText.match(/\{\{\s*skill icon/gi) ?? []).length
  // A page whose only skill-icon lines are outside the balance section (e.g. AI
  // tweaks) opts out explicitly via `export const noBalanceSection = '<why>'`.
  if (overridesMod.noBalanceSection)
    acknowledged.push({ page: date, note: overridesMod.noBalanceSection })
  else if (changes.length === 0 && iconLineCount > 0) {
    throw new Error(
      `parsed 0 balance changes but the page has ${iconLineCount} {{skill icon}} lines — ` +
        `the "Balance Update" section heading may have changed. Inspect ${date} manually.`
    )
  }

  for (const { profession, name, variant, text } of changes) {
    if (acknowledge('name', name)) continue
    const { targets, flags } = await resolveTargets(name, variant)
    for (const f of flags) {
      const e = entryFor(`unresolved:${name}`, name, profession)
      e.flags.push(f)
      e.notes.push(text)
    }
    // Loud guard: a change line that resolves to nothing must never be silently dropped.
    if (targets.length === 0 && flags.length === 0) {
      const e = entryFor(`unresolved:${name}`, name, profession)
      e.flags.push(
        `could not resolve any target (variant=${variant ?? 'none'})`
      )
      e.notes.push(text)
    }
    if (aoeRe.test(text)) {
      // recorded per-target below as a flag (not representable in our data)
    }

    for (const { id, wiki } of targets) {
      const localD = skillData[String(id)]
      const localT = skillDesc[String(id)]
      const e = entryFor(id, localT?.name ?? name, profession)
      e.notes.push(`[${variant ?? 'base'}] ${text}`)

      if (!localD || !localT) {
        // A skill this changeset creates: its override `create` block carries
        // the full post-patch state, so there's nothing to parse here.
        if (!overrides[id]?.create) e.flags.push('missing local skill entry')
        continue
      }
      if (
        wiki?.name &&
        localT.name !== wiki.name &&
        !/\((PvP|PvE)\)/.test(name)
      ) {
        e.flags.push(
          `name mismatch: local "${localT.name}" vs wiki "${wiki.name}"`
        )
      }

      // numeric cost changes
      const nums = parseNumeric(text)
      for (const [field, { from, to }] of Object.entries(nums)) {
        const cur = localD[field]
        if (cur === to) continue // already applied (no-op)
        const rec = { from: cur, to, noteFrom: from }
        if (cur !== from)
          rec.flag = `current ${field}=${cur} != note-from ${from}`
        if (wiki && wiki[field] != null) {
          if (wiki[field] === to) rec.wiki = 'confirmed'
          else if (wiki[field] === from) rec.wiki = 'lagged'
          else rec.wiki = `mismatch(${wiki[field]})`
        } else rec.wiki = 'n/a'
        e.data[field] = rec
      }

      // text scaling swaps (mutate the working copy; e.desc computed at the end)
      const ranges = parseRanges(text)
      let swapped = false
      const w = getWork(id)
      for (const { from, to } of ranges) {
        for (const f of ['description', 'concise']) {
          const s = w[f]
          if (s == null) continue
          const n = s.split(from).length - 1
          if (n === 1) {
            w[f] = s.replaceAll(from, to)
            swapped = true
          } else if (n > 1) {
            e.flags.push(`ambiguous range "${from}" x${n} in ${f}`)
          }
        }
      }

      // things needing manual authoring / not representable
      const aoe = aoeRe.test(text)
      const structural = structuralRe.test(text)
      const bareTo = ranges.length === 0 && /\bto \d+\.\.\d+/.test(text)
      if (aoe) e.flags.push('AoE 100%->75% not representable (skipped)')
      if (structural) e.flags.push(`manual: "${text}"`)
      if (bareTo) e.flags.push(`manual (bare "to" range): "${text}"`)
      const numCount = Object.keys(nums).length
      if (!numCount && !swapped && !aoe && !structural && !bareTo)
        e.flags.push(`unparsed: "${text}"`)

      // Partial-parse guard: we captured SOMETHING but the line looks like it
      // describes more changes than we captured (e.g. an extra clause with a
      // novel phrasing). Flag so a second change is never silently dropped.
      if ((numCount || swapped) && !structural && !aoe && !bareTo) {
        const verbs = (
          text.match(
            /\b(reduce|increase|decrease|adjust|add|remove|change|set|now)\b/gi
          ) || []
        ).length
        if (verbs > numCount + ranges.length)
          e.flags.push(`partial parse — review: "${text}"`)
      }
    }
  }

  // Nature Ritual bulk activation change (explicit "Affects:" list in notes)
  await applyNatureRitual()

  // Surface any balance-section bullet we didn't explicitly handle, so bulk /
  // prose changes are never invisible.
  await surfaceOtherBullets()

  // Manual overrides (reproducible authoring of reworks / added clauses / etc.)
  await applyOverrides()

  // Compute description/concise from/to from the working copies vs original.
  for (const e of entries.values()) {
    const key = String(e.id)
    const w = work[key]
    if (!w) continue
    for (const f of ['description', 'concise']) {
      if (skillDesc[key]?.[f] !== w[f])
        e.desc[f] = { from: skillDesc[key][f], to: w[f] }
    }
  }

  const list = [...entries.values()].sort((a, b) => {
    const an = typeof a.id === 'number'
    const bn = typeof b.id === 'number'
    if (an && bn) return a.id - b.id
    return an ? -1 : bn ? 1 : 0
  })
  const out = {
    date,
    source: `https://wiki.guildwars.com/wiki/Feedback:Game_updates/${date}`,
    generatedAt: new Date().toISOString(),
    entries: list,
    acknowledged,
  }
  const outPath = path.join(rootDir, 'scripts/changesets', `${date}.json`)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`)

  // summary
  const dataChanges = list.reduce((n, e) => n + Object.keys(e.data).length, 0)
  const descChanges = list.reduce((n, e) => n + Object.keys(e.desc).length, 0)
  const flagged = list.filter(e => e.flags.length)
  console.log(
    `changeset ${date}: ${list.length} skills, ${dataChanges} numeric, ${descChanges} text changes`
  )
  console.log(`wrote ${path.relative(rootDir, outPath)}`)
  console.log(
    `coverage: parsed ${changes.length} balance lines (page has ${iconLineCount} skill-icon lines total incl. non-balance sections)` +
      (wikiFetchErrors > 0 ? `; ⚠️ ${wikiFetchErrors} wiki fetch errors — cross-check degraded` : '')
  )
  const created = list.filter(e => e.create).length
  if (created) console.log(`creates ${created} new skills`)
  if (acknowledged.length)
    console.log(`acknowledged ${acknowledged.length} lines (no data change, see changeset)`)
  const stale = acknowledgements.filter(a => !a.used)
  for (const a of stale)
    console.log(`⚠️  acknowledgement matched nothing: ${a.name ?? a.line}`)
  console.log(`\n${flagged.length} skills with flags (need review):`)
  for (const e of flagged)
    console.log(`  [${e.id}] ${e.name}: ${e.flags.join('; ')}`)
}

// Canonical key order of a skilldata / skilldesc record (taken from the data).
const DATA_KEYS = Object.keys(Object.values(skillData)[0])
const DESC_KEYS = ['id', 'name', 'description', 'concise']

const buildCreate = (id, ov) => {
  const { data, desc } = ov.create
  const keysMatch = (obj, keys) =>
    Object.keys(obj).length === keys.length && keys.every(k => k in obj)
  if (skillData[String(id)] || skillDesc[String(id)])
    throw new Error(`override create ${id}: skill already exists locally`)
  const fullData = { ...data, id: Number(id) }
  const fullDesc = { ...desc, id: Number(id) }
  if (!keysMatch(fullData, DATA_KEYS) || !keysMatch(fullDesc, DESC_KEYS))
    throw new Error(`override create ${id}: fields must be exactly ${DATA_KEYS} / ${DESC_KEYS}`)
  return {
    data: Object.fromEntries(DATA_KEYS.map(k => [k, fullData[k]])),
    desc: Object.fromEntries(DESC_KEYS.map(k => [k, fullDesc[k]])),
  }
}

const applyOverrides = async () => {
  for (const [id, ov] of Object.entries(overrides)) {
    const localT = skillDesc[String(id)]
    const name = ov.create?.desc.name ?? localT?.name ?? `id ${id}`
    const e = entryFor(id, name, ov.profession)
    if (ov.profession) e.profession = ov.profession
    if (ov.note) e.notes.push(`override: ${ov.note}`)
    if (ov.create) {
      e.name = name // the change loop may have labelled it with the base name
      e.create = buildCreate(id, ov)
      e.flags = e.flags.filter(f => !/missing local/i.test(f))
      continue
    }
    if (ov.data)
      for (const [f, v] of Object.entries(ov.data)) {
        const cur = skillData[String(id)]?.[f]
        if (cur !== v) e.data[f] = { from: cur, to: v, wiki: 'override' }
        else delete e.data[f] // override pins the current value: drop a parsed change
      }
    const w = getWork(id)
    if (ov.description != null) w.description = ov.description
    if (ov.concise != null) w.concise = ov.concise
    if (ov.append) {
      if (ov.append.description) w.description += ov.append.description
      if (ov.append.concise) w.concise += ov.append.concise
    }
    if (ov.replaceAll)
      for (const [from, to] of ov.replaceAll) {
        w.description = w.description.replaceAll(from, to)
        w.concise = w.concise.replaceAll(from, to)
      }
    // An override resolves manual/unparsed/ambiguous/AoE flags; keep only the
    // structural ones an override can't address.
    e.flags = e.flags.filter(f =>
      /no PvP split|name mismatch|missing local/i.test(f)
    )
  }
}

// Regex identifying the one bulk bullet we handle explicitly (Nature Ritual).
const NATURE_RITUAL_RE =
  /Nature Ritual\]*\s*activation time from (\d+) to (\d+)\.\s*Affects:\s*([^\n]+)/i

const surfaceOtherBullets = async () => {
  const bullets = await parseBalanceOtherBullets(date)
  for (const text of bullets) {
    if (NATURE_RITUAL_RE.test(text)) continue // handled by applyNatureRitual
    if (acknowledge('line', text)) continue
    const e = entryFor(
      `unhandled:${text.slice(0, 40)}`,
      '(bulk/prose line)',
      null
    )
    e.flags.push(`unhandled balance line — review: "${text}"`)
    e.notes.push(text)
  }
}

const applyNatureRitual = async () => {
  const wikitext = await fetchWikitext(`Feedback:Game updates/${date}`)
  // Wikitext is "[[Nature Ritual]] activation time from 3 to 2. Affects: [[..]], ..."
  const m = wikitext.match(NATURE_RITUAL_RE)
  if (!m) return
  const to = Number(m[2])
  const names = [...m[3].matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)].map(x =>
    x[1].trim()
  )
  for (const name of names) {
    const ids = localIdsByName[name] ?? []
    const id = ids.length === 1 ? ids[0] : null
    const e = entryFor(
      id ?? `unresolved:${name}`,
      name,
      'Ranger (Nature Ritual)'
    )
    if (id == null) {
      e.flags.push(
        `Nature Ritual: ${ids.length === 0 ? 'unknown name' : 'ambiguous name'}`
      )
      continue
    }
    const cur = skillData[String(id)].activation
    if (cur === to) continue
    e.data.activation = {
      from: cur,
      to,
      noteFrom: cur,
      wiki: 'bulk',
      bulk: 'nature-ritual',
    }
    e.notes.push(`Nature Ritual activation -> ${to}`)
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
