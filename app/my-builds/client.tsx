/**
 * @fileoverview My Builds page client component
 * @module app/my-builds/client
 *
 * Simple, lightweight tabbed view of user's builds.
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, FileEdit, PenLine, Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Container, PageWrapper, Header } from '@/components/layout'
import { BuildFeedCard } from '@/components/build/build-feed-card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { getAllDraftKeys, getDraftTimestamp } from '@/hooks/use-build-draft'
import { formatRelativeTime } from '@/lib/utils'
import { gridContainerVariants, gridItemVariants } from '@/lib/motion'
import type { BuildListItem } from '@/types/database'

type TabType = 'created' | 'starred'

const BUILDS_PER_PAGE = 10

interface MyBuildsPageClientProps {
  builds: BuildListItem[]
  starredBuilds: BuildListItem[]
}

export function MyBuildsPageClient({
  builds,
  starredBuilds,
}: MyBuildsPageClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('created')
  const [displayCounts, setDisplayCounts] = useState({
    created: BUILDS_PER_PAGE,
    starred: BUILDS_PER_PAGE,
  })

  const currentBuilds = activeTab === 'created' ? builds : starredBuilds
  const displayedBuilds = currentBuilds.slice(0, displayCounts[activeTab])
  const hasMore = displayCounts[activeTab] < currentBuilds.length

  const handleLoadMore = useCallback(() => {
    setDisplayCounts(prev => ({
      ...prev,
      [activeTab]: prev[activeTab] + BUILDS_PER_PAGE,
    }))
  }, [activeTab])

  return (
    <PageWrapper>
      <Header />

      <Container size="md" className="py-8 sm:py-12">
        {/* Page Header */}
        <h1 className="text-2xl font-bold text-text-primary mb-6">My Builds</h1>

        {/* Draft Banner */}
        <DraftBanner />

        {/* Tab Switcher - Simple underline style */}
        <div className="flex items-center gap-1 mb-6">
          <TabButton
            active={activeTab === 'created'}
            onClick={() => setActiveTab('created')}
            icon={<PenLine className="w-3.5 h-3.5" />}
          >
            Created
          </TabButton>
          <TabButton
            active={activeTab === 'starred'}
            onClick={() => setActiveTab('starred')}
            icon={<Star className="w-3.5 h-3.5" />}
          >
            Starred
          </TabButton>
        </div>

        {/* Build Grid */}
        <AnimatePresence mode="wait">
          {displayedBuilds.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                icon={activeTab === 'created' ? '📝' : '⭐'}
                title={
                  activeTab === 'created'
                    ? 'No builds yet'
                    : 'No starred builds'
                }
                description={
                  activeTab === 'created'
                    ? 'Create your first build to see it here.'
                    : 'Star builds you like to save them here.'
                }
                action={
                  activeTab === 'created' ? (
                    <Link
                      href="/new"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent-gold text-bg-primary hover:bg-accent-gold-bright transition-colors"
                    >
                      Create Build
                    </Link>
                  ) : (
                    <Link
                      href="/"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-bg-card border border-border hover:border-border-hover text-text-primary transition-colors"
                    >
                      Browse Builds
                    </Link>
                  )
                }
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {displayedBuilds.map(build => (
                <motion.div key={build.id} variants={gridItemVariants}>
                  <BuildFeedCard build={build} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load More */}
        {hasMore && displayedBuilds.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" onClick={handleLoadMore}>
              Load more ({currentBuilds.length - displayCounts[activeTab]}{' '}
              remaining)
            </Button>
          </div>
        )}
      </Container>
    </PageWrapper>
  )
}

/**
 * Simple underline tab button (matches landing page)
 */
interface TabButtonProps {
  active: boolean
  onClick: () => void
  icon?: React.ReactNode
  children: React.ReactNode
}

function TabButton({ active, onClick, icon, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer',
        active
          ? 'text-accent-gold'
          : 'text-text-muted hover:text-text-secondary'
      )}
    >
      <motion.span
        animate={{
          scale: active ? 1 : 0.9,
          rotate: active ? 0 : -3,
        }}
        transition={{ duration: 0.12, ease: [0, 0, 0.2, 1] }}
      >
        {icon}
      </motion.span>
      {children}
      {active && (
        <motion.div
          layoutId="myBuildsActiveTab"
          className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-accent-gold rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}

/**
 * Get most recent draft from localStorage
 */
function getMostRecentDraft(): { key: string; timestamp: Date | null } | null {
  if (typeof window === 'undefined') return null

  const keys = getAllDraftKeys()
  if (keys.length === 0) return null

  const timestamps = keys.map(key => ({
    key,
    timestamp: getDraftTimestamp(key),
  }))
  timestamps.sort((a, b) => {
    if (!a.timestamp) return 1
    if (!b.timestamp) return -1
    return b.timestamp.getTime() - a.timestamp.getTime()
  })
  return timestamps[0]
}

/**
 * Hook to safely read localStorage after mount
 */
function useDraft() {
  const [draft, setDraft] = useState<{
    key: string
    timestamp: Date | null
  } | null>(null)

  // Read localStorage after mount - this is the proper pattern for client-only state
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const recentDraft = getMostRecentDraft()
    if (recentDraft) {
      setDraft(recentDraft)
    }
  }, [])

  return draft
}

/**
 * Subtle draft indicator
 */
function DraftBanner() {
  const draft = useDraft()

  if (!draft) return null

  return (
    <Link
      href="/new"
      className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-accent-gold transition-colors mb-6"
    >
      <FileEdit className="h-3.5 w-3.5" />
      <span>Continue draft</span>
      {draft.timestamp && (
        <span className="text-text-muted/60">
          · {formatRelativeTime(draft.timestamp)}
        </span>
      )}
    </Link>
  )
}
