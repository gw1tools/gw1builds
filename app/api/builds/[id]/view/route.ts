/**
 * @fileoverview Build view-tracking API endpoint
 * @module app/api/builds/[id]/view/route
 *
 * POST /api/builds/[id]/view - Record a build view (fire-and-forget)
 *
 * Called client-side from the build page. The build page is statically
 * rendered / ISR-cached, so view tracking can no longer run during render —
 * it happens here, where the client IP is available from request headers.
 */

import { NextResponse } from 'next/server'
import { recordBuildView } from '@/lib/services/builds'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Client IP for unique-view dedup (same logic the page used previously).
  const clientIP =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Fire-and-forget: never block or fail the client on view tracking.
  try {
    await recordBuildView(id, clientIP)
  } catch {
    // Ignore — view tracking is best-effort.
  }

  return NextResponse.json({ ok: true })
}
