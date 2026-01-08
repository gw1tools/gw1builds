/**
 * @fileoverview Client-side build page with interactivity
 * @module app/b/[id]/client
 *
 * Handles interactive elements: skill tooltips, copy buttons, etc.
 */
'use client'

import Link from 'next/link'
import { toast } from 'sonner'
import { Eye, Clock, Copy, Link2, Pencil, Check, Flag } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import {
  trackBuildViewed,
  trackTemplateCopied,
  trackBuildShared,
} from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { useAuthModal } from '@/components/auth/auth-modal'
import { SkillMentionTooltip } from '@/components/ui/skill-mention-tooltip'
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { Button } from '@/components/ui/button'
import { StarButton } from '@/components/ui/star-button'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { Tag, TagGroup } from '@/components/ui/tag'
import { HeroBuildCard } from '@/components/build/hero-build-card'
import { TeamOverview } from '@/components/build/team-overview'
import { ReportModal } from '@/components/build/report-modal'
import type { BuildWithAuthor } from '@/types/database'
import type { Skill } from '@/lib/gw/skills'
import type { ProfessionKey } from '@/types/gw1'

interface BuildPageClientProps {
  build: BuildWithAuthor
  /** Pre-fetched skill data from server, keyed by skill ID */
  skillMap: Record<number, Skill>
  isOwner: boolean
  professionColors: Record<string, string>
  /** Whether current user has starred this build */
  initialStarred: boolean
  /** Current star count */
  starCount: number
  /** Whether user is authenticated */
  isAuthenticated: boolean
}

export function BuildPageClient({
  build,
  skillMap,
  isOwner,
  professionColors,
  initialStarred,
  starCount,
  isAuthenticated,
}: BuildPageClientProps) {
  const isSingleBuild = build.bars.length === 1
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const isDelisted = build.moderation_status === 'delisted'
  const { openModal } = useAuthModal()

  const handleReportClick = () => {
    if (!isAuthenticated) {
      // Open auth modal - user can report after logging in
      openModal()
      return
    }
    setReportModalOpen(true)
  }

  // Track build view on mount (only once per build)
  useEffect(() => {
    trackBuildViewed({
      build_id: build.id,
      primary_profession: build.bars[0]?.primary,
      secondary_profession: build.bars[0]?.secondary,
      game_mode: build.tags.find(t =>
        ['PvE', 'PvP', 'GvG', 'HA', 'RA'].includes(t)
      ),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [build.id])

  // Track scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 pb-12">
      {/* Delisted banner - only shown to author */}
      {isOwner && isDelisted && (
        <div className="mb-6 p-4 rounded-xl border border-accent-red/30 bg-accent-red/5">
          <div className="flex items-start gap-3">
            <Flag className="w-5 h-5 text-accent-red shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-accent-red">
                This build has been delisted
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {build.moderation_reason || 'This build is no longer visible to other users due to community reports.'}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Navigation Bar */}
      <nav
        className={cn(
          'fixed top-[60px] left-0 right-0 z-30 transition-all duration-200',
          isScrolled
            ? 'bg-bg-primary/95 backdrop-blur-md border-b border-border shadow-lg'
            : 'bg-transparent'
        )}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Breadcrumb with build name */}
          <div className="text-sm text-text-muted font-mono flex items-center gap-2 min-w-0 flex-1">
            <Link
              href="/"
              className="text-text-secondary hover:text-accent-gold transition-colors shrink-0"
            >
              builds
            </Link>
            <span className="shrink-0">/</span>
            <span className="shrink-0">{build.id}</span>
            {isScrolled && (
              <>
                <span className="shrink-0 text-text-muted/50">•</span>
                <span className="truncate text-text-primary font-sans">
                  {build.name}
                </span>
              </>
            )}
          </div>

          {/* Actions */}
          <PageActions
            buildId={build.id}
            isOwner={isOwner}
            initialStarred={initialStarred}
            starCount={starCount}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </nav>

      {/* Spacer to prevent content jump */}
      <div className="h-12" />

      {/* Single Build View - unified card with title */}
      {isSingleBuild && (
        <SingleBuildView
          buildName={build.name}
          authorName={build.author?.username ?? undefined}
          bar={build.bars[0]}
          buildId={build.id}
          skillMap={skillMap}
          professionColors={professionColors}
        />
      )}

      {/* Team Build View */}
      {!isSingleBuild && (
        <>
          {/* Team Overview - the header for team builds, contains title for image capture */}
          <TeamOverview
            buildId={build.id}
            buildName={build.name}
            authorName={build.author?.username ?? undefined}
            bars={build.bars}
            skillMap={skillMap}
          />

          {/* Detailed Stacked Cards */}
          <div className="space-y-3 mt-4">
            {build.bars.map((bar, index) => (
              <HeroBuildCard
                key={index}
                bar={bar}
                index={index}
                buildId={build.id}
                skillMap={skillMap}
              />
            ))}
          </div>
        </>
      )}

      {/* Notes */}
      {build.notes && build.notes.content && build.notes.content.length > 0 && (
        <section className="mt-4">
          <div className="bg-bg-card border border-border rounded-xl p-5 shadow-sticky">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              Notes
            </h2>
            <div className="prose prose-sm text-text-secondary">
              <NotesRenderer notes={build.notes} />
            </div>
          </div>
        </section>
      )}

      {/* Tags */}
      {build.tags.length > 0 && (
        <section className="mt-4">
          <div className="bg-bg-card border border-border rounded-xl p-5 shadow-sticky">
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-text-muted mb-3">
              Tags
            </h2>
            <TagGroup>
              {build.tags.map(tag => (
                <Tag key={tag} label={tag} size="sm" />
              ))}
            </TagGroup>
          </div>
        </section>
      )}

      {/* Footer with metadata */}
      <footer className="mt-8 pt-6 border-t border-border">
        {/* Metadata row */}
        <div className="flex items-center justify-between text-sm text-text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {build.view_count}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <FormattedDate date={build.created_at} />
            </span>
          </div>

          {/* Report button for all non-owners (triggers auth flow if not logged in) */}
          {!isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReportClick}
              leftIcon={<Flag className="w-3.5 h-3.5" />}
              noLift
            >
              Report
            </Button>
          )}
        </div>
      </footer>

      {/* Report Modal */}
      <ReportModal
        buildId={build.id}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
      />
    </main>
  )
}

/**
 * Page-level actions: Star, Share, Edit
 */
function PageActions({
  buildId,
  isOwner,
  initialStarred,
  starCount,
  isAuthenticated,
}: {
  buildId: string
  isOwner: boolean
  initialStarred: boolean
  starCount: number
  isAuthenticated: boolean
}) {
  const [linkCopied, setLinkCopied] = useState(false)
  const { openModal } = useAuthModal()

  const handleStarChange = async () => {
    const response = await fetch(`/api/builds/${buildId}/star`, {
      method: 'POST',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      toast.error(errorData.error || 'Failed to star build')
      throw new Error('Failed to toggle star')
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/b/${buildId}`
    await navigator.clipboard.writeText(url)
    setLinkCopied(true)
    trackBuildShared({ build_id: buildId, method: 'clipboard' })
    setTimeout(() => setLinkCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2">
      <StarButton
        count={starCount}
        isStarred={initialStarred}
        onStarChange={handleStarChange}
        onUnauthenticatedClick={isAuthenticated ? undefined : openModal}
        size="sm"
      />

      <Button
        variant="secondary"
        size="sm"
        onClick={handleCopyLink}
        leftIcon={
          linkCopied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Link2 className="w-4 h-4" />
          )
        }
        className={cn(
          linkCopied &&
            'bg-accent-green/20 text-accent-green border-accent-green/50'
        )}
        noLift
      >
        {linkCopied ? 'Copied!' : 'Copy Link'}
      </Button>

      {isOwner && (
        <Button
          variant="secondary"
          size="sm"
          href={`/b/${buildId}/edit`}
          leftIcon={<Pencil className="w-4 h-4" />}
          noLift
        >
          Edit
        </Button>
      )}
    </div>
  )
}

/**
 * Single build view (skill bar, attributes, copy button)
 */
function SingleBuildView({
  buildName,
  authorName,
  bar,
  buildId,
  skillMap,
  professionColors,
}: {
  buildName: string
  authorName?: string
  bar: BuildWithAuthor['bars'][0]
  buildId: string
  skillMap: Record<number, Skill>
  professionColors: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)

  // Convert skill IDs to skill data using pre-fetched map (memoized)
  const skills = useMemo(
    () =>
      bar.skills.map(id => {
        if (id === 0) return null
        const skill = skillMap[id]
        if (!skill) return null
        return {
          id: skill.id,
          name: skill.name,
          description: skill.description,
          profession: skill.profession,
          attribute: skill.attribute,
          energy: skill.energy,
          activation: skill.activation,
          recharge: skill.recharge,
          elite: skill.elite,
        }
      }),
    [bar.skills, skillMap]
  )

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(bar.template)
    setCopied(true)
    trackTemplateCopied({ build_id: buildId, bar_count: 1 })
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Build Card - unified with title */}
      <div className="bg-bg-card border border-border rounded-xl shadow-sticky overflow-hidden">
        {/* Header with title */}
        <div className="px-5 pt-5 pb-4">
          <h1 className="text-xl font-bold text-text-primary leading-tight">
            {buildName}
          </h1>
          {authorName && (
            <p className="text-text-muted text-sm mt-1">
              by <span className="text-text-secondary">{authorName}</span>
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Build content */}
        <div className="p-5">
          {/* Profession Badge - compact */}
          <div
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold mb-4"
            style={{
              borderColor: `${professionColors[bar.primary]}40`,
              backgroundColor: `${professionColors[bar.primary]}12`,
            }}
          >
            <ProfessionIcon
              profession={bar.primary.toLowerCase() as ProfessionKey}
              size="xs"
            />
            <span style={{ color: professionColors[bar.primary] }}>
              {bar.primary}
            </span>
            {bar.secondary !== 'None' && (
              <>
                <span className="text-text-muted/40 mx-0.5">/</span>
                <ProfessionIcon
                  profession={bar.secondary.toLowerCase() as ProfessionKey}
                  size="xs"
                />
                <span style={{ color: professionColors[bar.secondary] }}>
                  {bar.secondary}
                </span>
              </>
            )}
          </div>

          {/* Skill Bar */}
          <SkillBar skills={skills} size="lg" />

          {/* Attributes */}
          <div className="mt-5">
            <AttributeBar attributes={bar.attributes} />
          </div>

          {/* Divider */}
          <div className="my-5 border-t border-dashed border-border/50" />

          {/* Template Code Pill - nostalgic style with integrated copy */}
          <button
            onClick={handleCopyCode}
            className={cn(
              'group w-full flex items-center justify-between gap-3',
              'px-4 py-3 rounded-xl cursor-pointer',
              'bg-bg-secondary border border-border',
              'transition-all duration-150',
              'hover:border-border-hover hover:bg-bg-hover/50',
              copied && 'border-accent-green/50 bg-accent-green/5'
            )}
          >
            <code
              className={cn(
                'font-mono text-sm tracking-wide truncate',
                copied ? 'text-accent-green' : 'text-text-primary'
              )}
            >
              {bar.template}
            </code>
            <span
              className={cn(
                'shrink-0 flex items-center gap-1.5 text-xs font-medium',
                'transition-colors duration-150',
                copied
                  ? 'text-accent-green'
                  : 'text-text-muted group-hover:text-text-secondary'
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      {/* Hero indicator */}
      {bar.hero && (
        <div className="mt-4 bg-bg-card border border-border rounded-xl p-4 shadow-sticky">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">
            Works On
          </span>
          <div className="mt-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-secondary/50 border border-border/50 rounded-lg text-sm">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: professionColors[bar.primary] }}
              />
              {bar.hero}
            </span>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Formats a date string using UTC to avoid hydration mismatch
 * Uses consistent UTC-based format between server and client
 */
function FormattedDate({ date }: { date: string }) {
  const d = new Date(date)
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  return (
    <>{`${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`}</>
  )
}

/**
 * Simple notes renderer for TipTap JSON content
 */
/**
 * Renders inline content (text with marks, skill mentions)
 */
function renderInlineContent(
  content: BuildWithAuthor['notes']['content'] | undefined
): React.ReactNode {
  if (!content) return null

  return content.map((child, childIndex) => {
    // Handle skill mentions with tooltip
    if (child.type === 'skillMention') {
      const attrs = child.attrs as
        | { id?: string; label?: string; elite?: boolean }
        | undefined
      return (
        <SkillMentionTooltip
          key={childIndex}
          skillId={attrs?.id || '0'}
          label={attrs?.label || 'Unknown Skill'}
          elite={attrs?.elite === true}
        />
      )
    }

    // Handle text nodes
    if (child.type === 'text') {
      let content: React.ReactNode = child.text

      // Apply marks (bold, italic, link, etc.)
      if (child.marks) {
        for (const mark of child.marks) {
          if (mark.type === 'bold') {
            content = <strong key={`${childIndex}-bold`}>{content}</strong>
          } else if (mark.type === 'italic') {
            content = <em key={`${childIndex}-italic`}>{content}</em>
          } else if (mark.type === 'code') {
            content = <code key={`${childIndex}-code`}>{content}</code>
          } else if (mark.type === 'link') {
            const href = (mark.attrs as { href?: string } | undefined)?.href
            content = (
              <a
                key={`${childIndex}-link`}
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="text-accent-blue hover:text-accent-blue/80 underline"
              >
                {content}
              </a>
            )
          }
        }
      }

      return <span key={childIndex}>{content}</span>
    }

    // Handle hard breaks
    if (child.type === 'hardBreak') {
      return <br key={childIndex} />
    }

    return null
  })
}

/**
 * Renders list items with full inline content support
 */
function renderListItems(
  content: BuildWithAuthor['notes']['content'] | undefined
): React.ReactNode {
  if (!content) return null

  return content.map((item, itemIndex) => (
    <li key={itemIndex}>
      {item.content?.map((para, paraIndex) => (
        <span key={paraIndex}>{renderInlineContent(para.content)}</span>
      ))}
    </li>
  ))
}

function NotesRenderer({ notes }: { notes: BuildWithAuthor['notes'] }) {
  if (!notes || !notes.content) return null

  return (
    <>
      {notes.content.map((node, index) => {
        // Headings
        if (node.type === 'heading') {
          const level =
            (node.attrs as { level?: number } | undefined)?.level || 1
          const HeadingTag = `h${level}` as
            | 'h1'
            | 'h2'
            | 'h3'
            | 'h4'
            | 'h5'
            | 'h6'
          return (
            <HeadingTag key={index}>
              {renderInlineContent(node.content)}
            </HeadingTag>
          )
        }

        // Paragraphs
        if (node.type === 'paragraph') {
          return <p key={index}>{renderInlineContent(node.content)}</p>
        }

        // Bullet lists
        if (node.type === 'bulletList') {
          return <ul key={index}>{renderListItems(node.content)}</ul>
        }

        // Ordered lists
        if (node.type === 'orderedList') {
          return <ol key={index}>{renderListItems(node.content)}</ol>
        }

        // Blockquotes
        if (node.type === 'blockquote') {
          return (
            <blockquote key={index}>
              {node.content?.map((child, childIndex) => (
                <p key={childIndex}>{renderInlineContent(child.content)}</p>
              ))}
            </blockquote>
          )
        }

        // Horizontal rule
        if (node.type === 'horizontalRule') {
          return <hr key={index} />
        }

        return null
      })}
    </>
  )
}
