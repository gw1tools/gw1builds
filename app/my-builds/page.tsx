/**
 * @fileoverview My Builds page (private - authenticated user only)
 * @module app/my-builds/page
 *
 * Shows the authenticated user's builds and starred builds.
 * Private page - redirects unauthenticated users.
 *
 * Route: /my-builds
 */

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getUserBuilds, getUserStarredBuilds } from '@/lib/services/builds'
import { createClient } from '@/lib/supabase/server'
import { MyBuildsPageClient } from './client'

export const metadata: Metadata = {
  title: 'My Builds',
  description: 'View and manage your builds.',
  robots: {
    index: false, // Private page
  },
}

export default async function MyBuildsPage() {
  // Get authenticated user
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Must be authenticated
  if (!user) {
    redirect('/')
  }

  // Fetch user's builds
  const [builds, starredBuilds] = await Promise.all([
    getUserBuilds(user.id),
    getUserStarredBuilds(user.id),
  ])

  return <MyBuildsPageClient builds={builds} starredBuilds={starredBuilds} />
}
