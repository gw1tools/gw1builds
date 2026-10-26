// Detects new Guild Wars 1 skill-balance updates by scanning the official wiki
// "Game updates" page for a Feedback:Game_updates/<date> newer than the last one
// we have applied. Records a notification row (and optionally pings a webhook)
// so the team knows to run the skill-data update pipeline.
//
// Invoked daily by pg_cron (see migration 20260625100929_skill_update_cron.sql).
//
// AUTH: runs with verify_jwt = false (see config.toml) because pg_cron cannot mint
// a Supabase JWT, and Supabase's new API keys (sb_secret_*) are not JWTs. Instead
// the endpoint is gated by a shared secret: the cron sends `Authorization: Bearer
// <CRON_SECRET>` and this function checks it. Set the same value in the function
// env (supabase secrets set CRON_SECRET=...) and in Vault (skill_update_service_key)
// that the cron reads.
//
// Deploy: supabase functions deploy check-skill-updates
// Optional alert: supabase secrets set SKILL_UPDATE_WEBHOOK_URL=<discord/slack url>

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const WIKI_API = 'https://wiki.guildwars.com/api.php'
const NS_FEEDBACK = 202 // "Feedback" namespace on wiki.guildwars.com

// Newest Feedback:Game updates/<YYYYMMDD> date. Queried via the API
// (list=allpages) — the "Game updates" index page builds its list with
// DynamicPageList, so the dated links are NOT in that page's wikitext.
// Throws (rather than returning null) on any wiki failure so it can't fail silently.
const fetchLatestUpdateDate = async (): Promise<string> => {
  // apdir=descending: newest titles first, so the latest date is always inside
  // the 500-page window even once the wiki grows past aplimit (434 pages as of
  // 2026-07; ascending order would silently drop the newest and never detect).
  const url = `${WIKI_API}?action=query&list=allpages&apnamespace=${NS_FEEDBACK}&apprefix=${encodeURIComponent('Game updates/')}&apdir=descending&aplimit=500&format=json`
  const res = await fetch(url, { headers: { 'user-agent': 'gw1builds-skill-update-check/1.0' } })
  if (!res.ok) throw new Error(`wiki HTTP ${res.status}`)
  // During outages the wiki serves an HTML maintenance page with HTTP 200
  if (!res.headers.get('content-type')?.includes('json')) {
    throw new Error('wiki API returned non-JSON (wiki likely down for maintenance)')
  }
  const json = await res.json()
  if (json.error) throw new Error(`wiki API error: ${json.error.info}`)
  const pages: Array<{ title: string }> = json?.query?.allpages ?? []
  if (pages.length === 0) throw new Error('wiki: no Feedback "Game updates/*" pages returned')
  const dates = pages.map(p => p.title.match(/Game updates\/(\d{8})$/)?.[1]).filter(Boolean) as string[]
  if (dates.length === 0) throw new Error('wiki: no dated update pages matched')
  return dates.sort().at(-1)!
}

// Posts to SKILL_UPDATE_WEBHOOK_URL. Sends `text` (Slack) and `content`
// (Discord): Slack rejects a body without `text`, which silently dropped every
// alert while the payload was Discord-only. Returns the outcome so it shows up
// in the function response instead of being swallowed.
const notify = async (message: string): Promise<string> => {
  const webhook = Deno.env.get('SKILL_UPDATE_WEBHOOK_URL')
  if (!webhook) return 'no webhook configured'
  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, content: message }),
      // A hanging webhook must not eat the function's wall-clock budget
      signal: AbortSignal.timeout(10_000),
    })
    return res.ok ? 'sent' : `webhook HTTP ${res.status}: ${await res.text()}`
  } catch (err) {
    return `webhook failed: ${String(err)}`
  }
}

Deno.serve(async req => {
  // Shared-secret gate (see AUTH note above).
  const expected = Deno.env.get('CRON_SECRET')
  if (!expected || req.headers.get('Authorization') !== `Bearer ${expected}`) {
    return new Response('unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const latest = await fetchLatestUpdateDate()
    const now = new Date().toISOString()

    const { data: state, error: readErr } = await supabase
      .from('skill_update_state')
      .select('last_known_update_date')
      .eq('id', true)
      .maybeSingle()
    if (readErr) throw new Error(`db read: ${readErr.message}`)

    const lastKnown = state?.last_known_update_date ?? '00000000'
    const { error: touchErr } = await supabase
      .from('skill_update_state')
      .update({ last_checked_at: now })
      .eq('id', true)
    if (touchErr) throw new Error(`db touch: ${touchErr.message}`)

    if (latest <= lastKnown) {
      return Response.json({ ok: true, latest, lastKnown, newUpdate: false })
    }

    // New update detected: record it, advance state, optionally notify.
    const pageUrl = `https://wiki.guildwars.com/wiki/Feedback:Game_updates/${latest}`
    const { error: insErr } = await supabase.from('skill_update_notifications').insert({
      update_date: latest,
      payload: { url: pageUrl, previous: lastKnown },
    })
    if (insErr) throw new Error(`db insert: ${insErr.message}`)
    const { error: advErr } = await supabase
      .from('skill_update_state')
      .update({ last_known_update_date: latest })
      .eq('id', true)
    if (advErr) throw new Error(`db advance: ${advErr.message}`)

    const notified = await notify(
      `New GW1 game update detected: ${latest}. Review and run the skill-data pipeline: ${pageUrl}`
    )

    return Response.json({ ok: true, latest, lastKnown, newUpdate: true, url: pageUrl, notified })
  } catch (err) {
    // Surface the real reason instead of a silent null / generic 500, and alert:
    // a failing check (e.g. wiki down) otherwise goes unnoticed. Cron is daily,
    // so this pings at most once a day while the failure lasts.
    const notified = await notify(`GW1 skill-update check failed: ${String(err)}`)
    return Response.json({ ok: false, error: String(err), notified }, { status: 500 })
  }
})
