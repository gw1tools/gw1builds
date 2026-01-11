import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/** Routes only available in development and preview environments */
const DEV_ONLY_ROUTES = ['/prototype']

function isProduction(): boolean {
  // VERCEL_ENV distinguishes production from preview deployments
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'production'
  }
  return process.env.NODE_ENV === 'production'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block dev-only routes in production
  if (isProduction()) {
    const isDevOnlyRoute = DEV_ONLY_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
    if (isDevOnlyRoute) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
