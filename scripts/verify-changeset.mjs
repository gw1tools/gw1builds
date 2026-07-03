#!/usr/bin/env node
/* global console, process */
/**
 * Verify an applied changeset against the live wiki skill pages — an independent
 * oracle that does NOT trust our own parser.
 *
 *   node scripts/verify-changeset.mjs scripts/changesets/20260624.json
 *
 * Two checks per skill:
 *   NUMERIC  — wiki infobox costs vs our applied numeric fields.
 *   TEXT     — the multiset of numbers/ranges in our applied description+concise
 *              vs the wiki's. This is phrasing-agnostic, so it catches text
 *              changes our parser doesn't model (flat "50%→100%", "8→12s", etc.)
 *              regardless of wording.
 *
 * Each reports CONFIRMED / LAGGED (wiki still shows the pre-patch value) /
 * MISMATCH (a real discrepancy). Run a few days after applying, once wiki
 * editors have caught up. MISMATCH exits non-zero so it can gate CI.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchSkill } from './lib/wiki.mjs'

const changesetPath = process.argv[2]
if (!changesetPath) {
  console.error('usage: node scripts/verify-changeset.mjs <changeset.json>')
  process.exit(1)
}
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const changeset = JSON.parse(
  fs.readFileSync(path.resolve(changesetPath), 'utf8')
)
const skillDesc = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'lib/gw/data/skilldesc-en.json'), 'utf8')
).skilldesc

const NUMERIC = [
  'energy',
  'recharge',
  'activation',
  'adrenaline',
  'sacrifice',
  'upkeep',
  'overcast',
]

// Multiset of numeric tokens (ranges first, then standalone numbers), sorted.
const tokens = s => {
  if (!s) return []
  const out = []
  let t = String(s)
  t = t.replace(/-?\d+\.\.\.\d+%?/g, m => (out.push(m), ' '))
  t.replace(/-?\d+%?/g, m => (out.push(m), ' '))
  return out.sort()
}
const sameTokens = (a, b) =>
  a.length === b.length && a.every((x, i) => x === b[i])

let numOk = 0
let numLag = 0
const numMismatch = []
let textOk = 0
const textDiffs = []
let unavailable = 0 // skills whose wiki page couldn't be fetched (outage/rename)

const pool = 8
const items = changeset.entries.filter(e => typeof e.id === 'number')
let idx = 0
const worker = async () => {
  while (idx < items.length) {
    const entry = items[idx++]
    let wiki = null
    let fetchFailed = false
    try {
      wiki = await fetchSkill(entry.name)
      if (wiki == null) fetchFailed = true // page exists but no infobox parsed
    } catch {
      fetchFailed = true
    }
    if (fetchFailed) {
      unavailable += 1
      continue // don't miscount an outage/rename as "lagged"
    }

    // NUMERIC
    for (const [field, rec] of Object.entries(entry.data ?? {})) {
      if (!NUMERIC.includes(field)) continue
      const w = wiki?.[field]
      if (w == null) numLag += 1
      else if (w === rec.to) numOk += 1
      else if (w === rec.from) numLag += 1
      else
        numMismatch.push(
          `[${entry.id}] ${entry.name}.${field}: wiki=${w}, applied=${rec.to}`
        )
    }

    // TEXT (only where the wiki page exposes a description to compare)
    if (wiki?.description != null) {
      const local = skillDesc[String(entry.id)]
      const localTok = [
        ...tokens(local?.description),
        ...tokens(local?.concise),
      ].sort()
      const wikiTok = [
        ...tokens(wiki.description),
        ...tokens(wiki.concise),
      ].sort()
      if (sameTokens(localTok, wikiTok)) textOk += 1
      else
        textDiffs.push(
          `[${entry.id}] ${entry.name}: applied numbers [${localTok.join(', ')}] vs wiki [${wikiTok.join(', ')}]`
        )
    }
  }
}
await Promise.all(Array.from({ length: pool }, worker))

console.log(
  `\nNUMERIC: ${numOk} confirmed, ${numLag} lagged, ${numMismatch.length} mismatches` +
    (unavailable > 0 ? `; ${unavailable} skills unavailable (wiki fetch failed — not verified)` : '')
)
for (const m of numMismatch) console.error(`  MISMATCH ${m}`)
console.log(
  `TEXT:    ${textOk} matching, ${textDiffs.length} differing (lag or miss — review)`
)
for (const d of textDiffs) console.log(`  DIFF ${d}`)

if (numMismatch.length > 0) process.exit(1)
