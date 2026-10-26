/**
 * @fileoverview Draft autosave hook
 * @module hooks/use-draft-autosave
 *
 * Persists form data shortly after each change, and flushes immediately when
 * the page hides or the form unmounts. Blur/visibilitychange alone miss
 * in-app navigation (e.g. the mobile back button), which lost whole sessions.
 */

'use client'

import { useEffect, useRef } from 'react'

/**
 * @param data - Current form data (a new object whenever the form changes)
 * @param persist - Called with the data to save; decides itself whether to save
 * @param delayMs - Debounce delay after the last change
 */
export function useDraftAutosave<T>(
  data: T,
  persist: (data: T) => void,
  delayMs = 500
): void {
  const latestDataRef = useRef(data)
  const persistRef = useRef(persist)
  // Set when a change hasn't been persisted yet, so flushes don't re-save
  const dirtyRef = useRef(false)

  useEffect(() => {
    persistRef.current = persist
  }, [persist])

  // Debounced save after each change
  useEffect(() => {
    latestDataRef.current = data
    dirtyRef.current = true

    const timer = setTimeout(() => {
      dirtyRef.current = false
      persistRef.current(data)
    }, delayMs)
    return () => clearTimeout(timer)
  }, [data, delayMs])

  // Flush pending changes when the page hides or the form unmounts
  useEffect(() => {
    const flush = () => {
      if (!dirtyRef.current) return
      dirtyRef.current = false
      persistRef.current(latestDataRef.current)
    }
    const handleVisibilityChange = () => {
      if (document.hidden) flush()
    }

    window.addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', flush)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      flush()
    }
  }, [])
}
