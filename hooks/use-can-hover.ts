import { useState, useEffect } from 'react'

/**
 * Detects if the device supports hover interactions.
 * Returns false on touch-only devices, true on devices with hover capability.
 */
export function useCanHover(): boolean {
  const [canHover, setCanHover] = useState(false)

  useEffect(() => {
    setCanHover(window.matchMedia('(hover: hover)').matches)
  }, [])

  return canHover
}
