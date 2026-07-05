# Skill Data Update Pipeline + Update Detector — Handoff

**Status:** Skill data (June 24 2026 patch) applied locally; update detector built and **fully deployed + validated in DEV**, **NOT yet in PROD**. All code is **local/uncommitted**. Last updated: 2026-07-02.

This doc is for the dev finishing the production rollout. It covers what exists, why, what's proven, and the exact prod steps.

---

## 1. Background / why this exists

Two goals: (A) apply the **June 24, 2026** GW1 skill balance patch to our data, and (B) build a reliable way to **stay current** with future patches instead of noticing by hand (the previous manual approach mis-mapped skills).

Provenance note: our `lib/gw/data/skilldata.json` + `skilldesc-en.json` originate from `build-wars/gw-skilldata`, but that upstream is stale/divergent — **not** a live source. The authoritative source is the official wiki (`wiki.guildwars.com`). The wiki **Skill infobox carries the numeric skill `id`**, so we key changes by id from the wiki rather than hand-mapping names (the old bug source).

---

## 2. Part A — Skill-data pipeline (June 24 applied)

**Reusable pipeline** (works for any future patch):
1. `npm run skills:build-changeset -- --date YYYYMMDD` → reads the wiki patch notes, resolves each skill's id from its wiki infobox (cross-checks against our local id and **flags disagreement**), parses numeric + range-scaling changes, and writes a reviewable `scripts/changesets/YYYYMMDD.json`. Reworks / added-clauses / flat-scalar text go into `scripts/changesets/YYYYMMDD.overrides.mjs` (authored from wiki text).
2. `npm run skills:apply-changeset scripts/changesets/YYYYMMDD.json [--audit]` → applies with id + name + old-value guards; idempotent.
3. `npm run skills:verify scripts/changesets/YYYYMMDD.json` → re-checks applied values against the **live wiki** (independent oracle): NUMERIC (infobox costs) + TEXT (compares the *numbers* in our description vs the wiki's, phrasing-agnostic). Run a few days post-patch once wiki pages catch up.

**Files (all new unless noted):**
- `scripts/lib/wiki.mjs` — wiki fetch/parse helpers (infobox → id + costs + rendered description/concise; `listUpdateDates`; `parseBalanceChanges`).
- `scripts/build-changeset.mjs`, `scripts/apply-changeset.mjs`, `scripts/verify-changeset.mjs`
- `scripts/changesets/20260624.json` + `20260624.overrides.mjs`
- `lib/gw/data/skilldata.json` + `skilldesc-en.json` (**modified** — the applied data)
- `CHANGELOG.md` (+ entry), `package.json` (v0.3.0 → **0.4.0**, added `skills:*` scripts)

**Result:** 156-skill changeset applied (147 numeric + 118 text). `verify` = **146 confirmed / 0 mismatches** (a few "lagged" = wiki pages not yet updated; auto-confirm later).

**Guards added after review (the pipeline caught real silent bugs — keep these):**
- Parser only auto-handles cost fields + `A..B→C..D` ranges. **Flat-number/flat-% text changes** (e.g. "50%→100% adrenaline") are NOT auto-applied — a **partial-parse guard** flags lines describing more than we captured. (Caught 5 real misses on June 24.)
- **Silent-empty guard:** if `parseBalanceChanges` returns 0 but the page has `{{skill icon}}` lines, it throws (protects against the "Balance Update" heading being renamed).
- ids resolved from our exact local name; wiki id is a **cross-check that flags disagreement**. Multi-id wiki pages (Kurzick/Luxon `id = A<!--..-->, B`) handled by stripping HTML comments.
- `verify` distinguishes **unavailable** (wiki fetch failed) from **lagged**.

**Open follow-ups (NOT done):**
- **We're 2 updates behind: June 25 + June 30 not applied.** Run the pipeline for `20260625` and `20260630`.
- ~10 **pre-existing Nature Ritual spirit-lifespan divergences** (e.g. Winnowing 30…150 vs wiki 30…240) — from the Feb 5 patch, not this sprint; needs a reconciliation pass.
- `lib/constants.ts` `SKILL_TYPE_BY_ID` is misaligned with the data's `type` numbers (type 20 = Shouts, not Nature Ritual). Latent; not used by this pipeline.
- Duplicate skill name in data: `Pious Fury (PvP)` (ids 2146 & 3368) — resolver now flags it as ambiguous.

---

## 3. Part B — Update detector (DEV done, PROD pending)

**What it does:** a daily `pg_cron` job calls the `check-skill-updates` Edge Function, which queries the wiki API (`list=allpages`, Feedback namespace **202**) for the newest `Feedback:Game updates/<YYYYMMDD>`. If it's newer than `skill_update_state.last_known_update_date`, it inserts a `skill_update_notifications` row (and pings a webhook if configured) and advances the state.

**Components:**
- `supabase/functions/check-skill-updates/index.ts` — the Deno function.
- `supabase/migrations/20260625100929_skill_update_cron.sql` — enables `pg_cron`+`pg_net`, creates `skill_update_state` (singleton, seeded `last_known_update_date='20260624'`) and `skill_update_notifications` (both RLS-on, service-role only), schedules the cron (`17 8 * * *`, 08:17 UTC).
- `supabase/config.toml` — `[functions.check-skill-updates] verify_jwt = false` (**modified**).
- `tsconfig.json` — excludes `supabase/functions` from the app build (Deno files; **modified**).

**Auth model (important — reflects Supabase's 2025+ key system):** `service_role`/`anon` are now legacy; new keys are `sb_publishable_*`/`sb_secret_*` (not JWTs). So the function runs with **`verify_jwt = false`** and gates itself with a **shared secret**: the cron sends `Authorization: Bearer <secret>`; the function checks it against env `CRON_SECRET`. The shared secret is stored in two places that **must match**: the function env `CRON_SECRET` and the Vault secret `skill_update_service_key` (which the cron reads). The function still writes its tables using the auto-injected `SUPABASE_SERVICE_ROLE_KEY`.

**Vault secrets the cron reads (per environment):**
- `skill_update_function_url` = `https://<ref>.supabase.co/functions/v1/check-skill-updates`
- `skill_update_service_key` = the shared secret (same value as `CRON_SECRET`) — *(name is legacy; it holds the shared secret, not a service key)*

### DEV status (project `aqjfurwosiiicfxqmbjd`) — ✅ DONE & VALIDATED
Migration pushed, function deployed, `CRON_SECRET` set, both Vault secrets set. Smoke tests passed: authed curl → `{"ok":true,"latest":"20260630","lastKnown":"20260624","newUpdate":true}`; unauthed curl → `401`; `skill_update_notifications` has the `20260630` row; state advanced. Detector-logic unit tests (incl. mocked future update, edge cases) pass. NOTE: dev's `last_known` is now `20260630`, so it won't re-alert; optionally `select cron.unschedule('check-skill-updates');` in dev if prod becomes the sole monitor.

### PROD status (project `iaqbfleijvzdffahhqtc`, "gw1builds") — ❌ NOT DONE
See section 5.

---

## 4. Repo state — nothing committed yet

All the above is **local/uncommitted**. To ship the **data + tooling** (separate from the Supabase deploy):
1. Commit on a branch (not `main`).
2. Open PR → Vercel builds a preview with the new skill data. Spot-check a few changed skills render.
3. `main` blocks merges without a `CHANGELOG.md` update (already updated) — run `/release` per team process, then merge.

---

## 5. PRODUCTION deploy instructions (detector)

> Run against the **prod** project `iaqbfleijvzdffahhqtc`. Dev is already done; this replicates it to prod. The CLI must be authenticated to an account with access to the prod project.

**5.1 Link prod and check what will push (prod migration history may differ from dev):**
```
supabase link --project-ref iaqbfleijvzdffahhqtc   # or: npm run db:link-prod
supabase migration list
```
⚠️ Confirm **only** `20260625100929` is pending (Local, no Remote). If other migrations are unexpectedly pending, STOP and investigate before pushing.

**5.2 Push migration + deploy function:**
```
supabase db push                                 # creates tables/cron, seeds last_known='20260624'
supabase functions deploy check-skill-updates    # applies config.toml verify_jwt=false
```

**5.3 Secrets (generate a FRESH prod secret — do not reuse dev's):**
```
openssl rand -hex 32                             # -> <PROD_SECRET>
supabase secrets set CRON_SECRET=<PROD_SECRET>
```
Then in the **prod** SQL editor:
```sql
select vault.create_secret(
  'https://iaqbfleijvzdffahhqtc.supabase.co/functions/v1/check-skill-updates',
  'skill_update_function_url');
select vault.create_secret('<PROD_SECRET>', 'skill_update_service_key');
```

**5.4 Optional alert channel (recommended on prod so detections actually notify someone):**
```
supabase secrets set SKILL_UPDATE_WEBHOOK_URL='<Discord/Slack webhook>'
```

**5.5 Smoke test prod (mirror the dev validation):**
```
# function directly (expect 200, newUpdate:true, latest 20260630 — prod data is behind too):
curl -s -X POST 'https://iaqbfleijvzdffahhqtc.supabase.co/functions/v1/check-skill-updates' \
  -H "Authorization: Bearer <PROD_SECRET>"
# unauthed must be 401:
curl -i -X POST 'https://iaqbfleijvzdffahhqtc.supabase.co/functions/v1/check-skill-updates'
```
Then verify the **cron path** (Vault + pg_net + auth), in the prod SQL editor:
```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='skill_update_function_url'),
  headers := jsonb_build_object('Content-Type','application/json',
    'Authorization','Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='skill_update_service_key')),
  body := '{}'::jsonb);
-- wait ~2s:
select id, status_code, content from net._http_response order by id desc limit 3;   -- expect 200
select * from skill_update_notifications order by detected_at desc limit 3;          -- expect a 20260630 row
select * from skill_update_state;                                                     -- last_known advanced to 20260630
```
A `401` in `net._http_response` means `CRON_SECRET` ≠ Vault `skill_update_service_key` — fix the parity.

**5.6 Cleanup:** re-link back to dev for normal work: `supabase link --project-ref aqjfurwosiiicfxqmbjd` (or `npm run db:link-dev`).

---

## 6. Watch-items / gotchas

- **Secret parity** (`CRON_SECRET` == Vault `skill_update_service_key`) is the main footgun — the cron-path test (5.5) catches it (200 vs 401).
- **Never ship a changeset with open flags** — resolve each into an override or a conscious skip.
- **Run `build-changeset` against clean data** — regenerating after a partial apply yields a degenerate (no-op) changeset.
- **`verify` TEXT diffs are non-failing** (exit 0); only NUMERIC `MISMATCH` fails CI. Pre-existing Nature Ritual divergences will show as TEXT diffs until reconciled.
- Detector reports only the **newest** new date, not each intermediate (by design). Optional hardening: `unique (update_date)` on notifications to dedupe if the function ever crashes mid-write.
- Run the detector in **one** environment as the live monitor (recommend prod) to avoid double alerts.

## 7. Immediate next tasks (post-deploy)
1. Apply **June 25 (20260625)** and **June 30 (20260630)** patches via the pipeline (we're behind).
2. Reconcile the ~10 pre-existing Nature Ritual spirit-lifespan divergences.
