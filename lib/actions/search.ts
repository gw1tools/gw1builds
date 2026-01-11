'use server'

import { getAllPublishedBuildsForSearch } from '@/lib/services/builds'
import { getPvxBuildsForSearch } from '@/lib/pvx'
import type { BuildListItem } from '@/types/database'
import type { SearchableBuild } from '@/lib/search/build-search'

/**
 * Loads all builds for client-side search indexing
 * Fetches both database builds and PvX archival builds in parallel
 *
 * This is a shared server action used by:
 * - Homepage search trigger
 * - Prototype build picker
 */
export async function loadBuildsForSearch(): Promise<{
  database: BuildListItem[]
  pvx: SearchableBuild[]
}> {
  const [dbBuilds, pvxBuilds] = await Promise.all([
    getAllPublishedBuildsForSearch(),
    getPvxBuildsForSearch(),
  ])

  return { database: dbBuilds, pvx: pvxBuilds }
}
