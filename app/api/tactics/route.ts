/**
 * @fileoverview Tactics redirect — attaches the preview-gate password
 * @module app/api/tactics/route
 *
 * GET /api/tactics → 307 redirect to `${TACTICS_URL}?pw=${TACTICS_SITE_PASSWORD}`
 *
 * tactics.gw1builds.com reads the `pw` query param once, sets a signed cookie,
 * then strips the param (see echo-wars-tactics/web/proxy.ts). Keeping this
 * server-side means the password never ships in the client bundle — the only
 * visibility is the brief `?pw=…` in the user's URL bar on first hop, which is
 * unavoidable with a query-param gate.
 */

import { NextResponse } from 'next/server'
import { TACTICS_URL } from '@/lib/constants'

export function GET() {
  const password = process.env.TACTICS_SITE_PASSWORD
  const target = new URL(TACTICS_URL)
  if (password) {
    target.searchParams.set('pw', password)
  }
  return NextResponse.redirect(target, { status: 307 })
}
