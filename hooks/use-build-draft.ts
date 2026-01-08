/**
 * @fileoverview Build Draft Hook
 * @module hooks/use-build-draft
 *
 * Simple draft management for build forms.
 * Saves on blur/visibility change, clears on successful submit.
 */

'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

const DRAFT_PREFIX = 'build-draft:'

export interface UseBuildDraftReturn<T> {
  /** Load draft from localStorage (returns null if none or empty) */
  loadDraft: () => T | null
  /** Clear draft from localStorage */
  clearDraft: () => void
  /** Manually save draft to localStorage */
  saveDraft: (data: T) => void
  /** Timestamp of last save (for showing "Draft saved" indicator) */
  lastSaved: Date | null
}

/**
 * Simple hook for managing build drafts
 * Call saveDraft() when you want to persist, clearDraft() on successful submit
 *
 * @example
 * const { loadDraft, saveDraft, clearDraft, lastSaved } = useBuildDraft<FormData>('new-build')
 *
 * // On mount, check for draft
 * useEffect(() => {
 *   const draft = loadDraft()
 *   if (draft) setFormData(draft)
 * }, [])
 *
 * // Save on blur
 * useEffect(() => {
 *   const handleBlur = () => saveDraft(formData)
 *   window.addEventListener('blur', handleBlur)
 *   return () => window.removeEventListener('blur', handleBlur)
 * }, [formData])
 */
export function useBuildDraft<T>(key: string): UseBuildDraftReturn<T> {
  const storageKey = `${DRAFT_PREFIX}${key}`
  const clearedRef = useRef(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Save draft to localStorage
  const saveDraft = useCallback(
    (data: T) => {
      if (clearedRef.current) return

      try {
        const now = new Date()
        const serialized = JSON.stringify(data)
        localStorage.setItem(storageKey, serialized)
        localStorage.setItem(`${storageKey}:timestamp`, now.toISOString())
        setLastSaved(now)
      } catch (error) {
        console.error('Failed to save draft:', error)
      }
    },
    [storageKey]
  )

  // Load draft from localStorage
  const loadDraft = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        return JSON.parse(saved) as T
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
    return null
  }, [storageKey])

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    clearedRef.current = true
    try {
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`${storageKey}:timestamp`)
      setLastSaved(null)
    } catch (error) {
      console.error('Failed to clear draft:', error)
    }
  }, [storageKey])

  // Reset cleared flag if component remounts
  useEffect(() => {
    clearedRef.current = false
  }, [])

  return {
    loadDraft,
    clearDraft,
    saveDraft,
    lastSaved,
  }
}

/**
 * Get all draft keys from localStorage
 * Useful for showing a list of drafts
 */
export function getAllDraftKeys(): string[] {
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(DRAFT_PREFIX) && !key.endsWith(':timestamp')) {
        keys.push(key.replace(DRAFT_PREFIX, ''))
      }
    }
    return keys
  } catch {
    return []
  }
}

/**
 * Get draft timestamp
 */
export function getDraftTimestamp(key: string): Date | null {
  try {
    const timestamp = localStorage.getItem(`${DRAFT_PREFIX}${key}:timestamp`)
    return timestamp ? new Date(timestamp) : null
  } catch {
    return null
  }
}

/**
 * Clear all drafts from localStorage
 */
export function clearAllDrafts(): void {
  try {
    const keys = getAllDraftKeys()
    keys.forEach(key => {
      localStorage.removeItem(`${DRAFT_PREFIX}${key}`)
      localStorage.removeItem(`${DRAFT_PREFIX}${key}:timestamp`)
    })
  } catch (error) {
    console.error('Failed to clear all drafts:', error)
  }
}
