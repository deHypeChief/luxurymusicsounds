import { useEffect, useState } from 'react'

/** Locks body scroll while a dialog is open, without losing scroll position. */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return

    const { overflow, paddingRight } = document.body.style
    const gutter = window.innerWidth - document.documentElement.clientWidth

    document.body.style.overflow = 'hidden'
    // Compensate for the vanished scrollbar so the page does not jump sideways.
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`

    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [active])
}

/** Calls `onClose` on Escape while `active`. */
export function useEscapeKey(active, onClose) {
  useEffect(() => {
    if (!active) return

    const handler = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, onClose])
}

/** Tracks a media query, e.g. useMediaQuery('(min-width: 768px)'). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    const list = window.matchMedia(query)
    const handler = (event) => setMatches(event.matches)

    setMatches(list.matches)
    list.addEventListener('change', handler)
    return () => list.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function usePrefersReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
