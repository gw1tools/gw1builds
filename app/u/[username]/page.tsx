/**
 * @fileoverview Public user profile page
 * @module app/u/[username]/page
 *
 * Server Component that displays a user's public profile and builds.
 * Shows 404 if user doesn't exist.
 *
 * Route: /u/[username]
 *
 * @see lib/services/users.ts for data fetching
 */
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getUserByUsername,
  getPublicBuildsByUser,
  type UserBuildSortType,
} from '@/lib/services/users'
import { SITE_URL } from '@/lib/constants'
import { ProfilePageClient } from './client'

interface ProfilePageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ tab?: string }>
}

/**
 * Generates dynamic metadata for profile pages
 */
export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const user = await getUserByUsername(username)

  if (!user || !user.username) {
    return {
      title: 'User not found',
    }
  }

  const description = `View ${user.username}'s builds on GW1 Builds`
  const pageUrl = `${SITE_URL}/u/${encodeURIComponent(user.username)}`

  return {
    title: `${user.username} - GW1 Builds`,
    description,
    openGraph: {
      title: `${user.username} - GW1 Builds`,
      description,
      type: 'profile',
      url: pageUrl,
      siteName: 'GW1 Builds',
    },
    twitter: {
      card: 'summary',
      title: `${user.username} - GW1 Builds`,
      description,
    },
  }
}

/**
 * User profile page component
 *
 * Fetches user profile and their public builds.
 * Shows 404 if user doesn't exist.
 */
export default async function ProfilePage({ params, searchParams }: ProfilePageProps) {
  const { username } = await params
  const { tab } = await searchParams

  const user = await getUserByUsername(username)

  if (!user || !user.username) {
    notFound()
  }

  // Validate tab parameter
  const initialTab: UserBuildSortType = tab === 'recent' ? 'recent' : 'popular'

  // Fetch user's public builds for both tabs in parallel
  const [popularBuilds, recentBuilds] = await Promise.all([
    getPublicBuildsByUser(user.id, 'popular'),
    getPublicBuildsByUser(user.id, 'recent'),
  ])

  return (
    <ProfilePageClient
      username={user.username}
      createdAt={user.created_at}
      popularBuilds={popularBuilds}
      recentBuilds={recentBuilds}
      initialTab={initialTab}
    />
  )
}
