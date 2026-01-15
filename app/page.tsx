/**
 * @fileoverview Homepage - Build workbench for the GW1 community
 * @module app/page
 */

import { Plus } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui'
import { BuildFeed } from '@/components/build/build-feed'
import { BuildSearchTrigger } from '@/components/build/build-search-trigger'
import { getBuilds, type BuildSortType } from '@/lib/supabase/queries'
import { loadBuildsForSearch } from '@/lib/actions/search'

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  // Read and validate tab parameter
  const { tab } = await searchParams
  const initialTab: BuildSortType = tab === 'recent' ? 'recent' : 'popular'

  // Fetch builds for the selected tab
  const { builds, nextOffset } = await getBuilds({ type: initialTab, limit: 6 })

  return (
    <>
      {/* Hero */}
      <section className="relative pt-12 sm:pt-20 pb-8 sm:pb-18">
        <Container size="md" className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-3">
            <span className="text-accent-gold">GW1</span> Builds
          </h1>
          <p className="text-text-muted text-lg mb-18">
            Create, search, and share builds for the{' '}
            <span className="text-accent-gold italic">Reforged</span> era
          </p>

          {/* Search + Create - always in one row */}
          <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 max-w-lg mx-auto">
            <div className="flex-1 min-w-0">
              <BuildSearchTrigger
                loadBuilds={loadBuildsForSearch}
                placeholder="Search builds..."
              />
            </div>
            <Button
              href="/new"
              variant="primary"
              size="lg"
              leftIcon={<Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
              className="flex-shrink-0 whitespace-nowrap"
            >
              Create
            </Button>
          </div>
        </Container>
      </section>

      {/* Build Feed with Tabs */}
      <section className="relative pb-16 sm:pb-24">
        <Container size="md">
          <BuildFeed
            initialBuilds={builds}
            initialTab={initialTab}
            initialNextOffset={nextOffset}
          />
        </Container>
      </section>
    </>
  )
}
