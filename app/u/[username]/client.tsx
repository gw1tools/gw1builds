/**
 * @fileoverview Client-side profile page with user info and builds
 * @module app/u/[username]/client
 */
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, Star, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { gridContainerVariants, gridItemVariants } from '@/lib/motion'
import { BuildFeedCard } from '@/components/build/build-feed-card'
import { EmptyState } from '@/components/ui/empty-state'
import type { BuildListItem } from '@/types/database'
import type { UserBuildSortType } from '@/lib/services/users'

interface ProfilePageClientProps {
  username: string
  createdAt: string
  popularBuilds: BuildListItem[]
  recentBuilds: BuildListItem[]
  initialTab: UserBuildSortType
}

/**
 * Formats a date to "Month Year" format using UTC
 */
function formatJoinDate(dateString: string): string {
  const date = new Date(dateString)
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
}

export function ProfilePageClient({
  username,
  createdAt,
  popularBuilds,
  recentBuilds,
  initialTab,
}: ProfilePageClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<UserBuildSortType>(initialTab)

  const currentBuilds = activeTab === 'popular' ? popularBuilds : recentBuilds
  const totalBuilds = popularBuilds.length // Both arrays have same builds, just sorted differently

  const handleTabChange = (tab: UserBuildSortType) => {
    if (tab === activeTab) return
    setActiveTab(tab)
    // Update URL to persist tab state
    const url = tab === 'popular' ? `/u/${username}` : `/u/${username}?tab=recent`
    router.replace(url, { scroll: false })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-12">
      {/* Breadcrumb */}
      <div className="text-sm text-text-muted font-mono mb-6">
        <Link
          href="/"
          className="text-text-secondary hover:text-accent-gold transition-colors"
        >
          builds
        </Link>
        {' / '}
        <span>u</span>
        {' / '}
        <span>{username}</span>
      </div>

      {/* Profile Header */}
      <header className="bg-bg-card border border-border rounded-xl p-6 shadow-sticky mb-6">
        <h1 className="text-2xl font-bold text-text-primary">{username}</h1>
        <div className="flex items-center gap-2 mt-2 text-sm text-text-muted">
          <Calendar className="w-4 h-4" />
          <span>Member since {formatJoinDate(createdAt)}</span>
        </div>
      </header>

      {/* Builds Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Public Builds ({totalBuilds})
          </h2>

          {/* Tab Switcher - only show if there are builds */}
          {totalBuilds > 0 && (
            <div className="flex items-center gap-1">
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
          )}
        </div>

        <AnimatePresence mode="wait">
          {currentBuilds.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState
                title="No public builds"
                description={`${username} hasn't published any public builds yet.`}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              variants={gridContainerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-3"
            >
              {currentBuilds.map((build) => (
                <motion.div key={build.id} variants={gridItemVariants}>
                  <BuildFeedCard build={build} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
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
        'relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer',
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
          layoutId="profileActiveTab"
          className="absolute inset-x-2 -bottom-0.5 h-0.5 bg-accent-gold rounded-full"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </button>
  )
}
