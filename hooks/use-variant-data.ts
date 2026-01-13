/**
 * @fileoverview Hook for computing variant data from a skill bar
 * @module hooks/use-variant-data
 *
 * Consolidates the duplicated logic for building variant arrays
 * and getting current variant data across editor and viewer components.
 */

import { useMemo } from 'react'
import type { SkillBarVariant } from '@/types/database'

interface BarWithVariants {
  template: string
  skills: number[]
  attributes: Record<string, number>
  variants?: SkillBarVariant[]
}

interface VariantData {
  template: string
  skills: number[]
  attributes: Record<string, number>
  name?: string
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
    }
    return [base, ...(bar.variants || [])]
  }, [bar.template, bar.skills, bar.attributes, bar.variants])

  // Get current variant data based on activeVariantIndex
  const currentVariant = useMemo(() => {
    if (activeVariantIndex === 0) {
      return {
        template: bar.template,
        skills: bar.skills,
        attributes: bar.attributes,
      }
    }
    const variant = bar.variants?.[activeVariantIndex - 1]
    // Fallback to base bar if variant index is out of bounds
    return variant || {
      template: bar.template,
      skills: bar.skills,
      attributes: bar.attributes,
    }
  }, [activeVariantIndex, bar.template, bar.skills, bar.attributes, bar.variants])

  const hasVariants = (bar.variants?.length ?? 0) > 0

  return { allVariants, currentVariant, hasVariants }
}
