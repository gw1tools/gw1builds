#!/usr/bin/env node
/* global console, process */
/**
 * Apply (or audit) a skill-balance changeset produced by build-changeset.mjs.
 *
 *   node scripts/apply-changeset.mjs scripts/changesets/20260624.json
 *   node scripts/apply-changeset.mjs scripts/changesets/20260624.json --audit
 *
 * Every change is guarded: the local value must equal the recorded `from`
 * (apply) or already equal `to` (idempotent re-run); anything else is a failure
 * and nothing is written. Skill identity is asserted by name so a change can
 * never land on the wrong skill.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const changesetPath = process.argv[2]
const auditOnly = process.argv.includes('--audit')
if (!changesetPath) {
  console.error(
    'usage: node scripts/apply-changeset.mjs <changeset.json> [--audit]'
  )
  process.exit(1)
}

const dataPath = path.join(rootDir, 'lib/gw/data/skilldata.json')
const descPath = path.join(rootDir, 'lib/gw/data/skilldesc-en.json')
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8'))
const writeJson = (p, data) =>
  fs.writeFileSync(p, `${JSON.stringify(data, null, '\t')}\n`)

const dataFile = readJson(dataPath)
const descFile = readJson(descPath)
const skillData = dataFile.skilldata
const skillDesc = descFile.skilldesc
const changeset = readJson(path.resolve(changesetPath))

const failures = []
let dataChanges = 0
let descChanges = 0

const same = (a, b) => Object.is(a, b)

for (const entry of changeset.entries) {
  const id = entry.id
  if (typeof id !== 'number') {
    failures.push(
      `[${id}] unresolved entry — fix the changeset before applying`
    )
    continue
  }
  const key = String(id)
  const d = skillData[key]
  const t = skillDesc[key]
  const label = `${id} ${entry.name}`

  if (!d || !t) {
    failures.push(`[${label}] missing local skill entry`)
    continue
  }
  if (entry.name && t.name !== entry.name) {
    failures.push(
      `[${label}] name mismatch: local "${t.name}" != changeset "${entry.name}"`
    )
    continue
  }

  // numeric fields
  for (const [field, rec] of Object.entries(entry.data ?? {})) {
    const cur = d[field]
    if (auditOnly) {
      if (!same(cur, rec.to))
        failures.push(`[${label}] audit ${field}=${cur}, expected ${rec.to}`)
      continue
    }
    if (same(cur, rec.to)) continue // already applied
    if (!same(cur, rec.from)) {
      failures.push(
        `[${label}] ${field}=${cur}, expected from ${rec.from} (to ${rec.to})`
      )
      continue
    }
    d[field] = rec.to
    dataChanges += 1
  }

  // description / concise text
  for (const field of ['description', 'concise']) {
    const rec = entry.desc?.[field]
    if (!rec) continue
    const cur = t[field]
    if (auditOnly) {
      if (!same(cur, rec.to))
        failures.push(`[${label}] audit ${field} mismatch`)
      continue
    }
    if (same(cur, rec.to)) continue
    if (!same(cur, rec.from)) {
      failures.push(
        `[${label}] ${field} differs from changeset "from" — refusing to apply`
      )
      continue
    }
    t[field] = rec.to
    descChanges += 1
  }
}

if (!auditOnly && failures.length === 0) {
  writeJson(dataPath, dataFile)
  writeJson(descPath, descFile)
}

if (failures.length > 0) {
  console.error(
    `changeset ${auditOnly ? 'audit' : 'apply'} FAILED (${failures.length}):`
  )
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}

if (auditOnly) {
  console.log(
    `audit passed: ${changeset.entries.length} entries verified against current data.`
  )
} else {
  console.log(
    `applied changeset ${changeset.date}: ${dataChanges} numeric + ${descChanges} text changes written.`
  )
}
