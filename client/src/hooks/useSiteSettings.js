import { useEffect, useState } from 'react'
import { loadSiteSettings } from '../lib/api'

/**
 * Editable site chrome: contact details, the footer copy, and the social links.
 *
 * Falls back to `null` rather than throwing, because the footer appearing
 * without its links is a far better failure than the whole page refusing to
 * render because one settings request timed out.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState(null)

  useEffect(() => {
    let cancelled = false

    loadSiteSettings()
      .then((data) => {
        if (!cancelled) setSettings(data)
      })
      .catch(() => {
        if (!cancelled) setSettings(null)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return settings
}
