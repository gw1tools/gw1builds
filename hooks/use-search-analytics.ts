/**
 * Search analytics hook for tracking search behavior via Vercel Analytics.
 * Tracks search_click (user selected a result) and search_abandon (closed without selecting).
 * Uses debouncing to capture final search terms, not every keystroke.
 */

import { useRef, useCallback, useEffect } from 'react'
import { track } from '@vercel/analytics'

type SearchState = {
  finalSearchTerm: string
  resultCount: number
  hasClicked: boolean
}

const SEARCH_DEBOUNCE_MS = 1500
const MIN_SEARCH_LENGTH = 2

const INITIAL_STATE: SearchState = {
  finalSearchTerm: '',
  resultCount: 0,
  hasClicked: false,
}

export function useSearchAnalytics() {
  const stateRef = useRef<SearchState>({ ...INITIAL_STATE })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetState = useCallback(() => {
    stateRef.current = { ...INITIAL_STATE }
  }, [])

  const trackAbandonIfNeeded = useCallback(() => {
    const { finalSearchTerm, resultCount, hasClicked } = stateRef.current
    if (finalSearchTerm.length >= MIN_SEARCH_LENGTH && !hasClicked) {
      track('search_abandon', { search_term: finalSearchTerm, result_count: resultCount })
    }
  }, [])

  const onSearchChange = useCallback((query: string, resultCount: number) => {
    clearTimer()
    timerRef.current = setTimeout(() => {
      stateRef.current = {
        finalSearchTerm: query.trim(),
        resultCount,
        hasClicked: false,
      }
    }, SEARCH_DEBOUNCE_MS)
  }, [clearTimer])

  const onBuildClick = useCallback((buildId: string, position: number) => {
    const { finalSearchTerm, resultCount } = stateRef.current
    stateRef.current.hasClicked = true
    clearTimer()

    if (finalSearchTerm.length >= MIN_SEARCH_LENGTH) {
      track('search_click', {
        search_term: finalSearchTerm,
        build_id: buildId,
        position,
        result_count: resultCount,
      })
    }
  }, [clearTimer])

  const onSearchClose = useCallback(() => {
    clearTimer()
    trackAbandonIfNeeded()
    resetState()
  }, [clearTimer, resetState, trackAbandonIfNeeded])

  const onSearchClear = useCallback(() => {
    clearTimer()
    trackAbandonIfNeeded()
    resetState()
  }, [clearTimer, resetState, trackAbandonIfNeeded])

  useEffect(() => clearTimer, [clearTimer])

  return { onSearchChange, onBuildClick, onSearchClose, onSearchClear }
}
