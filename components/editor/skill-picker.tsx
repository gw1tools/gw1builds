'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllSkills, type Skill } from '@/lib/gw/skills'
import { SkillIcon } from '@/components/ui/skill-icon'
import { CostStat } from '@/components/ui/cost-stat'
import { ScaledDescription } from '@/components/ui/scaled-description'
import { ATTRIBUTES_BY_PROFESSION, PROFESSION_TO_ID, PROFESSION_BY_ID, ATTRIBUTE_BY_ID } from '@/lib/constants'
import { PROFESSIONS, professionToKey } from '@/types/gw1'
import type { Profession } from '@/types/gw1'
import { ProfessionIcon } from '@/components/ui/profession-icon'

const ALL_ATTRIBUTES = Object.values(ATTRIBUTE_BY_ID).filter(
  (attr, idx, arr) => attr !== 'No Attribute' && arr.indexOf(attr) === idx
)

const PROFESSION_BY_ATTRIBUTE: Record<string, string> = {}
for (const [profId, attrs] of Object.entries(ATTRIBUTES_BY_PROFESSION)) {
  const profName = PROFESSION_BY_ID[Number(profId)]
  for (const attr of attrs) {
    PROFESSION_BY_ATTRIBUTE[attr] = profName
  }
}

export const EMPTY_SKILL: Skill = {
  id: 0,
  name: 'Empty',
  description: 'Clear this skill slot',
  concise: 'Clear this skill slot',
  profession: 'None',
  attributeId: 0,
  attribute: 'No Attribute',
  type: 'Skill',
  typeId: 0,
  elite: false,
  campaign: 'Core',
  energy: 0,
  activation: 0,
  recharge: 0,
  adrenaline: 0,
  sacrifice: 0,
  upkeep: 0,
  overcast: 0,
  isRoleplay: false,
  pvpSplit: false,
}

const PROFESSION_ALIASES: Record<string, string> = {
  'warr': 'Warrior',
  'war': 'Warrior',
  'rang': 'Ranger',
  'monk': 'Monk',
  'mo': 'Monk',
  'nec': 'Necromancer',
  'necro': 'Necromancer',
  'mes': 'Mesmer',
  'mesm': 'Mesmer',
  'ele': 'Elementalist',
  'elem': 'Elementalist',
  'sin': 'Assassin',
  'ass': 'Assassin',
  'rit': 'Ritualist',
  'para': 'Paragon',
  'derv': 'Dervish',
}

interface SkillCategoryMatch {
  type: 'profession' | 'attribute'
  name: string
  count: number
}

interface AttributeGroup {
  attribute: string
  skills: Skill[]
  isCollapsed: boolean
}

export interface SpotlightSkillPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (skill: Skill) => void
  currentSkills: Skill[]
  /** Current attribute values for scaling skill descriptions */
  attributes?: Record<string, number>
}

export function SpotlightSkillPicker({
  isOpen,
  onClose,
  onSelect,
  currentSkills,
  attributes,
}: SpotlightSkillPickerProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [activeFilter, setActiveFilter] = useState<{ type: 'profession' | 'attribute'; value: string } | null>(null)
  const [collapsedAttributes, setCollapsedAttributes] = useState<Set<string>>(new Set())
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAllSkills().then(skills => {
      setAllSkills(skills)
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    } else {
      /* eslint-disable react-hooks/set-state-in-effect -- reset on close */
      setQuery('')
      setSelectedIndex(0)
      setActiveFilter(null)
      setCollapsedAttributes(new Set())
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isOpen])

  const smartSearchResults = useMemo(() => {
    if (!isOpen || isLoading) return { categories: [], skills: [], groupedByAttribute: [] as AttributeGroup[] }

    const lowerQuery = query.trim().toLowerCase()

    if (activeFilter?.type === 'profession') {
      const professionSkills = allSkills.filter(skill => skill.profession === activeFilter.value)
      const filteredSkills = lowerQuery
        ? professionSkills.filter(s => s.name.toLowerCase().includes(lowerQuery))
        : professionSkills

      const attributeMap = new Map<string, Skill[]>()
      filteredSkills.forEach(skill => {
        const attr = skill.attribute || 'No Attribute'
        if (!attributeMap.has(attr)) {
          attributeMap.set(attr, [])
        }
        attributeMap.get(attr)!.push(skill)
      })

      const profId = PROFESSION_TO_ID[activeFilter.value as keyof typeof PROFESSION_TO_ID]
      const profAttrs = profId ? ATTRIBUTES_BY_PROFESSION[profId] || [] : []

      const sortedAttrs = Array.from(attributeMap.keys()).sort((a, b) => {
        if (a === 'No Attribute') return 1
        if (b === 'No Attribute') return -1
        const aIdx = profAttrs.indexOf(a)
        const bIdx = profAttrs.indexOf(b)
        if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx
        if (aIdx >= 0) return -1
        if (bIdx >= 0) return 1
        return a.localeCompare(b)
      })

      const groupedByAttribute: AttributeGroup[] = sortedAttrs.map(attr => ({
        attribute: attr,
        skills: attributeMap.get(attr)!.sort((a, b) => a.name.localeCompare(b.name)),
        isCollapsed: collapsedAttributes.has(attr),
      }))

      return { categories: [], skills: [], groupedByAttribute }
    }

    if (activeFilter?.type === 'attribute') {
      const filteredSkills = allSkills.filter(skill => skill.attribute === activeFilter.value)
      const matchedSkills = lowerQuery
        ? filteredSkills.filter(s => s.name.toLowerCase().includes(lowerQuery))
        : filteredSkills

      return {
        categories: [],
        skills: matchedSkills.sort((a, b) => a.name.localeCompare(b.name)),
        groupedByAttribute: [],
      }
    }

    if (lowerQuery === '') return { categories: [], skills: [], groupedByAttribute: [] }

    const categories: SkillCategoryMatch[] = []

    const matchedProfessionByAlias = PROFESSION_ALIASES[lowerQuery]
    PROFESSIONS.forEach(prof => {
      const nameMatch = prof.name.toLowerCase().startsWith(lowerQuery) || prof.abbreviation.toLowerCase().startsWith(lowerQuery)
      const aliasMatch = matchedProfessionByAlias === prof.name

      if (nameMatch || aliasMatch) {
        const count = allSkills.filter(s => s.profession === prof.name).length
        categories.push({
          type: 'profession',
          name: prof.name,
          count,
        })
      }
    })

    ALL_ATTRIBUTES.forEach(attr => {
      if (attr.toLowerCase().includes(lowerQuery)) {
        const count = allSkills.filter(s => s.attribute === attr).length
        categories.push({
          type: 'attribute',
          name: attr,
          count,
        })
      }
    })

    const skillMatches = allSkills
      .filter(skill => skill.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(lowerQuery)
        const bStarts = b.name.toLowerCase().startsWith(lowerQuery)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return a.name.localeCompare(b.name)
      })
      .slice(0, 30)

    return { categories, skills: skillMatches, groupedByAttribute: [] }
  }, [query, isOpen, allSkills, isLoading, activeFilter, collapsedAttributes])

  const isSkillInBar = useCallback((skill: Skill) => currentSkills.some(s => s.id === skill.id), [currentSkills])
  const hasEliteInBar = currentSkills.some(s => s.elite)

  const totalVisibleSkills = useMemo(() => {
    if (smartSearchResults.groupedByAttribute.length > 0) {
      return smartSearchResults.groupedByAttribute.reduce((sum, g) =>
        sum + (g.isCollapsed ? 0 : g.skills.length), 0
      )
    }
    return smartSearchResults.skills.length
  }, [smartSearchResults])

  const toggleAttributeCollapse = (attr: string) => {
    setCollapsedAttributes(prev => {
      const next = new Set(prev)
      if (next.has(attr)) {
        next.delete(attr)
      } else {
        next.add(attr)
      }
      return next
    })
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (activeFilter) {
        setActiveFilter(null)
        setSelectedIndex(0)
        setCollapsedAttributes(new Set())
      } else {
        onClose()
      }
    } else if (e.key === 'Enter' && query.trim() !== '' && !activeFilter) {
      e.preventDefault()
      const firstCat = smartSearchResults.categories[0]
      if (firstCat) {
        setActiveFilter({ type: firstCat.type, value: firstCat.name })
        setQuery('')
        setSelectedIndex(0)
      }
    } else if (e.key === 'Backspace' && query === '' && activeFilter) {
      e.preventDefault()
      setActiveFilter(null)
      setCollapsedAttributes(new Set())
    }
  }, [smartSearchResults, activeFilter, onClose, query])

  const handleCategoryClick = (cat: SkillCategoryMatch) => {
    setActiveFilter({ type: cat.type, value: cat.name })
    setQuery('')
    setSelectedIndex(0)
    inputRef.current?.focus()
  }

  const clearFilter = () => {
    setActiveFilter(null)
    setQuery('')
    setSelectedIndex(0)
    setCollapsedAttributes(new Set())
    inputRef.current?.focus()
  }

  const isGroupedView = activeFilter?.type === 'profession' && smartSearchResults.groupedByAttribute.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 cursor-pointer"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[3%] sm:top-[10%] left-1/2 -translate-x-1/2 w-[98%] sm:w-[95%] max-w-xl z-50"
          >
            <div className="bg-bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden">
              <div className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-text-muted pointer-events-none" />

                {activeFilter && (
                  <button
                    type="button"
                    onClick={clearFilter}
                    className={cn(
                      'ml-12 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer',
                      activeFilter.type === 'profession'
                        ? 'bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/30'
                        : 'bg-accent-purple/20 text-accent-purple hover:bg-accent-purple/30'
                    )}
                  >
                    {activeFilter.type === 'profession' ? (
                      <ProfessionIcon profession={professionToKey(activeFilter.value as Profession)} size="sm" />
                    ) : PROFESSION_BY_ATTRIBUTE[activeFilter.value] ? (
                      <ProfessionIcon
                        profession={professionToKey(PROFESSION_BY_ATTRIBUTE[activeFilter.value] as Profession)}
                        size="sm"
                      />
                    ) : (
                      <Search className="w-3 h-3" />
                    )}
                    {activeFilter.value}
                    <X className="w-3 h-3" />
                  </button>
                )}

                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
                  onKeyDown={handleKeyDown}
                  placeholder={activeFilter ? `Search ${activeFilter.value} skills...` : 'Search skills...'}
                  className={cn(
                    'flex-1 bg-transparent text-text-primary py-4 pr-14 sm:pr-10 text-lg placeholder:text-text-muted focus:outline-none',
                    activeFilter ? 'pl-2' : 'pl-12'
                  )}
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} className="absolute right-12 sm:right-4 text-text-muted hover:text-text-primary cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="sm:hidden absolute right-3 p-1 text-text-muted hover:text-text-primary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="h-px bg-border" />

              <div ref={listRef} className="max-h-[75vh] sm:max-h-[65vh] overflow-y-auto overscroll-contain">
                {isLoading ? (
                  <div className="p-8 text-center text-text-muted">Loading skills...</div>
                ) : query.trim() === '' && !activeFilter ? (
                  <div className="p-4">
                    <button
                      type="button"
                      onClick={() => onSelect(EMPTY_SKILL)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer',
                        'bg-bg-hover/50 hover:bg-bg-hover border border-border hover:border-text-muted/30'
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-bg-card border border-border flex items-center justify-center">
                        <X className="w-5 h-5 text-text-muted" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-text-primary">Clear slot</div>
                        <div className="text-xs text-text-muted">Remove skill from this slot</div>
                      </div>
                    </button>

                    <div className="text-text-muted text-center text-sm mt-4 mb-3">Or search for:</div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { label: 'Warrior', type: 'profession' as const },
                        { label: 'Mesmer', type: 'profession' as const },
                        { label: 'Healing Prayers', type: 'attribute' as const },
                        { label: 'Fire Magic', type: 'attribute' as const },
                      ].map(hint => (
                        <button
                          type="button"
                          key={hint.label}
                          onClick={() => {
                            setActiveFilter({ type: hint.type, value: hint.label })
                            setQuery('')
                            setSelectedIndex(0)
                            inputRef.current?.focus()
                          }}
                          className="px-3 py-1.5 text-sm bg-bg-card hover:bg-bg-hover text-text-secondary rounded-lg transition-colors cursor-pointer"
                        >
                          {hint.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : isGroupedView ? (
                  <div className="relative">
                    {smartSearchResults.groupedByAttribute.map((group) => (
                      <AttributeGroupSection
                        key={group.attribute}
                        group={group}
                        onToggleCollapse={() => toggleAttributeCollapse(group.attribute)}
                        onSelectSkill={onSelect}
                        isSkillInBar={isSkillInBar}
                        hasEliteInBar={hasEliteInBar}
                        attributes={attributes}
                      />
                    ))}
                  </div>
                ) : smartSearchResults.categories.length === 0 && smartSearchResults.skills.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">No results found</div>
                ) : (
                  <div className="p-2">
                    {smartSearchResults.categories.length > 0 && (
                      <div className="mb-2">
                        {smartSearchResults.categories.map((cat, idx) => (
                          <button
                            type="button"
                            key={`${cat.type}-${cat.name}`}
                            data-index={idx}
                            onClick={() => handleCategoryClick(cat)}
                            className={cn(
                              'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all cursor-pointer',
                              selectedIndex === idx ? 'bg-bg-hover ring-1 ring-accent-gold/50' : 'hover:bg-bg-hover'
                            )}
                          >
                            <div className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center',
                              cat.type === 'profession' ? 'bg-accent-gold/10' : 'bg-accent-purple/10'
                            )}>
                              {cat.type === 'profession' ? (
                                <ProfessionIcon profession={professionToKey(cat.name as Profession)} size="md" />
                              ) : PROFESSION_BY_ATTRIBUTE[cat.name] ? (
                                <ProfessionIcon
                                  profession={professionToKey(PROFESSION_BY_ATTRIBUTE[cat.name] as Profession)}
                                  size="md"
                                />
                              ) : (
                                <Search className="w-5 h-5 text-text-muted" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-text-primary">{cat.name}</div>
                              <div className="text-xs text-text-muted">
                                {cat.type === 'profession' ? 'Profession' : 'Attribute'} • {cat.count} skills
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-muted" />
                          </button>
                        ))}
                        {smartSearchResults.skills.length > 0 && (
                          <div className="h-px bg-border my-2" />
                        )}
                      </div>
                    )}

                    {smartSearchResults.skills.map((skill, idx) => (
                      <SkillResultRow
                        key={skill.id}
                        skill={skill}
                        isSelected={selectedIndex === smartSearchResults.categories.length + idx}
                        isInBar={isSkillInBar(skill)}
                        eliteBlocked={skill.elite && hasEliteInBar && !isSkillInBar(skill)}
                        onSelect={() => onSelect(skill)}
                        attributes={attributes}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />
              <div className="px-4 py-2 text-xs text-text-muted flex items-center justify-between">
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 bg-bg-card rounded">↵</kbd> select
                  {activeFilter && (
                    <>{' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">⌫</kbd> back</>
                  )}
                  {' '}<kbd className="px-1.5 py-0.5 bg-bg-card rounded">esc</kbd> close
                </span>
                <span className="ml-auto">
                  {isGroupedView
                    ? `${totalVisibleSkills} skills in ${smartSearchResults.groupedByAttribute.length} attributes`
                    : activeFilter
                      ? `${smartSearchResults.skills.length} ${activeFilter.value} skills`
                      : smartSearchResults.categories.length + smartSearchResults.skills.length > 0
                        ? `${smartSearchResults.categories.length + smartSearchResults.skills.length} results`
                        : ''
                  }
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function SkillRowContent({
  skill,
  isInBar,
  attributes,
}: {
  skill: Skill
  isInBar: boolean
  attributes?: Record<string, number>
}) {
  const attributeLevel = attributes?.[skill.attribute] ?? 0

  return (
    <>
      <div className="flex items-start gap-3 w-full">
        <SkillIcon skillId={skill.id} size={40} elite={skill.elite} name={skill.name} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('text-sm font-medium', skill.elite ? 'text-accent-gold' : 'text-text-primary')}>
              {skill.name}
            </span>
            {skill.elite && (
              <span className="text-[9px] uppercase tracking-widest text-accent-gold/60 font-semibold px-1.5 py-0.5 bg-accent-gold/10 rounded">
                Elite
              </span>
            )}
            {isInBar && (
              <span className="text-[9px] uppercase tracking-wider text-text-muted font-medium px-1.5 py-0.5 bg-bg-card rounded">
                Equipped
              </span>
            )}
            <span className="hidden sm:flex items-center gap-1.5 ml-auto">
              <SkillCostStats skill={skill} />
            </span>
          </div>

          <div className="flex items-center justify-between mt-1">
            {skill.attribute && skill.attribute !== 'No Attribute' ? (
              <span className="text-[11px] text-text-secondary">{skill.attribute}</span>
            ) : (
              <span />
            )}
            <span className="sm:hidden">
              <SkillCostStats skill={skill} />
            </span>
          </div>
        </div>
      </div>

      {skill.description && (
        <p className="text-sm text-text-secondary leading-relaxed mt-2 w-full line-clamp-3">
          <ScaledDescription
            description={skill.description}
            attributeLevel={attributeLevel}
          />
        </p>
      )}
    </>
  )
}

function SkillCostStats({ skill }: { skill: Skill }) {
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0 text-xs text-text-primary">
      {skill.energy > 0 && <CostStat type="energy" value={skill.energy} />}
      {skill.adrenaline > 0 && <CostStat type="adrenaline" value={skill.adrenaline} />}
      {skill.sacrifice > 0 && <CostStat type="sacrifice" value={skill.sacrifice} showUnit />}
      {skill.activation > 0 && <CostStat type="activation" value={skill.activation} />}
      {skill.recharge > 0 && <CostStat type="recharge" value={skill.recharge} />}
    </div>
  )
}

function AttributeGroupSection({
  group,
  onToggleCollapse,
  onSelectSkill,
  isSkillInBar,
  hasEliteInBar,
  attributes,
}: {
  group: AttributeGroup
  onToggleCollapse: () => void
  onSelectSkill: (skill: Skill) => void
  isSkillInBar: (skill: Skill) => boolean
  hasEliteInBar: boolean
  attributes?: Record<string, number>
}) {
  return (
    <div className="relative">
      <div className="sticky top-0 z-10">
        <div className="bg-gradient-to-r from-bg-card via-bg-elevated to-bg-card border-y border-border/50">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-white/5 transition-colors w-full text-left group cursor-pointer"
          >
            <ChevronDown
              className={cn(
                'w-3.5 h-3.5 text-text-muted transition-transform duration-200',
                group.isCollapsed && '-rotate-90'
              )}
            />
            <span className="font-semibold text-sm text-text-primary tracking-wide">{group.attribute}</span>
            <span className="text-xs text-text-muted/70 tabular-nums">({group.skills.length})</span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!group.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="py-1 px-2 space-y-0.5">
              {group.skills.map((skill, idx) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02, duration: 0.2 }}
                >
                  <GroupedSkillRow
                    skill={skill}
                    isInBar={isSkillInBar(skill)}
                    eliteBlocked={skill.elite && hasEliteInBar && !isSkillInBar(skill)}
                    onSelect={() => onSelectSkill(skill)}
                    attributes={attributes}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function GroupedSkillRow({
  skill,
  isInBar,
  eliteBlocked,
  onSelect,
  attributes,
}: {
  skill: Skill
  isInBar: boolean
  eliteBlocked: boolean
  onSelect: () => void
  attributes?: Record<string, number>
}) {
  const disabled = isInBar || eliteBlocked

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      className={cn(
        'w-full flex flex-col p-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer',
        'border border-transparent',
        disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'hover:bg-bg-hover/80 hover:border-border/50'
      )}
    >
      <SkillRowContent skill={skill} isInBar={isInBar} attributes={attributes} />
    </button>
  )
}

function SkillResultRow({
  skill,
  isSelected,
  isInBar,
  eliteBlocked,
  onSelect,
  attributes,
}: {
  skill: Skill
  isSelected: boolean
  isInBar: boolean
  eliteBlocked: boolean
  onSelect: () => void
  attributes?: Record<string, number>
}) {
  const disabled = isInBar || eliteBlocked

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect()}
      disabled={disabled}
      className={cn(
        'w-full flex flex-col p-2.5 rounded-lg text-left transition-all duration-150',
        'border border-transparent',
        isSelected && 'bg-bg-hover/80 border-accent-gold/30 shadow-sm',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-bg-hover/60'
      )}
    >
      <SkillRowContent skill={skill} isInBar={isInBar} attributes={attributes} />
    </button>
  )
}
