import { useEffect } from 'react'

const SUFFIX = 'Luxury Music Sounds'

/**
 * Sets the browser tab title for a page.
 *
 * Pass null while data is still loading so the previous title stays put rather
 * than flashing "undefined" between renders.
 */
export function useDocumentTitle(title) {
  useEffect(() => {
    if (!title) return

    const previous = document.title
    document.title = title === SUFFIX ? title : `${title} | ${SUFFIX}`

    return () => {
      document.title = previous
    }
  }, [title])
}
