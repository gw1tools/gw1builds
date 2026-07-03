/* global fetch, setTimeout */
/**
 * Shared helpers for reading structured Guild Wars 1 skill data from the
 * official wiki (https://wiki.guildwars.com) via the MediaWiki API.
 *
 * The wiki Skill infobox carries the authoritative numeric skill `id`, costs,
 * and both the full + concise descriptions, so we key changes by that id rather
 * than mapping skill names to ids by hand (the source of past mistakes).
 *
 * Same MediaWiki-API-fetch + parse approach already used by scrape-pvx.ts.
 */

const API = 'https://wiki.guildwars.com/api.php'

/**
 * Extract the inner content of the first `{{<name> ...}}` template via brace
 * matching (handles nested templates like {{gr|..}} and closing `}}` mid-line).
 * Returns the content between the outer braces, or null if not found.
 */
const extractTemplate = (text, name) => {
  const re = new RegExp(`\\{\\{\\s*${name}\\b`, 'i')
  const start = text.search(re)
  if (start === -1) return null
  let depth = 0
  for (let j = start; j < text.length - 1; j++) {
    if (text[j] === '{' && text[j + 1] === '{') {
      depth++
      j++
    } else if (text[j] === '}' && text[j + 1] === '}') {
      depth--
      j++
      if (depth === 0) return text.slice(start + 2, j - 1)
    }
  }
  return null
}

const NS_FEEDBACK = 202 // "Feedback" namespace on wiki.guildwars.com
const wikitextCache = new Map()
const sleep = ms => new Promise(r => setTimeout(r, ms))

/** GET a MediaWiki API query (given the query string after `?`) as JSON, with retry. */
const fetchApiJson = async (query, label) => {
  const url = `${API}?${query}&format=json`
  let lastErr
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'user-agent': 'gw1builds-skilldata-sync/1.0 (contact: gw1builds)',
        },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error.info)
      return json
    } catch (err) {
      lastErr = err
      if (attempt < 2) await sleep(500 * (attempt + 1))
    }
  }
  throw new Error(`wiki ${label}: ${lastErr?.message ?? lastErr}`)
}

/** Fetch raw wikitext for a page. Cached per-page for the process. */
export const fetchWikitext = async pageTitle => {
  if (wikitextCache.has(pageTitle)) return wikitextCache.get(pageTitle)
  const json = await fetchApiJson(
    `action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&redirects=1`,
    `fetch ${pageTitle}`
  )
  const text = json?.parse?.wikitext?.['*']
  if (typeof text !== 'string') throw new Error(`wiki fetch ${pageTitle}: no wikitext (missing page?)`)
  wikitextCache.set(pageTitle, text)
  return text
}

/**
 * Render wiki skill text into our dataset's plain-text style:
 * - {{gr|a|b}} / {{gr|a|b|c}} -> "a...b" (progression range)
 * - [[Target|Label]] -> "Label", [[Target]] -> "Target"
 * - [s], [es], [y|ies] pluralization markers -> first option
 * - collapse whitespace
 */
export const renderWikiText = raw => {
  if (raw == null) return raw
  let t = String(raw)
  // progression ranges {{gr|10|30}} -> 10...30. A trailing "-" arg marks a
  // negative range (degeneration), e.g. {{gr|1|4|-}} -> -1...4.
  t = t.replace(/\{\{gr\|([^}]*)\}\}/gi, (_m, args) => {
    const parts = args.split('|').map(s => s.trim())
    const neg = parts.includes('-')
    const nums = parts.filter(p => /^-?\d/.test(p))
    if (nums.length === 0) return ''
    const range =
      nums.length === 1 ? nums[0] : `${nums[0]}...${nums[nums.length - 1]}`
    return neg ? `-${range}` : range
  })
  // bold/italic wiki markup
  t = t.replace(/'''''|'''|''/g, '')
  // links [[A|B]] -> B, [[A]] -> A
  t = t.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
  t = t.replace(/\[\[([^\]]+)\]\]/g, '$1')
  // pluralization markers [s] / [es] / [y|ies] -> first option (singular form drop bracket)
  t = t.replace(/\[([a-z]+)\|([a-z]+)\]/gi, '$1')
  t = t.replace(/\[(s|es)\]/gi, '$1')
  // gray caveat text {{gray|...}} -> <gray>...</gray> (matches our dataset style)
  t = t.replace(/\{\{gray\|([^}]*)\}\}/gi, '<gray>$1</gray>')
  // leftover simple templates {{x}} -> drop
  t = t.replace(/\{\{[^}]*\}\}/g, '')
  return t.replace(/\s+/g, ' ').trim()
}

/** Build the "Elite? <Type>. " classification prefix the wiki prepends but our data omits. */
const typePrefixes = infobox => {
  const type = renderWikiText(infobox.type || '')
  const elite = /^y(es)?$/i.test(infobox.elite || '')
  const prefixes = []
  if (type) {
    if (elite) prefixes.push(`Elite ${type}. `)
    prefixes.push(`${type}. `)
  }
  if (elite) prefixes.push('Elite. ')
  return prefixes
}

/** Strip the leading skill-type classification sentence to match our dataset style. */
const stripTypePrefix = (rendered, infobox) => {
  if (!rendered) return rendered
  for (const p of typePrefixes(infobox)) {
    if (rendered.startsWith(p)) return rendered.slice(p.length).trim()
  }
  return rendered
}

/**
 * Parse a Skill infobox from page wikitext into a normalized object.
 * Numeric cost fields are returned as numbers when present.
 * `description` / `concise` are rendered to our dataset's plain-text style.
 * Returns null if no Skill infobox is found.
 */
export const parseSkillInfobox = wikitext => {
  const inner = extractTemplate(wikitext, 'skill infobox')
  if (inner == null) return null
  const raw = {}
  // split on "\n|" param boundaries (nested template pipes are not line-anchored)
  for (const chunk of inner.split(/\n\s*\|/)) {
    const eq = chunk.indexOf('=')
    if (eq === -1) continue
    const key = chunk
      .slice(0, eq)
      .trim()
      .replace(/^\|/, '')
      .trim()
      .toLowerCase()
    // Strip HTML comments — some pages carry multiple ids, e.g.
    // `id = 1951<!-- Luxon -->, 2094<!-- Kurzick -->`.
    const val = chunk
      .slice(eq + 1)
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()
    if (key) raw[key] = val
  }

  const FRAC = {
    '1/4': 0.25,
    '1/2': 0.5,
    '3/4': 0.75,
    '¼': 0.25,
    '½': 0.5,
    '¾': 0.75,
  }
  const num = v => {
    if (v == null) return undefined
    const s = String(v).trim()
    if (s === '') return undefined
    // fraction templates {{1/4}} / glyphs ¼, optionally with a leading integer
    for (const [g, f] of Object.entries(FRAC)) {
      if (s.includes(g)) {
        const lead = s.match(/^(\d+)/)
        return (lead ? Number(lead[1]) : 0) + f
      }
    }
    const m = s.match(/-?\d+(\.\d+)?/)
    return m ? Number(m[0]) : undefined
  }

  const descRaw = raw.description
  const conciseRaw = raw['concise description']

  return {
    id: num(raw.id),
    name: renderWikiText(raw.name),
    profession: renderWikiText(raw.profession),
    attribute: renderWikiText(raw.attribute),
    type: renderWikiText(raw.type),
    elite: /^y(es)?$/i.test(raw.elite || ''),
    energy: num(raw.energy),
    activation: num(raw.activation),
    recharge: num(raw.recharge),
    adrenaline: num(raw.adrenaline),
    sacrifice: num(raw.sacrifice),
    upkeep: num(raw.upkeep),
    overcast: num(raw.overcast),
    description:
      descRaw == null
        ? undefined
        : stripTypePrefix(renderWikiText(descRaw), raw),
    concise:
      conciseRaw == null
        ? undefined
        : stripTypePrefix(renderWikiText(conciseRaw), raw),
    _raw: raw,
  }
}

/** Convenience: fetch a skill page and return its parsed infobox (or null). */
export const fetchSkill = async pageTitle =>
  parseSkillInfobox(await fetchWikitext(pageTitle))

/**
 * Parse a Feedback:Game_updates/<date> page for the list of skill page titles it
 * links to (i.e. which skills the update touched). Returns unique titles.
 * Heuristic: collects [[links]] that are not namespaced/section/file links.
 */
export const parseUpdatePage = async date => {
  const wikitext = await fetchWikitext(`Feedback:Game updates/${date}`)
  const titles = new Set()
  for (const lm of wikitext.matchAll(/\[\[([^\]|#]+)(?:\|[^\]]+)?\]\]/g)) {
    const title = lm[1].trim()
    if (!title || title.includes(':')) continue // skip namespaced (File:, Category:, etc.)
    titles.add(title)
  }
  return [...titles]
}

/**
 * Parse the per-skill balance change lines from a Feedback:Game updates/<date>
 * page. Only the "Balance Update" section is read (AI/bug-fix sections are
 * skipped). Returns [{ profession, name, variant, text }] where variant is
 * 'PvE' | 'PvP' | 'BOTH' | null, name is the skill-icon name (may embed a
 * "(PvP)"/"(PvE)" suffix), and text is the raw change description.
 */
export const parseBalanceChanges = async date => {
  const wikitext = await fetchWikitext(`Feedback:Game updates/${date}`)
  const lines = wikitext.split('\n')
  const out = []
  let inBalance = false
  let profession = null
  const iconRe = /\{\{\s*skill icon\s*\|\s*([^}|]+?)\s*(?:\|[^}]*)?\}\}\s*(.*)/i
  for (const ln of lines) {
    const h = ln.trim().match(/^(=+)\s*(.*?)\s*\1$/)
    if (h) {
      const level = h[1].length
      const title = h[2]
      if (level === 3 && /balance update/i.test(title)) {
        inBalance = true
        continue
      }
      if (inBalance && level <= 3 && !/balance update/i.test(title)) {
        if (level <= 2) inBalance = false
        else if (level === 3) inBalance = false
      }
      if (inBalance && level === 4) profession = title
      continue
    }
    if (!inBalance) continue
    const m = ln.match(iconRe)
    if (!m) continue
    const name = m[1].trim()
    let rest = m[2].trim()
    let variant = null
    const vm = rest.match(/^\((PvE|PvP|BOTH)\)\s*/i)
    if (vm) {
      variant = vm[1].toUpperCase()
      rest = rest.slice(vm[0].length)
    }
    rest = rest.replace(/^[-:]\s*/, '').trim()
    out.push({ profession, name, variant, text: rest })
  }
  return out
}

/**
 * Bullet lines in the Balance Update section that are NOT per-skill `{{skill icon}}`
 * lines (e.g. bulk changes like the Nature Ritual line, or prose notes). The
 * caller surfaces any it doesn't explicitly handle so a bulk/prose change is
 * never silently invisible to the pipeline.
 */
export const parseBalanceOtherBullets = async date => {
  const wikitext = await fetchWikitext(`Feedback:Game updates/${date}`)
  const lines = wikitext.split('\n')
  const out = []
  let inBalance = false
  for (const ln of lines) {
    const h = ln.trim().match(/^(=+)\s*(.*?)\s*\1$/)
    if (h) {
      const level = h[1].length
      const title = h[2]
      if (level === 3 && /balance update/i.test(title)) inBalance = true
      else if (inBalance && level <= 3) inBalance = false
      continue
    }
    if (!inBalance) continue
    const t = ln.trim()
    if (!/^\*+/.test(t)) continue // bullet lines only
    if (/\{\{\s*skill icon/i.test(t)) continue // per-skill lines handled elsewhere
    const text = t.replace(/^\*+\s*/, '').trim()
    if (text) out.push(text)
  }
  return out
}

/**
 * All Feedback:Game updates/<YYYYMMDD> dates, ascending.
 * Queried via the API (list=allpages) — the "Game updates" index page builds its
 * list with DynamicPageList, so the dated links are NOT in that page's wikitext.
 */
export const listUpdateDates = async () => {
  // apdir=descending: newest titles first, so the latest dates stay inside the
  // 500-page window even once the wiki grows past aplimit (result is re-sorted
  // ascending below).
  const json = await fetchApiJson(
    `action=query&list=allpages&apnamespace=${NS_FEEDBACK}&apprefix=${encodeURIComponent('Game updates/')}&apdir=descending&aplimit=500`,
    'list update pages'
  )
  const pages = json?.query?.allpages ?? []
  if (pages.length === 0) throw new Error('wiki: no Feedback "Game updates/*" pages returned')
  const dates = pages
    .map(p => p.title.match(/Game updates\/(\d{8})$/)?.[1])
    .filter(Boolean)
  return [...new Set(dates)].sort()
}

/** Feedback:Game updates dates newer than `afterYmd` (YYYYMMDD string), ascending. */
export const listUpdateDatesAfter = async afterYmd =>
  (await listUpdateDates()).filter(d => d > afterYmd)
