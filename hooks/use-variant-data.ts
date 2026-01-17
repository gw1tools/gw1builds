/**
 * @fileoverview Hook for computing variant data from a skill bar
 * @module hooks/use-variant-data
 *
 * Consolidates the duplicated logic for building variant arrays
 * and getting current variant data across editor and viewer components.
 */

import { useMemo } from 'react'
import type { SkillBarVariant, Equipment } from '@/types/database'

interface BarWithVariants {
  template: string
  skills: number[]
  attributes: Record<string, number>
  primary: string
  secondary: string
  equipment?: Equipment
  variants?: SkillBarVariant[]
}

interface VariantData {
  template: string
  skills: number[]
  attributes: Record<string, number>
  name?: string
  /** Resolved primary profession (variant's own or inherited from bar) */
  primary: string
  /** Resolved secondary profession (variant's own or inherited from bar) */
  secondary: string
  /** Equipment for this variant (undefined if not set) */
  equipment?: Equipment
}

interface UseVariantDataReturn {
  /** Array of all variants (base + additional) for tabs */
  allVariants: VariantData[]
  /** Current variant data based on activeVariantIndex */
  currentVariant: VariantData
  /** Whether additional variants exist */
  hasVariants: boolean
}

/**
 * Hook for computing variant data from a skill bar
 *
 * @param bar - The skill bar with base data and optional variants
 * @param activeVariantIndex - Currently selected variant (0 = base)
 * @returns Computed variant arrays and current variant data
 *
 * @example
 * const { allVariants, currentVariant, hasVariants } = useVariantData(bar, activeVariantIndex)
 */
export function useVariantData(
  bar: BarWithVariants,
  activeVariantIndex: number
): UseVariantDataReturn {
  // Build array of all variants (base + additional) for tabs
  const allVariants = useMemo(() => {
    const base: VariantData = {
      name: undefined,
      template: bar.template,
      skills: bar.skills,
      attributes: bar.attributes,
      primary: bar.primary,
      secondary: bar.secondary,
      equipment: bar.equipment,
    }
    const variants: VariantData[] = (bar.variants || []).map(v => ({
      name: v.name,
      template: v.template,
      skills: v.skills,
      attributes: v.attributes,
      // Resolve profession: use variant's own or fall back to bar's
      primary: v.primary || bar.primary,
      secondary: v.secondary || bar.secondary,
      equipment: v.equipment,
    }))
    return [base, ...variants]
  }, [bar.template, bar.skills, bar.attributes, bar.primary, bar.secondary, bar.equipment, bar.variants])

  // Get current variant data based on activeVariantIndex
  const currentVariant = useMemo(() => {
    if (activeVariantIndex === 0) {
      return {
        template: bar.template,
        skills: bar.skills,
        attributes: bar.attributes,
        primary: bar.primary,
        secondary: bar.secondary,
        equipment: bar.equipment,
      }
    }
    const variant = bar.variants?.[activeVariantIndex - 1]
    // Fallback to base bar if variant index is out of bounds
    if (!variant) {
      return {
        template: bar.template,
        skills: bar.skills,
        attributes: bar.attributes,
        primary: bar.primary,
        secondary: bar.secondary,
        equipment: bar.equipment,
      }
    }
    return {
      template: variant.template,
      skills: variant.skills,
      attributes: variant.attributes,
      name: variant.name,
      // Resolve profession: use variant's own or fall back to bar's
      primary: variant.primary || bar.primary,
      secondary: variant.secondary || bar.secondary,
      equipment: variant.equipment,
    }
  }, [activeVariantIndex, bar.template, bar.skills, bar.attributes, bar.primary, bar.secondary, bar.equipment, bar.variants])

  const hasVariants = (bar.variants?.length ?? 0) > 0

  return { allVariants, currentVariant, hasVariants }
}
