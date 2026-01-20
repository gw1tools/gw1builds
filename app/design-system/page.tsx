'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Copy, Star, Share2, Trash2, Plus, Check, Search } from 'lucide-react'
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Tag,
  TagGroup,
  Badge,
  CountBadge,
  Input,
  Textarea,
  Toggle,
  IconButton,
  StarButton,
  PlayerCountControl,
  VariantTabs,
  SkillIcon,
  CostStat,
  SkillSlot,
  SkillBar,
  SkillBarCompact,
  ProfessionBadge,
  ProfessionDot,
  AttributeBar,
  AttributeInline,
  TemplateCode,
  Skeleton,
  SkillBarSkeleton,
  BuildCardSkeleton,
  EmptyState,
  Tooltip,
  ProfessionSpinner,
  UserLink,
} from '@/components/ui'
import { Header, Container, ActionBar, PageWrapper } from '@/components/layout'
import { BuildFeedCard, BuildFeedCardSkeleton } from '@/components/build/build-feed-card'
import { Modal, ModalBody, ModalFooter } from '@/components/ui/modal'

// Sample skill data for demos
const sampleSkills = [
  {
    id: 1,
    name: 'Energy Surge',
    description:
      'Target foe loses 1...8 Energy. For each point of Energy lost, that foe and all nearby foes take 9 damage.',
    profession: 'Mesmer',
    attribute: 'Domination Magic',
    energy: 10,
    activation: 2,
    recharge: 20,
    elite: true,
  },
  {
    id: 2,
    name: 'Mistrust',
    description:
      'For 6 seconds, the next spell that target foe casts causes 30...100 damage to all nearby foes.',
    profession: 'Mesmer',
    attribute: 'Domination Magic',
    energy: 10,
    activation: 1,
    recharge: 12,
  },
  {
    id: 3,
    name: 'Cry of Frustration',
    description:
      'Interrupt target foe. Interruption effect: that foe and all nearby foes take 30...80 damage.',
    profession: 'Mesmer',
    attribute: 'Domination Magic',
    energy: 10,
    activation: 0.25,
    recharge: 10,
  },
  {
    id: 4,
    name: 'Shatter Hex',
    profession: 'Mesmer',
    energy: 5,
    activation: 1,
    recharge: 8,
  },
  {
    id: 5,
    name: 'Power Drain',
    profession: 'Mesmer',
    energy: 5,
    activation: 0.25,
    recharge: 15,
  },
  {
    id: 6,
    name: 'Drain Enchantment',
    profession: 'Mesmer',
    energy: 5,
    activation: 1,
    recharge: 20,
  },
  {
    id: 7,
    name: 'Waste Not Want Not',
    profession: 'Mesmer',
    energy: 5,
    activation: 0.25,
    recharge: 4,
  },
  {
    id: 8,
    name: 'Resurrection Signet',
    profession: 'None',
    energy: 0,
    activation: 3,
    recharge: 0,
  },
]

const sampleAttributes = {
  'Domination Magic': 12,
  'Inspiration Magic': 10,
  'Fast Casting': 8,
}

// Sample build data for BuildFeedCard demo
const sampleBuild = {
  id: 'demo-build-1',
  name: 'Energy Surge Mesmer',
  tags: ['PvE', 'meta', 'mesmer', 'domination'],
  bars: [
    {
      name: 'Energy Surge Mesmer',
      primary: 'Mesmer',
      secondary: 'Monk',
      skills: [946, 837, 838, 936, 839, 933, 840, 265],
    },
  ],
  star_count: 128,
  view_count: 1523,
  created_at: new Date().toISOString(),
  author: {
    username: 'GuildMaster',
    avatar_url: null,
  },
}

const sampleTeamBuild = {
  id: 'demo-build-2',
  name: 'DoA Team Comp',
  tags: ['PvE', 'elite', 'team', 'DoA'],
  bars: [
    {
      name: 'ESurge Mesmer',
      primary: 'Mesmer',
      secondary: 'Monk',
      skills: [946, 837, 838, 936, 839, 933, 840, 265],
    },
    {
      name: 'SoS Ritualist',
      primary: 'Ritualist',
      secondary: 'None',
      skills: [2358, 2359, 2360, 2361, 2362, 2363, 2364, 265],
    },
    {
      name: 'BiP Necro',
      primary: 'Necromancer',
      secondary: 'Monk',
      skills: [155, 156, 157, 158, 159, 160, 161, 265],
    },
  ],
  star_count: 256,
  view_count: 4200,
  created_at: new Date().toISOString(),
  author: {
    username: 'SpeedClear',
    avatar_url: null,
  },
}

/**
 * Interactive demo for VariantTabs
 */
function VariantTabsDemo() {
  const [activeIndex1, setActiveIndex1] = useState(0)
  const [activeIndex2, setActiveIndex2] = useState(0)
  const [variants, setVariants] = useState([
    { name: undefined },
    { name: 'Anti-Caster' },
  ])

  const handleAdd = () => {
    if (variants.length < 5) {
      setVariants([...variants, { name: undefined }])
    }
  }

  const handleDelete = (index: number) => {
    if (index > 0) {
      const newVariants = [...variants]
      newVariants.splice(index, 1)
      setVariants(newVariants)
      if (activeIndex2 >= index) {
        setActiveIndex2(Math.max(0, activeIndex2 - 1))
      }
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-text-primary mb-6">
        Variant Tabs
      </h2>
      <p className="text-text-secondary text-sm mb-4">
        Tab component for switching between skill bar variants. Used in both viewer (read-only)
        and editor (with add/delete) modes. Max 5 variants per bar.
      </p>
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3">
            Viewer Mode (Read-only)
          </h3>
          <VariantTabs
            variants={[{ name: undefined }, { name: 'Anti-Caster' }, { name: 'Budget' }]}
            activeIndex={activeIndex1}
            onChange={setActiveIndex1}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3">
            Editor Mode (Add/Delete)
          </h3>
          <VariantTabs
            variants={variants}
            activeIndex={activeIndex2}
            onChange={setActiveIndex2}
            editable
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </div>
        <div>
          <h3 className="text-sm font-medium text-text-muted mb-3">
            Single Variant (No tabs shown in viewer)
          </h3>
          <p className="text-xs text-text-muted italic">
            When only the default variant exists, tabs are typically hidden in the viewer.
            In the editor, you can still add variants.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function DesignSystemPage() {
  const [, setCopied] = useState(false)
  const [showDemoModal, setShowDemoModal] = useState(false)
  const [showDemoModalNoClose, setShowDemoModalNoClose] = useState(false)

  return (
    <PageWrapper>
      <Header />

      <Container size="lg" className="py-12 pb-32">
        <div className="space-y-16">
          {/* Title */}
          <section className="text-center">
            <h1 className="text-4xl font-bold text-text-primary mb-4">
              Design System
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              GW1 Builds component library. A sticky-note aesthetic on a warm
              dark canvas, grounded by Guild Wars gold.
            </p>
          </section>

          {/* Logo */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Logo
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              The logo is based on the profession spinner — 10 colored dots
              representing all GW1 professions arranged in a circle.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Static Logo (SVG)
                </h3>
                <div className="flex items-end gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <Image src="/logo.svg" alt="Logo" width={64} height={64} />
                    <span className="text-xs text-text-muted">64px</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Image src="/logo.svg" alt="Logo" width={48} height={48} />
                    <span className="text-xs text-text-muted">48px</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Image src="/logo.svg" alt="Logo" width={32} height={32} />
                    <span className="text-xs text-text-muted">32px</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Image src="/logo.svg" alt="Logo" width={16} height={16} />
                    <span className="text-xs text-text-muted">16px</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Animated (Spinner)
                </h3>
                <div className="flex items-end gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="xl" />
                    <span className="text-xs text-text-muted">xl</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="lg" />
                    <span className="text-xs text-text-muted">lg</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="md" />
                    <span className="text-xs text-text-muted">md</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="sm" />
                    <span className="text-xs text-text-muted">sm</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Buttons
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="gold">Gold</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="sm" variant="primary">
                  Small
                </Button>
                <Button size="md" variant="primary">
                  Medium
                </Button>
                <Button size="lg" variant="primary">
                  Large
                </Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  With Icon
                </Button>
                <Button rightIcon={<Share2 className="w-4 h-4" />}>
                  Share
                </Button>
                <Button isLoading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button href="/new" variant="primary" leftIcon={<Plus className="w-4 h-4" />}>
                  Link Button
                </Button>
                <Button href="/" variant="secondary">
                  Browse Builds
                </Button>
              </div>
            </div>
          </section>

          {/* Icon Buttons */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Icon Buttons
            </h2>
            <div className="flex flex-wrap gap-3">
              <Tooltip content="Copy to clipboard">
                <IconButton icon={<Copy />} aria-label="Copy" />
              </Tooltip>
              <IconButton
                icon={<Search />}
                aria-label="Search"
                variant="ghost"
              />
              <IconButton
                icon={<Trash2 />}
                aria-label="Delete"
                variant="danger"
              />
              <IconButton icon={<Plus />} aria-label="Add" size="lg" />
              <IconButton icon={<Check />} aria-label="Confirm" size="sm" />
            </div>
          </section>

          {/* Star Button */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Star Button
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              GitHub-style star button with count, optimistic updates, and
              debounced API calls.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Unstarred</span>
                <StarButton count={42} isStarred={false} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Starred</span>
                <StarButton count={128} isStarred={true} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">High count</span>
                <StarButton count={1523} isStarred={false} />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Small</span>
                <StarButton count={7} isStarred={true} size="sm" />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Large</span>
                <StarButton count={99} isStarred={false} size="lg" />
              </div>
            </div>
          </section>

          {/* Player Count Control */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Player Count Control
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              +/- buttons for specifying player count in team builds. Shows profession icon.
              Used to indicate how many players run a specific build in a team composition.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Default (1)</span>
                <PlayerCountControl
                  count={1}
                  onChange={() => {}}
                  profession="mesmer"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Multiple (3)</span>
                <PlayerCountControl
                  count={3}
                  onChange={() => {}}
                  profession="ritualist"
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">At max (12)</span>
                <PlayerCountControl
                  count={12}
                  onChange={() => {}}
                  profession="warrior"
                  max={12}
                />
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-text-muted">Disabled</span>
                <PlayerCountControl
                  count={2}
                  onChange={() => {}}
                  profession="monk"
                  disabled
                />
              </div>
            </div>
          </section>

          {/* Variant Tabs */}
          <VariantTabsDemo />

          {/* Cards */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Cards
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader
                  title="Default Card"
                  description="With sticky shadow"
                />
                <CardContent>
                  <p className="text-text-secondary text-sm">
                    This is a standard card with the signature offset shadow
                    effect.
                  </p>
                </CardContent>
              </Card>

              <Card variant="elevated">
                <CardHeader title="Elevated Card" />
                <CardContent>
                  <p className="text-text-secondary text-sm">
                    Slightly lighter background for modal-like content.
                  </p>
                </CardContent>
              </Card>

              <Card interactive>
                <CardHeader title="Interactive Card" />
                <CardContent>
                  <p className="text-text-secondary text-sm">
                    Hover me to see the lift effect!
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Build Feed Cards */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Build Feed Cards
            </h2>
            <p className="text-text-secondary text-sm mb-4">
              Compact cards for displaying builds in feeds and lists. Shows profession badge, skill preview, tags, and stats.
            </p>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Single Build
                </h3>
                <div className="max-w-md">
                  <BuildFeedCard build={sampleBuild} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Team Build
                </h3>
                <div className="max-w-md">
                  <BuildFeedCard build={sampleTeamBuild} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Non-Interactive (asLink=false)
                </h3>
                <div className="max-w-md">
                  <BuildFeedCard build={sampleBuild} asLink={false} />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Skeleton Loading State
                </h3>
                <div className="max-w-md">
                  <BuildFeedCardSkeleton />
                </div>
              </div>
            </div>
          </section>

          {/* Tags & Badges */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Tags & Badges
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-2">
                  Tags
                </h3>
                <TagGroup>
                  <Tag label="PvE" />
                  <Tag label="meta" />
                  <Tag label="beginner" />
                  <Tag label="hero" />
                  <Tag label="mesmer" rotate />
                  <Tag
                    variant="sticky"
                    stickyColor="yellow"
                    label="Note"
                    rotate
                  />
                </TagGroup>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-2">
                  Badges
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="gold">Gold</Badge>
                  <Badge variant="elite">Elite</Badge>
                  <Badge variant="success" dot>
                    Online
                  </Badge>
                  <Badge variant="danger">Error</Badge>
                  <Badge variant="info" icon={<Star className="w-3 h-3" />}>
                    Featured
                  </Badge>
                  <CountBadge count={5} />
                  <CountBadge count={99} variant="gold" />
                  <CountBadge count={150} max={99} variant="danger" />
                </div>
              </div>
            </div>
          </section>

          {/* Profession Badges */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Profession Badges
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Primary Only
                </h3>
                <div className="flex flex-wrap gap-3">
                  <ProfessionBadge primary="warrior" />
                  <ProfessionBadge primary="ranger" />
                  <ProfessionBadge primary="monk" />
                  <ProfessionBadge primary="necromancer" />
                  <ProfessionBadge primary="mesmer" />
                  <ProfessionBadge primary="elementalist" />
                  <ProfessionBadge primary="assassin" />
                  <ProfessionBadge primary="ritualist" />
                  <ProfessionBadge primary="paragon" />
                  <ProfessionBadge primary="dervish" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Primary / Secondary (with colored icons)
                </h3>
                <div className="flex flex-wrap gap-3">
                  <ProfessionBadge primary="assassin" secondary="ranger" />
                  <ProfessionBadge primary="mesmer" secondary="necromancer" />
                  <ProfessionBadge primary="warrior" secondary="monk" />
                  <ProfessionBadge
                    primary="elementalist"
                    secondary="assassin"
                  />
                  <ProfessionBadge primary="ritualist" secondary="paragon" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Sizes
                </h3>
                <div className="flex flex-wrap items-center gap-3">
                  <ProfessionBadge
                    primary="mesmer"
                    secondary="monk"
                    size="sm"
                  />
                  <ProfessionBadge
                    primary="mesmer"
                    secondary="monk"
                    size="md"
                  />
                  <ProfessionBadge
                    primary="mesmer"
                    secondary="monk"
                    size="lg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-text-muted">
                  Profession dots:
                </span>
                <ProfessionDot profession="warrior" />
                <ProfessionDot profession="mesmer" />
                <ProfessionDot profession="monk" />
                <ProfessionDot profession="elementalist" size="lg" />
              </div>
            </div>
          </section>

          {/* Skills */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Skill Components
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Skill Icon (standalone, no tooltip)
                </h3>
                <div className="flex items-end gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skillId={946} size="lg" name="Energy Surge" elite />
                    <span className="text-xs text-text-muted">lg (64px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skillId={946} size="md" name="Energy Surge" elite />
                    <span className="text-xs text-text-muted">md (56px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skillId={946} size="sm" name="Energy Surge" />
                    <span className="text-xs text-text-muted">sm (44px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skillId={946} size="xs" name="Energy Surge" />
                    <span className="text-xs text-text-muted">xs (24px)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skillId={0} size="sm" showEmptyGhost emptyVariant="viewer" />
                    <span className="text-xs text-text-muted">empty</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <SkillIcon skillId={0} size="sm" showEmptyGhost emptyVariant="editor" />
                    <span className="text-xs text-text-muted">editor</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Cost Stats
                </h3>
                <div className="flex items-center gap-6 text-sm">
                  <CostStat type="energy" value={10} />
                  <CostStat type="adrenaline" value={4} />
                  <CostStat type="activation" value={1.5} showUnit />
                  <CostStat type="recharge" value={20} showUnit />
                  <CostStat type="sacrifice" value={10} showUnit />
                  <CostStat type="upkeep" value={-1} />
                  <CostStat type="overcast" value={2} />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Individual Skill Slots (with tooltip)
                </h3>
                <div className="flex gap-2">
                  <SkillSlot skill={sampleSkills[0]} size="lg" />
                  <SkillSlot skill={sampleSkills[1]} size="lg" />
                  <SkillSlot skill={sampleSkills[2]} size="lg" />
                  <SkillSlot empty size="lg" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Full Skill Bar (with stagger animation)
                </h3>
                <SkillBar skills={sampleSkills} size="lg" />
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Compact Skill Bar (for cards)
                </h3>
                <SkillBarCompact skills={sampleSkills} />
              </div>
            </div>
          </section>

          {/* Attributes */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Attributes
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Attribute Bar
                </h3>
                <AttributeBar attributes={sampleAttributes} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Compact (inline)
                </h3>
                <AttributeInline attributes={sampleAttributes} />
              </div>
            </div>
          </section>

          {/* Template Code */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Template Code
            </h2>
            <div className="max-w-xl">
              <TemplateCode
                code="OQBDAasySIAFgFGDAxhMxBDhCA"
                label="Template Code"
                onCopy={() => {
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
              />
            </div>
          </section>

          {/* Inputs */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Form Inputs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
              <Input label="Build Name" placeholder="Enter build name" />
              <Input
                label="Template Code"
                placeholder="OQBDAasySIA..."
                mono
                rightElement={<Copy className="w-4 h-4" />}
              />
              <Input
                label="With Error"
                placeholder="Required field"
                error="This field is required"
              />
              <Input
                label="With Hint"
                placeholder="Search skills..."
                hint="Start typing to search"
                leftElement={<Search className="w-4 h-4" />}
              />
              <div className="md:col-span-2">
                <Textarea
                  label="Build Notes"
                  placeholder="Describe your build strategy, usage tips, and variations..."
                />
              </div>
            </div>
          </section>

          {/* Toggle */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Toggle
            </h2>
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center justify-between p-3 bg-bg-card rounded-lg border border-border">
                <span className="text-sm text-text-primary">Default (off)</span>
                <Toggle checked={false} onChange={() => {}} label="Example toggle" />
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-card rounded-lg border border-border">
                <span className="text-sm text-text-primary">Active (on)</span>
                <Toggle checked={true} onChange={() => {}} label="Example toggle" />
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-card rounded-lg border border-border opacity-50">
                <span className="text-sm text-text-primary">Disabled</span>
                <Toggle checked={false} onChange={() => {}} disabled label="Disabled toggle" />
              </div>
            </div>
          </section>

          {/* Build Search */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Build Search
            </h2>
            <div className="max-w-lg">
              <p className="text-text-muted text-sm mb-4">
                Spotlight-style search with tiered matching. Supports profession
                notation (W/Mo), hashtags (#meta), and skill names. Used on the
                homepage.
              </p>
              <div className="p-4 bg-bg-card rounded-xl border border-border">
                <p className="text-text-muted text-xs text-center italic">
                  See homepage for live demo - requires build data from database
                </p>
              </div>
              <div className="mt-4 text-xs text-text-muted space-y-1">
                <p>
                  <code className="bg-bg-primary px-1.5 py-0.5 rounded">W/Mo</code>{' '}
                  — Search by profession combo
                </p>
                <p>
                  <code className="bg-bg-primary px-1.5 py-0.5 rounded">#meta</code>{' '}
                  — Search by tag
                </p>
                <p>
                  <code className="bg-bg-primary px-1.5 py-0.5 rounded">energy surge</code>{' '}
                  — Search by skill name
                </p>
              </div>
            </div>
          </section>

          {/* Skeletons */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Loading States
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Profession Spinner
                </h3>
                <div className="flex items-center gap-8">
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="sm" />
                    <span className="text-xs text-text-muted">sm</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="md" />
                    <span className="text-xs text-text-muted">md</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="lg" />
                    <span className="text-xs text-text-muted">lg</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <ProfessionSpinner size="xl" />
                    <span className="text-xs text-text-muted">xl</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Basic Skeletons
                </h3>
                <div className="space-y-2 max-w-md">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Skill Bar Skeleton
                </h3>
                <SkillBarSkeleton size="lg" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Build Card Skeleton
                </h3>
                <div className="max-w-md">
                  <BuildCardSkeleton />
                </div>
              </div>
            </div>
          </section>

          {/* Modal */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Modal
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Reusable modal component with body scroll lock, focus trap, escape key handling, and ARIA attributes.
            </p>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => setShowDemoModal(true)}
                >
                  Open Demo Modal
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDemoModalNoClose(true)}
                >
                  Modal (Can&apos;t Close)
                </Button>
              </div>
              <div className="text-xs text-text-muted space-y-1">
                <p>Props: isOpen, onClose, title, maxWidth, canClose, closeOnBackdropClick, closeOnEscape, showCloseButton, showHeader, headerContent, footerContent</p>
                <p>Sub-components: ModalBody, ModalFooter</p>
              </div>
            </div>
          </section>

          {/* Empty States */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Empty States
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <EmptyState
                  icon="🔍"
                  title="No builds found"
                  description="Try adjusting your search or filters."
                  action={
                    <Button variant="gold" size="sm">
                      Clear filters
                    </Button>
                  }
                />
              </Card>
              <Card>
                <EmptyState
                  icon="⭐"
                  title="No saved builds"
                  description="Star builds you like to save them here."
                />
              </Card>
            </div>
          </section>

          {/* UserLink */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              UserLink
            </h2>
            <p className="text-sm text-text-secondary mb-4">
              Inline link to user&apos;s public profile page. Styled to fit naturally in sentences.
            </p>
            <Card>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-text-secondary">
                    Created by <UserLink username="GuildMaster" />
                  </p>
                  <p className="text-text-secondary">
                    Shared with you by <UserLink username="SpeedClear" showAtPrefix />
                  </p>
                  <p className="text-text-muted">
                    Built by <UserLink username="HeroBuilder" /> with contributions from{' '}
                    <UserLink username="SkillExpert" /> and <UserLink username="MetaGamer" />
                  </p>
                </div>
                <div className="text-xs text-text-muted mt-4 pt-3 border-t border-border">
                  <p>Props: username (required), showAtPrefix, className</p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Color Palette */}
          <section>
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              Color Palette
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Backgrounds
                </h3>
                <div className="flex gap-2">
                  <div
                    className="w-16 h-16 rounded-lg bg-bg-primary border border-border"
                    title="bg-primary"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-bg-secondary"
                    title="bg-secondary"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-bg-card"
                    title="bg-card"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-bg-elevated"
                    title="bg-elevated"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-bg-hover"
                    title="bg-hover"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Accents
                </h3>
                <div className="flex gap-2">
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-gold"
                    title="accent-gold"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-gold-bright"
                    title="gold-bright"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-gold-dim"
                    title="gold-dim"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-blue"
                    title="accent-blue"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-red"
                    title="accent-red"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-green"
                    title="accent-green"
                  />
                  <div
                    className="w-16 h-16 rounded-lg bg-accent-purple"
                    title="accent-purple"
                  />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-text-muted mb-3">
                  Profession Colors
                </h3>
                <div className="flex flex-wrap gap-2">
                  <div
                    className="w-12 h-12 rounded-lg bg-warrior"
                    title="warrior"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-ranger"
                    title="ranger"
                  />
                  <div className="w-12 h-12 rounded-lg bg-monk" title="monk" />
                  <div
                    className="w-12 h-12 rounded-lg bg-necromancer"
                    title="necromancer"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-mesmer"
                    title="mesmer"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-elementalist"
                    title="elementalist"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-assassin"
                    title="assassin"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-ritualist"
                    title="ritualist"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-paragon"
                    title="paragon"
                  />
                  <div
                    className="w-12 h-12 rounded-lg bg-dervish"
                    title="dervish"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </Container>

      {/* Demo Action Bar */}
      <ActionBar>
        <Button variant="primary" leftIcon={<Copy className="w-4 h-4" />}>
          Copy Template
        </Button>
        <Button variant="secondary" leftIcon={<Share2 className="w-4 h-4" />}>
          Share
        </Button>
        <StarButton count={42} isStarred={false} />
      </ActionBar>

      {/* Demo Modals */}
      <Modal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        title="Demo Modal"
        footerContent={
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowDemoModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setShowDemoModal(false)}>
              Confirm
            </Button>
          </ModalFooter>
        }
      >
        <ModalBody>
          <p className="text-text-secondary">
            This is a demo modal with all features enabled: body scroll lock,
            focus trap, escape to close, and backdrop click to close.
          </p>
        </ModalBody>
      </Modal>

      <Modal
        isOpen={showDemoModalNoClose}
        onClose={() => setShowDemoModalNoClose(false)}
        title="Modal (Cannot Close)"
        canClose={false}
      >
        <ModalBody className="space-y-4">
          <p className="text-text-secondary">
            This modal cannot be closed via escape, backdrop click, or close button.
            Use this for mandatory flows like username selection.
          </p>
          <Button
            variant="primary"
            onClick={() => setShowDemoModalNoClose(false)}
            className="w-full"
          >
            Acknowledge and Close
          </Button>
        </ModalBody>
      </Modal>
    </PageWrapper>
  )
}
