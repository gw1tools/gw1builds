import { useSyncExternalStore } from 'react'

const HOVER_MEDIA_QUERY = '(hover: hover)'

function subscribeToHoverCapability(onStoreChange: () => void): () => void {
  const mediaQuery = window.matchMedia(HOVER_MEDIA_QUERY)
  mediaQuery.addEventListener('change', onStoreChange)

  return () => mediaQuery.removeEventListener('change', onStoreChange)
}

function getHoverCapabilitySnapshot(): boolean {
  return window.matchMedia(HOVER_MEDIA_QUERY).matches
}

function getServerHoverCapabilitySnapshot(): boolean {
  return false
}

/**
 * Detects if the device supports hover interactions.
 * Returns false on touch-only devices, true on devices with hover capability.
 */
export function useCanHover(): boolean {
  return useSyncExternalStore(
    subscribeToHoverCapability,
    getHoverCapabilitySnapshot,
    getServerHoverCapabilitySnapshot
  )
}
