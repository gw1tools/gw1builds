/**
 * @fileoverview My Builds loading skeleton
 * @module app/my-builds/loading
 */

import { Container, PageWrapper, Header } from '@/components/layout'
import { BuildFeedCardSkeleton } from '@/components/build/build-feed-card'

export default function MyBuildsLoading() {
  return (
    <PageWrapper>
      <Header />

      <Container size="md" className="py-8 sm:py-12">
        {/* Page Title */}
        <div className="h-8 w-32 bg-bg-card/50 rounded animate-pulse mb-6" />

        {/* Tab switcher skeleton */}
        <div className="flex items-center gap-1 mb-6">
          <div className="h-9 w-24 bg-bg-card/40 rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-bg-card/30 rounded-lg animate-pulse" />
        </div>

        {/* Build cards grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <BuildFeedCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </PageWrapper>
  )
}
