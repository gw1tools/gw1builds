/**
 * @fileoverview Homepage - Simple, lightweight build sharing
 * @module app/page
 */

import { Plus } from 'lucide-react'
import { Container } from '@/components/layout/container'
import { Button } from '@/components/ui'
import { BuildFeed } from '@/components/build/build-feed'
import { getBuilds } from '@/lib/supabase/queries'

export default async function HomePage() {
  // Fetch popular builds for initial load
  const { builds, nextOffset } = await getBuilds({ type: 'popular', limit: 6 })

  return (
    <>
      {/* Hero */}
      <section className="relative py-16 sm:py-24">
        <Container size="md" className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary mb-4">
            <span className="text-accent-gold">GW1</span> Builds
          </h1>
          <p className="text-text-muted text-lg mb-14">
            A <span className="text-accent-gold italic">lightweight</span> build
            sharing tool for the Reforged era
          </p>
          <Button
            href="/new"
            variant="primary"
            size="lg"
            leftIcon={<Plus className="w-5 h-5" />}
          >
            Create Build
          </Button>
        </Container>
      </section>

      {/* Build Feed with Tabs */}
      <section className="relative pb-16 sm:pb-24">
        <Container size="md">
          <BuildFeed
            initialBuilds={builds}
            initialTab="popular"
            initialNextOffset={nextOffset}
          />
        </Container>
      </section>
    </>
  )
}
