#!/usr/bin/env node
/* global console, process */
/**
 * Render a skill-balance changeset as CHANGELOG-ready markdown.
 *
 *   node scripts/render-changeset-notes.mjs scripts/changesets/20260624.json
 *
 * Prints collapsible per-profession <details> blocks (the format used by the
 * February 8 / July 5, 2026 CHANGELOG entries and rendered on /changes) to
 * stdout. Paste the output into the release's CHANGELOG entry below the
 * highlight bullets. The per-skill text comes from each entry's `notes`
 * (the wiki patch lines captured by build-changeset.mjs), lightly cleaned.
 */

import fs from 'node:fs'

const PROFESSION_ORDER = [
  'Warrior',
  'Ranger',
  'Monk',
  'Necromancer',
  'Mesmer',
  'Elementalist',
  'Assassin',
  'Ritualist',
  'Paragon',
  'Dervish',
]

const changesetPath = process.argv[2]
if (!changesetPath) {
  console.error(
    'usage: node scripts/render-changeset-notes.mjs <changeset.json>'
  )
  process.exit(1)
}

const changeset = JSON.parse(fs.readFileSync(changesetPath, 'utf8'))

function cleanNote(note) {
  let text = note
  let suffix = ''

  const tag = text.match(/^\[([^\]]+)\]\s*/)
  if (tag) {
    text = text.slice(tag[0].length)
    const scope = tag[1].toUpperCase()
    if (scope === 'PVE') suffix = ' (PvE)'
    else if (scope === 'PVP') suffix = ' (PvP)'
    // [base] and [BOTH] apply to the skill as shown — no marker needed
  }

  text = text.replace(/(\d)\.\.(?=\d)/g, '$1...') // wiki `10..80` → site `10...80`
  text = text.replace(/\s*->\s*/g, ' → ')
  text = text.replace(/\.\s*$/, '')
  text = text.charAt(0).toUpperCase() + text.slice(1)
  return text + suffix
}

function skillLine(entry) {
  const notes = entry.notes
    .filter(n => !n.startsWith('override:'))
    .map(cleanNote)
  return `- **${entry.name}** — ${notes.join('; ')}`
}

// Group by profession, folding qualifiers like "Ranger (Nature Ritual)" into
// the base profession.
const byProfession = new Map()
for (const entry of changeset.entries) {
  const profession = entry.profession.replace(/\s*\(.*\)$/, '')
  if (!byProfession.has(profession)) byProfession.set(profession, [])
  byProfession.get(profession).push(entry)
}

const professions = [
  ...PROFESSION_ORDER.filter(p => byProfession.has(p)),
  ...[...byProfession.keys()].filter(p => !PROFESSION_ORDER.includes(p)).sort(),
]

const blocks = professions.map(profession => {
  const entries = byProfession.get(profession)
  const lines = entries.map(skillLine)
  return [
    '<details>',
    `<summary>${profession} — ${entries.length} skill${entries.length === 1 ? '' : 's'}</summary>`,
    '',
    ...lines,
    '</details>',
  ].join('\n')
})

console.log(blocks.join('\n\n'))
