/**
 * @fileoverview Build feed with tabs and pagination
 * @module components/build/build-feed
 *
 * Client component handling Popular/Recent tabs and "Load more" pagination.
 * Receives initial builds from server, fetches more on demand.
 */
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { gridContainerVariants, gridItemVariants } from '@/lib/motion'
import { EmptyState } from '@/components/ui/empty-state'
import { BuildFeedCard, BuildFeedCardSkeleton } from './build-feed-card'
import type { BuildListItem } from '@/types/database'
import type { BuildSortType, GetBuildsResult } from '@/lib/supabase/queries'

interface BuildFeedProps {
  /** Initial builds from server */
  initialBuilds: BuildListItem[]
  /** Initial tab selection */
  initialTab?: BuildSortType
  /** Initial next offset for pagination */
  initialNextOffset?: number | null
}


/**
 * Build feed with Popular/Recent tabs
 *
 * @example
 * <BuildFeed initialBuilds={builds} initialTab="popular" />
 */
export function BuildFeed({
  initialBuilds,
  initialTab = 'popular',
  initialNextOffset = null,
}: BuildFeedProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<BuildSortType>(initialTab)
  const [builds, setBuilds] = useState<Record<BuildSortType, BuildListItem[]>>({
    popular: initialTab === 'popular' ? initialBuilds : [],
    recent: initialTab === 'recent' ? initialBuilds : [],
  })
  const [nextOffsets, setNextOffsets] = useState<Record<BuildSortType, number | null>>({
    popular: initialTab === 'popular' ? initialNextOffset : null,
    recent: initialTab === 'recent' ? initialNextOffset : null,
  })
  const [tabLoading, setTabLoading] = useState(false)

  const currentBuilds = builds[activeTab]

  /**
   * Fetch builds from API
   */
  const fetchBuilds = useCallback(
    async (type: BuildSortType, offset: number = 0): Promise<GetBuildsResult> => {
      const res = await fetch(`/api/builds?type=${type}&offset=${offset}&limit=20`)
      if (!res.ok) throw new Error('Failed to fetch builds')
      return res.json()
    },
    []
  )

  /**
   * Handle tab change
   */
  const handleTabChange = useCallback(
    async (tab: BuildSortType) => {
      if (tab === activeTab) return

      setActiveTab(tab)

      // Update URL to persist tab state
      const url = tab === 'popular' ? '/' : '/?tab=recent'
      router.replace(url, { scroll: false })

      // If we haven't loaded this tab yet, fetch it
      if (builds[tab].length === 0) {
        setTabLoading(true)
        try {
          const result = await fetchBuilds(tab, 0)
          setBuilds(prev => ({ ...prev, [tab]: result.builds }))
          setNextOffsets(prev => ({ ...prev, [tab]: result.nextOffset }))
        } catch (error) {
          console.error('Error fetching builds:', error)
        } finally {
          setTabLoading(false)
        }
      }
    },
    [activeTab, builds, fetchBuilds, router]
  )

  return (
    <div className="w-full">
      {/* Tab Switcher */}
      <div className="flex items-center gap-1 mb-6">
        <TabButton
          active={activeTab === 'popular'}
          onClick={() => handleTabChange('popular')}
          icon={<Star className="w-3.5 h-3.5" />}
        >
          Popular
        </TabButton>
        <TabButton
          active={activeTab === 'recent'}
          onClick={() => handleTabChange('recent')}
          icon={<Clock className="w-3.5 h-3.5" />}
        >
          Recent
        </TabButton>
      </div>

      {/* Build Grid */}
      <AnimatePresence mode="wait">
        {tabLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <BuildFeedCardSkeleton key={i} />
            ))}
          </motion.div>
        ) : currentBuilds.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <EmptyState
              icon="📋"
              title="No builds yet"
              description={
                activeTab === 'popular'
                  ? 'Be the first to share a build!'
                  : 'No recent builds to show.'
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
            {currentBuilds.map(build => (
              <motion.div key={build.id} variants={gridItemVariants}>
                <BuildFeedCard build={build} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

/**
 * Tab button component
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
          layoutId="activeTab"
          className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-accent-gold rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}
