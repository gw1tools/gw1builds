/**
 * @fileoverview Client-side build page with interactivity
 * @module app/b/[id]/client
 *
 * Handles interactive elements: skill tooltips, copy buttons, etc.
 */
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, Clock, Copy, Link2, Pencil, Check, Flag, Lock } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import {
  trackBuildViewed,
  trackTemplateCopied,
  trackBuildShared,
} from '@/lib/analytics'
import { extractTextFromTiptap } from '@/lib/search/text-utils'
import { cn } from '@/lib/utils'
import { useVariantData } from '@/hooks'
import { mapSkillsFromIds, type Skill } from '@/lib/gw/skills'
import { useAuthModal } from '@/components/auth/auth-modal'
import { SkillMentionTooltip } from '@/components/ui/skill-mention-tooltip'
import { SkillBar } from '@/components/ui/skill-bar'
import { AttributeBar } from '@/components/ui/attribute-bar'
import { Button } from '@/components/ui/button'
import { StarButton } from '@/components/ui/star-button'
import { OverflowMenu } from '@/components/ui/overflow-menu'
import { ProfessionIcon } from '@/components/ui/profession-icon'
import { Tag, TagGroup } from '@/components/ui/tag'
import { CollaboratorList } from '@/components/ui/collaborator-list'
import { HeroBuildCard } from '@/components/build/hero-build-card'
import { TeamOverview } from '@/components/build/team-overview'
import { VariantTabs } from '@/components/ui/variant-tabs'
import { ReportModal } from '@/components/build/report-modal'
import { EquipmentDisplay, hasEquipment } from '@/components/build/equipment-display'
import { getAttributeBonusBreakdown } from '@/lib/gw/equipment/armor'
import type { BuildWithAuthor } from '@/types/database'
import type { ProfessionKey } from '@/types/gw1'

interface BuildPageClientProps {
  build: BuildWithAuthor
  /** Pre-fetched skill data from server, keyed by skill ID */
  skillMap: Record<number, Skill>
  isOwner: boolean
  /** Whether user can edit (owner or collaborator) */
  canEdit: boolean
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
  canEdit,
  professionColors,
  initialStarred,
  starCount,
  isAuthenticated,
}: BuildPageClientProps) {
  // Calculate total players to determine if this is a team build
  const totalPlayers = build.bars.reduce(
    (sum, bar) => sum + (bar.playerCount || 1),
    0
  )
  // Single build only if one bar AND one player
  const isSingleBuild = build.bars.length === 1 && totalPlayers === 1
  const [reportModalOpen, setReportModalOpen] = useState(false)
  // Track active variant for each bar in team builds { barIndex: variantIndex }
  const [activeVariants, setActiveVariants] = useState<Record<number, number>>({})
  const isDelisted = build.moderation_status === 'delisted'
  const isPrivate = build.is_private === true
  const [isScrolled, setIsScrolled] = useState(false)
  const { openModal } = useAuthModal()

  // Track scroll position for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-12">
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

      {/* Private build banner */}
      {isPrivate && (
        <div className="mb-6 p-4 rounded-xl border border-text-muted/30 bg-bg-secondary/50">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-text-muted shrink-0" />
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Private Build
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Only you and collaborators can see this build
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Breadcrumb + Actions Row - click to scroll to top */}
      <nav
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={cn(
          'fixed top-16 left-0 right-0 z-30 cursor-pointer',
          'bg-bg-primary/95 backdrop-blur-md border-b border-border shadow-lg',
          'transition-opacity duration-200',
          isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="text-sm font-mono">
            <span className="text-text-secondary">builds</span>
            {' / '}
            <span className="text-text-muted">{build.id}</span>
            <span className="text-text-muted mx-2">·</span>
            <span className="text-text-primary truncate max-w-[200px] inline-block align-bottom">
              {build.name}
            </span>
          </div>

          {/* Stop propagation so button clicks don't trigger scroll */}
          <div onClick={(e) => e.stopPropagation()}>
            <PageActions
              build={build}
              canEdit={canEdit}
              initialStarred={initialStarred}
              starCount={starCount}
              isAuthenticated={isAuthenticated}
            />
          </div>
        </div>
      </nav>

      {/* Static Breadcrumb + Actions Row (visible before scroll) */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-text-muted font-mono">
          <Link
            href="/"
            className="text-text-secondary hover:text-accent-gold transition-colors"
          >
            builds
          </Link>
          {' / '}
          <span>{build.id}</span>
        </div>

        <PageActions
          build={build}
          canEdit={canEdit}
          initialStarred={initialStarred}
          starCount={starCount}
          isAuthenticated={isAuthenticated}
        />
      </div>

      {/* Single Build View - unified card with title */}
      {isSingleBuild && (
        <SingleBuildView
          buildName={build.name}
          authorName={build.author?.username ?? undefined}
          collaborators={build.collaborators}
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
            collaborators={build.collaborators}
            bars={build.bars}
            skillMap={skillMap}
          />

          {/* Detailed Stacked Cards */}
          <div className="space-y-3 mt-4">
            {build.bars.map((bar, index) => (
              <div key={index} id={`skill-bar-${index}`}>
                <HeroBuildCard
                  bar={bar}
                  index={index}
                  buildId={build.id}
                  skillMap={skillMap}
                  activeVariantIndex={activeVariants[index] || 0}
                  onVariantChange={(variantIndex) =>
                    setActiveVariants(prev => ({ ...prev, [index]: variantIndex }))
                  }
                />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Notes - only show if there's actual text content */}
      {build.notes && extractTextFromTiptap(build.notes).length > 0 && (
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
    </div>
  )
}

/**
 * Page-level actions: Star, Share, More (Edit + Use as Template)
 */
function PageActions({
  build,
  canEdit,
  initialStarred,
  starCount,
  isAuthenticated,
}: {
  build: BuildWithAuthor
  canEdit: boolean
  initialStarred: boolean
  starCount: number
  isAuthenticated: boolean
}) {
  const router = useRouter()
  const { openModal } = useAuthModal()

  const handleStarChange = async () => {
    const response = await fetch(`/api/builds/${build.id}/star`, {
      method: 'POST',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      toast.error(errorData.error || 'Failed to star build')
      throw new Error('Failed to toggle star')
    }
  }

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/b/${build.id}`
    await navigator.clipboard.writeText(url)
    trackBuildShared({ build_id: build.id, method: 'clipboard' })
  }

  const handleUseAsTemplate = () => {
    localStorage.setItem(
      'build-template',
      JSON.stringify({
        name: `Copy: ${build.name}`,
        bars: build.bars,
        notes: build.notes,
        tags: build.tags,
      })
    )
    router.push('/new')
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

      <OverflowMenu
        size="sm"
        items={[
          {
            label: 'Copy Link',
            icon: <Link2 className="w-4 h-4" />,
            onClick: handleCopyLink,
            successLabel: 'Copied!',
          },
          ...(canEdit
            ? [
                {
                  label: 'Edit',
                  icon: <Pencil className="w-4 h-4" />,
                  onClick: () => router.push(`/b/${build.id}/edit`),
                  successLabel: 'Opening...',
                },
              ]
            : []),
          {
            label: 'Use as Template',
            icon: <Copy className="w-4 h-4" />,
            onClick: handleUseAsTemplate,
            successLabel: 'Creating...',
          },
        ]}
      />
    </div>
  )
}

/**
 * Single build view (skill bar, attributes, copy button)
 */
function SingleBuildView({
  buildName,
  authorName,
  collaborators,
  bar,
  buildId,
  skillMap,
  professionColors,
}: {
  buildName: string
  authorName?: string
  collaborators?: Array<{ username: string }>
  bar: BuildWithAuthor['bars'][0]
  buildId: string
  skillMap: Record<number, Skill>
  professionColors: Record<string, string>
}) {
  const [copied, setCopied] = useState(false)
  const [activeVariantIndex, setActiveVariantIndex] = useState(0)
  const { allVariants, currentVariant, hasVariants } = useVariantData(bar, activeVariantIndex)
  const skills = useMemo(
    () => mapSkillsFromIds(currentVariant.skills, skillMap),
    [currentVariant.skills, skillMap]
  )

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(currentVariant.template)
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
              <CollaboratorList collaborators={collaborators || []} />
            </p>
          )}
        </div>

        {/* Variant tabs - only show if variants exist */}
        {hasVariants && (
          <div className="px-5 py-3 border-t border-border/50 bg-bg-secondary/30">
            <VariantTabs
              variants={allVariants}
              activeIndex={activeVariantIndex}
              onChange={setActiveVariantIndex}
            />
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border" />

        {/* Build content */}
        <div className="p-5">
          {/* Profession Badge - compact (uses current variant's profession) */}
          <div
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-semibold mb-4"
            style={{
              borderColor: `${professionColors[currentVariant.primary]}40`,
              backgroundColor: `${professionColors[currentVariant.primary]}12`,
            }}
          >
            <ProfessionIcon
              profession={currentVariant.primary.toLowerCase() as ProfessionKey}
              size="xs"
            />
            <span style={{ color: professionColors[currentVariant.primary] }}>
              {currentVariant.primary}
            </span>
            {currentVariant.secondary !== 'None' && (
              <>
                <span className="text-text-muted/40 mx-0.5">/</span>
                <ProfessionIcon
                  profession={currentVariant.secondary.toLowerCase() as ProfessionKey}
                  size="xs"
                />
                <span style={{ color: professionColors[currentVariant.secondary] }}>
                  {currentVariant.secondary}
                </span>
              </>
            )}
          </div>

          {/* Skill Bar */}
          <SkillBar skills={skills} size="lg" attributes={currentVariant.attributes} />

          {/* Attributes */}
          <div className="mt-5">
            <AttributeBar
              attributes={currentVariant.attributes}
              bonusBreakdown={currentVariant.equipment?.armor ? getAttributeBonusBreakdown(currentVariant.equipment.armor) : undefined}
            />
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
              {currentVariant.template}
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

          {/* Equipment Display (uses current variant's equipment) */}
          {currentVariant.equipment && hasEquipment(currentVariant.equipment) && (
            <EquipmentDisplay equipment={currentVariant.equipment} className="mt-4" />
          )}
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
 * Renders inline content (text with marks, skill mentions)
 */
function renderInlineContent(
  content: BuildWithAuthor['notes']['content'] | undefined
): React.ReactNode {
  if (!content) return null

  return content.map((child, index) => {
    switch (child.type) {
      case 'skillMention': {
        const attrs = child.attrs as
          | { id?: string; label?: string; elite?: boolean }
          | undefined
        return (
          <SkillMentionTooltip
            key={index}
            skillId={attrs?.id || '0'}
            label={attrs?.label || 'Unknown Skill'}
            elite={attrs?.elite === true}
          />
        )
      }

      case 'text': {
        let node: React.ReactNode = child.text
        for (const mark of child.marks ?? []) {
          node = wrapWithMark(node, mark, index)
        }
        return <span key={index}>{node}</span>
      }

      case 'hardBreak':
        return <br key={index} />

      default:
        return null
    }
  })
}

/**
 * Wraps content with the appropriate mark element
 */
function wrapWithMark(
  content: React.ReactNode,
  mark: { type: string; attrs?: unknown },
  index: number
): React.ReactNode {
  switch (mark.type) {
    case 'bold':
      return <strong key={`${index}-bold`}>{content}</strong>
    case 'italic':
      return <em key={`${index}-italic`}>{content}</em>
    case 'code':
      return <code key={`${index}-code`}>{content}</code>
    case 'link': {
      const href = (mark.attrs as { href?: string } | undefined)?.href
      return (
        <a
          key={`${index}-link`}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-accent-blue hover:text-accent-blue/80 underline"
        >
          {content}
        </a>
      )
    }
    default:
      return content
  }
}

/**
 * Renders list items with nested list support
 */
function renderListItems(
  content: BuildWithAuthor['notes']['content'] | undefined
): React.ReactNode {
  if (!content) return null

  return content.map((item, itemIndex) => (
    <li key={itemIndex}>
      {item.content?.map((child, index) => {
        switch (child.type) {
          case 'paragraph':
            return <span key={index}>{renderInlineContent(child.content)}</span>
          case 'bulletList':
            return <ul key={index}>{renderListItems(child.content)}</ul>
          case 'orderedList':
            return <ol key={index}>{renderListItems(child.content)}</ol>
          case 'horizontalRule':
            return <hr key={index} />
          default:
            return null
        }
      })}
    </li>
  ))
}

type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

/**
 * Renders block-level content (paragraphs, lists, headings, blockquotes, etc.)
 */
function renderBlockContent(
  content: BuildWithAuthor['notes']['content'] | undefined
): React.ReactNode {
  if (!content) return null

  return content.map((node, index) => {
    switch (node.type) {
      case 'heading': {
        const level = (node.attrs as { level?: number } | undefined)?.level || 1
        const HeadingTag = `h${level}` as HeadingLevel
        return (
          <HeadingTag key={index}>
            {renderInlineContent(node.content)}
          </HeadingTag>
        )
      }

      case 'paragraph':
        return <p key={index}>{renderInlineContent(node.content)}</p>

      case 'bulletList':
        return <ul key={index}>{renderListItems(node.content)}</ul>

      case 'orderedList':
        return <ol key={index}>{renderListItems(node.content)}</ol>

      case 'blockquote':
        return (
          <blockquote key={index}>
            {renderBlockContent(node.content)}
          </blockquote>
        )

      case 'horizontalRule':
        return <hr key={index} />

      default:
        return null
    }
  })
}

function NotesRenderer({ notes }: { notes: BuildWithAuthor['notes'] }): React.ReactNode {
  if (!notes?.content) return null
  return <>{renderBlockContent(notes.content)}</>
}
